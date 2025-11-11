# Service Structure

## Overview

The backend is organized into service modules, each responsible for a specific domain. Services contain business logic, data validation, and database operations.

## Implemented Services

### 1. Authentication Service (`authService.js`)

**Purpose:** Manages user registration, authentication, and password operations.

**Key Functions:**
- `registerUser(userData)` - Creates new user account (consumer or SME)
- `authenticateUser(credentials)` - Validates credentials and returns user data
- `getUserById(userId)` - Retrieves user information
- `hashPassword(password)` - Hashes passwords with bcrypt
- `comparePassword(password, hash)` - Verifies password against hash

**Validation Schemas:**
- `registrationSchema` - Validates email, password, userType, and optional businessInfo
- `loginSchema` - Validates email and password

**Business Logic:**
- Checks for duplicate email addresses
- Hashes passwords with 10 salt rounds
- Creates business profile automatically for SME registrations
- Uses database transactions for atomic operations

**Error Handling:**
- 400: Validation errors
- 401: Invalid credentials
- 404: User not found
- 409: User already exists

### 2. Business Service (`businessService.js`)

**Purpose:** Manages SME business profiles, locations, and CRUD operations.

**Key Functions:**
- `registerBusiness(ownerId, businessData)` - Creates new business with geocoded location
- `getBusinessById(businessId)` - Retrieves business profile
- `updateBusiness(businessId, ownerId, updateData)` - Updates business information
- `deleteBusiness(businessId, ownerId)` - Removes business (cascade deletes products)
- `getBusinessesByOwner(ownerId)` - Lists all businesses for an owner

**Validation Schemas:**
- `businessRegistrationSchema` - Validates name, type, address, contact info
- `businessUpdateSchema` - Validates partial updates

**Business Logic:**
- Verifies user is SME type before allowing business creation
- Geocodes addresses using `geocodingUtils`
- Stores location as PostGIS GEOGRAPHY(POINT)
- Validates ownership before updates/deletes
- Re-geocodes address when location fields change

**Geospatial Operations:**
- Converts address to coordinates via OpenStreetMap Nominatim
- Falls back to Google Maps API if configured
- Stores as `POINT(longitude latitude)` in WGS84 (SRID 4326)
- Extracts coordinates using `ST_X()` and `ST_Y()` for responses

**Error Handling:**
- 400: Invalid address, validation errors
- 403: Not authorized to modify business
- 404: Business or user not found

### 3. Product Service (`productService.js`)

**Purpose:** Manages product catalog, inventory, and search functionality.

**Key Functions:**
- `createProduct(businessId, productData)` - Adds new product to catalog
- `getProductById(productId)` - Retrieves product with business info
- `updateProduct(productId, businessId, updateData)` - Updates product details
- `deleteProduct(productId, businessId)` - Removes product
- `updateInventory(productId, businessId, quantityData)` - Updates stock quantity
- `getProductsByBusiness(businessId)` - Lists all products for a business
- `searchProducts(searchParams)` - Advanced search with filters and geolocation

**Validation Schemas:**
- `productCreateSchema` - Validates name, price, quantity, category, images
- `productUpdateSchema` - Validates partial updates
- `inventoryUpdateSchema` - Validates quantity updates

**Product Categories:**
15 predefined categories: electronics, clothing, food, beverages, home, beauty, health, sports, books, toys, automotive, office, garden, pets, other

**Search Capabilities:**
- Keyword search (name or description, case-insensitive)
- Category filtering
- Price range filtering (min/max)
- Geolocation filtering (radius-based)
- Distance calculation from user location
- Sorting by: price, created_at, name, rating, distance
- Pagination (limit/offset)

**Caching Strategy:**
- Search results cached in Redis for 5 minutes (300 seconds)
- Cache key generated from search parameters
- Cache invalidated on product create/update/delete
- Pattern-based cache deletion (`products:search:*`)

**Business Logic:**
- Verifies business exists before product creation
- Validates business ownership for modifications
- Auto-calculates `in_stock` status (generated column)
- Joins with business data for enriched responses
- Uses PostGIS `ST_Distance()` for location-based search
- `ST_DWithin()` for radius filtering

**Error Handling:**
- 400: Validation errors, no updates provided
- 403: Not authorized to modify product
- 404: Product or business not found

