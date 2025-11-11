import { verifyAccessToken } from '../utils/jwtUtils.js';
import { getUserById } from '../services/authService.js';

/**
 * Authentication middleware
 * Verifies JWT token from Authorization header and attaches user to request
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        error: {
          code: 'NO_TOKEN',
          message: 'Authorization token is required',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    // Check if header follows "Bearer <token>" format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        error: {
          code: 'INVALID_TOKEN_FORMAT',
          message: 'Authorization header must be in format: Bearer <token>',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    const token = parts[1];
    
    // Verify token
    const decoded = verifyAccessToken(token);
    
    // Get user data and attach to request
    const user = await getUserById(decoded.userId);
    req.user = user;
    
    next();
  } catch (error) {
    // Handle token verification errors
    if (error.status === 401) {
      return res.status(401).json({
        error: {
          code: error.code,
          message: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    // Handle other errors
    next(error);
  }
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is present, but doesn't require it
 */
export const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return next();
    }
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return next();
    }
    
    const token = parts[1];
    
    try {
      const decoded = verifyAccessToken(token);
      const user = await getUserById(decoded.userId);
      req.user = user;
    } catch (error) {
      // Silently fail for optional authentication
    }
    
    next();
  } catch (error) {
    next(error);
  }
};
