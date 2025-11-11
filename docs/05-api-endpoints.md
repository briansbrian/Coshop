# API Endpoints

## Overview

CoShop provides a RESTful API with versioned endpoints. All endpoints are prefixed with `/api/v1/`. Authentication is handled via JWT tokens in the Authorization header.

**Base URL:** `http://localhost:5000/api/v1` (development)

## API Conventions

### Request Format
- **Content-Type:** `application/json`
- **Authentication:** `Authorization: Bearer <access_token>`
- **Body:** JSON payload

### Response Format
- **Success:** JSON object with data
- **Error:** JSON object with error details
- **Status Codes:** Standard HTTP codes

### Common Headers
```
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

## Health Check

### GET /health

**Purpose:** Check API availability.

**Authentication:** None

**Response:**
```json
{
  "status": "ok",
  "message": "CoShop API is running"
}
```

### GET /api/v1

**Purpose:** API version information.

**Authentication:** None

**Response:**
```json
{
  "message": "CoShop Marketplace API",
  "version": "v1"
}
```

## Authentication Endpoints

### POST /api/v1/auth/register

**Purpose:** Register a new user (consumer or SME).

**Authentication:** None

**Request Body (Consumer):**
```json
{
  "email": "consumer@example.com",
  "password": "securepass123",
  "userType": "consumer"
}
```

**Request Body (SME):**
```json
{
  "email": "sme@example.com",
  "password": "securepass123",
  "userType": "sme",
  "businessInfo": {
    "name": "My Business",
    "businessType": "shop",
    "description": "Business description",
    "address": "123 Main St",
    "city": "New York",
    "country": "USA",
    "contactEmail": "contact@business.com",
    "contactPhone": "+1234567890"
  }
}
```

**Success Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "userType": "sme"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": "15m"
}
```

**Error Responses:**
- `400 VALIDATION_ERROR` - Invalid input data
- `409 USER_EXISTS` - Email already registered

**Business Logic:**
- Validates email format and uniqueness
- Hashes password with bcrypt
- Creates user record
- For SME: Creates business profile in same transaction
- For SME: Geocodes business address to coordinates
- Generates JWT access and refresh tokens
- Returns user data and tokens

### POST /api/v1/auth/login

**Purpose:** Authenticate user and receive tokens.

