# CoShop Marketplace Platform - Documentation

This documentation provides a comprehensive overview of the CoShop Marketplace platform architecture, implementation, and business logic. The documentation is organized hierarchically to help developers quickly locate information for updates, bug fixes, and feature development.

## Documentation Structure

### Getting Started
- **[00-quick-start.md](00-quick-start.md)** - Quick start guide with examples, common tasks, and rapid overview

### Core Architecture
- **[01-architecture-overview.md](01-architecture-overview.md)** - System architecture, technology stack, design principles, and implementation status
- **[02-service-structure.md](02-service-structure.md)** - Service modules, business logic, validation patterns, and utilities

### Data & API
- **[03-database-schema.md](03-database-schema.md)** - Complete database schema with PostGIS, relationships, and indexes
- **[04-data-models.md](04-data-models.md)** - Data models and relationships
- **[05-api-endpoints.md](05-api-endpoints.md)** - Complete API reference with request/response formats and examples (20 endpoints)

### Security & Performance
- **[06-authentication-authorization.md](06-authentication-authorization.md)** - JWT authentication, RBAC, and security patterns
- **[07-error-handling.md](07-error-handling.md)** - Error patterns, status codes, and client handling strategies
- **[08-caching-strategy.md](08-caching-strategy.md)** - Redis caching, invalidation strategies, and performance optimization

### Specialized Topics
- **[06-geolocation-implementation.md](06-geolocation-implementation.md)** - PostGIS spatial queries, geocoding, and location-based search

## Quick Reference

### Current Implementation Status

**✅ Completed (Backend Core):**
- **Database**: Complete schema with PostGIS extension, spatial indexes, triggers, and generated columns
- **Authentication**: User registration (SME/consumer), login, JWT token refresh with proper expiration
- **JWT Tokens**: Access tokens (15min), refresh tokens (7d), verification middleware, role-based access
- **Business Management**: Full CRUD operations, automatic geocoding via OpenStreetMap/Google Maps, location updates
- **Product Management**: Full CRUD operations, inventory tracking, category management (15 categories)
- **Product Search**: Advanced search with keyword, category, price filters, geolocation-based sorting, pagination
- **Geolocation Service**: Nearby business search (radius-based), distance calculations, map bounds queries
- **Caching**: Redis integration with intelligent TTLs (5min for searches, 24hr for geocoding, 1hr for geolocation)
- **Authorization**: Role-based access control (SME vs consumer), ownership validation for all modifications
- **Validation**: Joi schemas for all inputs, coordinate validation, address validation
- **Error Handling**: Standardized error format with codes, typed exceptions, proper HTTP status codes
- **Transactions**: Database transactions for multi-step operations (user+business registration)
- **PostGIS Queries**: Spatial indexes, ST_DWithin for radius search, ST_Distance for calculations, ST_MakeEnvelope for bounds

**⏳ Not Implemented:**
- Order management and workflow (pending, confirmed, delivered states)
- Payment processing integration (Stripe, M-Pesa, PayPal)
- Delivery service integration (Uber API, Pick Up Mtaani API)
- Bidirectional rating system (consumer→SME and SME→consumer with trust scores)
- Real-time messaging (WebSocket server, conversation threads, read receipts)
- Multi-channel notifications (email, SMS, push, in-app with preferences)
- Business analytics and reporting (metrics, trends, CSV exports)
- File upload service (images for products and businesses, S3 integration)
- Frontend web application (only skeleton structure exists)
- Business verification workflow (document upload, admin review, verified badge)
- Staff account management (role-based permissions for business staff)
- Promotions and discounts (coupon codes, usage tracking, validity periods)
- Favorites/wishlist functionality (save businesses and products)
- Business verification workflow
- Staff account management

### Technology Stack

**Backend:**
- Node.js with Express.js
- PostgreSQL 14+ with PostGIS extension
- Redis for caching
- JWT authentication (access + refresh tokens)

