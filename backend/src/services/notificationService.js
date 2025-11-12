import Joi from 'joi';
import pool from '../config/database.js';

/**
 * Notification Service
 * Handles notification creation, retrieval, and management
 */

// Validation schemas
const notificationSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  type: Joi.string().valid(
    'new_order',
    'message',
    'review',
    'low_inventory',
    'payment',
    'delivery_update'
  ).required(),
  title: Joi.string().max(255).required(),
  message: Joi.string().required(),
  priority: Joi.string().valid('low', 'medium', 'high').default('medium')
});

/**
 * Validate notification data
 */
export const validateNotification = (data) => {
  return notificationSchema.validate(data, { abortEarly: false });
};

/**
 * Create a new notification
 */
export const createNotification = async (notificationData) => {
  // Validate input
  const { error, value } = validateNotification(notificationData);
  if (error) {
    throw {
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Invalid notification data',
      details: error.details.map(d => d.message)
    };
  }

  try {
    const result = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, priority, read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, user_id, type, title, message, priority, read, created_at`,
      [value.userId, value.type, value.title, value.message, value.priority, false]
    );

    const notification = result.rows[0];
    return {
      id: notification.id,
      userId: notification.user_id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      read: notification.read,
      createdAt: notification.created_at
    };
  } catch (error) {
    console.error('Error creating notification:', error);
    throw {
      status: 500,
      code: 'DATABASE_ERROR',
      message: 'Failed to create notification'
    };
  }
};

/**
 * Get notifications for a specific user
 */
export const getNotificationsByUser = async (userId, filters = {}) => {
  try {
    let query = `
      SELECT id, user_id, type, title, message, priority, read, created_at
      FROM notifications
      WHERE user_id = $1
    `;
    const params = [userId];
    let paramIndex = 2;

    // Add filter for read/unread
    if (filters.read !== undefined) {
      query += ` AND read = $${paramIndex}`;
      params.push(filters.read);
      paramIndex++;
    }

    // Add filter for notification type
    if (filters.type) {
      query += ` AND type = $${paramIndex}`;
      params.push(filters.type);
      paramIndex++;
    }

    // Add filter for priority
    if (filters.priority) {
      query += ` AND priority = $${paramIndex}`;
      params.push(filters.priority);
      paramIndex++;
    }

    // Order by created_at descending (newest first)
    query += ' ORDER BY created_at DESC';

    // Add limit if specified
    if (filters.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(filters.limit);
    }

    const result = await pool.query(query, params);

    return result.rows.map(notification => ({
      id: notification.id,
      userId: notification.user_id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      read: notification.read,
      createdAt: notification.created_at
    }));
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw {
      status: 500,
      code: 'DATABASE_ERROR',
      message: 'Failed to fetch notifications'
    };
  }
};

/**
 * Mark a notification as read
 */
export const markNotificationAsRead = async (notificationId, userId) => {
  try {
    const result = await pool.query(
      `UPDATE notifications
       SET read = true
       WHERE id = $1 AND user_id = $2
       RETURNING id, user_id, type, title, message, priority, read, created_at`,
      [notificationId, userId]
    );

    if (result.rows.length === 0) {
      throw {
        status: 404,
        code: 'NOTIFICATION_NOT_FOUND',
        message: 'Notification not found or does not belong to user'
      };
    }

    const notification = result.rows[0];
    return {
      id: notification.id,
      userId: notification.user_id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      read: notification.read,
      createdAt: notification.created_at
    };
  } catch (error) {
    if (error.status) throw error;
    
    console.error('Error marking notification as read:', error);
    throw {
      status: 500,
      code: 'DATABASE_ERROR',
      message: 'Failed to mark notification as read'
    };
  }
};

/**
 * Get count of unread notifications for a user
 */
export const getUnreadNotificationCount = async (userId) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) as count
       FROM notifications
       WHERE user_id = $1 AND read = false`,
      [userId]
    );

    return parseInt(result.rows[0].count, 10);
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    throw {
      status: 500,
      code: 'DATABASE_ERROR',
      message: 'Failed to get unread notification count'
    };
  }
};

/**
 * Delete old read notifications (cleanup utility)
 */
export const deleteOldNotifications = async (userId, daysOld = 30) => {
  try {
    const result = await pool.query(
      `DELETE FROM notifications
       WHERE user_id = $1 
       AND read = true 
       AND created_at < NOW() - INTERVAL '${daysOld} days'
       RETURNING id`,
      [userId]
    );

    return result.rowCount;
  } catch (error) {
    console.error('Error deleting old notifications:', error);
    throw {
      status: 500,
      code: 'DATABASE_ERROR',
      message: 'Failed to delete old notifications'
    };
  }
};

/**
 * Helper function to create notification for new order
 */
export const notifyNewOrder = async (businessOwnerId, consumerEmail, orderTotal) => {
  return await createNotification({
    userId: businessOwnerId,
    type: 'new_order',
    title: 'New Order Received',
    message: `You have received a new order from ${consumerEmail} for $${orderTotal.toFixed(2)}.`,
    priority: 'high'
  });
};

/**
 * Helper function to create notification for order status change
 */
export const notifyOrderStatusChange = async (consumerId, businessName, newStatus) => {
  const statusMessages = {
    'confirmed': {
      title: 'Order Confirmed',
      message: `Your order from ${businessName} has been confirmed and is being prepared.`,
      priority: 'high'
    },
    'ready': {
      title: 'Order Ready',
      message: `Your order from ${businessName} is ready for pickup or delivery.`,
      priority: 'high'
    },
    'out_for_delivery': {
      title: 'Order Out for Delivery',
      message: `Your order from ${businessName} is on its way!`,
      priority: 'high'
    },
    'delivered': {
      title: 'Order Delivered',
      message: `Your order from ${businessName} has been delivered. Enjoy!`,
      priority: 'medium'
    },
    'cancelled': {
      title: 'Order Cancelled',
      message: `Your order from ${businessName} has been cancelled.`,
      priority: 'high'
    }
  };

  const notification = statusMessages[newStatus];
  if (notification) {
    return await createNotification({
      userId: consumerId,
      type: 'delivery_update',
      title: notification.title,
      message: notification.message,
      priority: notification.priority
    });
  }
};

/**
 * Helper function to create notification for new message
 */
export const notifyNewMessage = async (receiverId, senderName) => {
  return await createNotification({
    userId: receiverId,
    type: 'message',
    title: 'New Message',
    message: `You have a new message from ${senderName}.`,
    priority: 'medium'
  });
};

/**
 * Helper function to create notification for new review
 */
export const notifyNewReview = async (businessOwnerId, consumerName, stars) => {
  return await createNotification({
    userId: businessOwnerId,
    type: 'review',
    title: 'New Review Received',
    message: `${consumerName} left a ${stars}-star review for your business.`,
    priority: 'medium'
  });
};

/**
 * Helper function to create notification for low inventory
 */
export const notifyLowInventory = async (businessOwnerId, productName, quantity) => {
  return await createNotification({
    userId: businessOwnerId,
    type: 'low_inventory',
    title: 'Low Inventory Alert',
    message: `${productName} is running low (${quantity} remaining). Consider restocking.`,
    priority: 'medium'
  });
};

/**
 * Helper function to create notification for payment
 */
export const notifyPaymentReceived = async (businessOwnerId, amount, orderId) => {
  return await createNotification({
    userId: businessOwnerId,
    type: 'payment',
    title: 'Payment Received',
    message: `Payment of $${amount.toFixed(2)} received for order ${orderId}.`,
    priority: 'high'
  });
};

