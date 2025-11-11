import express from 'express';
import {
  findNearbyBusinesses,
  calculateDistance,
  getBusinessesInBounds
} from '../services/geolocationService.js';
import { geocodeAddress, reverseGeocode } from '../utils/geocodingUtils.js';

const router = express.Router();

/**
 * GET /api/v1/businesses/nearby
 * Find businesses near a specific location
 * Query params: latitude, longitude, radius (km), businessType, verified, minRating, limit, offset
 */
router.get('/nearby', async (req, res, next) => {
  try {
    const {
      latitude,
      longitude,
      radius,
      businessType,
      verified,
      minRating,
      limit,
      offset
    } = req.query;

    // Parse query parameters
    const searchParams = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      radius: radius ? parseFloat(radius) : undefined,
      businessType,
      verified: verified !== undefined ? verified === 'true' : undefined,
      minRating: minRating ? parseFloat(minRating) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    };

    const result = await findNearbyBusinesses(searchParams);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/businesses/distance
 * Calculate distance between two points
 * Query params: fromLat, fromLon, toLat, toLon
 */
router.get('/distance', async (req, res, next) => {
  try {
    const { fromLat, fromLon, toLat, toLon } = req.query;

    if (!fromLat || !fromLon || !toLat || !toLon) {
      return res.status(400).json({
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'Required parameters: fromLat, fromLon, toLat, toLon',
          timestamp: new Date().toISOString()
        }
      });
    }

    const result = await calculateDistance(
      parseFloat(fromLat),
      parseFloat(fromLon),
      parseFloat(toLat),
      parseFloat(toLon)
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/businesses/in-bounds
 * Get businesses within map bounds
 * Query params: neLat, neLon, swLat, swLon, businessType, verified, minRating, limit
 */
router.get('/in-bounds', async (req, res, next) => {
  try {
    const {
      neLat,
      neLon,
      swLat,
      swLon,
      businessType,
      verified,
      minRating,
      limit
    } = req.query;

    if (!neLat || !neLon || !swLat || !swLon) {
      return res.status(400).json({
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'Required parameters: neLat, neLon, swLat, swLon',
          timestamp: new Date().toISOString()
        }
      });
    }

    const filters = {
      businessType,
      verified: verified !== undefined ? verified === 'true' : undefined,
      minRating: minRating ? parseFloat(minRating) : undefined,
      limit: limit ? parseInt(limit) : undefined
    };

    const result = await getBusinessesInBounds(
      parseFloat(neLat),
      parseFloat(neLon),
      parseFloat(swLat),
      parseFloat(swLon),
      filters
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/geolocation/geocode
 * Convert address to coordinates
 * Query params: address, city, country
 */
router.get('/geocode', async (req, res, next) => {
  try {
    const { address, city, country } = req.query;

    if (!address || !city || !country) {
      return res.status(400).json({
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'Required parameters: address, city, country',
          timestamp: new Date().toISOString()
        }
      });
    }

    const result = await geocodeAddress(address, city, country);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/geolocation/reverse-geocode
 * Convert coordinates to address
 * Query params: latitude, longitude
 */
router.get('/reverse-geocode', async (req, res, next) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'Required parameters: latitude, longitude',
          timestamp: new Date().toISOString()
        }
      });
    }

    const result = await reverseGeocode(
      parseFloat(latitude),
      parseFloat(longitude)
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