**Key Libraries:**
- `bcrypt` - Password hashing (10 salt rounds)
- `joi` - Request validation
- `jsonwebtoken` - JWT tokens
- `axios` - HTTP client
- `pg` - PostgreSQL client
- `redis` - Redis client

**External Services:**
- OpenStreetMap Nominatim (geocoding, free)
- Google Maps API (geocoding fallback, optional)

### API Base URL

```
http://localhost:5000/api/v1
```

### Common Development Tasks

**Adding a new API endpoint:**
1. Create service function in `/backend/src/services/`
2. Implement Joi validation schema
3. Add route handler in `/backend/src/routes/`
4. Apply authentication/authorization middleware
5. Test error scenarios
6. Update `04-api-endpoints.md`

**Adding a new database table:**
1. Add CREATE TABLE to `/database/init.sql`
2. Create appropriate indexes (B-tree, GIST for spatial)
3. Add foreign key constraints with CASCADE rules
4. Create update trigger if needed
5. Update `03-database-schema.md`

**Implementing a new service:**
1. Review patterns in `02-service-structure.md`
2. Create service module in `/backend/src/services/`
3. Implement Joi validation schemas
4. Use transaction pattern for multi-step operations
5. Throw structured error objects
6. Create corresponding routes
7. Add caching if appropriate
8. Document in relevant sections

**Debugging issues:**
1. Check error logs for stack traces
2. Verify JWT token validity
3. Check database constraints and indexes
4. Review Redis cache state
5. Test geocoding service availability
6. Verify environment variables

## Navigation Tips

- **New to the project?** Start with `00-quick-start.md` for rapid overview and examples
- **For bug fixes:** Check `07-error-handling.md` for error patterns, then relevant service in `02-service-structure.md`
- **For new features:** Review `01-architecture-overview.md` and `03-database-schema.md` first
- **For API integration:** See `05-api-endpoints.md` for all 20 implemented endpoints with examples
- **For authentication issues:** See `06-authentication-authorization.md` for JWT and RBAC
- **For geolocation features:** See `06-geolocation-implementation.md` for PostGIS spatial queries
- **For performance optimization:** See `08-caching-strategy.md` for Redis strategy
- **For database queries:** See `03-database-schema.md` for complete schema and relationships

## Document Conventions

- **WHAT:** Each document explains what components do and their purpose
- **WHY:** Rationale for design decisions and architectural choices
- **HOW:** How components connect and interact with each other
- **Minimal code:** Focus on concepts with code examples only where necessary
- **LLM-friendly:** Structured for easy parsing and context extraction

## Implementation Summary

### Completed Features

**Authentication & Authorization:**
- User registration with email/password validation
- Separate flows for SME and consumer registration
- SME registration automatically creates business profile
- Login with credential validation and JWT token generation
- Token refresh mechanism (15min access, 7d refresh)
- JWT verification middleware for protected routes
- Role-based access control (requireRole middleware)
- Ownership validation for resource modifications

**Business Management:**
- Business registration with automatic geocoding
- Address to coordinates conversion (OpenStreetMap Nominatim + Google Maps fallback)
- PostGIS GEOGRAPHY(POINT) storage for efficient spatial queries
- Business profile retrieval (public endpoint)
- Business profile updates with re-geocoding on address changes
- Business deletion with cascading deletes
- List businesses by owner
- GIST spatial index for location-based queries

**Product Management:**
- Product creation with validation (15 predefined categories)
- Product retrieval with business information
- Product updates with dynamic query building
- Product deletion with cache invalidation
- Inventory quantity updates
- Auto-calculated in_stock status (generated column)
- List products by business

**Product Search:**
- Keyword search (name/description, case-insensitive)
- Category filtering
- Price range filtering (min/max)
- Geolocation-based search with distance calculation
- Radius filtering using PostGIS ST_DWithin
- Multiple sort options (price, date, name, rating, distance)
- Pagination support (limit/offset)
- Redis caching (5min TTL) with automatic invalidation
- Enriched results with business data

