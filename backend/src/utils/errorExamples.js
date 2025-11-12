/**
 * Error Handling Examples
 * This file demonstrates how to use the custom error classes
 * and error handling utilities throughout the application
 */

import {
  ValidationError,
  AuthError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  IntegrationError,
  DatabaseError
} from './errors.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

/**
 * Example 1: Validation Error
 * Use when input data is invalid
 */
export const exampleValidationError = asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  if (!email || !email.includes('@')) {
    throw new ValidationError('Invalid email format', {
      field: 'email',
      value: email
    });
  }
  
  res.json({ message: 'Email is valid' });
});

/**
 * Example 2: Authentication Error
 * Use when credentials are invalid or token is missing
 */
export const exampleAuthError = asyncHandler(async (req, res) => {
  const { password } = req.body;
  
  if (!password) {
    throw new AuthError('Password is required', 'MISSING_PASSWORD');
  }
  
  // Simulate password check
  const isValid = false;
  if (!isValid) {
    throw new AuthError('Invalid credentials', 'INVALID_CREDENTIALS');
  }
  
  res.json({ message: 'Authenticated' });
});

/**
 * Example 3: Authorization Error
 * Use when user doesn't have permission
 */
export const exampleAuthorizationError = asyncHandler(async (req, res) => {
  const userRole = req.user?.userType;
  
  if (userRole !== 'admin') {
    throw new AuthorizationError('Only administrators can access this resource');
  }
  
  res.json({ message: 'Access granted' });
});

/**
 * Example 4: Not Found Error
 * Use when a resource doesn't exist
 */
export const exampleNotFoundError = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  // Simulate database query
  const user = null;
  
  if (!user) {
    throw new NotFoundError('User', userId);
  }
  
  res.json({ user });
});

/**
 * Example 5: Conflict Error
 * Use when there's a duplicate or conflicting operation
 */
export const exampleConflictError = asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  // Simulate checking for existing user
  const existingUser = { email };
  
  if (existingUser) {
    throw new ConflictError('User with this email already exists', {
      email,
      existingUserId: existingUser.id
    });
  }
  
  res.json({ message: 'User created' });
});

/**
 * Example 6: Integration Error
 * Use when external service fails
 */
export const exampleIntegrationError = asyncHandler(async (req, res) => {
  try {
    // Simulate external API call
    const response = await fetch('https://api.example.com/data');
    
    if (!response.ok) {
      throw new IntegrationError(
        'Payment Gateway',
        'Failed to process payment',
        { statusCode: response.status }
      );
    }
    
    res.json({ message: 'Payment processed' });
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new IntegrationError(
        'Payment Gateway',
        'Service unavailable',
        { originalError: error.message }
      );
    }
    throw error;
  }
});

/**
 * Example 7: Database Error
 * Use when database operations fail
 */
export const exampleDatabaseError = asyncHandler(async (req, res) => {
  try {
    // Simulate database query
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    
    res.json({ user: result.rows[0] });
  } catch (error) {
    throw new DatabaseError('Failed to fetch user from database', {
      query: 'SELECT * FROM users',
      originalError: error.message
    });
  }
});

/**
 * Example 8: Using asyncHandler wrapper
 * Automatically catches errors in async functions
 */
export const exampleAsyncHandler = asyncHandler(async (req, res) => {
  // Any error thrown here will be automatically caught
  // and passed to the error handling middleware
  
  const data = await someAsyncOperation();
  
  if (!data) {
    throw new NotFoundError('Data');
  }
  
  res.json({ data });
});

/**
 * Example 9: Service layer error handling
 * How to throw errors from service functions
 */
export const exampleServiceError = async (userId) => {
  // Validate input
  if (!userId) {
    throw new ValidationError('User ID is required');
  }
  
  // Check if user exists
  const user = await findUserById(userId);
  if (!user) {
    throw new NotFoundError('User', userId);
  }
  
  // Check permissions
  if (!user.isActive) {
    throw new AuthorizationError('User account is inactive');
  }
  
  return user;
};

/**
 * Example 10: Route with multiple error scenarios
 */
export const exampleCompleteRoute = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;
  
  // Validation
  if (!quantity || quantity < 1) {
    throw new ValidationError('Quantity must be at least 1', {
      field: 'quantity',
      value: quantity
    });
  }
  
  // Check if product exists
  const product = await findProductById(productId);
  if (!product) {
    throw new NotFoundError('Product', productId);
  }
  
  // Check inventory
  if (product.quantity < quantity) {
    throw new ConflictError('Insufficient inventory', {
      requested: quantity,
      available: product.quantity
    });
  }
  
  // Check user permissions
  if (req.user.userType !== 'consumer') {
    throw new AuthorizationError('Only consumers can purchase products');
  }
  
  // Process order
  try {
    const order = await createOrder(req.user.id, productId, quantity);
    res.status(201).json({ order });
  } catch (error) {
    if (error.code === 'PAYMENT_FAILED') {
      throw new IntegrationError('Payment Gateway', 'Payment processing failed');
    }
    throw error;
  }
});

// Mock functions for examples
const someAsyncOperation = async () => null;
const findUserById = async (id) => null;
const findProductById = async (id) => null;
const createOrder = async (userId, productId, quantity) => ({});
