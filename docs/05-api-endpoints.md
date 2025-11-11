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

### GET /api/v1/businesses/:id/products

**Purpose:** Get all products for a specific business.

**Authentication:** None (public endpoint)

**URL Parameters:**
- `id` - Business UUID

**Success Response (200):**
```json
{
  "businessId": "uuid",
  "products": [
    {
      "id": "uuid",
      "businessId": "uuid",
      "name": "Product Name",
      "description": "Product description",
      "price": 29.99,
      "quantity": 100,
      "category": "electronics",
      "images": ["url1", "url2"],
      "inStock": true,
      "createdAt": "2025-11-12T10:30:00.000Z",
      "updatedAt": "2025-11-12T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

**Error Responses:**
- `404 BUSINESS_NOT_FOUND` - Business doesn't exist

**Business Logic:**
- Verifies business exists
- Queries all products for business
- Orders by creation date (newest first)
- Returns array of products with count

## Product Endpoints

### POST /api/v1/products

**Purpose:** Create a new product.

**Authentication:** Required (SME only, business owner)

**Request Body:**
```json
{
  "businessId": "uuid",
  "name": "Product Name",
  "description": "Product description",
  "price": 29.99,
  "quantity": 100,
  "category": "electronics",
  "images": ["https://example.com/image1.jpg"]
}
```

**Success Response (201):**
```json
{
  "message": "Product created successfully",
  "product": {
    "id": "uuid",
    "businessId": "uuid",
    "name": "Product Name",
    "description": "Product description",
    "price": 29.99,
    "quantity": 100,
    "category": "electronics",
    "images": ["https://example.com/image1.jpg"],
    "inStock": true,
    "createdAt": "2025-11-12T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `400 VALIDATION_ERROR` - Invalid product data
- `400 MISSING_BUSINESS_ID` - No businessId provided
- `401 AUTHENTICATION_REQUIRED` - No token provided
- `403 FORBIDDEN` - User doesn't own the business
- `404 BUSINESS_NOT_FOUND` - Business doesn't exist

**Business Logic:**
- Validates input with Joi schema
- Verifies business exists
- Checks user owns the business
- Inserts product record
- Auto-calculates in_stock status
- Invalidates product search cache
- Returns created product

**Valid Categories:**
electronics, clothing, food, beverages, home, beauty, health, sports, books, toys, automotive, office, garden, pets, other

### GET /api/v1/products/search

**Purpose:** Search products with advanced filters.

**Authentication:** None (public endpoint)

**Query Parameters:**
- `keyword` - Search in name/description (optional)
- `category` - Filter by category (optional)
- `minPrice` - Minimum price (optional)
- `maxPrice` - Maximum price (optional)
- `latitude` - User latitude for distance calculation (optional)
- `longitude` - User longitude for distance calculation (optional)
- `radius` - Search radius in km (optional, requires lat/lon)
- `sortBy` - Sort field: price, created_at, name, rating, distance (default: created_at)
- `sortOrder` - ASC or DESC (default: DESC)
- `limit` - Results per page (default: 50, max: 100)
- `offset` - Pagination offset (default: 0)

**Example Request:**
```
GET /api/v1/products/search?keyword=laptop&category=electronics&minPrice=500&maxPrice=2000&latitude=40.7128&longitude=-74.0060&radius=10&sortBy=price&sortOrder=ASC&limit=20
```

**Success Response (200):**
```json
{
  "products": [
    {
      "id": "uuid",
      "businessId": "uuid",
      "businessName": "Tech Store",
      "businessRating": 4.5,
      "businessVerified": true,
      "businessLocation": {
        "latitude": 40.7128,
        "longitude": -74.0060
      },
      "name": "Laptop Pro 15",
      "description": "High-performance laptop",
      "price": 1299.99,
      "quantity": 10,
      "category": "electronics",
      "images": ["url1", "url2"],
      "inStock": true,
      "createdAt": "2025-11-12T10:30:00.000Z",
      "distanceKm": 2.5
    }
  ],
  "count": 1,
  "params": {
    "keyword": "laptop",
    "category": "electronics",
    "minPrice": 500,
    "maxPrice": 2000,
    "latitude": 40.7128,
    "longitude": -74.0060,
    "radius": 10,
    "sortBy": "price",
    "sortOrder": "ASC",
    "limit": 20,
    "offset": 0
  }
}
```

**Business Logic:**
- Validates query parameters
- Builds dynamic SQL query with filters
- Joins with businesses table for enriched data
- If location provided: Calculates distance using PostGIS ST_Distance
- If radius provided: Filters using PostGIS ST_DWithin
- Supports sorting by distance when location provided
- Caches results in Redis for 5 minutes
- Returns products with business info and distance

**Caching:**
- Cache key generated from all search parameters
- TTL: 5 minutes (300 seconds)
- Cache invalidated on product create/update/delete

### GET /api/v1/products/:id

**Purpose:** Get product details by ID.

**Authentication:** None (public endpoint)

**URL Parameters:**
- `id` - Product UUID

**Success Response (200):**
```json
{
  "product": {
    "id": "uuid",
    "businessId": "uuid",
    "businessName": "Tech Store",
    "businessRating": 4.5,
    "name": "Laptop Pro 15",
    "description": "High-performance laptop",
    "price": 1299.99,
    "quantity": 10,
    "category": "electronics",
    "images": ["url1", "url2"],
    "inStock": true,
    "createdAt": "2025-11-12T10:30:00.000Z",
    "updatedAt": "2025-11-12T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `404 PRODUCT_NOT_FOUND` - Product doesn't exist

**Business Logic:**
- Queries product by ID
- Joins with business for enriched data
- Returns product with business info

### PUT /api/v1/products/:id

**Purpose:** Update product details.

**Authentication:** Required (SME only, business owner)

**URL Parameters:**
- `id` - Product UUID

**Request Body (partial updates allowed):**
```json
{
  "name": "Updated Product Name",
  "price": 1199.99,
  "quantity": 15,
  "description": "Updated description"
}
```

**Success Response (200):**
```json
{
  "message": "Product updated successfully",
  "product": {
    "id": "uuid",
    "businessId": "uuid",
    "name": "Updated Product Name",
    "description": "Updated description",
    "price": 1199.99,
    "quantity": 15,
    "category": "electronics",
    "images": ["url1"],
    "inStock": true,
    "createdAt": "2025-11-12T10:30:00.000Z",
    "updatedAt": "2025-11-12T11:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 VALIDATION_ERROR` - Invalid update data
- `400 NO_UPDATES` - No fields to update
- `401 AUTHENTICATION_REQUIRED` - No token provided
- `403 FORBIDDEN` - User doesn't own the business
- `404 PRODUCT_NOT_FOUND` - Product doesn't exist

**Business Logic:**
- Validates input with Joi schema
- Checks product exists
- Verifies user owns the business
- Builds dynamic UPDATE query
- Updates only provided fields
- Auto-recalculates in_stock status
- Invalidates product search cache
- Returns updated product

### DELETE /api/v1/products/:id

**Purpose:** Delete product.

**Authentication:** Required (SME only, business owner)

**URL Parameters:**
- `id` - Product UUID

**Success Response (200):**
```json
{
  "message": "Product deleted successfully"
}
```

**Error Responses:**
- `401 AUTHENTICATION_REQUIRED` - No token provided
- `403 FORBIDDEN` - User doesn't own the business
- `404 PRODUCT_NOT_FOUND` - Product doesn't exist

**Business Logic:**
- Checks product exists
- Verifies user owns the business
- Deletes product record
- Invalidates product search cache
- Returns success message

### PATCH /api/v1/products/:id/inventory

**Purpose:** Update product inventory quantity.

**Authentication:** Required (SME only, business owner)

**URL Parameters:**
- `id` - Product UUID

**Request Body:**
```json
{
  "quantity": 50
}
```

**Success Response (200):**
```json
{
  "message": "Inventory updated successfully",
  "product": {
    "id": "uuid",
    "businessId": "uuid",
    "name": "Product Name",
    "quantity": 50,
    "inStock": true,
    "updatedAt": "2025-11-12T11:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 VALIDATION_ERROR` - Invalid quantity
- `401 AUTHENTICATION_REQUIRED` - No token provided
- `403 FORBIDDEN` - User doesn't own the business
- `404 PRODUCT_NOT_FOUND` - Product doesn't exist

**Business Logic:**
- Validates quantity (must be >= 0)
- Checks product exists
- Verifies user owns the business
- Updates quantity field
- Auto-recalculates in_stock status
- Invalidates product search cache
- Returns updated product info

## Geolocation Endpoints

### GET /api/v1/geolocation/nearby

**Purpose:** Find businesses near a specific location.

**Authentication:** None (public endpoint)

**Query Parameters:**
- `latitude` - User latitude (required)
- `longitude` - User longitude (required)
- `radius` - Search radius in km (optional, default: 10, max: 100)
- `businessType` - Filter by type: shop, business, service (optional)
- `verified` - Filter verified businesses: true/false (optional)
- `minRating` - Minimum rating 0-5 (optional)
- `limit` - Results per page (optional, default: 50, max: 100)
- `offset` - Pagination offset (optional, default: 0)

**Example Request:**
```
GET /api/v1/geolocation/nearby?latitude=40.7128&longitude=-74.0060&radius=5&businessType=shop&verified=true&minRating=4&limit=20
```

**Success Response (200):**
```json
{
  "searchLocation": {
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "radius": {
    "kilometers": 5,
    "meters": 5000
  },
  "filters": {
    "businessType": "shop",
    "verified": true,
    "minRating": 4
  },
  "businesses": [
    {
      "id": "uuid",
      "ownerId": "uuid",
      "name": "Local Shop",
      "description": "Shop description",
      "businessType": "shop",
      "location": {
        "latitude": 40.7150,
        "longitude": -74.0070,
        "address": "123 Main St",
        "city": "New York",
        "country": "USA"
      },
      "contactInfo": {
        "email": "contact@shop.com",
        "phone": "+1234567890"
      },
      "verified": true,
      "rating": 4.5,
      "totalRatings": 120,
      "distance": {
        "meters": 250,
        "kilometers": 0.25
      },
      "createdAt": "2025-11-12T10:30:00.000Z",
      "updatedAt": "2025-11-12T10:30:00.000Z"
    }
  ],
  "count": 1,
  "pagination": {
    "limit": 20,
    "offset": 0
  }
}
```

**Error Responses:**
- `400 VALIDATION_ERROR` - Invalid parameters
- `400 INVALID_COORDINATES` - Invalid lat/lon values

**Business Logic:**
- Validates coordinates (-90 to 90 lat, -180 to 180 lon)
- Uses PostGIS ST_DWithin for efficient radius search
- Calculates distance using ST_Distance (geodesic)
- Applies optional filters (type, verified, rating)
- Orders results by distance (nearest first)
- Caches results in Redis for 1 hour
- Returns businesses with distance info

**PostGIS Queries:**
- `ST_DWithin(location, point, radius)` - Spatial index search
- `ST_Distance(location1, location2)` - Geodesic distance
- Uses GIST index on businesses.location

### GET /api/v1/geolocation/distance

**Purpose:** Calculate distance between two geographic points.

**Authentication:** None (public endpoint)

**Query Parameters:**
- `fromLat` - Starting latitude (required)
- `fromLon` - Starting longitude (required)
- `toLat` - Destination latitude (required)
- `toLon` - Destination longitude (required)

**Example Request:**
```
GET /api/v1/geolocation/distance?fromLat=40.7128&fromLon=-74.0060&toLat=40.7589&toLon=-73.9851
```

**Success Response (200):**
```json
{
  "from": {
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "to": {
    "latitude": 40.7589,
    "longitude": -73.9851
  },
  "distance": {
    "meters": 5234,
    "kilometers": 5.23,
    "miles": 3.25
  }
}
```

**Error Responses:**
- `400 MISSING_PARAMETERS` - Missing required parameters
- `400 INVALID_COORDINATES` - Invalid lat/lon values

**Business Logic:**
- Validates all coordinates
- Uses PostGIS ST_Distance for geodesic calculation
- Returns distance in meters, kilometers, and miles
- Accurate for any two points on Earth

### GET /api/v1/geolocation/in-bounds

**Purpose:** Get businesses within map bounds (bounding box).

**Authentication:** None (public endpoint)

**Query Parameters:**
- `neLat` - Northeast corner latitude (required)
- `neLon` - Northeast corner longitude (required)
- `swLat` - Southwest corner latitude (required)
- `swLon` - Southwest corner longitude (required)
- `businessType` - Filter by type (optional)
- `verified` - Filter verified businesses (optional)
- `minRating` - Minimum rating (optional)
- `limit` - Max results (optional, default: 500)

**Example Request:**
```
GET /api/v1/geolocation/in-bounds?neLat=40.8&neLon=-73.9&swLat=40.7&swLon=-74.1&businessType=shop
```

**Success Response (200):**
```json
{
  "bounds": {
    "northEast": {
      "latitude": 40.8,
      "longitude": -73.9
    },
    "southWest": {
      "latitude": 40.7,
      "longitude": -74.1
    }
  },
  "filters": {
    "businessType": "shop"
  },
  "businesses": [
    {
      "id": "uuid",
      "ownerId": "uuid",
      "name": "Business Name",
      "description": "Description",
      "businessType": "shop",
      "location": {
        "latitude": 40.75,
        "longitude": -74.0,
        "address": "123 Main St",
        "city": "New York",
        "country": "USA"
      },
      "contactInfo": {
        "email": "contact@business.com",
        "phone": "+1234567890"
      },
      "verified": true,
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
- `400 MISSING_PARAMETERS` - Missing required bounds
- `400 INVALID_COORDINATES` - Invalid lat/lon values

**Business Logic:**
- Validates all corner coordinates
- Uses PostGIS ST_MakeEnvelope for bounding box
- Applies optional filters
- Limits results to prevent overwhelming map
- Useful for map pan/zoom interactions
- Returns all businesses within visible area

### GET /api/v1/geolocation/geocode

**Purpose:** Convert address to geographic coordinates.

**Authentication:** None (public endpoint)

**Query Parameters:**
- `address` - Street address (required)
- `city` - City name (required)
- `country` - Country name (required)

**Example Request:**
```
GET /api/v1/geolocation/geocode?address=123 Main St&city=New York&country=USA
```

**Success Response (200):**
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "formattedAddress": "123 Main Street, New York, NY, USA"
}
```

**Error Responses:**
- `400 MISSING_PARAMETERS` - Missing required parameters
- `400 GEOCODING_FAILED` - Address not found
- `502 GEOCODING_SERVICE_ERROR` - External service unavailable

**Business Logic:**
- Checks Redis cache first (24-hour TTL)
- Uses OpenStreetMap Nominatim (free)
- Falls back to Google Maps if API key configured
- Caches successful results
- Returns coordinates and formatted address

### GET /api/v1/geolocation/reverse-geocode

**Purpose:** Convert coordinates to address.

**Authentication:** None (public endpoint)

**Query Parameters:**
- `latitude` - Latitude (required)
- `longitude` - Longitude (required)

**Example Request:**
```
GET /api/v1/geolocation/reverse-geocode?latitude=40.7128&longitude=-74.0060
```

**Success Response (200):**
```json
{
  "address": "123 Main Street, New York, NY, USA",
  "city": "New York",
  "country": "USA",
  "formattedAddress": "123 Main Street, New York, NY, USA"
}
```

**Error Responses:**
- `400 MISSING_PARAMETERS` - Missing required parameters
- `400 REVERSE_GEOCODING_FAILED` - Coordinates not found
- `502 GEOCODING_SERVICE_ERROR` - External service unavailable

**Business Logic:**
- Checks Redis cache first (24-hour TTL)
- Uses OpenStreetMap Nominatim
- Caches successful results
- Returns address components

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
