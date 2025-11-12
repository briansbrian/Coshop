import Joi from 'joi';
import pool from '../config/database.js';

/**
 * Rating Service
 * Handles bidirectional ratings: consumer-to-SME and SME-to-consumer
 */

// Validation schemas
const consumerRatingSchema = Joi.object({
  orderId: Joi.string().uuid().required(),
  businessId: Joi.string().uuid().required(),
  stars: Joi.number().integer().min(1).max(5).required(),
  review: Joi.string().allow('').max(2000),
  criteria: Joi.object({
    productQuality: Joi.number().integer().min(1).max(5).required(),
    service: Joi.number().integer().min(1).max(5).required(),
    value: Joi.number().integer().min(1).max(5).required()
  }).required()
});

const smeRatingSchema = Joi.object({
  orderId: Joi.string().uuid().required(),
  consumerId: Joi.string().uuid().required(),
  stars: Joi.number().integer().min(1).max(5).required(),
  feedback: Joi.string().allow('').max(2000),
  criteria: Joi.object({
    paymentTimeliness: Joi.number().integer().min(1).max(5).required(),
    communication: Joi.number().integer().min(1).max(5).required(),
    compliance: Joi.number().integer().min(1).max(5).required()
  }).required()
});

/**
 * Create a consumer-to-SME rating
 * Consumers rate businesses after completing an order
 */
