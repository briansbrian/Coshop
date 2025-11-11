# Implementation Plan

- [x] 1. Set up project structure and development environment
  - Create project directory structure (frontend, backend, database)
  - Initialize Node.js backend with Express and package manager
  - Set up React frontend with Vite build tools
  - Configure environment variables for development
  - Set up Git repository with .gitignore
  - _Requirements: All requirements depend on proper project setup_

- [x] 2. Implement database schema and migrations
  - [x] 2.1 Create PostgreSQL database with PostGIS extension
    - Write database initialization script
    - Configure PostGIS for geospatial queries
    - _Requirements: 1.3, 3.1, 3.2, 5.4_
  
  - [x] 2.2 Implement users and authentication tables
    - Create users table with email, password_hash, user_type fields
    - Add indexes for email lookups
    - _Requirements: 1.1, 1.2_
  
  - [x] 2.3 Implement businesses table with geospatial support
    - Create businesses table with location as GEOGRAPHY(POINT)
    - Add GIST index for location-based queries
    - Create indexes for verified status
    - _Requirements: 1.3, 3.2, 5.1, 5.2, 5.4_
  
  - [x] 2.4 Implement products and inventory tables
    - Create products table with business_id foreign key
    - Add generated column for in_stock status
    - Create indexes for business_id, category, in_stock
    - _Requirements: 2.1, 2.3, 2.4_
  
  - [x] 2.5 Implement orders and order_items tables
    - Create orders table with consumer_id and business_id
    - Create order_items table with order_id and product_id
    - Add indexes for order lookups
    - _Requirements: 7.1, 7.3, 8.1, 8.2_
  
  - [x] 2.6 Implement ratings table for bidirectional reviews
    - Create ratings table with rating_type field
    - Add support for consumer-to-SME and SME-to-consumer ratings
    - Store criteria as JSONB
    - _Requirements: 11.1, 11.2, 11A.1, 11A.2_
  
  - [x] 2.7 Implement messages and notifications tables
    - Create messages table for user conversations
    - Create notifications table with type and priority fields
    - Add indexes for efficient queries
    - _Requirements: 17.1, 17.3, 20.1_

- [x] 3. Build authentication service





  - [x] 3.1 Create authentication service module


    - Implement user registration logic with email/password validation using Joi
    - Hash passwords using bcrypt
    - Create database queries for user creation
    - Support both SME and consumer registration
    - _Requirements: 1.1, 1.2_
  
  - [x] 3.2 Implement JWT token utilities


    - Create utility functions for JWT token generation
    - Implement access and refresh token generation
    - Set appropriate token expiration times (15min access, 7d refresh)
    - Create token verification utility
    - _Requirements: 1.1_
  

  - [x] 3.3 Create authentication API routes

    - Implement POST /api/v1/auth/register endpoint
    - Implement POST /api/v1/auth/login endpoint with credential validation
    - Implement POST /api/v1/auth/refresh endpoint for token refresh
    - Return user data and tokens on successful authentication
    - _Requirements: 1.1, 1.2_
  
  - [x] 3.4 Implement authentication middleware


    - Create middleware to verify JWT tokens from Authorization header
    - Extract and attach user information to request object
    - Handle expired and invalid tokens with proper error responses
    - _Requirements: All authenticated endpoints_
  
  - [x] 3.5 Implement role-based access control middleware


    - Create middleware to check user roles (sme, consumer)
    - Implement permission checks for SME vs consumer actions
    - Create reusable authorization middleware functions
    - _Requirements: 18.2, 18.3_
  
  - [ ]* 3.6 Implement password reset functionality
    - Create password reset request endpoint
    - Generate secure reset tokens
    - Send reset emails (can be added post-MVP)
    - _Requirements: 1.5_

- [ ] 4. Build SME management service
  - [ ] 4.1 Create business service module
    - Implement business registration logic with validation
    - Create database queries for business CRUD operations
    - Implement geocoding utility to convert addresses to coordinates
    - Store business location as PostGIS GEOGRAPHY(POINT)
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [ ] 4.2 Create business API routes
    - Implement POST /api/v1/businesses endpoint for registration
    - Implement GET /api/v1/businesses/:id endpoint for profile retrieval
    - Implement PUT /api/v1/businesses/:id endpoint for profile updates
    - Support updating address, contact info, operating hours, description
    - Validate geographic coordinates and business data
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [ ]* 4.3 Implement business verification system
    - Create POST /api/v1/businesses/:id/verification endpoint
    - Implement file upload handling for verification documents
    - Store documents in S3 or local storage with encryption
    - Create verification status tracking in database
    - _Requirements: 1.4, 12.1, 12.2_
  
  - [ ]* 4.4 Implement staff account management
    - Create endpoints to add/remove staff members
    - Implement role assignment (owner, manager, staff)
    - Create permission management system
    - Log all staff actions
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

