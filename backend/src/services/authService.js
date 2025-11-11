import bcrypt from 'bcrypt';
import Joi from 'joi';
import pool from '../config/database.js';

/**
 * Authentication Service
 * Handles user registration, validation, and password management
 */

// Validation schemas
const registrationSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  userType: Joi.string().valid('sme', 'consumer').required(),
  businessInfo: Joi.object({
    name: Joi.string().required(),
    businessType: Joi.string().valid('shop', 'business', 'service').required(),
    description: Joi.string().allow(''),
    address: Joi.string().required(),
    city: Joi.string().required(),
    country: Joi.string().required(),
    contactEmail: Joi.string().email().required(),
    contactPhone: Joi.string().required()
  }).when('userType', {
    is: 'sme',
    then: Joi.required(),
    otherwise: Joi.forbidden()
  })
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

/**
 * Validate user registration data
 */
export const validateRegistration = (data) => {
  return registrationSchema.validate(data, { abortEarly: false });
};

/**
 * Validate login credentials
 */
export const validateLogin = (data) => {
  return loginSchema.validate(data, { abortEarly: false });
};

/**
 * Hash password using bcrypt
 */
export const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Compare password with hash
 */
export const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

/**
 * Register a new user (consumer or SME)
 */
export const registerUser = async (userData) => {
  const client = await pool.connect();
  
  try {
    // Validate input
    const { error, value } = validateRegistration(userData);
    if (error) {
      throw {
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Invalid registration data',
        details: error.details.map(d => d.message)
      };
    }

    await client.query('BEGIN');

    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [value.email]
    );

    if (existingUser.rows.length > 0) {
      throw {
        status: 409,
        code: 'USER_EXISTS',
        message: 'User with this email already exists'
      };
    }

    // Hash password
    const passwordHash = await hashPassword(value.password);

    // Create user
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, user_type, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING id, email, user_type, created_at`,
      [value.email, passwordHash, value.userType]
    );

    const user = userResult.rows[0];

    // If SME, create business profile
    if (value.userType === 'sme' && value.businessInfo) {
      const { businessInfo } = value;
      
      await client.query(
        `INSERT INTO businesses (
          owner_id, name, description, business_type, address, city, country,
          contact_email, contact_phone, verified, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
        [
          user.id,
          businessInfo.name,
          businessInfo.description || '',
          businessInfo.businessType,
          businessInfo.address,
          businessInfo.city,
          businessInfo.country,
          businessInfo.contactEmail,
          businessInfo.contactPhone,
          false
        ]
      );
    }

    await client.query('COMMIT');

    return {
      id: user.id,
      email: user.email,
      userType: user.user_type,
      createdAt: user.created_at
    };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Authenticate user with email and password
 */
export const authenticateUser = async (credentials) => {
  // Validate input
  const { error, value } = validateLogin(credentials);
  if (error) {
    throw {
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Invalid login credentials',
      details: error.details.map(d => d.message)
    };
  }

  // Find user by email
  const result = await pool.query(
    'SELECT id, email, password_hash, user_type FROM users WHERE email = $1',
    [value.email]
  );

  if (result.rows.length === 0) {
    throw {
      status: 401,
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password'
    };
  }

  const user = result.rows[0];

  // Verify password
  const isValidPassword = await comparePassword(value.password, user.password_hash);
  
  if (!isValidPassword) {
    throw {
      status: 401,
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password'
    };
  }

  return {
    id: user.id,
    email: user.email,
    userType: user.user_type
  };
};

/**
 * Get user by ID
 */
export const getUserById = async (userId) => {
  const result = await pool.query(
    'SELECT id, email, user_type, created_at FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw {
      status: 404,
      code: 'USER_NOT_FOUND',
      message: 'User not found'
    };
  }

  const user = result.rows[0];
  return {
    id: user.id,
    email: user.email,
    userType: user.user_type,
    createdAt: user.created_at
  };
};
