import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import {
  getNotificationsByUser,
  markNotificationAsRead,
  getUnreadNotificationCount
} from '../services/notificationService.js';

const router = express.Router();

/**
 * GET /api/v1/notifications
 * Get notification history for authenticated user
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { read, type, priority, limit } = req.query;

    // Build filters object
    const filters = {};
    
    if (read !== undefined) {
      filters.read = read === 'true';
    }
    
    if (type) {
      filters.type = type;
    }
    
    if (priority) {
      filters.priority = priority;
    }
    
    if (limit) {
      filters.limit = parseInt(limit, 10);
    }

    const notifications = await getNotificationsByUser(userId, filters);

    res.status(200).json({
      message: 'Notifications retrieved successfully',
      count: notifications.length,
      notifications
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/v1/notifications/:id/read
 * Mark a notification as read
 */
router.patch('/:id/read', authenticate, async (req, res, next) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;

    const notification = await markNotificationAsRead(notificationId, userId);

    res.status(200).json({
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/notifications/unread/count
 * Get count of unread notifications for authenticated user
 */
router.get('/unread/count', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const count = await getUnreadNotificationCount(userId);

    res.status(200).json({
      message: 'Unread notification count retrieved successfully',
      count
    });
  } catch (error) {
    next(error);
  }
});

export default router;