- [ ] 5. Build product and inventory service
  - [ ] 5.1 Create product service module
    - Implement product CRUD operations with validation
    - Create database queries for product management
    - Implement image upload handling (S3 or local storage)
    - Support product categorization with predefined categories
    - _Requirements: 2.1, 2.5_
  
  - [ ] 5.2 Create product API routes
    - Implement POST /api/v1/products endpoint for product creation
    - Implement GET /api/v1/products/:id endpoint for product details
    - Implement PUT /api/v1/products/:id endpoint for updates
    - Implement DELETE /api/v1/products/:id endpoint
    - Implement PATCH /api/v1/products/:id/inventory for quantity updates
    - Restrict product management to business owners
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [ ] 5.3 Implement product search functionality
    - Create GET /api/v1/products/search endpoint
    - Implement database queries with filters (keyword, category, price range)
    - Support geolocation-based filtering with distance calculation
    - Implement sorting by price, distance, ratings
    - Cache search results in Redis for performance
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [ ] 5.4 Implement product listing by business
    - Create GET /api/v1/businesses/:id/products endpoint
    - Return all products for a specific business
    - Include inventory status and images
    - _Requirements: 6.2_

- [ ] 6. Build geolocation service
  - [ ] 6.1 Create geolocation service module
    - Implement PostGIS spatial queries for nearby businesses
    - Create distance calculation utility using ST_Distance
    - Implement radius-based business search
    - Cache location queries in Redis
    - _Requirements: 3.1, 3.2_
  
  - [ ] 6.2 Create geolocation API routes
    - Implement GET /api/v1/businesses/nearby endpoint
    - Accept latitude, longitude, and radius parameters
    - Return businesses with distance calculations
    - Support filtering by business type, verified status, ratings
    - _Requirements: 3.1, 3.2, 3.3, 3.5_
  
  - [ ] 6.3 Implement geocoding utilities
    - Integrate with Google Maps Geocoding API or OpenStreetMap Nominatim
    - Create utility function to convert addresses to coordinates
    - Implement reverse geocoding (coordinates to address)
    - Cache geocoding results in Redis to reduce API calls
    - _Requirements: 5.4_

- [ ] 7. Build order management service
  - [ ] 7.1 Create order service module
    - Implement order creation logic with validation
    - Create database queries for order and order_items
    - Implement inventory validation before order creation
    - Calculate order totals including multiple items
    - Support splitting cart into separate orders per SME
    - _Requirements: 8.1, 8.2_
  
  - [ ] 7.2 Create order API routes
    - Implement POST /api/v1/orders endpoint for order creation
    - Implement GET /api/v1/orders/:id endpoint for order details
    - Implement GET /api/v1/orders endpoint for order history (filtered by user)
    - Implement PATCH /api/v1/orders/:id/status for status updates
    - Restrict status updates to business owners
    - _Requirements: 7.2, 7.3, 7.4, 8.2, 9.4_
  
  - [ ] 7.3 Implement order status workflow
    - Create status transition validation logic
    - Update product inventory when order is confirmed
    - Trigger notifications on status changes
    - Support status: pending, confirmed, ready, out_for_delivery, delivered, cancelled
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 9.1, 9.2_

- [ ]* 8. Integrate payment processing
  - [ ]* 8.1 Create payment service module
    - Integrate Stripe SDK for payment processing
    - Implement payment intent creation
    - Handle payment confirmation and webhooks
    - Store payment records in database
    - Update order payment_status on successful payment
    - _Requirements: 10.1, 10.2_
  
  - [ ]* 8.2 Create payment API routes
    - Implement POST /api/v1/payments/create-intent endpoint
    - Implement POST /api/v1/payments/webhook endpoint for Stripe callbacks
    - Implement GET /api/v1/payments/history endpoint for transaction history
    - Secure webhook endpoint with signature verification
    - _Requirements: 10.1, 10.2, 10.3, 10.5_

