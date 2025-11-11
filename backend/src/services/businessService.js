import Joi from 'joi';
import pool from '../config/database.js';
import { geocodeAddress, validateCoordinates } from '../utils/geocodingUtils.js';

/**
 * Business Service
 * Handles business registration, profile management, and CRUD operations
 */

// Validation schemas
const businessRegistrationSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  description: Joi.string().allow('').max(5000),
  businessType: Joi.string().valid('shop', 'business', 'service').required(),
  address: Joi.string().required(),
  city: Joi.string().required(),
  country: Joi.string().required(),
  contactEmail: Joi.string().email().required(),
  contactPhone: Joi.string().required(),
  operatingHours: Joi.array().items(
    Joi.object({
      day: Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday').required(),
      open: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
      close: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
      closed: Joi.boolean()
    })
  ).optional()
});

const businessUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(255),
  description: Joi.string().allow('').max(5000),
  businessType: Joi.string().valid('shop', 'business', 'service'),
  address: Joi.string(),
  city: Joi.string(),
  country: Joi.string(),
  contactEmail: Joi.string().email(),
  contactPhone: Joi.string(),
  operatingHours: Joi.array().items(
    Joi.object({
      day: Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday').required(),
      open: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
      close: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
      closed: Joi.boolean()
    })
  )
}).min(1);

/**
 * Register a new business
 */
