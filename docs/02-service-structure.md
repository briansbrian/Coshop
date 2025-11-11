# Service Structure

## Overview

CoShop follows a service-oriented architecture where each service is responsible for a specific business domain. Services are implemented as modules in `/backend/src/services/` and exposed through API routes in `/backend/src/routes/`.

## Service Organization

### Directory Structure
```
backend/src/
├── services/          # Business logic layer
│   ├── authService.js
│   ├── businessService.js
│   ├── productService.js (planned)
│   ├── orderService.js (planned)
│   └── ...
├── routes/            # API endpoint definitions
│   ├── authRoutes.js
│   ├── businessRoutes.js
│   └── ...
├── middleware/        # Request processing
│   ├── authMiddleware.js
│   └── rbacMiddleware.js
├── utils/             # Helper functions
│   ├── jwtUtils.js
│   └── geocodingUtils.js
└── config/            # Configuration
    ├── database.js
    └── redis.js
```

## Implemented Services

### 1. Authentication Service

**Location:** `/backend/src/services/authService.js`

**Purpose:** Manages user registration, authentication, and password security.

**Key Responsibilities:**
- User registration for SMEs and consumers
- Credential validation and authentication
- Password hashing and comparison
- Input validation with Joi schemas
- User retrieval by ID

**Core Functions:**
- `registerUser(userData)` - Creates new user account with optional business profile
- `authenticateUser(credentials)` - Validates email/password and returns user data
- `getUserById(userId)` - Retrieves user information
- `hashPassword(password)` - Bcrypt hashing with 10 salt rounds
- `comparePassword(password, hash)` - Verifies password against stored hash
- `validateRegistration(data)` - Joi schema validation for registration
- `validateLogin(data)` - Joi schema validation for login

**Validation Rules:**
- Email must be valid format
- Password minimum 8 characters
- User type must be 'sme' or 'consumer'
- SME registration requires business information
- Business type must be 'shop', 'business', or 'service'

**Error Handling:**
- `VALIDATION_ERROR` (400) - Invalid input data
- `USER_EXISTS` (409) - Email already registered
- `INVALID_CREDENTIALS` (401) - Wrong email or password
- `USER_NOT_FOUND` (404) - User ID doesn't exist

**Database Interactions:**
- Inserts into `users` table
- Optionally inserts into `businesses` table (for SMEs)
- Uses transactions for atomic operations
- Checks email uniqueness before insertion

### 2. Business Service

**Location:** `/backend/src/services/businessService.js`

**Purpose:** Manages SME business profiles, registration, and location data.

**Key Responsibilities:**
- Business registration with geolocation
- Profile updates and management
- Address geocoding to coordinates
- Ownership validation
- Business retrieval and listing

**Core Functions:**
- `registerBusiness(ownerId, businessData)` - Creates new business with geocoded location
- `getBusinessById(businessId)` - Retrieves business profile
- `updateBusiness(businessId, ownerId, updateData)` - Updates business information
- `deleteBusiness(businessId, ownerId)` - Removes business and related data
- `getBusinessesByOwner(ownerId)` - Lists all businesses for an owner

**Validation Rules:**
- Business name 2-255 characters
- Description max 5000 characters
- Business type: 'shop', 'business', or 'service'
- Address, city, country required
- Valid email and phone format
- Operating hours in HH:MM format

**Geocoding Integration:**
- Converts address to latitude/longitude coordinates
- Uses OpenStreetMap Nominatim (primary)
- Falls back to Google Maps API if configured
- Validates coordinate ranges
- Creates PostGIS POINT geometry

**Error Handling:**
- `VALIDATION_ERROR` (400) - Invalid business data
- `USER_NOT_FOUND` (404) - Owner doesn't exist
- `FORBIDDEN` (403) - Non-SME user or wrong owner
- `BUSINESS_NOT_FOUND` (404) - Business doesn't exist
- `INVALID_ADDRESS` (400) - Geocoding failed
- `NO_UPDATES` (400) - No fields to update

**Database Interactions:**
- Inserts/updates `businesses` table
- Stores location as PostGIS GEOGRAPHY(POINT)
- Uses transactions for data consistency
- Validates user type and ownership
- Cascading deletes for related records

## Planned Services

### 3. Product/Inventory Service

**Purpose:** Manage product catalogs and inventory tracking.

**Key Responsibilities:**
- Product CRUD operations
- Inventory quantity management
- Product search and filtering
- Category management
- Image upload handling

**Planned Functions:**
- `createProduct(businessId, productData)`
- `updateProduct(productId, updates)`
- `updateInventory(productId, quantity)`
- `searchProducts(query)`
- `getProductsByBusiness(businessId)`

### 4. Order Management Service

**Purpose:** Handle order creation, processing, and status tracking.

**Key Responsibilities:**
- Order creation from cart items
- Inventory validation and reservation
- Order status workflow management
- Payment integration
- Delivery service coordination

**Planned Functions:**
- `createOrder(consumerId, orderData)`
- `updateOrderStatus(orderId, status)`
- `getOrdersByConsumer(consumerId)`
- `getOrdersBySME(businessId)`
- `processPayment(orderId, paymentMethod)`

### 5. Geolocation Service

**Purpose:** Provide location-based business discovery and spatial queries.

**Key Responsibilities:**
- Nearby business search with radius
- Distance calculations
- Map bounds filtering
- Geocoding utilities

**Planned Functions:**
- `findNearbyBusinesses(location, radius)`
- `calculateDistance(from, to)`
- `getBusinessesInBounds(bounds)`
- `geocodeAddress(address)`

### 6. Rating & Review Service

**Purpose:** Manage bidirectional ratings between consumers and SMEs.

**Key Responsibilities:**
- Consumer ratings for businesses/products
- SME ratings for consumer trustworthiness
- Rating aggregation and averages
- Review management and responses
- Trust score calculation

