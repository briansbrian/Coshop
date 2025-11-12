import express from 'express';
import {
  createConsumerRating,
  createSMERating,
  getBusinessRatings,
  getConsumerTrustScore
} from '../services/ratingService.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/rbacMiddleware.js';

const router = express.Router();

/**
 * POST /api/v1/ratings
 * Create a rating (consumer-to-SME or SME-to-consumer)
 * Route determines rating type based on user type
 */
router.post('/', authenticate, async (req, res, next) => {
  try {
    const ratingData = req.body;
    const userId = req.user.id;
    const userType = req.user.userType;

    let rating;

    if (userType === 'consumer') {
      // Consumer rating a business
      rating = await createConsumerRating(userId, ratingData);
      res.status(201).json({
        message: 'Business rating created successfully',
        rating
      });
    } else if (userType === 'sme') {
      // SME rating a consumer
      rating = await createSMERating(userId, ratingData);
      res.status(201).json({
        message: 'Consumer rating created successfully',
        rating
      });
    } else {
      throw {
        status: 400,
        code: 'INVALID_USER_TYPE',
        message: 'Invalid user type for rating'
      };
    }

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/businesses/:id/ratings
 * Get all ratings for a specific business
 * Query params: limit, offset, minStars, maxStars
 */
router.get('/businesses/:id/ratings', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const filters = {
      limit: req.query.limit ? parseInt(req.query.limit) : 50,
      offset: req.query.offset ? parseInt(req.query.offset) : 0,
      minStars: req.query.minStars ? parseInt(req.query.minStars) : undefined,
      maxStars: req.query.maxStars ? parseInt(req.query.maxStars) : undefined
    };

    const ratings = await getBusinessRatings(id, filters);
    
    res.status(200).json({
      businessId: id,
      ratings,
      count: ratings.length,
      filters
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/consumers/:id/trust-score
 * Get trust score for a specific consumer
 * Restricted to authenticated SME users
 */
router.get('/consumers/:id/trust-score', authenticate, requireRole('sme'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const trustScore = await getConsumerTrustScore(id);
    
    res.status(200).json({
      trustScore
    });
  } catch (error) {
    next(error);
  }
});

export default router;