## Service Patterns

### Validation Pattern

All services use Joi for input validation:

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

### Transaction Pattern

Multi-step operations use database transactions:

```javascript
const client = await pool.connect();
try {
  await client.query('BEGIN');
  // ... multiple queries
  await client.query('COMMIT');
  return result;
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

### Error Throwing Pattern

Services throw structured error objects:

```javascript
throw {
  status: 404,
  code: 'RESOURCE_NOT_FOUND',
  message: 'Resource not found'
};
```

### Dynamic Query Building

Services build SQL queries dynamically for partial updates:

```javascript
const updates = [];
const values = [];
let paramCount = 1;

if (value.name !== undefined) {
  updates.push(`name = $${paramCount++}`);
  values.push(value.name);
}
// ... more fields

const query = `UPDATE table SET ${updates.join(', ')} WHERE id = $${paramCount}`;
```

## Utility Modules

### JWT Utils (`jwtUtils.js`)

- `generateAccessToken(payload)` - Creates 15-minute access token
- `generateRefreshToken(payload)` - Creates 7-day refresh token
- `generateTokens(user)` - Creates both tokens
- `verifyAccessToken(token)` - Validates and decodes access token
- `verifyRefreshToken(token)` - Validates and decodes refresh token

### Geocoding Utils (`geocodingUtils.js`)

- `geocodeAddress(address, city, country)` - Converts address to coordinates
- `reverseGeocode(latitude, longitude)` - Converts coordinates to address
- `validateCoordinates(latitude, longitude)` - Validates coordinate ranges

Uses OpenStreetMap Nominatim by default, falls back to Google Maps if API key configured.

### Cache Utils (`cacheUtils.js`)

- `getCached(key)` - Retrieves and parses cached value
- `setCached(key, value, ttl)` - Stores value with TTL
- `deleteCached(key)` - Removes single cache entry
- `deleteCachedPattern(pattern)` - Removes all matching keys
- `generateSearchCacheKey(params)` - Creates consistent cache keys

## Service Dependencies

```
authService
  ├── jwtUtils (token generation)
  ├── pool (database)
  └── bcrypt (password hashing)

businessService
  ├── pool (database)
  ├── geocodingUtils (address conversion)
  └── joi (validation)

productService
  ├── pool (database)
  ├── cacheUtils (search caching)
  └── joi (validation)
