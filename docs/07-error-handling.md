# Error Handling

## Error Response Format

All API errors follow a consistent JSON structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": "Additional context (optional)",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## Error Throwing Pattern

Services throw structured error objects:

```javascript
throw {
  status: 404,
  code: 'RESOURCE_NOT_FOUND',
  message: 'The requested resource was not found',
  details: 'Additional context'
};
```

## Error Handling Middleware

**Location:** `backend/src/server.js`

**Process:**
1. Catches all errors from routes and middleware
2. Logs error stack to console
3. Extracts status code (default: 500)
4. Formats error response
5. Sends JSON response to client

**Implementation:**
```javascript
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred',
      timestamp: new Date().toISOString()
    }
  });
});
```

## HTTP Status Codes

### 400 Bad Request

**When:** Invalid input data, validation failures

**Error Codes:**
- `VALIDATION_ERROR` - Joi validation failed
- `MISSING_BUSINESS_ID` - Required field missing
- `NO_UPDATES` - No valid fields to update
- `INVALID_ADDRESS` - Address cannot be geocoded
- `GEOCODING_FAILED` - Address not found

**Example:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid product data",
    "details": [
      "\"price\" must be a positive number",
      "\"category\" must be one of [electronics, clothing, ...]"
    ],
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### 401 Unauthorized

**When:** Authentication failures

**Error Codes:**
- `NO_TOKEN` - Missing Authorization header
- `INVALID_TOKEN_FORMAT` - Malformed header
- `TOKEN_EXPIRED` - Access token expired
- `INVALID_TOKEN` - Invalid signature or corrupted
- `REFRESH_TOKEN_EXPIRED` - Refresh token expired
- `INVALID_REFRESH_TOKEN` - Invalid refresh token
- `INVALID_CREDENTIALS` - Wrong email or password
- `AUTHENTICATION_REQUIRED` - Endpoint requires auth