export const createConsumerRating = async (consumerId, ratingData) => {
  const client = await pool.connect();
  
  try {
    // Validate input
    const { error, value } = consumerRatingSchema.validate(ratingData, { abortEarly: false });
    if (error) {
      throw {
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Invalid rating data',
        details: error.details.map(d => d.message)
      };
    }

    await client.query('BEGIN');

    // Verify order exists and consumer is the order owner
    const orderResult = await client.query(
      `SELECT o.id, o.consumer_id, o.business_id, o.status, b.owner_id
       FROM orders o
       JOIN businesses b ON o.business_id = b.id
       WHERE o.id = $1`,
      [value.orderId]
    );

    if (orderResult.rows.length === 0) {
      throw {
        status: 404,
        code: 'ORDER_NOT_FOUND',
        message: 'Order not found'
      };
    }

    const order = orderResult.rows[0];

    if (order.consumer_id !== consumerId) {
      throw {
        status: 403,
        code: 'FORBIDDEN',
        message: 'You can only rate orders you placed'
      };
    }

    if (order.business_id !== value.businessId) {
      throw {
        status: 400,
        code: 'INVALID_BUSINESS',
        message: 'Business ID does not match the order'
      };
    }

    // Check if order is completed or delivered
    if (order.status !== 'delivered' && order.status !== 'completed') {
      throw {
        status: 400,
        code: 'ORDER_NOT_COMPLETED',
        message: 'You can only rate completed or delivered orders'
      };
    }

    // Check for duplicate rating
    const existingRating = await client.query(
      `SELECT id FROM ratings 
       WHERE order_id = $1 AND rater_id = $2 AND rating_type = 'consumer_to_sme'`,
      [value.orderId, consumerId]
    );

    if (existingRating.rows.length > 0) {
      throw {
        status: 409,
        code: 'DUPLICATE_RATING',
        message: 'You have already rated this order'
      };
    }

    // Insert rating
    const ratingResult = await client.query(
      `INSERT INTO ratings (
        order_id, rater_id, rated_id, rating_type, stars, review, criteria, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING id, order_id, rater_id, rated_id, rating_type, stars, review, criteria, created_at`,
      [
        value.orderId,
        consumerId,
        order.owner_id, // SME owner is the rated user
        'consumer_to_sme',
        value.stars,
        value.review || '',
        JSON.stringify(value.criteria)
      ]
    );

    const rating = ratingResult.rows[0];

    // Update business aggregate ratings
    await updateBusinessRatings(client, value.businessId);

    await client.query('COMMIT');

    return {
      id: rating.id,
      orderId: rating.order_id,
      raterId: rating.rater_id,
      ratedId: rating.rated_id,
      ratingType: rating.rating_type,
      stars: rating.stars,
      review: rating.review,
      criteria: rating.criteria,
      createdAt: rating.created_at
    };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Create an SME-to-consumer rating
 * SMEs rate consumers based on their transaction behavior
 */
export const createSMERating = async (smeOwnerId, ratingData) => {
  const client = await pool.connect();
  
  try {
    // Validate input
    const { error, value } = smeRatingSchema.validate(ratingData, { abortEarly: false });
    if (error) {
      throw {
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Invalid rating data',
        details: error.details.map(d => d.message)
      };
    }

    await client.query('BEGIN');

    // Verify order exists and SME owns the business
    const orderResult = await client.query(
      `SELECT o.id, o.consumer_id, o.business_id, o.status, b.owner_id
       FROM orders o
       JOIN businesses b ON o.business_id = b.id
       WHERE o.id = $1`,
      [value.orderId]
    );

    if (orderResult.rows.length === 0) {
      throw {
        status: 404,
        code: 'ORDER_NOT_FOUND',
        message: 'Order not found'
      };
    }

    const order = orderResult.rows[0];

    if (order.owner_id !== smeOwnerId) {
      throw {
        status: 403,
        code: 'FORBIDDEN',
        message: 'You can only rate orders for your business'
      };
    }

    if (order.consumer_id !== value.consumerId) {
      throw {
        status: 400,
        code: 'INVALID_CONSUMER',
        message: 'Consumer ID does not match the order'
      };
    }

    // Check if order is completed or delivered
    if (order.status !== 'delivered' && order.status !== 'completed') {
      throw {
        status: 400,
        code: 'ORDER_NOT_COMPLETED',
        message: 'You can only rate completed or delivered orders'
      };
    }

    // Check for duplicate rating
    const existingRating = await client.query(
      `SELECT id FROM ratings 
       WHERE order_id = $1 AND rater_id = $2 AND rating_type = 'sme_to_consumer'`,
      [value.orderId, smeOwnerId]
    );

    if (existingRating.rows.length > 0) {
      throw {
        status: 409,
        code: 'DUPLICATE_RATING',
        message: 'You have already rated this consumer for this order'
      };
    }

    // Insert rating
    const ratingResult = await client.query(
      `INSERT INTO ratings (
        order_id, rater_id, rated_id, rating_type, stars, review, criteria, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING id, order_id, rater_id, rated_id, rating_type, stars, review, criteria, created_at`,
      [
        value.orderId,
        smeOwnerId,
        value.consumerId,
        'sme_to_consumer',
        value.stars,
        value.feedback || '',
        JSON.stringify(value.criteria)
      ]
    );

    const rating = ratingResult.rows[0];

    // Update consumer trust score
    await updateConsumerTrustScore(client, value.consumerId);

    await client.query('COMMIT');

    return {
      id: rating.id,
      orderId: rating.order_id,
      raterId: rating.rater_id,
      ratedId: rating.rated_id,
      ratingType: rating.rating_type,
      stars: rating.stars,
      feedback: rating.review,
      criteria: rating.criteria,
      createdAt: rating.created_at
    };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get ratings for a business
 * Returns consumer ratings for the business
 */
export const getBusinessRatings = async (businessId, filters = {}) => {
  const { limit = 50, offset = 0, minStars, maxStars } = filters;

  // Verify business exists
  const businessResult = await pool.query(
    'SELECT id, owner_id FROM businesses WHERE id = $1',
    [businessId]
  );

  if (businessResult.rows.length === 0) {
    throw {
      status: 404,
      code: 'BUSINESS_NOT_FOUND',
      message: 'Business not found'
    };
  }

  const ownerId = businessResult.rows[0].owner_id;

  // Build query
  let query = `
    SELECT r.id, r.order_id, r.rater_id, r.rated_id, r.rating_type, r.stars, r.review, r.criteria, r.created_at,
           u.email as rater_email
    FROM ratings r
    JOIN users u ON r.rater_id = u.id
    WHERE r.rated_id = $1 AND r.rating_type = 'consumer_to_sme'
  `;
  
  const values = [ownerId];
  let paramCount = 2;

  if (minStars !== undefined) {
    query += ` AND r.stars >= $${paramCount}`;
    values.push(minStars);
    paramCount++;
  }

  if (maxStars !== undefined) {
    query += ` AND r.stars <= $${paramCount}`;
    values.push(maxStars);
    paramCount++;
  }

  query += ` ORDER BY r.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
  values.push(limit, offset);

  const result = await pool.query(query, values);

  return result.rows.map(rating => ({
    id: rating.id,
    orderId: rating.order_id,
    raterId: rating.rater_id,
    raterEmail: rating.rater_email,
    stars: rating.stars,
    review: rating.review,
    criteria: rating.criteria,
    createdAt: rating.created_at
  }));
};

/**
 * Get consumer trust score
 * Calculates trust score based on SME ratings
 */
export const getConsumerTrustScore = async (consumerId) => {
  // Verify consumer exists
  const consumerResult = await pool.query(
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

  // Get all SME ratings for this consumer
  const ratingsResult = await pool.query(
    `SELECT stars, criteria
     FROM ratings
     WHERE rated_id = $1 AND rating_type = 'sme_to_consumer'`,
    [consumerId]
  );

  if (ratingsResult.rows.length === 0) {
    return {
      consumerId,
      overallScore: 0,
      totalRatings: 0,
      breakdown: {
        paymentTimeliness: 0,
        communication: 0,
        compliance: 0
      }
    };
  }

  // Calculate averages
  const totalRatings = ratingsResult.rows.length;
  let totalStars = 0;
  let totalPayment = 0;
  let totalCommunication = 0;
  let totalCompliance = 0;

  ratingsResult.rows.forEach(rating => {
    totalStars += rating.stars;
    totalPayment += rating.criteria.paymentTimeliness;
    totalCommunication += rating.criteria.communication;
    totalCompliance += rating.criteria.compliance;
  });

  return {
    consumerId,
    overallScore: parseFloat((totalStars / totalRatings).toFixed(2)),
    totalRatings,
    breakdown: {
      paymentTimeliness: parseFloat((totalPayment / totalRatings).toFixed(2)),
      communication: parseFloat((totalCommunication / totalRatings).toFixed(2)),
      compliance: parseFloat((totalCompliance / totalRatings).toFixed(2))
    }
  };
};

/**
 * Helper function to update business aggregate ratings
 * Called after a new consumer rating is created
 */
const updateBusinessRatings = async (client, businessId) => {
  // Get business owner
  const businessResult = await client.query(
    'SELECT owner_id FROM businesses WHERE id = $1',
    [businessId]
  );

  if (businessResult.rows.length === 0) {
    return;
  }

  const ownerId = businessResult.rows[0].owner_id;

  // Calculate average rating
  const ratingsResult = await client.query(
    `SELECT AVG(stars) as avg_rating, COUNT(*) as total_ratings
     FROM ratings
     WHERE rated_id = $1 AND rating_type = 'consumer_to_sme'`,
    [ownerId]
  );

  const avgRating = ratingsResult.rows[0].avg_rating || 0;
  const totalRatings = ratingsResult.rows[0].total_ratings || 0;

  // Update business
  await client.query(
    `UPDATE businesses
     SET rating = $1, total_ratings = $2, updated_at = NOW()
     WHERE id = $3`,
    [parseFloat(avgRating).toFixed(2), totalRatings, businessId]
  );
};

/**
 * Helper function to update consumer trust score
 * Called after a new SME rating is created
 * Note: Trust score is calculated on-demand, but we could cache it here if needed
 */
const updateConsumerTrustScore = async (client, consumerId) => {
  // Trust score is calculated on-demand in getConsumerTrustScore
  // This function is a placeholder for future caching implementation
  return;
};

