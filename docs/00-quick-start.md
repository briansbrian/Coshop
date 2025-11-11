# Quick Start Guide

## What is CoShop?

CoShop is a marketplace platform that empowers Small and Medium-sized Enterprises (SMEs) to establish online presence and connect with consumers through geolocation-based discovery. The platform provides business registration, product management, and location-based search capabilities.

## Current Status

**Backend:** Core features implemented (authentication, business management, product management, geolocation services)  
**Frontend:** Skeleton only (not implemented)  
**Database:** Fully configured with PostGIS  
**Caching:** Redis integrated  

## Technology Stack

- **Backend:** Node.js + Express.js
- **Database:** PostgreSQL 14+ with PostGIS extension
- **Cache:** Redis
- **Authentication:** JWT (15min access, 7d refresh)
- **Validation:** Joi schemas
- **Geocoding:** OpenStreetMap Nominatim + Google Maps fallback

## Project Structure

```
/backend
  /src
    /config         - Database and Redis configuration
    /middleware     - Authentication and RBAC middleware
    /routes         - API route handlers (20 endpoints)
    /services       - Business logic (4 services implemented)
    /utils          - JWT, geocoding, and cache utilities
    server.js       - Express app setup
    
/database
  init.sql          - Complete schema with PostGIS
  
/docs
  00-quick-start.md           - This file
  01-architecture-overview.md - System architecture and design principles
  02-service-structure.md     - Service modules and business logic
  03-database-schema.md       - Complete database schema with PostGIS
  04-data-models.md           - Data models and relationships
  05-api-endpoints.md         - Complete API reference (20 endpoints)
  06-authentication-authorization.md - JWT and RBAC implementation
  07-error-handling.md        - Error patterns and status codes
  08-caching-strategy.md      - Redis caching and invalidation
  README.md                   - Documentation index
```

## Quick Reference

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/coshop

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key-for-access-tokens
JWT_REFRESH_SECRET=your-secret-key-for-refresh-tokens

# Server
PORT=5000
NODE_ENV=development
API_VERSION=v1

# Geocoding (optional)
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### Start Development Server

```bash
cd backend
npm install
npm run dev
```

Server runs on `http://localhost:5000`

### API Base URL

```
http://localhost:5000/api/v1
```

### Test API Health

```bash
curl http://localhost:5000/health
```

## Implemented Features

### 1. Authentication (3 endpoints)

- User registration (SME or consumer)
- Login with JWT tokens
- Token refresh mechanism

**Example:**
```bash
# Register SME with business
POST /api/v1/auth/register
{
  "email": "sme@example.com",
  "password": "securepass123",
  "userType": "sme",
  "businessInfo": {
    "name": "My Shop",
    "businessType": "shop",
    "address": "123 Main St",
    "city": "New York",
    "country": "USA",
    "contactEmail": "contact@shop.com",
    "contactPhone": "+1234567890"
  }
}

# Login
POST /api/v1/auth/login
{
  "email": "sme@example.com",
  "password": "securepass123"
}
```

### 2. Business Management (6 endpoints)

- Create, read, update, delete businesses
- Automatic geocoding (address → coordinates)
- List businesses by owner
- List products by business

**Example:**
```bash
# Get business profile
GET /api/v1/businesses/{id}

# Update business (requires auth)
PUT /api/v1/businesses/{id}
Authorization: Bearer {token}
{
  "name": "Updated Shop Name",
  "description": "New description"
}
```

### 3. Product Management (6 endpoints)

- Create, read, update, delete products
- Inventory tracking with auto-calculated in_stock status
- Advanced search with filters
- 15 predefined categories

**Example:**
```bash
# Create product (requires auth)
POST /api/v1/products
Authorization: Bearer {token}
{
  "businessId": "uuid",
  "name": "Laptop Pro 15",
  "description": "High-performance laptop",
  "price": 1299.99,
  "quantity": 10,
  "category": "electronics",
  "images": ["https://example.com/image.jpg"]
}

# Search products
GET /api/v1/products/search?keyword=laptop&category=electronics&minPrice=500&maxPrice=2000
```

### 4. Geolocation Services (5 endpoints)

- Find nearby businesses (radius-based)
- Calculate distance between points
- Get businesses in map bounds
- Forward geocoding (address → coordinates)
- Reverse geocoding (coordinates → address)

