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

### 5. Order Service (`orderService.js`)

**Purpose:** Manages order creation, processing, status workflow, and inventory updates.

**Key Functions:**
- `createOrder(consumerId, orderData)` - Creates order(s) with inventory validation and cart splitting
- `getOrderById(orderId, userId)` - Retrieves order details with items
- `getOrdersByUser(userId, userType, filters)` - Lists orders for consumer or SME
- `updateOrderStatus(orderId, businessOwnerId, statusData)` - Updates order status with workflow validation

**Validation Schemas:**
- `orderCreateSchema` - Validates items array and delivery method
- `orderItemSchema` - Validates productId and quantity
- `orderStatusUpdateSchema` - Validates status transitions

**Order Workflow:**
Six status states with validated transitions:
1. `pending` → can transition to `confirmed` or `cancelled`
2. `confirmed` → can transition to `ready` or `cancelled`
3. `ready` → can transition to `out_for_delivery`, `delivered`, or `cancelled`
4. `out_for_delivery` → can transition to `delivered` or `cancelled`
5. `delivered` → terminal state (no transitions)
6. `cancelled` → terminal state (no transitions)

**Business Logic:**
- Validates product availability and inventory before order creation
- Splits shopping cart into separate orders per SME (multi-vendor support)
- Calculates total amount for each order
- Deducts inventory automatically when order status changes to `confirmed`
- Restores inventory if order is cancelled from `confirmed` state
- Prevents invalid status transitions
- Triggers notifications on order creation and status changes
- Verifies user access (consumer can view their orders, SME can view orders for their businesses)

**Inventory Management:**
- Checks product `in_stock` status before order creation
- Validates sufficient quantity available
- Atomic inventory deduction using database transactions
- Automatic inventory restoration on cancellation
- Prevents order confirmation if inventory insufficient

**Multi-SME Cart Splitting:**
- Groups cart items by business_id
- Creates separate order for each business
- Each order has independent status tracking
- Maintains referential integrity with order_items

**Notification Integration:**
- Notifies business owner when new order is created
- Notifies consumer when order status changes
- Uses `notificationUtils` for automatic notification creation

**Error Handling:**
- 400: Validation errors, insufficient inventory, invalid status transition
- 403: Not authorized to view/modify order
- 404: Order, consumer, or product not found

### 6. Rating Service (`ratingService.js`)

**Purpose:** Manages bidirectional rating system where consumers rate SMEs and SMEs rate consumers.

**Key Functions:**
- `createConsumerRating(consumerId, ratingData)` - Consumer rates SME after order completion
- `createSMERating(smeOwnerId, ratingData)` - SME rates consumer's transaction behavior
- `getBusinessRatings(businessId, filters)` - Retrieves all consumer ratings for a business
- `getConsumerTrustScore(consumerId)` - Calculates consumer's trust score from SME ratings

**Validation Schemas:**
- `consumerRatingSchema` - Validates orderId, businessId, stars (1-5), review, criteria (productQuality, service, value)
- `smeRatingSchema` - Validates orderId, consumerId, stars (1-5), feedback, criteria (paymentTimeliness, communication, compliance)

**Rating Types:**
1. **Consumer-to-SME (`consumer_to_sme`):**
   - Rates product quality, service, and value
   - Updates business aggregate rating and total_ratings
   - Displayed on business profiles
   
2. **SME-to-Consumer (`sme_to_consumer`):**
   - Rates payment timeliness, communication, and compliance
   - Contributes to consumer trust score
   - Visible to other SMEs when processing orders

**Business Logic:**
- Verifies order exists and is completed/delivered before allowing rating
- Prevents duplicate ratings for same order
- Validates rater is participant in the order (consumer or business owner)
- Stores criteria as JSONB for flexible rating dimensions
- Automatically updates aggregate ratings after new rating created

**Trust Score Calculation:**
- Averages all SME ratings for a consumer
- Calculates breakdown by criteria (payment, communication, compliance)
- Returns 0 score if consumer has no ratings
- Helps SMEs identify trustworthy customers

**Aggregate Rating Updates:**
- `updateBusinessRatings()` - Recalculates business average rating and total count
- `updateConsumerTrustScore()` - Placeholder for future caching (currently calculated on-demand)

**Duplicate Prevention:**
- Checks for existing rating with same order_id, rater_id, and rating_type
- Returns 409 Conflict if duplicate found

**Error Handling:**
- 400: Validation errors, order not completed, invalid business/consumer
- 403: Not authorized to rate (not order participant)
- 404: Order not found
- 409: Duplicate rating

### 7. Notification Service (`notificationService.js`)

**Purpose:** Manages in-app notifications with database storage and read/unread tracking.

**Key Functions:**
- `createNotification(userId, notificationData)` - Creates new notification
- `getUserNotifications(userId, filters)` - Retrieves user's notification history
- `markNotificationAsRead(notificationId, userId)` - Marks notification as read
- `getUnreadCount(userId)` - Gets count of unread notifications

**Validation Schemas:**
- `notificationCreateSchema` - Validates type, title, message, priority
- `notificationFiltersSchema` - Validates read status, type, limit, offset

**Notification Types:**
- `new_order` - Business owner receives notification when order is placed
- `order_status_change` - Consumer receives notification when order status updates
- `message` - User receives notification for new messages (future)
- `review` - User receives notification for new reviews (future)
- `low_inventory` - Business owner notified when product stock is low (future)
- `payment` - Payment-related notifications (future)
- `delivery_update` - Delivery status updates (future)

**Priority Levels:**
- `low` - Non-urgent notifications (batched)
- `medium` - Standard notifications
- `high` - Urgent notifications (new orders, payment issues)

**Business Logic:**
- Stores notifications in database for persistence
- Tracks read/unread status per notification
- Supports filtering by type and read status
- Provides pagination for notification history
- Validates user ownership before marking as read

**Notification Utilities (`notificationUtils.js`):**
- `notifyNewOrder(businessOwnerId, consumerEmail, totalAmount)` - Auto-creates notification when order placed
- `notifyOrderStatusChange(orderId, consumerId, businessName, newStatus)` - Auto-creates notification on status change

**Current Implementation:**
- In-app notifications only (stored in database)
- Automatic triggers from order service
- Read/unread tracking
- Notification history with pagination

**Not Yet Implemented:**
- Email notifications
- SMS notifications
- Push notifications
- Notification preferences management
- Batching of non-urgent notifications
- WebSocket real-time delivery

**Error Handling:**
- 400: Validation errors
- 403: Not authorized to access notification
- 404: Notification not found

## Service Dependencies (Updated)

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

orderService
  ├── pool (database)
  ├── notificationUtils (order notifications)
  └── joi (validation)

ratingService
  ├── pool (database)
  └── joi (validation)

notificationService
  ├── pool (database)
  └── joi (validation)
```

## Not Yet Implemented

Services planned but not yet built:
- Payment Service (Stripe/M-Pesa integration, transaction tracking)
- Delivery Service (Uber/Pick Up Mtaani API integration)
- Messaging Service (WebSocket, conversation threads, read receipts)
- Analytics Service (metrics aggregation, reporting, CSV exports)
- File Upload Service (image storage, S3 integration)
- Admin Moderation Service (content flagging, reports, audit logs)
- Promotions Service (discount codes, usage tracking, validity periods)
- Favorites Service (wishlist functionality)
