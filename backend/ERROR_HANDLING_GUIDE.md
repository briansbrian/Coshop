# Error Handling and Logging Guide

This guide explains how to use the error handling and logging system in the CoShop backend.

## Table of Contents

1. [Custom Error Classes](#custom-error-classes)
2. [Error Handling Middleware](#error-handling-middleware)
3. [Logging System](#logging-system)
4. [Best Practices](#best-practices)
5. [Examples](#examples)

## Custom Error Classes

The application provides typed error classes for different scenarios. All errors extend from `AppError` and automatically format responses.

### Available Error Classes

#### ValidationError (400)
Use for invalid input data, missing required fields, or business rule violations.

```javascript
import { ValidationError } from './utils/errors.js';

throw new ValidationError('Invalid email format');
throw new ValidationError('Validation failed', {
  field: 'email',
  message: 'Email is required'
});
```

#### AuthError (401)
Use for invalid credentials, expired tokens, or missing authentication.

```javascript
import { AuthError } from './utils/errors.js';

throw new AuthError('Invalid credentials');
throw new AuthError('Token expired', 'TOKEN_EXPIRED');
```

#### AuthorizationError (403)
Use for insufficient permissions or forbidden access.

```javascript
import { AuthorizationError } from './utils/errors.js';

throw new AuthorizationError();
throw new AuthorizationError('Only SME owners can access this resource');
```

#### NotFoundError (404)
Use when a requested resource doesn't exist.

```javascript
import { NotFoundError } from './utils/errors.js';

throw new NotFoundError('User', userId);
throw new NotFoundError('Product');
```

#### ConflictError (409)
Use for duplicate resources or conflicting operations.

```javascript
import { ConflictError } from './utils/errors.js';

throw new ConflictError('User with this email already exists');
throw new ConflictError('Insufficient inventory', {
  requested: 10,
  available: 5
});
```

#### IntegrationError (502)
Use when external service integration fails.

```javascript
import { IntegrationError } from './utils/errors.js';

throw new IntegrationError('Payment Gateway', 'Service unavailable');
throw new IntegrationError('Stripe', 'Payment processing failed', {
  errorCode: 'card_declined'
});
```

#### DatabaseError (500)
Use for database connection or query failures.

```javascript
import { DatabaseError } from './utils/errors.js';

throw new DatabaseError('Failed to connect to database');
throw new DatabaseError('Query execution failed', {
  query: 'SELECT * FROM users'
});
```

## Error Handling Middleware

### asyncHandler

Wrap async route handlers to automatically catch errors:

```javascript
import { asyncHandler } from './middleware/errorMiddleware.js';

router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await getUserById(req.params.id);
  
  if (!user) {
    throw new NotFoundError('User', req.params.id);
  }
  
  res.json({ user });
}));
```

### Error Response Format

All errors return a consistent JSON format:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "User with id '123' not found",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

With details:

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

### Automatic Error Processing

The middleware automatically handles:

- **Joi validation errors** → ValidationError
- **PostgreSQL constraint violations** → ConflictError or ValidationError
- **JWT errors** → AuthError
- **Database errors** → DatabaseError

## Logging System

### Request Logging

All API requests are automatically logged with:
- HTTP method and URL
- Response status code
- Request duration
- User information (if authenticated)
- IP address and user agent

```
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "INFO",
  "message": "GET /api/v1/products",
  "request": {
    "method": "GET",
    "url": "/api/v1/products",
    "ip": "192.168.1.1",
    "userAgent": "Mozilla/5.0..."
  },
  "response": {
    "statusCode": 200,
    "duration": "45ms"
  }
}
```

### Error Logging

Errors are automatically logged with full context:

```javascript
import { logError } from './utils/logger.js';

try {
  // Some operation
} catch (error) {
  logError(error, req);
  throw error;
}
```

### Manual Logging

Use the logger for custom log messages:

```javascript
import { logInfo, logWarn, logDebug } from './utils/logger.js';

logInfo('User registered successfully', { userId: user.id });
logWarn('Low inventory detected', { productId, quantity: 5 });
logDebug('Cache hit', { key: 'products:123' });
```

### Module-Specific Logger

Create a logger for a specific module:

```javascript
import { createLogger } from './utils/logger.js';

const logger = createLogger('ProductService');

logger.info('Product created', { productId });
logger.error('Failed to update inventory', { error });
```

### Database Query Logging

Enable query logging in development:

```javascript
import { logQuery } from './utils/logger.js';

const startTime = Date.now();
const result = await pool.query(query, params);
const duration = Date.now() - startTime;

logQuery(query, params, duration);
```

Set `LOG_QUERIES=true` in `.env` to enable.

### External API Logging

Log external API calls:

```javascript
import { logExternalAPI } from './utils/logger.js';

const startTime = Date.now();
const response = await axios.get('https://api.stripe.com/...');
const duration = Date.now() - startTime;

logExternalAPI('Stripe', 'GET', url, response.status, duration);
```

## Best Practices

### 1. Use Specific Error Classes

Always use the most specific error class:

```javascript
// ❌ Bad
throw new Error('User not found');

// ✅ Good
throw new NotFoundError('User', userId);
```

### 2. Provide Context in Error Details

Include relevant information in error details:

```javascript
// ❌ Bad
throw new ValidationError('Invalid data');

// ✅ Good
throw new ValidationError('Invalid product data', {
  field: 'price',
  value: -10,
  constraint: 'Price must be positive'
});
```

### 3. Use asyncHandler for Route Handlers

Always wrap async route handlers:

```javascript
// ❌ Bad
router.get('/users', async (req, res) => {
  const users = await getUsers();
  res.json({ users });
});

// ✅ Good
router.get('/users', asyncHandler(async (req, res) => {
  const users = await getUsers();
  res.json({ users });
}));
```

### 4. Let Errors Bubble Up

Don't catch errors unless you need to add context:

```javascript
// ❌ Bad
try {
  const user = await getUserById(id);
  return user;
} catch (error) {
  console.error(error);
  throw error; // Unnecessary try-catch
}

// ✅ Good
const user = await getUserById(id);
return user;
```

### 5. Add Context When Re-throwing

If you catch an error, add context before re-throwing:

```javascript
// ✅ Good
try {
  await externalAPI.call();
} catch (error) {
  throw new IntegrationError('Payment Gateway', 'Failed to process payment', {
    originalError: error.message
  });
}
```

### 6. Log Important Operations

Log significant operations and state changes:

```javascript
import { logInfo } from './utils/logger.js';

const order = await createOrder(orderData);
logInfo('Order created', {
  orderId: order.id,
  userId: order.consumerId,
  amount: order.totalAmount
});
```

### 7. Don't Log Sensitive Data

Never log passwords, tokens, or sensitive information:

```javascript
// ❌ Bad
logInfo('User login', { email, password });

// ✅ Good
logInfo('User login', { email });
```

## Examples

### Service Layer

```javascript
import { NotFoundError, ValidationError } from '../utils/errors.js';

export const updateProduct = async (productId, updates) => {
  // Validate input
  if (!updates.price || updates.price < 0) {
    throw new ValidationError('Price must be positive', {
      field: 'price',
      value: updates.price
    });
  }
  
  // Check if product exists
  const product = await findProductById(productId);
  if (!product) {
    throw new NotFoundError('Product', productId);
  }
  
  // Update product
  const updated = await pool.query(
    'UPDATE products SET price = $1 WHERE id = $2 RETURNING *',
    [updates.price, productId]
  );
  
  return updated.rows[0];
};
```

### Route Handler

```javascript
import { asyncHandler } from '../middleware/errorMiddleware.js';
import { requireSME } from '../middleware/rbacMiddleware.js';
import { updateProduct } from '../services/productService.js';

router.put('/products/:id', 
  authenticate,
  requireSME,
  asyncHandler(async (req, res) => {
    const product = await updateProduct(req.params.id, req.body);
    
    res.json({
      message: 'Product updated successfully',
      product
    });
  })
);
```

### Integration with External Service

```javascript
import { IntegrationError } from '../utils/errors.js';
import { logExternalAPI } from '../utils/logger.js';

export const processPayment = async (amount, token) => {
  const startTime = Date.now();
  
  try {
    const response = await stripe.charges.create({
      amount,
      currency: 'usd',
      source: token
    });
    
    const duration = Date.now() - startTime;
    logExternalAPI('Stripe', 'POST', '/charges', 200, duration);
    
    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    logExternalAPI('Stripe', 'POST', '/charges', error.statusCode, duration);
    
    throw new IntegrationError('Stripe', 'Payment processing failed', {
      errorCode: error.code,
      message: error.message
    });
  }
};
```

## Environment Variables

Configure logging behavior with environment variables:

```env
NODE_ENV=development          # Enable debug logs and stack traces
LOG_QUERIES=true             # Enable database query logging
```

## Production Considerations

In production:
- Stack traces are not included in error responses
- Debug logs are disabled
- Errors can be sent to external tracking services (Sentry)
- Logs are formatted as compact JSON for log aggregation

To integrate Sentry, uncomment the Sentry integration code in `logger.js` and `errorMiddleware.js`.
