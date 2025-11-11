import Joi from 'joi';
import pool from '../config/database.js';
import { getCached, setCached } from '../utils/cacheUtils.js';
import { validateCoordinates } from '../utils/geocodingUtils.js';

/**
 * Geolocation Service
 * Handles location-based business discovery and distance calculations using PostGIS
 */

// Validation schemas
const nearbySearchSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  radius: Joi.number().min(0.1).max(100).default(10), // radius in kilometers
  businessType: Joi.string().valid('shop', 'business', 'service').optional(),
  verified: Joi.boolean().optional(),
  minRating: Joi.number().min(0).max(5).optional(),
  limit: Joi.number().min(1).max(100).default(50),
  offset: Joi.number().min(0).default(0)
});

/**
 * Find nearby businesses within a specified radius
 * Uses PostGIS ST_DWithin for efficient spatial queries
 */
export const findNearbyBusinesses = async (searchParams) => {
  try {
    // Validate input
    const { error, value } = nearbySearchSchema.validate(searchParams, { abortEarly: false });
    if (error) {
      throw {
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Invalid search parameters',
        details: error.details.map(d => d.message)
      };
    }

    // Validate coordinates
    if (!validateCoordinates(value.latitude, value.longitude)) {
      throw {
        status: 400,
        code: 'INVALID_COORDINATES',
        message: 'Invalid latitude or longitude values'
      };
    }

    // Generate cache key
    const cacheKey = `geolocation:nearby:${JSON.stringify(value)}`;
    
    // Check cache first (TTL: 1 hour)
    const cachedResult = await getCached(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    // Build query with filters
    const queryParams = [value.latitude, value.longitude, value.radius * 1000]; // Convert km to meters
    let paramCount = 4;
    
    let whereClause = '';
    
    if (value.businessType) {
      whereClause += ` AND business_type = $${paramCount}`;
      queryParams.push(value.businessType);
      paramCount++;
    }
    
    if (value.verified !== undefined) {
      whereClause += ` AND verified = $${paramCount}`;
      queryParams.push(value.verified);
      paramCount++;
    }
    
    if (value.minRating !== undefined) {
      whereClause += ` AND rating >= $${paramCount}`;
      queryParams.push(value.minRating);
      paramCount++;
    }

    // Add limit and offset
    queryParams.push(value.limit);
    queryParams.push(value.offset);

    // Execute PostGIS spatial query
    const query = `
      SELECT 
        id, 
        owner_id, 
        name, 
        description, 
        business_type,
        ST_Y(location::geometry) as latitude, 
        ST_X(location::geometry) as longitude,
        address, 
        city, 
        country, 
        contact_email, 
        contact_phone,
        verified, 
        rating, 
        total_ratings,
        ST_Distance(
          location,
          ST_GeogFromText('POINT(' || $2 || ' ' || $1 || ')')
        ) as distance_meters,
        created_at,
        updated_at
      FROM businesses
      WHERE ST_DWithin(
        location,
        ST_GeogFromText('POINT(' || $2 || ' ' || $1 || ')'),
        $3
      )
      ${whereClause}
      ORDER BY distance_meters ASC
      LIMIT $${paramCount}
      OFFSET $${paramCount + 1}
    `;

    const result = await pool.query(query, queryParams);

    // Format results
    const businesses = result.rows.map(business => ({
      id: business.id,
      ownerId: business.owner_id,
      name: business.name,
      description: business.description,
      businessType: business.business_type,
      location: {
        latitude: business.latitude,
        longitude: business.longitude,
        address: business.address,
        city: business.city,
        country: business.country
      },
      contactInfo: {
        email: business.contact_email,
        phone: business.contact_phone
      },
      verified: business.verified,
      rating: parseFloat(business.rating),
      totalRatings: business.total_ratings,
      distance: {
        meters: Math.round(business.distance_meters),
        kilometers: parseFloat((business.distance_meters / 1000).toFixed(2))
      },
      createdAt: business.created_at,
      updatedAt: business.updated_at
    }));

    const response = {
      searchLocation: {
        latitude: value.latitude,
        longitude: value.longitude
      },
      radius: {
        kilometers: value.radius,
        meters: value.radius * 1000
      },
      filters: {
        businessType: value.businessType,
        verified: value.verified,
        minRating: value.minRating
      },
      businesses,
      count: businesses.length,
      pagination: {
        limit: value.limit,
        offset: value.offset
      }
    };

    // Cache the result (1 hour TTL)
    await setCached(cacheKey, response, 3600);

    return response;

  } catch (error) {
    if (error.status) {
      throw error;
    }
    
    console.error('Geolocation service error:', error);
    throw {
      status: 500,
      code: 'GEOLOCATION_ERROR',
      message: 'Failed to search nearby businesses',
      details: error.message
    };
  }
};

/**
 * Calculate distance between two geographic points
 * Uses PostGIS ST_Distance for accurate geodesic distance calculation
 */
export const calculateDistance = async (fromLat, fromLon, toLat, toLon) => {
  try {
    // Validate coordinates
    if (!validateCoordinates(fromLat, fromLon) || !validateCoordinates(toLat, toLon)) {
      throw {
        status: 400,
        code: 'INVALID_COORDINATES',
        message: 'Invalid latitude or longitude values'
      };
    }

    // Use PostGIS to calculate distance
    const query = `
      SELECT ST_Distance(
        ST_GeogFromText('POINT($1 $2)'),
        ST_GeogFromText('POINT($3 $4)')
      ) as distance_meters
    `;

    const result = await pool.query(query, [fromLon, fromLat, toLon, toLat]);
    const distanceMeters = result.rows[0].distance_meters;

    return {
      from: {
        latitude: fromLat,
        longitude: fromLon
      },
      to: {
        latitude: toLat,
        longitude: toLon
      },
      distance: {
        meters: Math.round(distanceMeters),
        kilometers: parseFloat((distanceMeters / 1000).toFixed(2)),
        miles: parseFloat((distanceMeters / 1609.34).toFixed(2))
      }
    };

  } catch (error) {
    if (error.status) {
      throw error;
    }
    
    console.error('Distance calculation error:', error);
    throw {
      status: 500,
      code: 'DISTANCE_CALCULATION_ERROR',
      message: 'Failed to calculate distance',
      details: error.message
    };
  }
};

/**
 * Get businesses within map bounds
 * Useful for map-based interfaces where users pan/zoom
 */
export const getBusinessesInBounds = async (northEastLat, northEastLon, southWestLat, southWestLon, filters = {}) => {
  try {
    // Validate coordinates
    if (!validateCoordinates(northEastLat, northEastLon) || !validateCoordinates(southWestLat, southWestLon)) {
      throw {
        status: 400,
        code: 'INVALID_COORDINATES',
        message: 'Invalid map bounds coordinates'
      };
    }

    // Build query with optional filters
    const queryParams = [northEastLon, northEastLat, southWestLon, southWestLat];
    let paramCount = 5;
    let whereClause = '';

    if (filters.businessType) {
      whereClause += ` AND business_type = $${paramCount}`;
      queryParams.push(filters.businessType);
      paramCount++;
    }

    if (filters.verified !== undefined) {
      whereClause += ` AND verified = $${paramCount}`;
      queryParams.push(filters.verified);
      paramCount++;
    }

    if (filters.minRating !== undefined) {
      whereClause += ` AND rating >= $${paramCount}`;
      queryParams.push(filters.minRating);
      paramCount++;
    }

    // Limit results to prevent overwhelming the map
    const limit = filters.limit || 500;
    queryParams.push(limit);

    // Query businesses within bounding box
    const query = `
      SELECT 
        id, 
        owner_id, 
        name, 
        description, 
        business_type,
        ST_Y(location::geometry) as latitude, 
        ST_X(location::geometry) as longitude,
        address, 
        city, 
        country, 
        contact_email, 
        contact_phone,
        verified, 
        rating, 
        total_ratings,
        created_at,
        updated_at
      FROM businesses
      WHERE location && ST_MakeEnvelope($1, $2, $3, $4, 4326)
      ${whereClause}
      LIMIT $${paramCount}
    `;

    const result = await pool.query(query, queryParams);

    // Format results
    const businesses = result.rows.map(business => ({
      id: business.id,
      ownerId: business.owner_id,
      name: business.name,
      description: business.description,
      businessType: business.business_type,
      location: {
        latitude: business.latitude,
        longitude: business.longitude,
        address: business.address,
        city: business.city,
        country: business.country
      },
      contactInfo: {
        email: business.contact_email,
        phone: business.contact_phone
      },
      verified: business.verified,
      rating: parseFloat(business.rating),
      totalRatings: business.total_ratings,
      createdAt: business.created_at,
      updatedAt: business.updated_at
    }));

    return {
      bounds: {
        northEast: {
          latitude: northEastLat,
          longitude: northEastLon
        },
        southWest: {
          latitude: southWestLat,
          longitude: southWestLon
        }
      },
      filters,
      businesses,
      count: businesses.length
    };

  } catch (error) {
    if (error.status) {
      throw error;
    }
    
    console.error('Map bounds query error:', error);
    throw {
      status: 500,
      code: 'MAP_BOUNDS_ERROR',
      message: 'Failed to retrieve businesses in map bounds',
      details: error.message
    };
  }
};