**Example:**
```json
{
  "error": {
    "code": "TOKEN_EXPIRED",
    "message": "Access token has expired",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### 403 Forbidden

**When:** Authorization failures (authenticated but not permitted)

**Error Codes:**
- `INSUFFICIENT_PERMISSIONS` - Wrong user role
- `FORBIDDEN` - Not authorized to access resource

**Example:**
```json
{
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "Only SME users can create businesses",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### 404 Not Found

**When:** Resource doesn't exist

**Error Codes:**
- `USER_NOT_FOUND` - User ID doesn't exist
- `BUSINESS_NOT_FOUND` - Business ID doesn't exist
- `PRODUCT_NOT_FOUND` - Product ID doesn't exist

**Example:**
```json
{
  "error": {
    "code": "BUSINESS_NOT_FOUND",
    "message": "Business not found",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### 409 Conflict

**When:** Resource already exists or state conflict

**Error Codes:**
- `USER_EXISTS` - Email already registered

**Example:**
```json
{
  "error": {
    "code": "USER_EXISTS",
    "message": "User with this email already exists",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### 500 Internal Server Error

**When:** Unexpected server errors

**Error Codes:**
- `INTERNAL_SERVER_ERROR` - Generic server error

**Example:**
```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### 502 Bad Gateway

**When:** External service failures

**Error Codes:**
- `GEOCODING_SERVICE_ERROR` - Nominatim/Google Maps unavailable

**Example:**
```json
{
  "error": {
    "code": "GEOCODING_SERVICE_ERROR",
    "message": "Geocoding service unavailable",
    "details": "Connection timeout",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## Validation Errors

### Joi Validation

**Pattern:**
```javascript
const { error, value } = schema.validate(data, { abortEarly: false });
if (error) {
  throw {
    status: 400,
    code: 'VALIDATION_ERROR',
    message: 'Invalid data',
    details: error.details.map(d => d.message)
  };
}
```

**Details Array:**
Contains all validation errors, not just the first one.

**Example Details:**
```json
[
  "\"email\" must be a valid email",
  "\"password\" length must be at least 8 characters long",
  "\"userType\" must be one of [sme, consumer]"
]
```

## Database Errors

### Connection Errors

**Handling:**
- Caught by error middleware
- Logged to console
- Returned as 500 INTERNAL_SERVER_ERROR
- Details not exposed to client (security)

### Transaction Rollback

**Pattern:**
```javascript
const client = await pool.connect();
try {
  await client.query('BEGIN');
  // ... operations
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;  // Re-throw to error middleware
} finally {
  client.release();
}
```

**Why rollback?** Ensures data consistency when multi-step operations fail.

### Foreign Key Violations

**Example:** Deleting a user with existing orders

**Handling:**
- Caught by error middleware
- Returned as 500 (not exposed to client)
- Should be prevented by application logic

**Prevention:** Use CASCADE deletes or check dependencies before deletion.

## External Service Errors

### Geocoding Failures

**Nominatim Unavailable:**
1. Try Google Maps fallback (if configured)
2. If both fail: Throw 502 GEOCODING_SERVICE_ERROR

**Address Not Found:**
1. Throw 400 GEOCODING_FAILED
2. User must correct address

**Rate Limiting:**
- Nominatim: 1 req/sec limit
- Should implement request queuing (not yet implemented)
- Cache results to reduce requests

### Future: Payment Gateway Errors

**Not implemented yet**

**Planned Error Codes:**
- `PAYMENT_FAILED` - Payment declined
- `PAYMENT_GATEWAY_ERROR` - Stripe/PayPal unavailable

### Future: Delivery Service Errors

**Not implemented yet**

**Planned Error Codes:**
- `DELIVERY_UNAVAILABLE` - No delivery service available
- `DELIVERY_SERVICE_ERROR` - Uber/Pick Up Mtaani API error

## Error Logging

### Current Implementation

**Console Logging:**
```javascript
console.error(err.stack);
```

**Logs:**
- Error message
- Stack trace
- Request context (via Express)

### Production Recommendations

**Structured Logging:**
- Use Winston or Pino for structured logs
- Include request ID, user ID, timestamp
- Log to file or external service

**Error Tracking:**
- Integrate Sentry or similar service
- Capture stack traces and context
- Alert on critical errors
- Track error frequency and patterns

**Example with Sentry:**
```javascript
const Sentry = require('@sentry/node');

app.use((err, req, res, next) => {
  Sentry.captureException(err);
  // ... send error response
});
```

## Client-Side Error Handling

### Recommended Pattern

```javascript
try {
  const response = await fetch('/api/v1/products', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    
    // Handle specific errors
    if (error.error.code === 'TOKEN_EXPIRED') {
      // Refresh token and retry
      await refreshAccessToken();
      return retryRequest();
    }
    
    if (error.error.code === 'VALIDATION_ERROR') {
      // Show validation errors to user
      showValidationErrors(error.error.details);
      return;
    }
    
    // Generic error handling
    showErrorMessage(error.error.message);
  }
  
  const data = await response.json();
  // ... handle success
  
} catch (error) {
  // Network error or JSON parse error
  showErrorMessage('Network error. Please try again.');
}
```

### Token Expiration Handling

**Strategy:**
1. Detect 401 TOKEN_EXPIRED
2. Call `/auth/refresh` with refresh token
3. Store new tokens
4. Retry original request
5. If refresh fails: Redirect to login

## Error Prevention

### Input Validation

**Always validate:**
- Required fields present
- Correct data types
- Valid formats (email, phone, URL)
- Value ranges (price > 0, stars 1-5)
- String lengths

**Use Joi schemas** for consistent validation across all endpoints.

### Authorization Checks

**Always verify:**
- User is authenticated (for protected routes)
- User has correct role (SME vs consumer)
- User owns the resource (for modifications)

**Use middleware** for consistent authorization.

### Database Constraints

**Use constraints:**
- NOT NULL for required fields
- UNIQUE for unique fields (email)
- CHECK for enums and ranges
- FOREIGN KEY for relationships

**Why?** Last line of defense against invalid data.

## Testing Error Scenarios

### Unit Tests

**Test each error path:**
- Invalid input data
- Missing required fields
- Unauthorized access
- Resource not found
- Duplicate resources

### Integration Tests

**Test error responses:**
- Correct status codes
- Correct error codes
- Error message format
- Details included when appropriate

**Example:**
```javascript
test('POST /products returns 400 for invalid price', async () => {
  const response = await request(app)
    .post('/api/v1/products')
    .set('Authorization', `Bearer ${token}`)
    .send({ price: -10 });
  
  expect(response.status).toBe(400);
  expect(response.body.error.code).toBe('VALIDATION_ERROR');
  expect(response.body.error.details).toContain('"price" must be a positive number');
});
```

## Future Enhancements

Not yet implemented:

- Request ID tracking across services
- Structured logging with Winston/Pino
- Error tracking with Sentry
- Rate limiting error responses
- Retry logic for external services
- Circuit breaker pattern for external APIs
- Error metrics and monitoring
- Custom error pages for frontend