export const registerBusiness = async (ownerId, businessData) => {
  const client = await pool.connect();
  
  try {
    // Validate input
    const { error, value } = businessRegistrationSchema.validate(businessData, { abortEarly: false });
    if (error) {
      throw {
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Invalid business registration data',
        details: error.details.map(d => d.message)
      };
    }

    await client.query('BEGIN');

    // Check if user exists and is an SME
    const userResult = await client.query(
      'SELECT id, user_type FROM users WHERE id = $1',
      [ownerId]
    );

    if (userResult.rows.length === 0) {
      throw {
        status: 404,
        code: 'USER_NOT_FOUND',
        message: 'User not found'
      };
    }

    if (userResult.rows[0].user_type !== 'sme') {
      throw {
        status: 403,
        code: 'FORBIDDEN',
        message: 'Only SME users can register businesses'
      };
    }

    // Geocode the address to get coordinates
    let coordinates;
    try {
      coordinates = await geocodeAddress(value.address, value.city, value.country);
    } catch (geocodeError) {
      throw {
        status: 400,
        code: 'INVALID_ADDRESS',
        message: 'Could not validate the business address. Please check the address details.',
        details: geocodeError.message
      };
    }

    // Create PostGIS POINT from coordinates
    const locationPoint = `POINT(${coordinates.longitude} ${coordinates.latitude})`;

    // Insert business
    const businessResult = await client.query(
      `INSERT INTO businesses (
        owner_id, name, description, business_type, location, address, city, country,
        contact_email, contact_phone, verified, rating, total_ratings, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, ST_GeogFromText($5), $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
      RETURNING id, owner_id, name, description, business_type, 
                ST_Y(location::geometry) as latitude, ST_X(location::geometry) as longitude,
                address, city, country, contact_email, contact_phone, verified, rating, total_ratings, created_at`,
      [
        ownerId,
        value.name,
        value.description || '',
        value.businessType,
        locationPoint,
        value.address,
        value.city,
        value.country,
        value.contactEmail,
        value.contactPhone,
        false, // verified
        0,     // rating
        0,     // total_ratings
      ]
    );

    await client.query('COMMIT');

    const business = businessResult.rows[0];
    
    return {
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
      operatingHours: value.operatingHours || [],
      createdAt: business.created_at
    };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get business by ID
 */
export const getBusinessById = async (businessId) => {
  const result = await pool.query(
    `SELECT id, owner_id, name, description, business_type,
            ST_Y(location::geometry) as latitude, ST_X(location::geometry) as longitude,
            address, city, country, contact_email, contact_phone, 
            verified, rating, total_ratings, created_at, updated_at
     FROM businesses
     WHERE id = $1`,
    [businessId]
  );

  if (result.rows.length === 0) {
    throw {
      status: 404,
      code: 'BUSINESS_NOT_FOUND',
      message: 'Business not found'
    };
  }

  const business = result.rows[0];
  
  return {
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
  };
};

/**
 * Update business profile
 */
export const updateBusiness = async (businessId, ownerId, updateData) => {
  const client = await pool.connect();
  
  try {
    // Validate input
    const { error, value } = businessUpdateSchema.validate(updateData, { abortEarly: false });
    if (error) {
      throw {
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Invalid business update data',
        details: error.details.map(d => d.message)
      };
    }

    await client.query('BEGIN');

    // Check if business exists and user is the owner
    const businessResult = await client.query(
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

    if (businessResult.rows[0].owner_id !== ownerId) {
      throw {
        status: 403,
        code: 'FORBIDDEN',
        message: 'You do not have permission to update this business'
      };
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (value.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(value.name);
    }

    if (value.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(value.description);
    }

    if (value.businessType !== undefined) {
      updates.push(`business_type = $${paramCount++}`);
      values.push(value.businessType);
    }

    if (value.contactEmail !== undefined) {
      updates.push(`contact_email = $${paramCount++}`);
      values.push(value.contactEmail);
    }

    if (value.contactPhone !== undefined) {
      updates.push(`contact_phone = $${paramCount++}`);
      values.push(value.contactPhone);
    }

    // Handle location update if address, city, or country changed
    if (value.address || value.city || value.country) {
      // Get current location data
      const currentBusiness = await client.query(
        'SELECT address, city, country FROM businesses WHERE id = $1',
        [businessId]
      );

      const currentData = currentBusiness.rows[0];
      const newAddress = value.address || currentData.address;
      const newCity = value.city || currentData.city;
      const newCountry = value.country || currentData.country;

      // Geocode the new address
      let coordinates;
      try {
        coordinates = await geocodeAddress(newAddress, newCity, newCountry);
      } catch (geocodeError) {
        throw {
          status: 400,
          code: 'INVALID_ADDRESS',
          message: 'Could not validate the business address. Please check the address details.',
          details: geocodeError.message
        };
      }

      const locationPoint = `POINT(${coordinates.longitude} ${coordinates.latitude})`;
      
      updates.push(`location = ST_GeogFromText($${paramCount++})`);
      values.push(locationPoint);

      if (value.address !== undefined) {
        updates.push(`address = $${paramCount++}`);
        values.push(value.address);
      }

      if (value.city !== undefined) {
        updates.push(`city = $${paramCount++}`);
        values.push(value.city);
      }

      if (value.country !== undefined) {
        updates.push(`country = $${paramCount++}`);
        values.push(value.country);
      }
    }

    if (updates.length === 0) {
      throw {
        status: 400,
        code: 'NO_UPDATES',
        message: 'No valid fields to update'
      };
    }

    // Add businessId to values
    values.push(businessId);

    // Execute update
    const updateQuery = `
      UPDATE businesses 
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING id, owner_id, name, description, business_type,
                ST_Y(location::geometry) as latitude, ST_X(location::geometry) as longitude,
                address, city, country, contact_email, contact_phone,
                verified, rating, total_ratings, created_at, updated_at
    `;

    const result = await client.query(updateQuery, values);

    await client.query('COMMIT');

    const business = result.rows[0];
    
    return {
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
    };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Delete business
 */
export const deleteBusiness = async (businessId, ownerId) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Check if business exists and user is the owner
    const businessResult = await client.query(
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

    if (businessResult.rows[0].owner_id !== ownerId) {
      throw {
        status: 403,
        code: 'FORBIDDEN',
        message: 'You do not have permission to delete this business'
      };
    }

    // Delete business (cascade will handle related records)
    await client.query('DELETE FROM businesses WHERE id = $1', [businessId]);

    await client.query('COMMIT');

    return { message: 'Business deleted successfully' };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get businesses by owner ID
 */
export const getBusinessesByOwner = async (ownerId) => {
  const result = await pool.query(
    `SELECT id, owner_id, name, description, business_type,
            ST_Y(location::geometry) as latitude, ST_X(location::geometry) as longitude,
            address, city, country, contact_email, contact_phone,
            verified, rating, total_ratings, created_at, updated_at
     FROM businesses
     WHERE owner_id = $1
     ORDER BY created_at DESC`,
    [ownerId]
  );

  return result.rows.map(business => ({
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
};
