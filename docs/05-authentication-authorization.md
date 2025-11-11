# Authentication & Authorization

## Authentication Flow

### Registration Flow

1. User submits registration data (email, password, userType)
2. `authService.validateRegistration()` validates input with Joi
3. Check if email already exists in database
4. Hash password with bcrypt (10 salt rounds)
5. Create user record in database
6. If SME: Create business record in same transaction
7. Generate JWT access token (15min) and refresh token (7d)
8. Return user data and tokens

### Login Flow

1. User submits credentials (email, password)
2. `authService.validateLogin()` validates input
3. Query database for user by email
4. Compare submitted password with stored hash using bcrypt
5. If valid: Generate new JWT tokens
6. Return user data and tokens

### Token Refresh Flow

1. Client submits refresh token
2. `jwtUtils.verifyRefreshToken()` validates token
3. Extract userId from decoded token
4. Fetch current user data from database
5. Generate new access and refresh tokens
6. Return new tokens

## JWT Token Structure

### Access Token

**Expiration:** 15 minutes

**Payload:**
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "userType": "sme",
  "iat": 1234567890,
  "exp": 1234568790
}
```

**Secret:** `process.env.JWT_SECRET`

### Refresh Token

**Expiration:** 7 days

**Payload:**
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "userType": "sme",
  "iat": 1234567890,
  "exp": 1235172690
}
```

**Secret:** `process.env.JWT_REFRESH_SECRET`

**Why separate secrets?** Allows invalidating all access tokens without affecting refresh tokens, and vice versa.

## Authentication Middleware

### authenticate

**Purpose:** Verifies JWT access token and attaches user to request.

**Location:** `backend/src/middleware/authMiddleware.js`

**Process:**
1. Extract token from `Authorization: Bearer <token>` header
2. Verify token format (must be "Bearer <token>")
3. Verify token signature and expiration with `jwtUtils.verifyAccessToken()`
4. Extract userId from decoded token
5. Fetch user data from database
6. Attach user object to `req.user`
7. Call `next()` to continue to route handler

**Attached User Object:**
```javascript
req.user = {
  id: "uuid",
  email: "user@example.com",
  userType: "sme",
  createdAt: "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**
- 401 NO_TOKEN: Missing Authorization header
- 401 INVALID_TOKEN_FORMAT: Malformed header
- 401 TOKEN_EXPIRED: Token has expired
- 401 INVALID_TOKEN: Invalid signature or corrupted token

### optionalAuthenticate

**Purpose:** Attaches user if token present, but doesn't require it.

**Use Case:** Public endpoints that behave differently for authenticated users.

**Process:**
- Same as `authenticate` but silently fails if no token or invalid token
- `req.user` is undefined if authentication fails
- Always calls `next()` regardless of token validity

## Authorization Middleware (RBAC)

### requireRole(...allowedTypes)

**Purpose:** Restricts access to specific user types.

**Location:** `backend/src/middleware/rbacMiddleware.js`

**Usage:**
```javascript
router.post('/businesses', authenticate, requireRole('sme'), handler);
```

**Process:**
1. Check if `req.user` exists (authentication required)
2. Check if `req.user.userType` is in `allowedTypes`
3. If yes: Call `next()`
4. If no: Return 403 INSUFFICIENT_PERMISSIONS

**Shortcuts:**
- `requireSME` - Shorthand for `requireRole('sme')`
- `requireConsumer` - Shorthand for `requireRole('consumer')`

### requireOwnership(getResourceOwnerId)

**Purpose:** Ensures user owns the resource they're trying to access.

**Usage:**
```javascript
const getBusinessOwnerId = async (req) => {
  const result = await pool.query(
    'SELECT owner_id FROM businesses WHERE id = $1',
    [req.params.id]
  );
  return result.rows[0].owner_id;
};

