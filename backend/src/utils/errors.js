/**
 * Custom Error Classes
 * Provides typed exceptions for different error scenarios
 * 
 * Usage:
 * import { ValidationError, NotFoundError, AuthError } from './utils/errors.js';
 * 
 * throw new ValidationError('Invalid email format');
 * throw new NotFoundError('User', userId);
 * throw new AuthError('Invalid credentials');
 */

/**
 * Base Application Error
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_SERVER_ERROR', details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
        timestamp: new Date().toISOString()
      }
    };
  }
}

/**
 * Validation Error (400)
 * Used for invalid input data, missing required fields, or business rule violations
 */
export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

/**
 * Authentication Error (401)
 * Used for invalid credentials, expired tokens, or missing authentication
 */
export class AuthError extends AppError {
  constructor(message, code = 'AUTHENTICATION_ERROR') {
    super(message, 401, code);
  }
}

/**
 * Authorization Error (403)
 * Used for insufficient permissions or forbidden access
 */
export class AuthorizationError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

/**
 * Not Found Error (404)
 * Used when a requested resource does not exist
 */
export class NotFoundError extends AppError {
  constructor(resource = 'Resource', id = null) {
    const message = id 
      ? `${resource} with id '${id}' not found`
      : `${resource} not found`;
    super(message, 404, 'NOT_FOUND');
  }
}

/**
 * Conflict Error (409)
 * Used for duplicate resources or conflicting operations
 */
export class ConflictError extends AppError {
  constructor(message, details = null) {
    super(message, 409, 'CONFLICT_ERROR', details);
  }
}

/**
 * Integration Error (502)
 * Used when external service integration fails
 */
export class IntegrationError extends AppError {
  constructor(service, message = 'External service unavailable', details = null) {
    super(`${service}: ${message}`, 502, 'INTEGRATION_ERROR', details);
    this.service = service;
  }
}

/**
 * Database Error (500)
 * Used for database connection or query failures
 */
export class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', details = null) {
    super(message, 500, 'DATABASE_ERROR', details);
  }
}

/**
 * Helper function to check if error is operational
 */
export const isOperationalError = (error) => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};

/**
 * Helper function to convert legacy error objects to AppError instances
 */
export const normalizeError = (error) => {
  // If already an AppError, return as is
  if (error instanceof AppError) {
    return error;
  }

  // Handle legacy error objects with status property
  if (error.status) {
    const statusCode = error.status;
    const code = error.code || 'UNKNOWN_ERROR';
    const message = error.message || 'An error occurred';
    const details = error.details || null;

    // Map to appropriate error class based on status code
    switch (statusCode) {
      case 400:
        return new ValidationError(message, details);
      case 401:
        return new AuthError(message, code);
      case 403:
        return new AuthorizationError(message);
      case 404:
        return new NotFoundError(message);
      case 409:
        return new ConflictError(message, details);
      case 502:
      case 503:
        return new IntegrationError('External Service', message, details);
      default:
        return new AppError(message, statusCode, code, details);
    }
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return new AppError(error.message, 500, 'INTERNAL_SERVER_ERROR');
  }

  // Handle unknown error types
  return new AppError('An unexpected error occurred', 500, 'INTERNAL_SERVER_ERROR');
};