```

### 4. Geolocation Service (`geolocationService.js`)

**Purpose:** Provides location-based business discovery and distance calculations using PostGIS spatial queries.

**Key Functions:**
- `findNearbyBusinesses(searchParams)` - Finds businesses within radius of a location
- `calculateDistance(fromLat, fromLon, toLat, toLon)` - Calculates geodesic distance between two points
- `getBusinessesInBounds(northEastLat, northEastLon, southWestLat, southWestLon, filters)` - Retrieves businesses within map bounds

**Validation Schemas:**
- `nearbySearchSchema` - Validates latitude, longitude, radius, filters, pagination

**Search Capabilities:**
- Radius-based search (0.1 to 100 km)
- Business type filtering (shop, business, service)
- Verified status filtering
- Minimum rating filtering
- Distance calculation in meters and kilometers
- Results sorted by distance (nearest first)
- Pagination support

**PostGIS Spatial Queries:**
- `ST_DWithin(location, point, radius)` - Efficient radius search using spatial index
- `ST_Distance(location1, location2)` - Geodesic distance calculation
- `ST_GeogFromText('POINT(lon lat)')` - Creates geography point from coordinates
- `ST_MakeEnvelope(x1, y1, x2, y2, 4326)` - Creates bounding box for map queries
- Uses GIST index on `businesses.location` for performance

**Caching Strategy:**
- Nearby search results cached for 1 hour (3600 seconds)
- Cache key includes all search parameters
- Reduces load on PostGIS spatial queries

**Response Format:**
- Includes distance in meters and kilometers
- Returns search location and radius used
- Shows applied filters
- Provides business details with location data

**Error Handling:**
- 400: Invalid coordinates, validation errors
- 500: PostGIS query errors, spatial calculation failures

## Service Patterns

### Validation Pattern

All services use Joi for input validation:

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

### Transaction Pattern

Multi-step operations use database transactions:

```javascript
const client = await pool.connect();
try {
  await client.query('BEGIN');
  // ... multiple queries
  await client.query('COMMIT');
  return result;
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

### Error Throwing Pattern

Services throw structured error objects:

```javascript
throw {
  status: 404,
  code: 'RESOURCE_NOT_FOUND',
  message: 'Resource not found'
};
```

### Dynamic Query Building

Services build SQL queries dynamically for partial updates:

```javascript
const updates = [];
const values = [];
let paramCount = 1;

if (value.name !== undefined) {
  updates.push(`name = ${paramCount++}`);
  values.push(value.name);
}
// ... more fields

const query = `UPDATE table SET ${updates.join(', ')} WHERE id = ${paramCount}`;
```

### Caching Pattern

Services use Redis for frequently accessed data:

```javascript
// Check cache first
const cacheKey = generateCacheKey(params);
const cachedResult = await getCached(cacheKey);
if (cachedResult) {
  return cachedResult;
}

// Execute query
const result = await executeQuery();

// Cache result with TTL
await setCached(cacheKey, result, ttlSeconds);
return result;
```

### Cache Invalidation Pattern

Services invalidate cache when data changes:

```javascript
// After create/update/delete operations
await deleteCachedPattern('products:search:*');
```

## Utility Modules

### JWT Utils (`jwtUtils.js`)

- `generateAccessToken(payload)` - Creates 15-minute access token
- `generateRefreshToken(payload)` - Creates 7-day refresh token
- `generateTokens(user)` - Creates both tokens
- `verifyAccessToken(token)` - Validates and decodes access token
- `verifyRefreshToken(token)` - Validates and decodes refresh token

**Token Payload:**
```javascript
{
  userId: user.id,
  email: user.email,
  userType: user.userType
}
```

### Geocoding Utils (`geocodingUtils.js`)

- `geocodeAddress(address, city, country)` - Converts address to coordinates
- `reverseGeocode(latitude, longitude)` - Converts coordinates to address
- `validateCoordinates(latitude, longitude)` - Validates coordinate ranges (-90 to 90 lat, -180 to 180 lon)

**Geocoding Strategy:**
1. Check Redis cache (24-hour TTL)
2. Try OpenStreetMap Nominatim (free, no API key)
3. Fall back to Google Maps API if configured
4. Cache successful results

**User-Agent Header:**
Required for Nominatim: `CoShop-Marketplace/1.0`

### Cache Utils (`cacheUtils.js`)

- `getCached(key)` - Retrieves and parses cached value
- `setCached(key, value, ttl)` - Stores value with TTL (default 300s)
- `deleteCached(key)` - Removes single cache entry
- `deleteCachedPattern(pattern)` - Removes all matching keys
- `generateSearchCacheKey(params)` - Creates consistent cache keys from sorted parameters

**Cache Key Patterns:**
- `products:search:{params}` - Product search results (5min TTL)
- `geocode:forward:{address}` - Forward geocoding (24hr TTL)
- `geocode:reverse:{lat},{lon}` - Reverse geocoding (24hr TTL)
- `geolocation:nearby:{params}` - Nearby businesses (1hr TTL)

## Service Dependencies

```
authService
  ├── jwtUtils (token generation)
  ├── pool (database)
  └── bcrypt (password hashing)

businessService
  ├── pool (database)
  ├── geocodingUtils (address conversion)
  └── joi (validation)

productService
  ├── pool (database)
  ├── cacheUtils (search caching)
  └── joi (validation)

geolocationService
  ├── pool (database)
  ├── cacheUtils (result caching)
  ├── geocodingUtils (coordinate validation)
  └── joi (validation)
```

## Not Yet Implemented

Services planned but not yet built:
- Order Service (order creation, status management, workflow)
- Payment Service (Stripe/M-Pesa integration, transaction tracking)
- Delivery Service (Uber/Pick Up Mtaani API integration)
- Rating Service (bidirectional reviews, trust scores)
- Messaging Service (WebSocket, conversation threads)
- Notification Service (multi-channel delivery, preferences)
- Analytics Service (metrics aggregation, reporting, exports)
- File Upload Service (image storage, S3 integration)
