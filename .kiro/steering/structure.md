# Project Structure

## Current State

Project is in the planning phase with detailed requirements and design specifications. No implementation code exists yet.

## Planned Architecture

### Service-Oriented Structure

The platform will be organized into distinct services:

1. **Authentication Service** - User registration, login, JWT tokens, RBAC
2. **SME Management Service** - Business profiles, verification, staff accounts
3. **Product/Inventory Service** - Catalog management, inventory tracking, search
4. **Order Management Service** - Order processing, payment, delivery integration
5. **Geolocation Service** - Map-based discovery, distance calculations
6. **Rating & Review Service** - Bidirectional ratings (consumer↔SME)
7. **Messaging Service** - Real-time communication, conversation history
8. **Notification Service** - Multi-channel notifications (email, SMS, push, in-app)
9. **Analytics Service** - Business metrics, reports, data export

### Data Organization

**Core Entities:**
- Users (SMEs and consumers)
- Businesses (with geospatial location data)
- Products (with inventory tracking)
- Orders (with items, payment, delivery info)
- Ratings (bidirectional: consumer→SME and SME→consumer)
- Messages (conversation threads)
- Notifications (multi-channel with preferences)

**Key Relationships:**
- Users own Businesses (1:N for staff accounts)
- Businesses have Products (1:N)
- Orders link Consumers to Businesses (M:N through order items)
- Ratings link to completed Orders
- Messages connect Users bidirectionally

### Database Schema Highlights

- PostgreSQL with PostGIS extension for geospatial queries
- Spatial indexes on business locations
- Generated columns for computed fields (e.g., `in_stock`)
- JSONB for flexible criteria storage (ratings)
- Proper foreign key constraints and cascading deletes

## Conventions to Follow

### API Design
- RESTful endpoints with consistent naming
- JWT authentication for protected routes
- Consistent error response format across all services
- Typed interfaces for all service methods (see design.md)

### Database
- UUID primary keys
- `created_at` and `updated_at` timestamps on all tables
- Proper indexing on foreign keys and frequently queried fields
- Use PostGIS geography type for location data

### Error Handling
- Typed exceptions with error codes
- HTTP status codes: 401 (auth), 400 (validation), 404 (not found), 409 (conflict), 502/503 (integration), 500 (server)
- Retry logic with exponential backoff for external integrations
- Critical errors trigger admin alerts

### Testing
- Unit tests for business logic (80% coverage minimum)
- Integration tests for end-to-end flows
- Performance testing for scalability
- Security testing (OWASP compliance)

## File Organization (To Be Implemented)

Expected structure once implementation begins:
```
/src
  /services
    /auth
    /sme
    /product
    /order
    /geolocation
    /rating
    /messaging
    /notification
    /analytics
  /models
  /middleware
  /utils
  /config
/tests
  /unit
  /integration
/docs
```