- [ ]* 9. Integrate delivery services
  - [ ]* 9.1 Create delivery service integration module
    - Integrate with third-party delivery APIs (Uber, Pick Up Mtaani)
    - Implement delivery quote fetching
    - Create delivery booking functionality
    - Store delivery tracking information
    - _Requirements: 8.3, 8.4, 9.3_
  
  - [ ]* 9.2 Create delivery API routes
    - Implement GET /api/v1/delivery/options endpoint for available services
    - Implement POST /api/v1/delivery/book endpoint for booking delivery
    - Implement GET /api/v1/delivery/track/:id endpoint for tracking
    - _Requirements: 8.3, 8.4, 9.3, 9.5_

- [ ] 10. Build rating and review service
  - [ ] 10.1 Create rating service module
    - Implement rating creation logic with validation
    - Support consumer-to-SME and SME-to-consumer rating types
    - Store criteria as JSONB (quality, service, value for consumers; payment, communication, compliance for SMEs)
    - Prevent duplicate ratings for same order
    - Calculate average ratings and trust scores
    - _Requirements: 11.1, 11.2, 11A.1, 11A.2_
  
  - [ ] 10.2 Create rating API routes
    - Implement POST /api/v1/ratings endpoint for creating ratings
    - Implement GET /api/v1/businesses/:id/ratings endpoint for business ratings
    - Implement GET /api/v1/consumers/:id/trust-score endpoint for consumer trust score
    - Restrict rating creation to order participants
    - _Requirements: 11.1, 11.2, 11.3, 11A.1, 11A.2, 11A.3_
  
  - [ ] 10.3 Update business and user aggregates
    - Update business rating and total_ratings on new consumer rating
    - Recalculate consumer trust score on new SME rating
    - Display ratings on business profiles and product listings
    - _Requirements: 11.3, 11.4, 11A.4, 6.3_

- [ ]* 11. Build messaging service
  - [ ]* 11.1 Create messaging service module
    - Implement message creation and retrieval logic
    - Create database queries for conversation threads
    - Implement mark as read functionality
    - _Requirements: 17.1, 17.3_
  
  - [ ]* 11.2 Create messaging API routes
    - Implement POST /api/v1/messages endpoint for sending messages
    - Implement GET /api/v1/messages/conversations endpoint for conversation list
    - Implement GET /api/v1/messages/conversation/:userId endpoint for specific conversation
    - Implement PATCH /api/v1/messages/:id/read endpoint to mark as read
    - _Requirements: 17.1, 17.3_
  
  - [ ]* 11.3 Implement WebSocket server for real-time messaging
    - Set up WebSocket server using ws library
    - Handle WebSocket connections and authentication
    - Broadcast messages to connected users in real-time
    - Send message notifications within 30 seconds
    - _Requirements: 17.1, 17.2_

- [ ] 12. Build notification service
  - [ ] 12.1 Create notification service module
    - Implement notification creation logic
    - Create database queries for notifications
    - Implement notification type categorization (new_order, message, review, low_inventory, payment, delivery_update)
    - Support priority levels (low, medium, high)
    - _Requirements: 20.1_
  
  - [ ] 12.2 Create notification API routes
    - Implement GET /api/v1/notifications endpoint for notification history
    - Implement PATCH /api/v1/notifications/:id/read endpoint to mark as read
    - Implement GET /api/v1/notifications/unread/count endpoint
    - Filter notifications by user
    - _Requirements: 20.1, 20.5_
  
  - [ ]* 12.3 Implement multi-channel notification delivery
    - Integrate email service (SendGrid, AWS SES)
    - Implement notification templates
    - Support batching non-urgent notifications
    - Implement notification preferences management
    - _Requirements: 20.2, 20.3, 20.4_

- [ ]* 13. Build analytics service
  - [ ]* 13.1 Create analytics service module
    - Implement queries to aggregate order data
    - Calculate metrics: total orders, revenue, average order value, conversion rates
    - Query product views and top-performing products
    - Aggregate data by time periods (daily, weekly, monthly)
    - _Requirements: 14.1, 14.2_
  
  - [ ]* 13.2 Create analytics API routes
    - Implement GET /api/v1/analytics/business/:id endpoint for business metrics
    - Support time period filtering (start_date, end_date)
    - Return metrics including orders, revenue, top products, trends
    - Restrict access to business owners
    - _Requirements: 14.1, 14.2, 14.3, 14.4_
  
  - [ ]* 13.3 Implement data export functionality
    - Create GET /api/v1/analytics/business/:id/export endpoint
    - Generate CSV format data export
    - Include all business metrics and transaction history
    - _Requirements: 14.5_

