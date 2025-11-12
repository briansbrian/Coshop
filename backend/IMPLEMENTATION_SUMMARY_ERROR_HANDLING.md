# Error Handling and Logging Implementation Summary

## Overview

Implemented a comprehensive error handling and logging system for the CoShop backend API, providing standardized error responses, typed error classes, and structured logging.

## What Was Implemented

### 1. Custom Error Classes (`src/utils/errors.js`)

Created typed error classes for different scenarios:

- **AppError** - Base error class with standardized JSON formatting
- **ValidationError** (400) - Invalid input data or business rule violations
- **AuthError** (401) - Authentication failures
- **AuthorizationError** (403) - Permission denied
- **NotFoundError** (404) - Resource not found
- **ConflictError** (409) - Duplicate resources or conflicts
- **IntegrationError** (502) - External service failures
- **DatabaseError** (500) - Database operation failures

All errors automatically format to consistent JSON responses with error codes, messages, and optional details.

### 2. Error Handling Middleware (`src/middleware/errorMiddleware.js`)

Implemented comprehensive error handling middleware:

- **errorHandler** - Basic error response formatter
- **enhancedErrorHandler** - Advanced error processor with automatic error type detection
- **notFoundHandler** - Catches undefined routes (404)
- **asyncHandler** - Wrapper for async route handlers to catch errors automatically
- **processError** - Automatically converts Joi, PostgreSQL, and JWT errors to appropriate error classes
- **handleUnhandledRejection** - Global handler for unhandled promise rejections
- **handleUncaughtException** - Global handler for uncaught exceptions

### 3. Logging System (`src/utils/logger.js`)

Created structured logging with multiple log levels:

- **Request logging** - Automatic logging of all API requests with method, URL, status, duration, and user context
- **Error logging** - Detailed error logs with stack traces (in development) and request context
- **Manual logging** - Functions for info, warn, debug, and error logs
- **Module-specific loggers** - Create loggers for specific modules
- **Query logging** - Optional database query logging for debugging
- **External API logging** - Track external service calls with timing

Features:
- JSON-formatted logs for production log aggregation
- Pretty-printed logs for development
- Automatic user context inclusion for authenticated requests
- Sentry integration placeholders for production error tracking

### 4. Server Integration (`src/server.js`)

Updated the main server file to use the new system:

- Added request logging middleware
- Replaced basic error handler with enhanced error handler
- Added 404 handler for undefined routes
- Set up global error handlers for unhandled rejections and exceptions

### 5. Documentation

Created comprehensive documentation:

- **ERROR_HANDLING_GUIDE.md** - Complete guide with examples and best practices
- **errorExamples.js** - Code examples demonstrating all error types and patterns

## Error Response Format

All errors now return a consistent format:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "User with id '123' not found",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

With optional details:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ],
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

## Usage Examples

### Throwing Errors in Services

```javascript
import { NotFoundError, ValidationError } from '../utils/errors.js';

export const getUser = async (userId) => {
  if (!userId) {
    throw new ValidationError('User ID is required');
  }
  
  const user = await findUserById(userId);
  if (!user) {
    throw new NotFoundError('User', userId);
  }
  
  return user;
};
```

### Using asyncHandler in Routes

```javascript
import { asyncHandler } from '../middleware/errorMiddleware.js';

router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await getUser(req.params.id);
  res.json({ user });
}));
```

### Logging

```javascript
import { logInfo, logError } from '../utils/logger.js';

logInfo('Order created', { orderId: order.id, amount: order.totalAmount });

try {
  await processPayment();
} catch (error) {
  logError(error, req);
  throw error;
}
```

## Benefits

1. **Consistency** - All errors follow the same format across the entire API
2. **Type Safety** - Typed error classes make it clear what kind of error occurred
3. **Better Debugging** - Structured logs with context make debugging easier
4. **Production Ready** - Includes error tracking integration points and proper error handling
5. **Developer Experience** - Clear error messages and comprehensive documentation
6. **Automatic Processing** - Middleware automatically handles common error types (Joi, PostgreSQL, JWT)
7. **Request Tracking** - All requests are logged with timing and user context

## Next Steps

To fully utilize the system:

1. Update existing services to use the new error classes instead of throwing plain objects
2. Wrap all async route handlers with `asyncHandler`
3. Configure Sentry or another error tracking service for production
4. Set up log aggregation (ELK stack, CloudWatch, etc.) for production logs
5. Add custom error codes for business-specific errors as needed

## Files Created/Modified

### Created:
- `backend/src/utils/errors.js` - Custom error classes
- `backend/src/utils/logger.js` - Logging system
- `backend/src/middleware/errorMiddleware.js` - Error handling middleware
- `backend/src/utils/errorExamples.js` - Usage examples
- `backend/ERROR_HANDLING_GUIDE.md` - Comprehensive documentation
- `backend/IMPLEMENTATION_SUMMARY_ERROR_HANDLING.md` - This file

### Modified:
- `backend/src/server.js` - Integrated new error handling and logging
- `backend/src/middleware/index.js` - Exported new middleware functions

## Requirements Satisfied

This implementation satisfies the requirements from task 20:

✅ **20.1 Create error handling utilities**
- Custom error classes (ValidationError, AuthError, NotFoundError, etc.)
- Standardized error response format
- Error handling middleware

✅ **20.2 Implement logging system**
- Console logging for development
- All API requests logged with method, path, status code
- Errors logged with stack traces
- Sentry integration placeholders for production

All requirements need proper error handling - this system provides a foundation for consistent error handling across all services and routes.