router.put('/businesses/:id', 
  authenticate, 
  requireOwnership(getBusinessOwnerId), 
  handler
);
```

**Process:**
1. Check if `req.user` exists
2. Call `getResourceOwnerId(req)` to fetch owner ID
3. Compare `req.user.id` with owner ID
4. If match: Call `next()`
5. If no match: Return 403 INSUFFICIENT_PERMISSIONS

### requireBusinessOwnership(getBusinessOwnerId)

**Purpose:** Ensures user is SME and owns the business.

**Process:**
1. Check if `req.user` exists
2. Check if `req.user.userType === 'sme'`
3. Call `getBusinessOwnerId(req)` to fetch owner ID
4. Compare `req.user.id` with owner ID
5. If all checks pass: Call `next()`
6. Otherwise: Return 403

**Use Case:** Product management endpoints where business ownership must be verified.

### requireRoleOrOwnership(allowedRoles, getResourceOwnerId)

**Purpose:** Allows access if user has specific role OR owns the resource.

**Use Case:** Admin users who can access any resource, or owners who can access their own.

**Process:**
1. Check if `req.user` exists
2. If `req.user.userType` in `allowedRoles`: Call `next()`
3. Otherwise, check ownership
4. If owner: Call `next()`
5. Otherwise: Return 403

## Authorization Patterns in Routes

### Pattern 1: Public Endpoint

No authentication required.

```javascript
router.get('/products/search', async (req, res, next) => {
  // Anyone can search products
});
```

### Pattern 2: Authenticated Endpoint

Requires valid token, any user type.

```javascript
router.get('/orders', authenticate, async (req, res, next) => {
  // Any authenticated user can view their orders
});
```

### Pattern 3: Role-Restricted Endpoint

Requires specific user type.

```javascript
router.post('/businesses', authenticate, requireRole('sme'), async (req, res, next) => {
  // Only SME users can create businesses
});
```

### Pattern 4: Ownership-Based Endpoint

Requires user to own the resource.

```javascript
router.put('/businesses/:id', authenticate, requireRole('sme'), async (req, res, next) => {
  // Ownership checked in service layer
  const business = await updateBusiness(req.params.id, req.user.id, req.body);
});
```

**Note:** Current implementation checks ownership in service layer rather than middleware for simplicity. Services throw 403 errors if user doesn't own the resource.

## Security Best Practices

### Password Security

- Minimum 8 characters (enforced by Joi validation)
- Hashed with bcrypt using 10 salt rounds
- Never stored or transmitted in plain text
- Never returned in API responses

### Token Security

- Access tokens short-lived (15 minutes)
- Refresh tokens longer-lived (7 days)
- Secrets stored in environment variables
- Tokens transmitted only via HTTPS in production
- No token storage in database (stateless)

### SQL Injection Prevention

- All queries use parameterized statements
- User input never concatenated into SQL strings
- PostgreSQL `pg` library handles escaping

### CORS Configuration

- CORS enabled for cross-origin requests
- Should be restricted to specific origins in production

### Input Validation

- All inputs validated with Joi schemas before processing
- Type checking, format validation, range validation
- Validation errors return 400 with details

## Token Expiration Handling

### Client-Side Strategy

1. Store both access and refresh tokens
2. Include access token in all requests
3. If 401 TOKEN_EXPIRED received:
   - Call `/auth/refresh` with refresh token
   - Store new tokens
   - Retry original request
4. If refresh fails:
   - Clear tokens
   - Redirect to login

### Server-Side Behavior

- Access token expiration: Return 401 TOKEN_EXPIRED
- Refresh token expiration: Return 401 REFRESH_TOKEN_EXPIRED
- Invalid tokens: Return 401 INVALID_TOKEN
- No token: Return 401 NO_TOKEN

## Environment Variables

Required for authentication:

```env
JWT_SECRET=your-secret-key-for-access-tokens
JWT_REFRESH_SECRET=your-secret-key-for-refresh-tokens
```

**Important:** Use strong, random secrets in production. Never commit secrets to version control.

## Future Enhancements

Not yet implemented:

- Password reset functionality
- Email verification
- Two-factor authentication
- Token blacklisting/revocation
- Session management
- OAuth integration
- Admin role and permissions
- Staff account permissions (Requirement 18)