- [ ]* 14. Build admin moderation system
  - [ ]* 14.1 Create moderation service module
    - Implement content flagging logic
    - Create database tables for reports and audit logs
    - Implement account suspension functionality
    - _Requirements: 13.1, 13.2, 13.3_
  
  - [ ]* 14.2 Create admin API routes
    - Implement POST /api/v1/admin/reports endpoint for content reporting
    - Implement GET /api/v1/admin/reports endpoint for flagged content review
    - Implement PATCH /api/v1/admin/users/:id/suspend endpoint
    - Implement GET /api/v1/admin/audit-log endpoint
    - Restrict access to admin users only
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ]* 15. Implement promotions and discounts
  - [ ]* 15.1 Create promotions database schema
    - Create promotions table with code, discount_type, discount_value, validity_period, usage_limit
    - Create promotion_usage table to track usage
    - _Requirements: 16.1, 16.2_
  
  - [ ]* 15.2 Create promotion service and API routes
    - Implement POST /api/v1/promotions endpoint for creating promotions
    - Implement GET /api/v1/promotions/validate/:code endpoint for validation
    - Implement discount calculation logic
    - Track promotion usage and enforce limits
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [ ]* 16. Implement favorites and wishlist
  - [ ]* 16.1 Create favorites database schema and service
    - Create favorites table with user_id, favorited_type (business/product), favorited_id
    - Implement favorites CRUD operations
    - _Requirements: 15.1, 15.2_
  
  - [ ]* 16.2 Create favorites API routes
    - Implement POST /api/v1/favorites endpoint to add favorites
    - Implement DELETE /api/v1/favorites/:id endpoint to remove favorites
    - Implement GET /api/v1/favorites endpoint to retrieve user favorites
    - Support filtering by type (business/product)
    - _Requirements: 15.1, 15.2, 15.5_

- [ ] 17. Build frontend web application
  - [ ] 17.1 Set up API client and state management
    - Create axios API client with base URL configuration
    - Implement request/response interceptors for JWT tokens
    - Set up Zustand stores for auth, cart, and notifications
    - Create API service modules for each backend service
    - _Requirements: All frontend requirements_
  
  - [ ] 17.2 Implement authentication UI
    - Create registration page with forms for SMEs and consumers
    - Create login page with email/password fields
    - Implement JWT token storage in localStorage
    - Create protected route wrapper component
    - Add logout functionality
    - _Requirements: 1.1, 1.2_
  
  - [ ] 17.3 Implement homepage and navigation
    - Create navigation bar with logo, search, and user menu
    - Create homepage with hero section and search bar
    - Implement responsive navigation for mobile
    - Add links to map, products, orders, messages
    - _Requirements: 4.1, 19.1_
  
  - [ ] 17.4 Implement interactive map page
    - Integrate Leaflet with React-Leaflet
    - Request user location permission
    - Display business markers on map with custom icons by type
    - Implement marker click to show business preview popup
    - Add map filters for business type, distance, ratings
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [ ] 17.5 Implement product search and browse
    - Create product search page with filters (category, price, location)
    - Display search results in grid layout with images and prices
    - Implement sorting by price, distance, ratings
    - Create product detail page with full information
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [ ] 17.6 Implement business profile pages
    - Create business profile page layout
    - Display business info, photos, operating hours, location
    - Show product listings from the business
    - Display ratings and reviews section
    - Add contact and directions buttons
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ] 17.7 Implement shopping cart and checkout
    - Create cart store with add/remove/update quantity actions
    - Create cart page showing items grouped by business
    - Implement basic checkout flow with delivery method selection
    - Show order confirmation page (payment integration optional for MVP)
    - _Requirements: 8.1, 8.2, 8.5_
  
  - [ ] 17.8 Implement order management for consumers
    - Create order history page for consumers
    - Display order cards with status and items
    - Show order details page with status tracking
    - Add rating prompt after order completion
    - _Requirements: 9.1, 9.4, 11.1_
  
  - [ ] 17.9 Implement SME dashboard
    - Create SME dashboard layout with sidebar navigation
    - Build business profile management page
    - Create product inventory management page (add/edit/delete products)
    - Implement order management page for SMEs
    - Show incoming orders with accept/reject actions
    - _Requirements: 2.1, 5.1, 7.2, 7.4_
  
  - [ ] 17.10 Implement rating and review UI
    - Create rating form modal for consumers (stars + review text)
    - Create rating form for SMEs to rate consumers
    - Display ratings list on business profiles
    - Show consumer trust score to SMEs
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11A.1, 11A.2_
  
  - [ ]* 17.11 Implement messaging interface
    - Create messaging page with conversation list sidebar
    - Build chat interface with message bubbles
    - Implement WebSocket connection for real-time messages
    - Show unread message indicators
    - _Requirements: 17.1, 17.2, 17.3_
  
  - [ ] 17.12 Implement notification center
    - Create notification dropdown in navigation bar
    - Display notification list with icons by type
    - Implement mark as read functionality
    - Show unread count badge
    - _Requirements: 20.1, 20.5_
  
  - [ ] 17.13 Implement mobile responsive design
    - Apply Tailwind responsive classes throughout
    - Test and optimize map navigation on mobile
    - Ensure touch-friendly buttons and forms
    - Optimize images with lazy loading
    - Test on various screen sizes
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