**Example:**
```bash
# Find nearby businesses
GET /api/v1/geolocation/nearby?latitude=40.7128&longitude=-74.0060&radius=5&businessType=shop

# Calculate distance
GET /api/v1/geolocation/distance?fromLat=40.7128&fromLon=-74.0060&toLat=40.7589&toLon=-73.9851
```

## Key Concepts

### PostGIS Spatial Queries

Business locations stored as `GEOGRAPHY(POINT, 4326)` for efficient geospatial queries:

- **ST_DWithin()** - Radius-based search using spatial index
- **ST_Distance()** - Geodesic distance calculation in meters
- **ST_GeogFromText()** - Create point from coordinates
- **GIST index** - Enables fast spatial queries

### JWT Authentication

Two-token system:
- **Access Token:** 15 minutes, used for API requests
- **Refresh Token:** 7 days, used to get new access tokens

Include in requests:
```
Authorization: Bearer {access_token}
```

### Role-Based Access Control

- **SME:** Can create/manage businesses and products
- **Consumer:** Can browse, search, place orders (orders not implemented yet)
- **Admin:** Full access (not implemented yet)

### Caching Strategy

Redis caching with intelligent TTLs:
- **Product searches:** 5 minutes
- **Geocoding results:** 24 hours
- **Geolocation queries:** 1 hour

Cache automatically invalidated on data changes.

### Validation

All inputs validated with Joi schemas before processing:
- Email format validation
- Password strength (min 8 characters)
- Business type (shop, business, service)
- Product category (15 predefined)
- Coordinate ranges (-90 to 90 lat, -180 to 180 lon)
- Price and quantity validation

### Error Handling

Standardized error format:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": "Additional context",
    "timestamp": "2025-11-12T10:30:00.000Z"
  }
}
```

Common status codes:
- **400** - Validation error, invalid input
- **401** - Authentication required or failed
- **403** - Insufficient permissions
- **404** - Resource not found
- **409** - Resource already exists
- **500** - Server error
- **502** - External service error

## Common Development Tasks

### Add New API Endpoint

1. Create service function in `/backend/src/services/`
2. Add Joi validation schema
3. Create route handler in `/backend/src/routes/`
4. Apply authentication/authorization middleware
5. Test error scenarios
6. Update API documentation

### Add New Database Table

1. Add CREATE TABLE to `/database/init.sql`
2. Create appropriate indexes
3. Add foreign key constraints
4. Create update trigger if needed
5. Update schema documentation

### Debug Issues

1. Check error logs for stack traces
2. Verify JWT token validity
3. Check database constraints
4. Review Redis cache state
5. Test geocoding service availability
6. Verify environment variables

## What's Not Implemented

- Order management and workflow
- Payment processing (Stripe, M-Pesa)
- Delivery service integration (Uber, Pick Up Mtaani)
- Bidirectional rating system
- Real-time messaging (WebSocket)
- Multi-channel notifications
- Business analytics
- File upload for images
- Frontend web application
- Business verification workflow
- Staff account management
- Promotions and discounts
- Favorites/wishlist

## Next Steps for Development

1. **Order Management:** Implement order creation, status tracking, and workflow
2. **Payment Integration:** Add Stripe/M-Pesa payment processing
3. **Rating System:** Build bidirectional reviews (consumer↔SME)
4. **File Upload:** Implement image storage (S3 or local)
5. **Frontend:** Build React web application
6. **Messaging:** Add WebSocket for real-time chat
7. **Notifications:** Implement multi-channel delivery
8. **Analytics:** Build business metrics and reporting

## Documentation Navigation

- **Architecture:** See `01-architecture-overview.md` for system design
- **Services:** See `02-service-structure.md` for business logic patterns
- **Database:** See `03-database-schema.md` for complete schema
- **API:** See `05-api-endpoints.md` for all 20 endpoints
- **Auth:** See `06-authentication-authorization.md` for JWT and RBAC
- **Errors:** See `07-error-handling.md` for error patterns
- **Caching:** See `08-caching-strategy.md` for Redis strategy

## Getting Help

1. Check relevant documentation section
2. Review service implementation in `/backend/src/services/`
3. Check route handlers in `/backend/src/routes/`
4. Review database schema in `/database/init.sql`
5. Test endpoints with curl or Postman
6. Check error logs for detailed stack traces
