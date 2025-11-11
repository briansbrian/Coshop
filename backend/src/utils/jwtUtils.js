import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_EXPIRES_IN = '15m'; // 15 minutes for access token
const JWT_REFRESH_EXPIRES_IN = '7d'; // 7 days for refresh token

/**
 * Generate access token
 * @param {Object} payload - User data to encode in token
 * @returns {string} JWT access token
 */
export const generateAccessToken = (payload) => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  return jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      userType: payload.userType
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * Generate refresh token
 * @param {Object} payload - User data to encode in token
 * @returns {string} JWT refresh token
 */
export const generateRefreshToken = (payload) => {
  if (!JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET is not defined in environment variables');
  }

  return jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      userType: payload.userType
    },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );
};

/**
 * Generate both access and refresh tokens
 * @param {Object} user - User object with id, email, and userType
 * @returns {Object} Object containing accessToken and refreshToken
 */
export const generateTokens = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    userType: user.userType
  };

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
    expiresIn: JWT_EXPIRES_IN
  };
};

/**
 * Verify access token
 * @param {string} token - JWT access token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export const verifyAccessToken = (token) => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw {
        status: 401,
        code: 'TOKEN_EXPIRED',
        message: 'Access token has expired'
      };
    } else if (error.name === 'JsonWebTokenError') {
      throw {
        status: 401,
        code: 'INVALID_TOKEN',
        message: 'Invalid access token'
      };
    }
    throw error;
  }
};

/**
 * Verify refresh token
 * @param {string} token - JWT refresh token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export const verifyRefreshToken = (token) => {
  if (!JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET is not defined in environment variables');
  }

  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw {
        status: 401,
        code: 'REFRESH_TOKEN_EXPIRED',
        message: 'Refresh token has expired'
      };
    } else if (error.name === 'JsonWebTokenError') {
      throw {
        status: 401,
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid refresh token'
      };
    }
    throw error;
  }
};

/**
 * Decode token without verification (for debugging)
 * @param {string} token - JWT token to decode
 * @returns {Object} Decoded token payload
 */
export const decodeToken = (token) => {
  return jwt.decode(token);
};