- [ ] 18. Implement file upload and storage
  - [ ] 18.1 Create file upload utility
    - Implement multer middleware for file uploads
    - Validate file types (images only) and sizes (max 5MB)
    - Generate unique filenames
    - _Requirements: 1.4, 2.1_
  
  - [ ] 18.2 Create file storage service
    - Implement local file storage for MVP
    - Create utility to save files to /uploads directory
    - Generate and return file URLs
    - Serve static files from Express
    - _Requirements: 1.4, 2.1, 5.3_
  
  - [ ] 18.3 Create file upload API route
    - Implement POST /api/v1/upload endpoint
    - Accept single or multiple file uploads
    - Return file URLs in response
    - Restrict access to authenticated users
    - _Requirements: 1.4, 2.1_

- [ ]* 19. Implement caching with Redis
  - [ ]* 19.1 Create Redis cache utility
    - Implement cache get/set/delete functions
    - Set appropriate TTL for different data types
    - Handle Redis connection errors gracefully
    - _Requirements: Performance optimization for 2.2, 4.2, 5.2_
  
  - [ ]* 19.2 Implement caching in services
    - Cache business location queries (TTL: 1 hour)
    - Cache product search results (TTL: 5 minutes)
    - Cache geocoding results (TTL: 24 hours)
    - Implement cache invalidation on data updates
    - _Requirements: Performance optimization for 2.2, 4.2, 5.2_

- [ ] 20. Implement error handling and logging
  - [ ] 20.1 Create error handling utilities
    - Create custom error classes (ValidationError, AuthError, NotFoundError)
    - Implement standardized error response format
    - Create error handling middleware
    - _Requirements: All requirements need proper error handling_
  
  - [ ] 20.2 Implement logging system
    - Set up console logging for development
    - Log all API requests with method, path, status code
    - Log errors with stack traces
    - Optionally integrate Sentry for production error tracking
    - _Requirements: All requirements need proper error handling_

- [ ]* 21. Write integration tests
  - [ ]* 21.1 Test authentication flow
    - Test user registration endpoint
    - Test login with valid/invalid credentials
    - Test JWT token generation and verification
    - _Requirements: 1.1, 1.2_
  
  - [ ]* 21.2 Test business and product management
    - Test business registration and profile updates
    - Test product CRUD operations
    - Test inventory updates
    - _Requirements: 1.1, 2.1, 2.3, 5.1_
  
  - [ ]* 21.3 Test order flow
    - Test order creation with multiple items
    - Test order status updates
    - Test inventory deduction on order confirmation
    - _Requirements: 7.3, 8.1, 8.2_
  
  - [ ]* 21.4 Test geolocation and search
    - Test nearby business queries with PostGIS
    - Test product search with filters
    - Test distance calculations
    - _Requirements: 3.1, 3.2, 4.1, 4.2_
  
  - [ ]* 21.5 Test rating system
    - Test consumer-to-SME ratings
    - Test SME-to-consumer ratings
    - Test rating aggregation and trust score calculation
    - _Requirements: 11.1, 11.2, 11A.1, 11A.2_
