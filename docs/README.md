# CoShop Marketplace Platform - Documentation

This documentation provides a comprehensive overview of the CoShop Marketplace platform architecture, implementation, and business logic. The documentation is organized hierarchically to help developers quickly locate information for updates, bug fixes, and feature development.

## Documentation Structure

### Core Architecture
- **[01-architecture-overview.md](01-architecture-overview.md)** - System architecture, technology stack, design principles, and implementation status
- **[02-service-structure.md](02-service-structure.md)** - Service modules, business logic, validation patterns, and utilities

### Data & API
- **[03-database-schema.md](03-database-schema.md)** - Complete database schema with PostGIS, relationships, and indexes
- **[04-api-endpoints.md](04-api-endpoints.md)** - Complete API reference with request/response formats and examples

### Security & Performance
- **[05-authentication-authorization.md](05-authentication-authorization.md)** - JWT authentication, RBAC, and security patterns
- **[06-geolocation-implementation.md](06-geolocation-implementation.md)** - PostGIS spatial queries, geocoding, and location-based search
- **[07-error-handling.md](07-error-handling.md)** - Error patterns, status codes, and client handling strategies
- **[08-caching-strategy.md](08-caching-strategy.md)** - Redis caching, invalidation strategies, and performance optimization

## Quick Reference

### Current Implementation Status

**✅ Completed:**
- Database schema with PostGIS extension
- User authentication (registration, login, token refresh)
- JWT token generation and verification (15min access, 7d refresh)
- Business CRUD operations with automatic geocoding
- Product CRUD operations with inventory tracking
- Product search with geolocation filtering and caching
- Redis caching for search results (5min TTL)
- Role-based access control (SME vs consumer)
- Ownership validation for resource modifications
- Standardized error handling across all endpoints

**⏳ Not Implemented:**
- Order management and workflow
- Payment processing integration
- Delivery service integration (Uber, Pick Up Mtaani)
- Bidirectional rating system (consumer↔SME)
- Real-time messaging (WebSocket)
- Multi-channel notifications
- Business analytics and reporting
- File upload for images
- Frontend web application
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

- **For bug fixes:** Start with `07-error-handling.md` to understand error patterns, then check relevant service in `02-service-structure.md`
- **For new features:** Review `01-architecture-overview.md` and `03-database-schema.md` first
- **For API changes:** Check `04-api-endpoints.md` and update accordingly
- **For authentication issues:** See `05-authentication-authorization.md`
- **For geolocation features:** See `06-geolocation-implementation.md`
- **For performance optimization:** See `08-caching-strategy.md`

## Document Conventions

- **WHAT:** Each document explains what components do and their purpose
- **WHY:** Rationale for design decisions and architectural choices
- **HOW:** How components connect and interact with each other
- **Minimal code:** Focus on concepts with code examples only where necessary
- **LLM-friendly:** Structured for easy parsing and context extraction

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
