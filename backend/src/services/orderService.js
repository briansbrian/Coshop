import Joi from 'joi';
import pool from '../config/database.js';
import { notifyNewOrder, notifyOrderStatusChange } from '../utils/notificationUtils.js';

/**
 * Order Service
 * Handles order creation, processing, and management
 */

// Validation schemas
const orderItemSchema = Joi.object({
  productId: Joi.string().uuid().required(),
  quantity: Joi.number().integer().min(1).required()
});

const orderCreateSchema = Joi.object({
  items: Joi.array().items(orderItemSchema).min(1).required(),
  deliveryMethod: Joi.string().valid('pickup', 'delivery').required()
});

const orderStatusUpdateSchema = Joi.object({
  status: Joi.string().valid(
    'pending',
    'confirmed',
    'ready',
    'out_for_delivery',
    'delivered',
    'cancelled'
  ).required()
});

/**
 * Create a new order
 * Validates inventory, calculates totals, and splits cart into separate orders per SME
 */
export const createOrder = async (consumerId, orderData) => {
  const client = await pool.connect();
  
  try {
    // Validate input
    const { error, value } = orderCreateSchema.validate(orderData, { abortEarly: false });
    if (error) {
      throw {
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Invalid order data',
        details: error.details.map(d => d.message)
      };
    }

    await client.query('BEGIN');

    // Verify consumer exists
    const consumerResult = await client.query(
      'SELECT id, user_type FROM users WHERE id = $1',
      [consumerId]
    );

    if (consumerResult.rows.length === 0) {
      throw {
        status: 404,
        code: 'CONSUMER_NOT_FOUND',
        message: 'Consumer not found'
      };
    }

    // Fetch product details and group by business
    const productIds = value.items.map(item => item.productId);
    const productsResult = await client.query(
      `SELECT p.id, p.business_id, p.name, p.price, p.quantity, p.in_stock,
              b.name as business_name
       FROM products p
       JOIN businesses b ON p.business_id = b.id
       WHERE p.id = ANY($1)`,
      [productIds]
    );

    if (productsResult.rows.length !== productIds.length) {
      throw {
        status: 404,
        code: 'PRODUCT_NOT_FOUND',
        message: 'One or more products not found'
      };
    }

    // Create a map of products for easy lookup
    const productsMap = {};
    productsResult.rows.forEach(product => {
      productsMap[product.id] = product;
    });

    // Validate inventory and group items by business
    const businessOrders = {};
    
    for (const item of value.items) {
      const product = productsMap[item.productId];
      
      // Check if product is in stock
      if (!product.in_stock) {
        throw {
          status: 400,
          code: 'PRODUCT_OUT_OF_STOCK',
          message: `Product "${product.name}" is out of stock`
        };
      }

      // Check if requested quantity is available
      if (product.quantity < item.quantity) {
        throw {
          status: 400,
          code: 'INSUFFICIENT_INVENTORY',
          message: `Insufficient inventory for product "${product.name}". Available: ${product.quantity}, Requested: ${item.quantity}`
        };
      }

      // Group items by business
      const businessId = product.business_id;
      if (!businessOrders[businessId]) {
        businessOrders[businessId] = {
          businessId,
          businessName: product.business_name,
          items: [],
          totalAmount: 0
        };
      }

      businessOrders[businessId].items.push({
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        priceAtPurchase: parseFloat(product.price)
      });

      businessOrders[businessId].totalAmount += parseFloat(product.price) * item.quantity;
    }

    // Create separate orders for each business
    const createdOrders = [];

    for (const businessId in businessOrders) {
      const businessOrder = businessOrders[businessId];

      // Insert order
      const orderResult = await client.query(
        `INSERT INTO orders (
          consumer_id, business_id, total_amount, status, delivery_method, payment_status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING id, consumer_id, business_id, total_amount, status, delivery_method, payment_status, created_at`,
        [
          consumerId,
          businessId,
          businessOrder.totalAmount,
          'pending',
          value.deliveryMethod,
          'pending'
        ]
      );

      const order = orderResult.rows[0];

      // Insert order items
      const orderItems = [];
      for (const item of businessOrder.items) {
        const orderItemResult = await client.query(
          `INSERT INTO order_items (
            order_id, product_id, quantity, price_at_purchase, created_at
          ) VALUES ($1, $2, $3, $4, NOW())
          RETURNING id, order_id, product_id, quantity, price_at_purchase, created_at`,
          [order.id, item.productId, item.quantity, item.priceAtPurchase]
        );

        orderItems.push({
          id: orderItemResult.rows[0].id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          priceAtPurchase: item.priceAtPurchase
        });
      }

      createdOrders.push({
        id: order.id,
        consumerId: order.consumer_id,
        businessId: order.business_id,
        businessName: businessOrder.businessName,
        totalAmount: parseFloat(order.total_amount),
        status: order.status,
        deliveryMethod: order.delivery_method,
        paymentStatus: order.payment_status,
        items: orderItems,
        createdAt: order.created_at
      });
    }

    await client.query('COMMIT');

    // Send notifications to business owners about new orders
    for (const order of createdOrders) {
      // Get business owner ID
      const ownerResult = await pool.query(
        'SELECT owner_id FROM businesses WHERE id = $1',
        [order.businessId]
      );
      
      if (ownerResult.rows.length > 0) {
        const businessOwnerId = ownerResult.rows[0].owner_id;
        
        // Get consumer email
        const consumerResult = await pool.query(
          'SELECT email FROM users WHERE id = $1',
          [consumerId]
        );
        
        const consumerEmail = consumerResult.rows[0]?.email || 'Customer';
        
        // Notify business owner
        await notifyNewOrder(businessOwnerId, consumerEmail, order.totalAmount);
      }
    }

    return createdOrders;

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get order by ID with items
 */
export const getOrderById = async (orderId, userId) => {
  const result = await pool.query(
    `SELECT o.id, o.consumer_id, o.business_id, o.total_amount, o.status, 
            o.delivery_method, o.payment_status, o.created_at, o.updated_at,
            b.name as business_name, b.owner_id as business_owner_id,
            u.email as consumer_email
     FROM orders o
     JOIN businesses b ON o.business_id = b.id
     JOIN users u ON o.consumer_id = u.id
     WHERE o.id = $1`,
    [orderId]
  );

  if (result.rows.length === 0) {
    throw {
      status: 404,
      code: 'ORDER_NOT_FOUND',
      message: 'Order not found'
    };
  }

  const order = result.rows[0];

  // Verify user has access to this order (consumer or business owner)
  if (order.consumer_id !== userId && order.business_owner_id !== userId) {
    throw {
      status: 403,
      code: 'FORBIDDEN',
      message: 'You do not have permission to view this order'
    };
  }

  // Fetch order items
  const itemsResult = await pool.query(
    `SELECT oi.id, oi.product_id, oi.quantity, oi.price_at_purchase, oi.created_at,
            p.name as product_name, p.images as product_images
     FROM order_items oi
     JOIN products p ON oi.product_id = p.id
     WHERE oi.order_id = $1`,
    [orderId]
  );

  const items = itemsResult.rows.map(item => ({
    id: item.id,
    productId: item.product_id,
    productName: item.product_name,
    productImages: item.product_images,
    quantity: item.quantity,
    priceAtPurchase: parseFloat(item.price_at_purchase),
    createdAt: item.created_at
  }));

  return {
    id: order.id,
    consumerId: order.consumer_id,
    consumerEmail: order.consumer_email,
    businessId: order.business_id,
    businessName: order.business_name,
    totalAmount: parseFloat(order.total_amount),
    status: order.status,
    deliveryMethod: order.delivery_method,
    paymentStatus: order.payment_status,
    items,
    createdAt: order.created_at,
    updatedAt: order.updated_at
  };
};

/**
 * Get orders by user (consumer or business owner)
 */
export const getOrdersByUser = async (userId, userType, filters = {}) => {
  const { status, limit = 50, offset = 0 } = filters;

  let query;
  let values;

  if (userType === 'consumer') {
    // Get orders placed by consumer
    query = `
      SELECT o.id, o.consumer_id, o.business_id, o.total_amount, o.status,
             o.delivery_method, o.payment_status, o.created_at, o.updated_at,
             b.name as business_name
      FROM orders o
      JOIN businesses b ON o.business_id = b.id
      WHERE o.consumer_id = $1
    `;
    values = [userId];
  } else {
    // Get orders for businesses owned by SME
    query = `
      SELECT o.id, o.consumer_id, o.business_id, o.total_amount, o.status,
             o.delivery_method, o.payment_status, o.created_at, o.updated_at,
             b.name as business_name, u.email as consumer_email
      FROM orders o
      JOIN businesses b ON o.business_id = b.id
      JOIN users u ON o.consumer_id = u.id
      WHERE b.owner_id = $1
    `;
    values = [userId];
  }

  // Add status filter if provided
  if (status) {
    query += ` AND o.status = $${values.length + 1}`;
    values.push(status);
  }

  query += ` ORDER BY o.created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
  values.push(limit, offset);

  const result = await pool.query(query, values);

  // Fetch items for each order
  const orders = await Promise.all(
    result.rows.map(async (order) => {
      const itemsResult = await pool.query(
        `SELECT oi.id, oi.product_id, oi.quantity, oi.price_at_purchase,
                p.name as product_name
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = $1`,
        [order.id]
      );

      const items = itemsResult.rows.map(item => ({
        id: item.id,
        productId: item.product_id,
        productName: item.product_name,
        quantity: item.quantity,
        priceAtPurchase: parseFloat(item.price_at_purchase)
      }));

      return {
        id: order.id,
        consumerId: order.consumer_id,
        consumerEmail: order.consumer_email,
        businessId: order.business_id,
        businessName: order.business_name,
        totalAmount: parseFloat(order.total_amount),
        status: order.status,
        deliveryMethod: order.delivery_method,
        paymentStatus: order.payment_status,
        items,
        createdAt: order.created_at,
        updatedAt: order.updated_at
      };
    })
  );

  return orders;
};

/**
 * Update order status
 * Includes status transition validation and inventory updates
 */
export const updateOrderStatus = async (orderId, businessOwnerId, statusData) => {
  const client = await pool.connect();
  
  try {
    // Validate input
    const { error, value } = orderStatusUpdateSchema.validate(statusData, { abortEarly: false });
    if (error) {
      throw {
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Invalid status update data',
        details: error.details.map(d => d.message)
      };
    }

    await client.query('BEGIN');

    // Get order and verify business ownership
    const orderResult = await client.query(
      `SELECT o.id, o.status, o.business_id, b.owner_id
       FROM orders o
       JOIN businesses b ON o.business_id = b.id
       WHERE o.id = $1`,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      throw {
        status: 404,
        code: 'ORDER_NOT_FOUND',
        message: 'Order not found'
      };
    }

    const order = orderResult.rows[0];

    if (order.owner_id !== businessOwnerId) {
      throw {
        status: 403,
        code: 'FORBIDDEN',
        message: 'You do not have permission to update this order'
      };
    }

    const currentStatus = order.status;
    const newStatus = value.status;

    // Validate status transitions
    const validTransitions = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['ready', 'cancelled'],
      'ready': ['out_for_delivery', 'delivered', 'cancelled'],
      'out_for_delivery': ['delivered', 'cancelled'],
      'delivered': [],
      'cancelled': []
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw {
        status: 400,
        code: 'INVALID_STATUS_TRANSITION',
        message: `Cannot transition from ${currentStatus} to ${newStatus}`
      };
    }

    // Update inventory when order is confirmed
    if (newStatus === 'confirmed' && currentStatus === 'pending') {
      const itemsResult = await client.query(
        'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
        [orderId]
      );

      for (const item of itemsResult.rows) {
        // Deduct inventory
        const updateResult = await client.query(
          `UPDATE products 
           SET quantity = quantity - $1, updated_at = NOW()
           WHERE id = $2 AND quantity >= $3
           RETURNING id, quantity`,
          [item.quantity, item.product_id, item.quantity]
        );

        if (updateResult.rows.length === 0) {
          throw {
            status: 400,
            code: 'INSUFFICIENT_INVENTORY',
            message: 'Insufficient inventory to confirm order'
          };
        }
      }
    }

    // Restore inventory if order is cancelled from pending or confirmed
    if (newStatus === 'cancelled' && (currentStatus === 'pending' || currentStatus === 'confirmed')) {
      // Only restore if order was confirmed (inventory was deducted)
      if (currentStatus === 'confirmed') {
        const itemsResult = await client.query(
          'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
          [orderId]
        );

        for (const item of itemsResult.rows) {
          // Restore inventory
          await client.query(
            `UPDATE products 
             SET quantity = quantity + $1, updated_at = NOW()
             WHERE id = $2`,
            [item.quantity, item.product_id]
          );
        }
      }
    }

    // Update order status
    const updateResult = await client.query(
      `UPDATE orders 
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, consumer_id, business_id, total_amount, status, delivery_method, payment_status, created_at, updated_at`,
      [newStatus, orderId]
    );

    await client.query('COMMIT');

    const updatedOrder = updateResult.rows[0];

    // Get business name for notification
    const businessResult = await pool.query(
      'SELECT name FROM businesses WHERE id = $1',
      [updatedOrder.business_id]
    );
    
    const businessName = businessResult.rows[0]?.name || 'Business';

    // Notify consumer about status change
    await notifyOrderStatusChange(
      updatedOrder.id,
      updatedOrder.consumer_id,
      businessName,
      newStatus
    );

    return {
      id: updatedOrder.id,
      consumerId: updatedOrder.consumer_id,
      businessId: updatedOrder.business_id,
      totalAmount: parseFloat(updatedOrder.total_amount),
      status: updatedOrder.status,
      deliveryMethod: updatedOrder.delivery_method,
      paymentStatus: updatedOrder.payment_status,
      createdAt: updatedOrder.created_at,
      updatedAt: updatedOrder.updated_at
    };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

