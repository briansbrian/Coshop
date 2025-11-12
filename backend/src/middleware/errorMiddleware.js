/**
 * Error Handling Middleware
 * Centralized error handling for the application
 */

import { AppError, normalizeError, isOperationalError } from '../utils/errors.js';
import { logError } from '../utils/logger.js';

/**
 * Error handler middleware
 * Catches all errors and formats them into consistent responses
 */
export const errorHandler = (err, req, res, next) => {
  // Normalize error to AppError instance
  const error = normalizeError(err);

  // Log the error
  logError(error, req);

  // Send error response
  res.status(error.statusCode).json(error.toJSON());
};

/**
 * 404 Not Found handler
 * Catches requests to undefined routes
 */
export const notFoundHandler = (req, res, next) => {
  const error = new AppError(
    `Route ${req.method} ${req.originalUrl} not found`,
    404,
    'ROUTE_NOT_FOUND'
  );
  next(error);
};

/**
 * Async route handler wrapper
 * Automatically catches errors in async route handlers
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Validation error handler
 * Specifically handles Joi validation errors
 */
export const handleValidationError = (error) => {
  if (error.isJoi) {
    const details = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    
    return new AppError(
      'Validation failed',
      400,
      'VALIDATION_ERROR',
      details
    );
  }
  return error;
};

/**
 * Database error handler
 * Handles PostgreSQL specific errors
 */
export const handleDatabaseError = (error) => {
  // PostgreSQL unique constraint violation
  if (error.code === '23505') {
    return new AppError(
      'A record with this value already exists',
      409,
      'DUPLICATE_ENTRY',
      { constraint: error.constraint }
    );
  }

  // PostgreSQL foreign key violation
  if (error.code === '23503') {
    return new AppError(
      'Referenced record does not exist',
      400,
      'FOREIGN_KEY_VIOLATION',
      { constraint: error.constraint }
    );
  }

  // PostgreSQL not null violation
  if (error.code === '23502') {
    return new AppError(
      'Required field is missing',
      400,
      'NOT_NULL_VIOLATION',
      { column: error.column }
    );
  }

  // Generic database error
  return new AppError(
    'Database operation failed',
    500,
    'DATABASE_ERROR',
    process.env.NODE_ENV === 'development' ? { originalError: error.message } : null
  );
};

/**
 * JWT error handler
 * Handles JWT specific errors
 */
export const handleJWTError = (error) => {
  if (error.name === 'JsonWebTokenError') {
    return new AppError(
      'Invalid token',
      401,
      'INVALID_TOKEN'
    );
  }

  if (error.name === 'TokenExpiredError') {
    return new AppError(
      'Token has expired',
      401,
      'TOKEN_EXPIRED'
    );
  }

  return error;
};

/**
 * Process error before sending response
 * Applies specific error handlers based on error type
 */
export const processError = (error) => {
  let processedError = error;

  // Handle Joi validation errors
  if (error.isJoi) {
    processedError = handleValidationError(error);
  }
  // Handle database errors
  else if (error.code && error.code.startsWith('23')) {
    processedError = handleDatabaseError(error);
  }
  // Handle JWT errors
  else if (error.name && (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError')) {
    processedError = handleJWTError(error);
  }

  return normalizeError(processedError);
};

/**
 * Enhanced error handler with error processing
 */
export const enhancedErrorHandler = (err, req, res, next) => {
  // Process the error
  const error = processError(err);

  // Log the error
  logError(error, req);

  // In development, include stack trace
  const response = error.toJSON();
  if (process.env.NODE_ENV === 'development' && error.stack) {
    response.error.stack = error.stack;
  }

  // Send error response
  res.status(error.statusCode).json(response);
};

/**
 * Unhandled rejection handler
 * Catches unhandled promise rejections
 */
export const handleUnhandledRejection = () => {
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Log to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to Sentry or other error tracking service
    }
  });
};

/**
 * Uncaught exception handler
 * Catches uncaught exceptions
 */
export const handleUncaughtException = () => {
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Log to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to Sentry or other error tracking service
    }
    
    // Exit process if error is not operational
    if (!isOperationalError(error)) {
      console.error('Non-operational error detected. Shutting down...');
      process.exit(1);
    }
  });
};
