# Architecture Overview

## System Architecture

CoShop is a marketplace platform built with a service-oriented architecture that connects SMEs with consumers through geolocation-based discovery, product management, and order processing.

### Technology Stack

**Backend:**
- Node.js with Express.js (RESTful API)
- PostgreSQL 14+ with PostGIS extension (geospatial data)
- Redis (caching and session management)
- JWT for authentication (access + refresh tokens)

**Key Libraries:**
- `bcrypt` - Password hashing
- `joi` - Request validation
- `jsonwebtoken` - JWT token generation/verification
- `axios` - HTTP client for external APIs
- `pg` - PostgreSQL client

**External Services:**
- OpenStreetMap Nominatim (geocoding, free)
- Google Maps API (geocoding fallback, optional)

### Architecture Layers

```
┌─────────────────────────────────────┐
│         Client Layer                │
│   (Web/Mobile - Not Implemented)    │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│         API Gateway Layer           │
│      Express.js (Port 5000)         │
│   - CORS middleware                 │
│   - JSON body parsing               │
│   - Error handling                  │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│      Authentication Layer           │
│   - JWT verification                │
│   - Role-based access control       │
│   - Ownership validation            │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│        Service Layer                │
│   - authService                     │
│   - businessService                 │
│   - productService                  │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│         Data Layer                  │
│   - PostgreSQL (primary data)       │
│   - PostGIS (geospatial queries)    │
│   - Redis (caching)                 │
└─────────────────────────────────────┘
```

### Core Design Principles

**1. Service Isolation**
Each service module handles a specific domain (auth, business, products) with clear boundaries and responsibilities.

**2. Stateless Authentication**
JWT tokens enable stateless authentication. Access tokens expire in 15 minutes, refresh tokens in 7 days.

**3. Geospatial-First**
PostGIS extension enables efficient location-based queries using native geographic types and spatial indexes.

**4. Validation at Entry**
Joi schemas validate all incoming data before processing, ensuring data integrity.

**5. Caching Strategy**
Redis caches frequently accessed data (product searches) with appropriate TTLs to reduce database load.

**6. Error Consistency**
All errors follow a standardized format with status codes, error codes, and timestamps.

### Request Flow

**Authenticated Request:**
1. Client sends request with `Authorization: Bearer <token>` header
2. `authenticate` middleware verifies JWT token
3. User object attached to `req.user`
4. RBAC middleware checks user role/permissions
5. Route handler calls service function
6. Service validates input with Joi
7. Service executes business logic and database queries
8. Response returned to client

**Public Request:**
1. Client sends request (no auth header)
2. Route handler calls service function directly
3. Service validates input and executes logic
4. Response returned to client

### Database Connection Management

- Connection pool managed by `pg` library
- Pool configuration in `backend/src/config/database.js`
- Transactions used for multi-step operations (user registration with business creation)
- Clients acquired from pool and released in finally blocks

### Current Implementation Status

**✅ Completed (Backend Core):**
- **Database**: Complete schema with PostGIS extension, spatial indexes, and triggers
- **Authentication**: User registration (SME/consumer), login, JWT token refresh
- **JWT Tokens**: Access tokens (15min), refresh tokens (7d), verification middleware
- **Business Management**: CRUD operations, automatic geocoding, location updates
- **Product Management**: CRUD operations, inventory tracking, category management
- **Product Search**: Keyword search, category/price filters, geolocation-based sorting
- **Geolocation Service**: Nearby business search, distance calculations, map bounds queries
- **Caching**: Redis integration with TTLs (5min for searches, 24hr for geocoding)
- **Authorization**: Role-based access control (SME vs consumer), ownership validation
- **Validation**: Joi schemas for all inputs, coordinate validation, address validation
- **Error Handling**: Standardized error format, typed exceptions, proper HTTP status codes
- **Transactions**: Database transactions for multi-step operations

**⏳ Not Implemented:**
- Order management and workflow (pending, confirmed, delivered states)
- Payment processing integration (Stripe, M-Pesa, PayPal)
- Delivery service integration (Uber API, Pick Up Mtaani API)
- Bidirectional rating system (consumer→SME and SME→consumer)
- Real-time messaging (WebSocket server, conversation threads)
- Multi-channel notifications (email, SMS, push, in-app)
- Business analytics and reporting (metrics, trends, exports)
- File upload service (images for products and businesses)
- Frontend web application (only skeleton structure exists)
- Business verification workflow (document upload and review)
- Staff account management (role-based permissions for business staff)
- Promotions and discounts (coupon codes, usage tracking)
- Favorites/wishlist functionality (save businesses and products)

### API Versioning

All endpoints prefixed with `/api/v1/` to support future versioning without breaking existing clients.

### Security Measures

- Passwords hashed with bcrypt (10 salt rounds)
- JWT secrets stored in environment variables
- SQL injection prevented by parameterized queries
- CORS enabled for cross-origin requests
- Input validation on all endpoints
- Role-based access control enforced
- Ownership checks for resource modifications
