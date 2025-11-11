import express from 'express';
import {
  registerBusiness,
  getBusinessById,
  updateBusiness,
  deleteBusiness,
  getBusinessesByOwner
} from '../services/businessService.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/rbacMiddleware.js';

const router = express.Router();

/**
 * POST /api/v1/businesses
 * Register a new business (SME only)
 */
router.post('/', authenticateToken, requireRole('sme'), async (req, res, next) => {
  try {
    const businessData = req.body;
    const ownerId = req.user.id;
    
    const business = await registerBusiness(ownerId, businessData);
    
    res.status(201).json({
      message: 'Business registered successfully',
      business
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/businesses/:id
 * Get business profile by ID (public)
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const business = await getBusinessById(id);
    
    res.status(200).json({
      business
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/businesses/:id
 * Update business profile (owner only)
 */
router.put('/:id', authenticateToken, requireRole('sme'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const ownerId = req.user.id;
    
    const business = await updateBusiness(id, ownerId, updateData);
    
    res.status(200).json({
      message: 'Business updated successfully',
      business
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/businesses/:id
 * Delete business (owner only)
 */
router.delete('/:id', authenticateToken, requireRole('sme'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const ownerId = req.user.id;
    
    const result = await deleteBusiness(id, ownerId);
    
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/businesses/owner/:ownerId
 * Get all businesses owned by a specific user (authenticated)
 */
router.get('/owner/:ownerId', authenticateToken, async (req, res, next) => {
  try {
    const { ownerId } = req.params;
    
    // Users can only view their own businesses unless they're admin
    if (req.user.id !== ownerId && req.user.userType !== 'admin') {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to view these businesses',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    const businesses = await getBusinessesByOwner(ownerId);
    
    res.status(200).json({
      businesses,
      count: businesses.length
    });
  } catch (error) {
    next(error);
  }
});

export default router;
