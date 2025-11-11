# API Endpoints

## Base URL

```
http://localhost:5000/api/v1
```

## Authentication Endpoints

### POST /auth/register

Register a new user (consumer or SME).

**Authentication:** None (public)

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "userType": "sme",
  "businessInfo": {
    "name": "My Shop",
    "businessType": "shop",
    "description": "A great shop",
    "address": "123 Main St",
    "city": "Nairobi",
    "country": "Kenya",
    "contactEmail": "shop@example.com",
    "contactPhone": "+254712345678"
  }
}
```

**Notes:**
- `businessInfo` required only for SME users
- Password must be at least 8 characters
- Email must be unique

**Success Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "userType": "sme"
  },
  "accessToken": "jwt-token",
  "refreshToken": "jwt-refresh-token",
  "expiresIn": "15m"
}
```

**Error Responses:**
- 400: Validation error
- 409: Email already exists

### POST /auth/login

Authenticate user and receive tokens.

**Authentication:** None (public)

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "userType": "sme"
  },
  "accessToken": "jwt-token",
  "refreshToken": "jwt-refresh-token",
  "expiresIn": "15m"
}
```

**Error Responses:**
- 400: Validation error
- 401: Invalid credentials

### POST /auth/refresh

Refresh access token using refresh token.

**Authentication:** None (uses refresh token)

**Request Body:**
```json
{
  "refreshToken": "jwt-refresh-token"
}
```

**Success Response (200):**
```json
{
  "message": "Token refreshed successfully",
  "accessToken": "new-jwt-token",
  "refreshToken": "new-jwt-refresh-token",
  "expiresIn": "15m"
}
```

**Error Responses:**
- 400: Missing refresh token
- 401: Invalid or expired refresh token

## Business Endpoints

### POST /businesses

Register a new business (SME only).

**Authentication:** Required (SME role)

**Headers:**
```
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "name": "My Shop",
  "businessType": "shop",
  "description": "A great shop selling quality products",
  "address": "123 Main Street",
  "city": "Nairobi",
  "country": "Kenya",
  "contactEmail": "shop@example.com",
  "contactPhone": "+254712345678",
  "operatingHours": [
    {
      "day": "monday",
      "open": "09:00",
      "close": "18:00",
      "closed": false
    }
  ]
}
```

**Notes:**
- Address is geocoded automatically
- `operatingHours` is optional
- `businessType` must be: shop, business, or service

**Success Response (201):**
```json
{
  "message": "Business registered successfully",
  "business": {
    "id": "uuid",
    "ownerId": "uuid",
    "name": "My Shop",
    "description": "A great shop selling quality products",
    "businessType": "shop",
    "location": {
      "latitude": -1.2921,
      "longitude": 36.8219,
      "address": "123 Main Street",
      "city": "Nairobi",
      "country": "Kenya"
    },
    "contactInfo": {
      "email": "shop@example.com",
      "phone": "+254712345678"
    },
    "verified": false,
    "rating": 0,
    "totalRatings": 0,
    "operatingHours": [],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- 400: Invalid address or validation error
- 401: Not authenticated
- 403: Not an SME user
- 404: User not found

### GET /businesses/:id

Get business profile by ID (public).

**Authentication:** None (public)

**Success Response (200):**
```json
{
  "business": {
    "id": "uuid",
    "ownerId": "uuid",
    "name": "My Shop",
    "description": "A great shop",
    "businessType": "shop",
    "location": {
      "latitude": -1.2921,
      "longitude": 36.8219,
      "address": "123 Main Street",
      "city": "Nairobi",
      "country": "Kenya"
    },
    "contactInfo": {
      "email": "shop@example.com",
      "phone": "+254712345678"
    },
    "verified": false,
    "rating": 4.5,
    "totalRatings": 10,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- 404: Business not found

### PUT /businesses/:id

Update business profile (owner only).

**Authentication:** Required (SME role, must be owner)

**Headers:**
```
Authorization: Bearer <access-token>
```

**Request Body (all fields optional):**
```json
{
  "name": "Updated Shop Name",
  "description": "Updated description",
  "address": "456 New Street",
  "city": "Mombasa",
  "contactEmail": "newemail@example.com",
  "contactPhone": "+254798765432"
}
```

**Notes:**
- Only provided fields are updated
- Address changes trigger re-geocoding

**Success Response (200):**
```json
{
  "message": "Business updated successfully",
  "business": { /* updated business object */ }
}
```

**Error Responses:**
- 400: Validation error, invalid address
- 401: Not authenticated
- 403: Not the business owner
- 404: Business not found

### DELETE /businesses/:id

Delete business (owner only).

**Authentication:** Required (SME role, must be owner)

**Headers:**
```
Authorization: Bearer <access-token>
```

**Success Response (200):**
```json
{
  "message": "Business deleted successfully"
}
```

**Error Responses:**
- 401: Not authenticated
- 403: Not the business owner
- 404: Business not found

### GET /businesses/:id/products

Get all products for a business (public).

**Authentication:** None (public)

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
      "price": 99.99,
      "quantity": 10,
      "category": "electronics",
      "images": ["url1", "url2"],
      "inStock": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

**Error Responses:**
- 404: Business not found

### GET /businesses/owner/:ownerId

Get all businesses owned by a user (authenticated).

**Authentication:** Required (must be owner or admin)

**Headers:**
```
Authorization: Bearer <access-token>
```

**Success Response (200):**
```json
{
  "businesses": [ /* array of business objects */ ],
  "count": 2
}
```

**Error Responses:**
- 401: Not authenticated
- 403: Not authorized to view these businesses

## Product Endpoints

### POST /products

Create a new product (SME only, must own business).

**Authentication:** Required (SME role, must own business)

**Headers:**
```
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "businessId": "uuid",
  "name": "Product Name",
  "description": "Product description",
  "price": 99.99,
  "quantity": 10,
  "category": "electronics",
  "images": ["https://example.com/image1.jpg"]
}
```

**Notes:**
- `category` must be one of: electronics, clothing, food, beverages, home, beauty, health, sports, books, toys, automotive, office, garden, pets, other
- `images` is optional (defaults to empty array)

**Success Response (201):**
```json
{
  "message": "Product created successfully",
  "product": {
    "id": "uuid",
    "businessId": "uuid",
    "name": "Product Name",
    "description": "Product description",
    "price": 99.99,
    "quantity": 10,
    "category": "electronics",
    "images": ["https://example.com/image1.jpg"],
    "inStock": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- 400: Validation error, missing businessId
- 401: Not authenticated
- 403: Not the business owner
- 404: Business not found

### GET /products/search

Search products with filters (public).

**Authentication:** None (public)

**Query Parameters:**
- `keyword` (string): Search in name or description
- `category` (string): Filter by category
- `minPrice` (number): Minimum price
- `maxPrice` (number): Maximum price
- `latitude` (number): User latitude for distance calculation
- `longitude` (number): User longitude for distance calculation
- `radius` (number): Search radius in kilometers
- `sortBy` (string): Sort field (price, created_at, name, rating, distance)
- `sortOrder` (string): ASC or DESC
- `limit` (number): Results per page (default: 50)
- `offset` (number): Pagination offset (default: 0)

**Example:**
```
GET /products/search?keyword=phone&category=electronics&minPrice=100&maxPrice=500&latitude=-1.2921&longitude=36.8219&radius=10&sortBy=price&sortOrder=ASC&limit=20
```

**Success Response (200):**
```json
{
  "products": [
    {
      "id": "uuid",
      "businessId": "uuid",
      "businessName": "My Shop",
      "businessRating": 4.5,
      "businessVerified": true,
      "businessLocation": {
        "latitude": -1.2921,
        "longitude": 36.8219
      },
      "name": "Product Name",
      "description": "Product description",
      "price": 99.99,
      "quantity": 10,
      "category": "electronics",
      "images": ["url"],
      "inStock": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "distanceKm": 2.5
    }
  ],
  "count": 1,
  "params": { /* search parameters used */ }
}
```

**Notes:**
- Results cached in Redis for 5 minutes
- `distanceKm` only included if latitude/longitude provided

### GET /products/:id

Get product details by ID (public).

**Authentication:** None (public)

**Success Response (200):**
```json
{
  "product": {
    "id": "uuid",
    "businessId": "uuid",
    "businessName": "My Shop",
    "businessRating": 4.5,
    "name": "Product Name",
    "description": "Product description",
    "price": 99.99,
    "quantity": 10,
    "category": "electronics",
    "images": ["url"],
    "inStock": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- 404: Product not found

### PUT /products/:id

Update product (business owner only).

**Authentication:** Required (SME role, must own business)

**Headers:**
```
Authorization: Bearer <access-token>
```

**Request Body (all fields optional):**
```json
{
  "name": "Updated Product Name",
  "description": "Updated description",
  "price": 89.99,
  "quantity": 15,
  "category": "electronics",
  "images": ["new-url"]
}
```

**Success Response (200):**
```json
{
  "message": "Product updated successfully",
  "product": { /* updated product object */ }
}
```

**Error Responses:**
- 400: Validation error
- 401: Not authenticated
- 403: Not the business owner
- 404: Product not found

### DELETE /products/:id

Delete product (business owner only).

**Authentication:** Required (SME role, must own business)

**Headers:**
```
Authorization: Bearer <access-token>
```

**Success Response (200):**
```json
{
  "message": "Product deleted successfully"
}
```

**Error Responses:**
- 401: Not authenticated
- 403: Not the business owner
- 404: Product not found

### PATCH /products/:id/inventory

Update product inventory quantity (business owner only).

**Authentication:** Required (SME role, must own business)

**Headers:**
```
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "quantity": 25
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
    "quantity": 25,
    "inStock": true,
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- 400: Validation error
- 401: Not authenticated
- 403: Not the business owner
- 404: Product not found

## Health Check

### GET /health

Check API status (public).

**Authentication:** None (public)

**Success Response (200):**
```json
{
  "status": "ok",
  "message": "CoShop API is running"
}
```

## Error Response Format

All errors follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": "Additional error details (optional)",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## Common Error Codes

- `VALIDATION_ERROR` (400): Invalid request data
- `NO_TOKEN` (401): Missing authorization token
- `INVALID_TOKEN_FORMAT` (401): Malformed authorization header
- `TOKEN_EXPIRED` (401): Access token has expired
- `INVALID_TOKEN` (401): Invalid or corrupted token
- `INVALID_CREDENTIALS` (401): Wrong email or password
- `AUTHENTICATION_REQUIRED` (401): Endpoint requires authentication
- `INSUFFICIENT_PERMISSIONS` (403): User lacks required role or ownership
- `FORBIDDEN` (403): Not authorized to access resource
- `USER_NOT_FOUND` (404): User does not exist
- `BUSINESS_NOT_FOUND` (404): Business does not exist
- `PRODUCT_NOT_FOUND` (404): Product does not exist
- `USER_EXISTS` (409): Email already registered
- `GEOCODING_FAILED` (400): Could not validate address
- `GEOCODING_SERVICE_ERROR` (502): Geocoding service unavailable
- `INTERNAL_SERVER_ERROR` (500): Unexpected server error