**Authentication:** None

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepass123"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "userType": "consumer"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": "15m"
}
```

**Error Responses:**
- `400 VALIDATION_ERROR` - Invalid input format
- `401 INVALID_CREDENTIALS` - Wrong email or password

**Business Logic:**
- Validates email format
- Queries user by email
- Compares password with bcrypt hash
- Generates new JWT tokens
- Returns user data and tokens

### POST /api/v1/auth/refresh

**Purpose:** Refresh access token using refresh token.

**Authentication:** None (refresh token in body)

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Success Response (200):**
```json
{
  "message": "Token refreshed successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": "15m"
}
```

**Error Responses:**
- `400 MISSING_REFRESH_TOKEN` - No refresh token provided
- `401 REFRESH_TOKEN_EXPIRED` - Refresh token expired
- `401 INVALID_REFRESH_TOKEN` - Invalid token signature

**Business Logic:**
- Verifies refresh token signature
- Checks token expiration
- Retrieves user data
- Generates new access and refresh tokens
- Returns new tokens

## Business Endpoints

### POST /api/v1/businesses

**Purpose:** Register a new business.

**Authentication:** Required (SME only)

**Request Body:**
```json
{
  "name": "My Business",
  "description": "Business description",
  "businessType": "shop",
  "address": "123 Main St",
  "city": "New York",
  "country": "USA",
  "contactEmail": "contact@business.com",
  "contactPhone": "+1234567890",
  "operatingHours": [
    {
      "day": "monday",
      "open": "09:00",
      "close": "17:00",
      "closed": false
    }
  ]
}
```

**Success Response (201):**
```json
{
  "message": "Business registered successfully",
  "business": {
    "id": "uuid",
    "ownerId": "uuid",
    "name": "My Business",
    "description": "Business description",
    "businessType": "shop",
    "location": {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "address": "123 Main St",
      "city": "New York",
      "country": "USA"
    },
    "contactInfo": {
      "email": "contact@business.com",
      "phone": "+1234567890"
    },
    "verified": false,
    "rating": 0,
    "totalRatings": 0,
    "operatingHours": [...],
    "createdAt": "2025-11-12T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `400 VALIDATION_ERROR` - Invalid business data
- `400 INVALID_ADDRESS` - Geocoding failed
- `401 AUTHENTICATION_REQUIRED` - No token provided
- `403 FORBIDDEN` - User is not SME type
- `404 USER_NOT_FOUND` - Owner doesn't exist

**Business Logic:**
- Validates input with Joi schema
- Checks user is SME type
- Geocodes address to coordinates
- Creates PostGIS POINT from coordinates
- Inserts business record
- Returns formatted business profile

### GET /api/v1/businesses/:id

**Purpose:** Get business profile by ID.

**Authentication:** None (public endpoint)

**URL Parameters:**
- `id` - Business UUID

**Success Response (200):**
```json
{
  "business": {
    "id": "uuid",
    "ownerId": "uuid",
    "name": "My Business",
    "description": "Business description",
    "businessType": "shop",
    "location": {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "address": "123 Main St",
      "city": "New York",
      "country": "USA"
    },
    "contactInfo": {
      "email": "contact@business.com",
      "phone": "+1234567890"
    },
    "verified": false,
    "rating": 4.5,
    "totalRatings": 120,
    "createdAt": "2025-11-12T10:30:00.000Z",
    "updatedAt": "2025-11-12T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `404 BUSINESS_NOT_FOUND` - Business doesn't exist

**Business Logic:**
- Queries business by ID
- Extracts coordinates from PostGIS POINT
- Formats response with nested objects
- Returns business profile

### PUT /api/v1/businesses/:id

**Purpose:** Update business profile.

**Authentication:** Required (owner only)

**URL Parameters:**
- `id` - Business UUID

**Request Body (partial updates allowed):**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "address": "456 New St",
  "city": "Boston",
  "contactEmail": "new@business.com"
}
```

**Success Response (200):**
```json
{
  "message": "Business updated successfully",
  "business": {
    "id": "uuid",
    "ownerId": "uuid",
    "name": "Updated Name",
    "description": "Updated description",
    "businessType": "shop",
    "location": {
      "latitude": 42.3601,
      "longitude": -71.0589,
      "address": "456 New St",
      "city": "Boston",
      "country": "USA"
    },
    "contactInfo": {
      "email": "new@business.com",
      "phone": "+1234567890"
    },
    "verified": false,
    "rating": 4.5,
    "totalRatings": 120,
    "createdAt": "2025-11-12T10:30:00.000Z",
    "updatedAt": "2025-11-12T11:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 VALIDATION_ERROR` - Invalid update data
- `400 INVALID_ADDRESS` - Geocoding failed
- `400 NO_UPDATES` - No fields to update
- `401 AUTHENTICATION_REQUIRED` - No token provided
- `403 FORBIDDEN` - User is not owner
- `404 BUSINESS_NOT_FOUND` - Business doesn't exist

**Business Logic:**
- Validates input with Joi schema
- Checks business exists
- Verifies user is owner
- If address changed: Geocodes new address
- Builds dynamic UPDATE query
- Updates only provided fields
- Returns updated business profile

### DELETE /api/v1/businesses/:id

**Purpose:** Delete business.

**Authentication:** Required (owner only)

**URL Parameters:**
- `id` - Business UUID

**Success Response (200):**
```json
{
  "message": "Business deleted successfully"
}
```

**Error Responses:**
- `401 AUTHENTICATION_REQUIRED` - No token provided
- `403 FORBIDDEN` - User is not owner
- `404 BUSINESS_NOT_FOUND` - Business doesn't exist

**Business Logic:**
- Checks business exists
- Verifies user is owner
- Deletes business record
- Cascading deletes: products, orders, ratings
- Returns success message

### GET /api/v1/businesses/owner/:ownerId

**Purpose:** Get all businesses owned by a user.

**Authentication:** Required (owner or admin)

**URL Parameters:**
- `ownerId` - User UUID

**Success Response (200):**
```json
{
  "businesses": [
    {
      "id": "uuid",
      "ownerId": "uuid",
      "name": "Business 1",
      "businessType": "shop",
      "location": {...},
      "contactInfo": {...},
      "verified": false,
      "rating": 4.5,
      "totalRatings": 120,
      "createdAt": "2025-11-12T10:30:00.000Z",
      "updatedAt": "2025-11-12T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

**Error Responses:**
- `401 AUTHENTICATION_REQUIRED` - No token provided
- `403 FORBIDDEN` - User is not owner or admin

**Business Logic:**
- Checks user is owner or admin
- Queries all businesses by owner_id
- Orders by creation date (newest first)
- Returns array of businesses

## Product Endpoints (Planned)

### POST /api/v1/products
Create new product (SME only)

### GET /api/v1/products/:id
Get product details (public)

### PUT /api/v1/products/:id
Update product (owner only)

### DELETE /api/v1/products/:id
Delete product (owner only)

### PATCH /api/v1/products/:id/inventory
Update inventory quantity (owner only)

### GET /api/v1/products/search
Search products with filters (public)

### GET /api/v1/businesses/:id/products
Get all products for a business (public)

## Order Endpoints (Planned)

### POST /api/v1/orders
Create new order (consumer only)

### GET /api/v1/orders/:id
Get order details (owner or consumer)

### GET /api/v1/orders
Get order history (filtered by user)

### PATCH /api/v1/orders/:id/status
Update order status (business owner only)

## Geolocation Endpoints (Planned)

### GET /api/v1/businesses/nearby
Find nearby businesses with radius

### GET /api/v1/businesses/bounds
Get businesses within map bounds

## Rating Endpoints (Planned)

### POST /api/v1/ratings
Create rating (order participant only)

### GET /api/v1/businesses/:id/ratings
Get business ratings (public)

### GET /api/v1/consumers/:id/trust-score
Get consumer trust score (SME only)

## Messaging Endpoints (Planned)

### POST /api/v1/messages
Send message (authenticated)

### GET /api/v1/messages/conversations
Get conversation list (authenticated)

### GET /api/v1/messages/conversation/:userId
Get specific conversation (authenticated)

### PATCH /api/v1/messages/:id/read
Mark message as read (authenticated)

## Notification Endpoints (Planned)

### GET /api/v1/notifications
Get notification history (authenticated)

### PATCH /api/v1/notifications/:id/read
Mark notification as read (authenticated)

### GET /api/v1/notifications/unread/count
Get unread count (authenticated)

## Error Response Format

All errors follow this structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": "Additional context (optional)",
    "timestamp": "2025-11-12T10:30:00.000Z"
  }
}
```

## HTTP Status Codes

- **200 OK** - Successful GET, PUT, PATCH, DELETE
- **201 Created** - Successful POST (resource created)
- **400 Bad Request** - Validation error, invalid input
- **401 Unauthorized** - Authentication required or failed
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Resource doesn't exist
- **409 Conflict** - Resource already exists
- **500 Internal Server Error** - Unexpected server error
- **502 Bad Gateway** - External service error
- **503 Service Unavailable** - Service temporarily down

## Rate Limiting (Planned)

- **Authentication endpoints:** 5 requests per minute
- **Public endpoints:** 100 requests per minute
- **Authenticated endpoints:** 1000 requests per minute
- **Headers:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Pagination (Planned)

For endpoints returning lists:

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `sort` - Sort field
- `order` - Sort order (asc/desc)

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

## Filtering (Planned)

Common filter parameters:
- `businessType` - Filter by business type
- `category` - Filter by product category
- `minPrice` / `maxPrice` - Price range
- `minRating` - Minimum rating
- `verified` - Only verified businesses
- `inStock` - Only available products

## Sorting (Planned)

Common sort options:
- `name` - Alphabetical
- `price` - Price (low to high / high to low)
- `rating` - Rating (high to low)
- `distance` - Distance (near to far)
- `createdAt` - Date (newest / oldest)