**Planned Functions:**
- `rateBusinessByConsumer(orderId, rating)`
- `rateConsumerBySME(orderId, rating)`
- `getBusinessRatings(businessId)`
- `getConsumerTrustScore(consumerId)`
- `respondToReview(ratingId, response)`

### 7. Messaging Service

**Purpose:** Enable real-time communication between users.

**Key Responsibilities:**
- Message sending and retrieval
- Conversation thread management
- Read status tracking
- Automated responses
- WebSocket integration

**Planned Functions:**
- `sendMessage(from, to, message)`
- `getConversation(userId1, userId2)`
- `setAutoResponse(businessId, autoResponse)`
- `markAsRead(messageId)`

### 8. Notification Service

**Purpose:** Multi-channel notification delivery and management.

**Key Responsibilities:**
- Notification creation and delivery
- Channel management (email, SMS, push, in-app)
- Preference management
- Priority-based routing
- Notification batching

**Planned Functions:**
- `sendNotification(userId, notification)`
- `updatePreferences(userId, preferences)`
- `getNotificationHistory(userId)`
- `markAsRead(notificationId)`

### 9. Analytics Service

**Purpose:** Business performance metrics and reporting.

**Key Responsibilities:**
- Sales and revenue analytics
- Product performance tracking
- Customer demographics
- Trend analysis
- Data export functionality

**Planned Functions:**
- `getBusinessMetrics(businessId, period)`
- `getProductPerformance(businessId)`
- `getCustomerDemographics(businessId)`
- `exportData(businessId, format)`

## Service Communication Patterns

### Direct Database Access
Services directly query the PostgreSQL database using the connection pool from `/backend/src/config/database.js`. No inter-service communication layer exists currently.

### Transaction Management
Services use database transactions for operations that modify multiple tables:
```javascript
const client = await pool.connect();
try {
  await client.query('BEGIN');
  // Multiple operations
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

### Error Propagation
Services throw structured error objects that are caught by Express error middleware:
```javascript
throw {
  status: 400,
  code: 'ERROR_CODE',
  message: 'Human-readable message',
  details: 'Additional context'
};
```

## Middleware Integration

### Authentication Middleware
**Location:** `/backend/src/middleware/authMiddleware.js`

**Purpose:** Verify JWT tokens and attach user to request.

**Functions:**
- `authenticate(req, res, next)` - Required authentication
- `optionalAuthenticate(req, res, next)` - Optional authentication

**Behavior:**
- Extracts token from Authorization header
- Verifies token signature and expiration
- Loads user data from database
- Attaches user object to `req.user`
- Returns 401 for invalid/expired tokens

### RBAC Middleware
**Location:** `/backend/src/middleware/rbacMiddleware.js`

**Purpose:** Enforce role-based access control.

**Functions:**
- `requireRole(...allowedTypes)` - Require specific user types
- `requireSME()` - Shorthand for SME-only access
- `requireConsumer()` - Shorthand for consumer-only access
- `requireOwnership(getResourceOwnerId)` - Verify resource ownership
- `requireBusinessOwnership(getBusinessOwnerId)` - SME + ownership check
- `requireRoleOrOwnership(allowedRoles, getResourceOwnerId)` - Flexible access

**Behavior:**
- Checks `req.user.userType` against allowed roles
- Validates resource ownership when needed
- Returns 403 for insufficient permissions
- Returns 401 if not authenticated

## Utility Modules

### JWT Utilities
**Location:** `/backend/src/utils/jwtUtils.js`

**Purpose:** Token generation and verification.

**Functions:**
- `generateAccessToken(payload)` - 15-minute access token
- `generateRefreshToken(payload)` - 7-day refresh token
- `generateTokens(user)` - Both tokens at once
- `verifyAccessToken(token)` - Validate access token
- `verifyRefreshToken(token)` - Validate refresh token
- `decodeToken(token)` - Decode without verification

**Token Payload:**
- `userId` - User UUID
- `email` - User email
- `userType` - 'sme' or 'consumer'

### Geocoding Utilities
**Location:** `/backend/src/utils/geocodingUtils.js`

**Purpose:** Address-to-coordinate conversion.

**Functions:**
- `geocodeAddress(address, city, country)` - Forward geocoding
- `reverseGeocode(latitude, longitude)` - Reverse geocoding
- `validateCoordinates(latitude, longitude)` - Coordinate validation

**Behavior:**
- Primary: OpenStreetMap Nominatim (free, no API key)
- Fallback: Google Maps API (if configured)
- Returns latitude, longitude, formatted address
- Throws structured errors on failure

## Configuration Modules

### Database Configuration
**Location:** `/backend/src/config/database.js`

**Purpose:** PostgreSQL connection pool management.

**Configuration:**
- Max connections: 20
- Idle timeout: 30 seconds
- Connection timeout: 2 seconds
- Auto-reconnect on errors

### Redis Configuration (Planned)
**Location:** `/backend/src/config/redis.js`

**Purpose:** Redis client for caching and sessions.

## Service Design Patterns

### Input Validation
All services use Joi schemas for input validation before processing:
- Define schema with validation rules
- Validate input with `schema.validate(data)`
- Return detailed error messages on failure
- Proceed with validated data only

### Error Handling
Services throw structured error objects:
- `status` - HTTP status code
- `code` - Machine-readable error code
- `message` - Human-readable description
- `details` - Additional context (optional)

### Database Transactions
Multi-step operations use transactions:
- Begin transaction before operations
- Commit on success
- Rollback on any error
- Always release client connection

### Ownership Validation
Services verify user permissions:
- Check user type (SME, consumer)
- Validate resource ownership
- Query database for owner_id
- Compare with authenticated user ID
