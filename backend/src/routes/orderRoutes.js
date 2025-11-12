import express from 'express';
import {
  createOrder,
  getOrderById,
  getOrdersByUser,
  updateOrderStatus
} from '../services/orderService.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/rbacMiddleware.js';

const router = express.Router();

/**
 * POST /api/v1/orders
 * Create a new order (consumers only)
 */
router.post('/', authenticate, requireRole('consumer'), async (req, res, next) => {
  try {
    const orderData = req.body;
    const consumerId = req.user.id;

    const orders = await createOrder(consumerId, orderData);
    
    res.status(201).json({
      message: 'Order(s) created successfully',
      orders,
      count: orders.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/orders/:id
 * Get order details by ID (consumer or business owner)
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await getOrderById(id, userId);
    
    res.status(200).json({
      order
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/orders
 * Get order history filtered by user (consumer or SME)
 * Query params: status, limit, offset
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userType = req.user.userType;
    
    const filters = {
      status: req.query.status,
      limit: req.query.limit ? parseInt(req.query.limit) : 50,
      offset: req.query.offset ? parseInt(req.query.offset) : 0
    };

    const orders = await getOrdersByUser(userId, userType, filters);
    
    res.status(200).json({
      orders,
      count: orders.length,
      filters
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/v1/orders/:id/status
 * Update order status (business owners only)
 */
router.patch('/:id/status', authenticate, requireRole('sme'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const statusData = req.body;
    const businessOwnerId = req.user.id;

    const order = await updateOrderStatus(id, businessOwnerId, statusData);
    
    res.status(200).json({
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    next(error);
  }
});

export default router;