**Geolocation Services:**
- Nearby business search with radius (0.1-100km)
- Business type filtering (shop, business, service)
- Verified status and minimum rating filters
- Distance calculation between any two points
- Map bounds queries for pan/zoom interactions
- Geodesic distance calculations using PostGIS
- Results cached for 1 hour
- Distance returned in meters, kilometers, and miles

**Geocoding Services:**
- Forward geocoding (address → coordinates)
- Reverse geocoding (coordinates → address)
- OpenStreetMap Nominatim integration (free, no API key)
- Google Maps API fallback (optional)
- Redis caching (24hr TTL) to reduce API calls
- Coordinate validation (-90 to 90 lat, -180 to 180 lon)

**Data Validation:**
- Joi schemas for all service inputs
- Email format validation
- Password strength requirements (min 8 characters)
- Business type validation (shop, business, service)
- Product category validation (15 predefined categories)
- Price and quantity validation
- Coordinate range validation
- Address component validation

**Error Handling:**
- Standardized error response format
- Typed error objects with status codes
- Proper HTTP status codes (400, 401, 403, 404, 409, 500, 502)
- Error codes for client-side handling
- Detailed validation error messages
- Timestamp on all errors

**Database Features:**
- PostgreSQL with PostGIS extension
- UUID primary keys for all tables
- Spatial indexes (GIST) on location columns
- B-tree indexes on foreign keys and frequently queried fields
- Generated columns (in_stock calculated from quantity)
- Triggers for updated_at timestamps
- Cascading deletes for referential integrity
- Database transactions for atomic operations

**Caching Strategy:**
- Redis integration for performance optimization
- Product search results: 5 minutes TTL
- Geocoding results: 24 hours TTL
- Geolocation queries: 1 hour TTL
- Pattern-based cache invalidation
- Cache key generation from sorted parameters

### API Endpoints Summary

**Authentication (3 endpoints):**
- POST /api/v1/auth/register - User registration
- POST /api/v1/auth/login - User authentication
- POST /api/v1/auth/refresh - Token refresh

**Business (6 endpoints):**
- POST /api/v1/businesses - Create business (SME only)
- GET /api/v1/businesses/:id - Get business profile (public)
- PUT /api/v1/businesses/:id - Update business (owner only)
- DELETE /api/v1/businesses/:id - Delete business (owner only)
- GET /api/v1/businesses/owner/:ownerId - List owner's businesses
- GET /api/v1/businesses/:id/products - List business products (public)

**Product (6 endpoints):**
- POST /api/v1/products - Create product (SME only)
- GET /api/v1/products/search - Search products (public)
- GET /api/v1/products/:id - Get product details (public)
- PUT /api/v1/products/:id - Update product (owner only)
- DELETE /api/v1/products/:id - Delete product (owner only)
- PATCH /api/v1/products/:id/inventory - Update inventory (owner only)

**Geolocation (5 endpoints):**
- GET /api/v1/geolocation/nearby - Find nearby businesses (public)
- GET /api/v1/geolocation/distance - Calculate distance (public)
- GET /api/v1/geolocation/in-bounds - Get businesses in map bounds (public)
- GET /api/v1/geolocation/geocode - Address to coordinates (public)
- GET /api/v1/geolocation/reverse-geocode - Coordinates to address (public)

**Total: 20 implemented endpoints**

## Environment Variables

Required for development:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/coshop

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

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

## Project Structure

```
/backend
  /src
    /config         - Database and Redis configuration
    /middleware     - Authentication and RBAC middleware
    /routes         - API route handlers
    /services       - Business logic and data operations
    /utils          - JWT, geocoding, and cache utilities
    server.js       - Express app setup
  package.json
  
/database
  init.sql          - Database schema with PostGIS
  
/docs
  *.md              - This documentation
  
/frontend
  (Not implemented yet)
```
