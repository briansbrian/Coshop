# CoShop Marketplace Platform - Documentation

This documentation provides a comprehensive overview of the CoShop Marketplace platform architecture, implementation, and business logic. The documentation is organized hierarchically to help developers quickly locate information for updates, bug fixes, and feature development.

## Documentation Structure

### Core Architecture
- **[01-architecture-overview.md](01-architecture-overview.md)** - High-level system architecture, technology stack, and design principles
- **[02-service-structure.md](02-service-structure.md)** - Detailed breakdown of all services and their responsibilities

### Data Layer
- **[03-database-schema.md](03-database-schema.md)** - Complete database schema, relationships, and indexing strategy
- **[04-data-models.md](04-data-models.md)** - Data model transformations and business entity representations

### API Layer
- **[05-api-endpoints.md](05-api-endpoints.md)** - Complete API reference with request/response formats
- **[06-authentication-authorization.md](06-authentication-authorization.md)** - Authentication flow, JWT tokens, and RBAC implementation

### Business Logic
- **[07-user-management.md](07-user-management.md)** - User registration, authentication, and profile management
- **[08-business-management.md](08-business-management.md)** - SME business registration, verification, and profile updates
- **[09-geolocation-services.md](09-geolocation-services.md)** - Geocoding, spatial queries, and location-based discovery

### Integration Points
- **[10-external-integrations.md](10-external-integrations.md)** - Third-party service integrations (payment, delivery, maps)
- **[11-error-handling.md](11-error-handling.md)** - Error handling patterns, error codes, and response formats

### Development Guide
- **[12-development-setup.md](12-development-setup.md)** - Local development environment setup and configuration
- **[13-testing-strategy.md](13-testing-strategy.md)** - Testing approach, coverage requirements, and test patterns

## Quick Reference

### Current Implementation Status

**Completed:**
- ✅ Database schema with PostGIS support
- ✅ Authentication service (registration, login, JWT tokens)
- ✅ Business service (CRUD operations, geocoding)
- ✅ Authentication middleware
- ✅ Role-based access control (RBAC)
- ✅ API routes for auth and business management

**In Progress:**
- 🔄 Product and inventory service
- 🔄 Order management service
- 🔄 Geolocation service (nearby search)

**Planned:**
- ⏳ Rating and review service
- ⏳ Messaging service
- ⏳ Notification service
- ⏳ Analytics service
- ⏳ Frontend application

### Key Technologies

- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL with PostGIS extension
- **Authentication:** JWT (access + refresh tokens)
- **Geocoding:** OpenStreetMap Nominatim (with Google Maps fallback)
- **Validation:** Joi schema validation
- **Password Hashing:** bcrypt

### Common Tasks

**Adding a new API endpoint:**
1. Create service function in `/backend/src/services/`
2. Add route handler in `/backend/src/routes/`
3. Apply authentication/authorization middleware
4. Update API documentation in `05-api-endpoints.md`

**Adding a new database table:**
1. Add CREATE TABLE statement to `/database/init.sql`
2. Create appropriate indexes
3. Update schema documentation in `03-database-schema.md`
4. Update data model documentation in `04-data-models.md`

**Implementing a new service:**
1. Review service structure in `02-service-structure.md`
2. Create service module in `/backend/src/services/`
3. Implement validation schemas with Joi
4. Create corresponding routes
5. Add error handling
6. Document in relevant sections

## Navigation Tips

- **For bug fixes:** Start with the relevant service documentation (07-11) to understand business logic
- **For new features:** Review architecture (01-02) and data models (03-04) first
- **For API changes:** Check endpoint documentation (05) and update accordingly
- **For integration issues:** Refer to external integrations (10) and error handling (11)

## Document Conventions

- **WHAT:** Each document explains what components do and their purpose
- **WHY:** Rationale for design decisions and architectural choices
- **HOW:** How components connect and interact with each other
- **Minimal code:** Focus on concepts with minimal code snippets for clarity
- **LLM-friendly:** Structured for easy parsing and context extraction
