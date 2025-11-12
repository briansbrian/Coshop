# Architecture Overview

## System Architecture

CoShop is a marketplace platform built with a service-oriented architecture that connects SMEs with consumers through geolocation-based discovery, product management, and order processing.

### Technology Stack

**Frontend:**
- React 18.2.0 with Vite 5.0.8 (fast build tool)
- React Router DOM 6.20.0 (client-side routing)
- Zustand 4.4.7 (state management)
- Axios 1.6.2 (HTTP client with interceptors)
- Leaflet 1.9.4 + React-Leaflet 4.2.1 (interactive maps)
- Tailwind CSS 3.3.6 (utility-first styling)

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
- `multer` - File upload handling

**External Services:**
- OpenStreetMap Nominatim (geocoding, free)
- Google Maps API (geocoding fallback, optional)

### Architecture Layers

```
┌─────────────────────────────────────┐
│         Client Layer                │
│   React SPA (Vite + React Router)  │
│   - Zustand State Management        │
│   - Axios API Client                │
│   - Leaflet Maps                    │
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
│   - geolocationService              │
│   - orderService                    │
│   - ratingService                   │
│   - notificationService             │
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

**✅ Completed (Backend - 8 Services, 30 Endpoints):**
- **Database**: Complete schema with PostGIS extension, spatial indexes, triggers, and generated columns
- **Authentication Service**: User registration (SME/consumer), login, JWT token refresh with proper expiration
- **JWT Tokens**: Access tokens (15min), refresh tokens (7d), verification middleware, role-based access
- **Business Management Service**: Full CRUD operations, automatic geocoding via OpenStreetMap/Google Maps, location updates
- **Product Management Service**: Full CRUD operations, inventory tracking, category management (15 categories)
- **Product Search**: Advanced search with keyword, category, price filters, geolocation-based sorting, pagination
- **Geolocation Service**: Nearby business search (radius-based), distance calculations, map bounds queries
- **Order Management Service**: Order creation with inventory validation, status workflow (6 states), multi-SME cart splitting, automatic inventory deduction
- **Rating Service**: Bidirectional ratings (consumer→SME and SME→consumer), trust score calculation, aggregate ratings, duplicate prevention
- **Notification Service**: In-app notifications with database storage, notification history, read/unread tracking, automatic triggers
- **Caching**: Redis integration with intelligent TTLs (5min for searches, 24hr for geocoding, 1hr for geolocation)
- **Authorization**: Role-based access control (SME vs consumer), ownership validation for all modifications
- **Validation**: Joi schemas for all inputs, coordinate validation, address validation, status transition validation
- **Error Handling**: Standardized error format with codes, typed exceptions, proper HTTP status codes
- **Transactions**: Database transactions for multi-step operations (user+business registration, order creation with inventory updates)
- **PostGIS Queries**: Spatial indexes, ST_DWithin for radius search, ST_Distance for calculations, ST_MakeEnvelope for bounds

**✅ Completed (Frontend - React Application):**
- **React Application**: Vite build system, React Router, Zustand state management
- **Authentication UI**: Login, registration, protected routes, role-based access
- **Map Interface**: Leaflet integration, business markers, filters, user location
- **Product Discovery**: Search page, filters, sorting, pagination, product details
- **Business Profiles**: Business information, product listings, ratings display
- **Shopping Flow**: Cart management, checkout, order confirmation
- **Order Management**: Consumer order history, SME order processing, status updates
- **Rating System**: Consumer-to-SME and SME-to-consumer rating modals
- **Notification Center**: Dropdown with unread count, notification history
- **SME Dashboard**: Profile management, product inventory, order processing
- **Mobile Responsive**: Tailwind CSS, responsive layouts, touch-friendly UI
- **File Upload**: Image upload for products and businesses

**⏳ Not Implemented:**
- Payment processing integration (Stripe, M-Pesa, PayPal)
- Delivery service integration (Uber API, Pick Up Mtaani API)
- Real-time messaging (WebSocket server, conversation threads, read receipts)
- Multi-channel notifications (email, SMS, push notifications - only in-app implemented)
- Business analytics and reporting (metrics, trends, CSV exports)
- Business verification workflow (document upload, admin review, verified badge)
- Staff account management (role-based permissions for business staff)
- Promotions and discounts (coupon codes, usage tracking, validity periods)
- Favorites/wishlist functionality (save businesses and products)
- Admin moderation system (content flagging, reports, audit logs)

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
