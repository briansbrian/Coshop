import express from 'express';
import { 
  registerUser, 
  authenticateUser, 
  getUserById 
} from '../services/authService.js';
import { 
  generateTokens, 
  verifyRefreshToken 
} from '../utils/jwtUtils.js';

const router = express.Router();

/**
 * POST /api/v1/auth/register
 * Register a new user (consumer or SME)
 */
router.post('/register', async (req, res, next) => {
  try {
    const userData = req.body;
    
    // Register user
    const user = await registerUser(userData);
    
    // Generate tokens
    const tokens = generateTokens(user);
    
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        userType: user.userType
      },
      ...tokens
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/auth/login
 * Authenticate user and return tokens
 */
router.post('/login', async (req, res, next) => {
  try {
    const credentials = req.body;
    
    // Authenticate user
    const user = await authenticateUser(credentials);
    
    // Generate tokens
    const tokens = generateTokens(user);
    
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        userType: user.userType
      },
      ...tokens
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        error: {
          code: 'MISSING_REFRESH_TOKEN',
          message: 'Refresh token is required',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    // Get user data
    const user = await getUserById(decoded.userId);
    
    // Generate new tokens
    const tokens = generateTokens(user);
    
    res.status(200).json({
      message: 'Token refreshed successfully',
      ...tokens
    });
  } catch (error) {
    next(error);
  }
});

export default router;
