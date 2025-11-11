# Architecture Overview

## System Purpose

CoShop is a marketplace platform designed to empower Small and Medium-sized Enterprises (SMEs) by providing an integrated online presence. The platform connects SMEs with consumers through business registration, inventory management, and geolocation-based discovery.

## Core Value Proposition

Unlike traditional e-commerce platforms that cater to large enterprises, CoShop focuses on helping SMEs compete effectively in the digital marketplace while maintaining their unique identity and local presence.

## High-Level Architecture

The platform follows a **service-oriented architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                            │
│  (Web Application - React, Mobile-Responsive)                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   API Gateway / Router                       │
│  (Express.js - RESTful API with JWT Authentication)          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Auth Service │  │ SME Service  │  │Product Service│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │Order Service │  │ Geo Service  │  │Rating Service│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Msg Service  │  │Notif Service │  │Analytics Svc │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     Data Layer                               │
│  ┌──────────────────────┐  ┌──────────────────────┐         │
│  │ PostgreSQL + PostGIS │  │   Redis Cache        │         │
│  │  (Primary Database)  │  │  (Session/Cache)     │         │
│  └──────────────────────┘  └──────────────────────┘         │
│  ┌──────────────────────┐  ┌──────────────────────┐         │
│  │  File Storage (S3)   │  │  Elasticsearch       │         │
│  │  (Images/Documents)  │  │  (Product Search)    │         │
│  └──────────────────────┘  └──────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                 External Integrations                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Payment    │  │   Delivery   │  │     Maps     │      │
│  │ (Stripe/etc) │  │ (Uber/etc)   │  │(OSM/Google)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Backend
- **Runtime:** Node.js (ES6+ modules)
- **Framework:** Express.js
- **API Design:** RESTful with versioning (`/api/v1/`)
- **Authentication:** JWT (access + refresh tokens)
- **Validation:** Joi schema validation
- **Password Security:** bcrypt hashing

### Database & Storage
- **Primary Database:** PostgreSQL 14+
- **Geospatial Extension:** PostGIS (for location-based queries)
- **Caching:** Redis (planned for performance optimization)
- **Search Engine:** Elasticsearch (planned for product search)
- **File Storage:** Local filesystem (MVP), AWS S3 (production)

### Frontend (Planned)
- **Framework:** React.js with Vite
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **HTTP Client:** Axios
- **Mapping:** Leaflet or Google Maps JavaScript API
- **Real-time:** WebSocket for messaging

### External Services
- **Geocoding:** OpenStreetMap Nominatim (primary), Google Maps API (fallback)
- **Payment:** Stripe, PayPal, M-Pesa (planned)
- **Delivery:** Uber API, Pick Up Mtaani API (planned)

## Design Principles

### 1. Service Isolation
Each service is responsible for a specific domain:
- **Authentication Service:** User management and security
- **Business Service:** SME profile and verification
- **Product Service:** Inventory and catalog management
- **Order Service:** Transaction processing
- **Geolocation Service:** Spatial queries and discovery

### 2. Data Integrity
- Foreign key constraints ensure referential integrity
- Transactions (BEGIN/COMMIT/ROLLBACK) for multi-step operations
- Cascading deletes for dependent records
- Generated columns for computed fields (e.g., `in_stock`)

### 3. Security First
- Password hashing with bcrypt (10 salt rounds)
- JWT tokens with short expiration (15 minutes access, 7 days refresh)
- Role-based access control (RBAC) middleware
- Input validation on all endpoints
- SQL injection prevention through parameterized queries

### 4. Performance Optimization
- Database indexes on frequently queried fields
- Spatial indexes (GIST) for geolocation queries
- Redis caching for expensive operations (planned)
- Pagination for large result sets (planned)
- CDN for static assets (planned)

### 5. Error Handling
- Consistent error response format across all endpoints
- Typed error objects with status codes
- Graceful degradation for external service failures
- Detailed error logging for debugging

### 6. Scalability Considerations
- Stateless API design (JWT tokens, no server sessions)
- Horizontal scaling capability for application servers
- Database read replicas for query distribution (planned)
- Message queue for async operations (planned)
- Microservices-ready architecture

## API Design Patterns

### Versioning
All API endpoints are versioned: `/api/v1/resource`

### Authentication
Protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <access_token>
```

### Request/Response Format
- **Request:** JSON body with validated schemas
- **Response:** Consistent JSON structure with data/error objects
- **Timestamps:** ISO 8601 format

### Error Responses
Standardized error format:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": "Additional context (optional)",
    "timestamp": "2025-11-12T10:30:00.000Z"
  }
}
```

## Data Flow Patterns

### User Registration Flow
1. Client sends registration data to `/api/v1/auth/register`
2. Auth service validates input with Joi schema
3. Service checks for existing user (email uniqueness)
4. Password is hashed with bcrypt
5. User record created in database transaction
6. If SME, business profile created in same transaction
7. JWT tokens generated and returned to client

### Business Location Update Flow
1. Client sends address update to `/api/v1/businesses/:id`
2. Business service validates ownership and input
3. Geocoding utility converts address to coordinates
4. PostGIS POINT geometry created from coordinates
5. Database updated with new location and address
6. Spatial index automatically updated
7. Updated business profile returned to client

### Order Creation Flow (Planned)
1. Consumer submits cart items
2. Order service validates product availability
3. Inventory quantities checked and reserved
4. Separate orders created per SME
5. Payment processing initiated
6. On success, inventory decremented
7. Notifications sent to SMEs and consumer

## Deployment Architecture (Planned)

### Development Environment
- Local PostgreSQL with PostGIS
- Local Redis instance
- Environment variables in `.env` file
- Hot reload for rapid development

### Production Environment
- Load-balanced application servers
- PostgreSQL cluster with read replicas
- Redis cluster for high availability
- CDN for static assets
- Monitoring and logging (Sentry, ELK stack)
- Automated backups and disaster recovery

## Security Considerations

### Authentication Security
- JWT secrets stored in environment variables
- Refresh tokens for long-lived sessions
- Token expiration enforced
- Password complexity requirements (min 8 characters)

### Data Security
- Passwords never stored in plain text
- Sensitive data encrypted at rest (planned)
- HTTPS enforced in production
- SQL injection prevention via parameterized queries
- XSS protection through input sanitization

### Access Control
- Role-based permissions (SME, consumer, admin)
- Resource ownership validation
- API rate limiting (planned)
- CORS configuration for allowed origins

## Performance Targets

- **API Response Time:** < 200ms (95th percentile)
- **Map Loading:** < 2 seconds (1000+ businesses)
- **Search Results:** < 500ms
- **Mobile Page Load:** < 3 seconds (4G network)
- **Database Query Time:** < 50ms (indexed queries)
- **Concurrent Users:** 10,000+ simultaneous connections

## Monitoring and Observability (Planned)

- Application performance monitoring (APM)
- Error tracking and alerting
- Database query performance analysis
- API endpoint metrics
- User behavior analytics
- Infrastructure health monitoring
