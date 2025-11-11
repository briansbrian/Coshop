# Implementation Plan

- [x] 1. Set up project structure and development environment





  - Create project directory structure (frontend, backend, database)
  - Initialize Node.js/Python backend with package manager
  - Set up React/Vue frontend with build tools
  - Configure environment variables for development
  - Set up Git repository with .gitignore
  - _Requirements: All requirements depend on proper project setup_

- [ ] 2. Implement database schema and migrations
  - [ ] 2.1 Create PostgreSQL database with PostGIS extension
    - Write database initialization script
    - Configure PostGIS for geospatial queries
    - _Requirements: 1.3, 3.1, 3.2, 5.4_
  
  - [ ] 2.2 Implement users and authentication tables
    - Create users table with email, password_hash, user_type fields
    - Add indexes for email lookups
    - _Requirements: 1.1, 1.2_
  
  - [ ] 2.3 Implement businesses table with geospatial support
    - Create businesses table with location as GEOGRAPHY(POINT)
    - Add GIST index for location-based queries
    - Create indexes for verified status
    - _Requirements: 1.3, 3.2, 5.1, 5.2, 5.4_
  
  - [ ] 2.4 Implement products and inventory tables
    - Create products table with business_id foreign key
    - Add generated column for in_stock status
    - Create indexes for business_id, category, in_stock
    - _Requirements: 2.1, 2.3, 2.4_
  
  - [ ] 2.5 Implement orders and order_items tables
    - Create orders table with consumer_id and business_id
    - Create order_items table with order_id and product_id
    - Add indexes for order lookups
    - _Requirements: 7.1, 7.3, 8.1, 8.2_
  
  - [ ] 2.6 Implement ratings table for bidirectional reviews
    - Create ratings table with rating_type field
    - Add support for consumer-to-SME and SME-to-consumer ratings
    - Store criteria as JSONB
    - _Requirements: 11.1, 11.2, 11A.1, 11A.2_
  
  - [ ] 2.7 Implement messages and notifications tables
    - Create messages table for user conversations
    - Create notifications table with type and priority fields
    - Add indexes for efficient queries
    - _Requirements: 17.1, 17.3, 20.1_

- [ ] 3. Build authentication service
  - [ ] 3.1 Implement user registration endpoint
    - Create registration API with email/password validation
    - Hash passwords using bcrypt
    - Support both SME and consumer registration
    - _Requirements: 1.1, 1.2_
  
  - [ ] 3.2 Implement login and JWT token generation
    - Create login endpoint with credential validation
    - Generate JWT access and refresh tokens
    - Set appropriate token expiration times
    - _Requirements: 1.1_
  
  - [ ] 3.3 Implement token verification middleware
    - Create middleware to verify JWT tokens
    - Extract user information from tokens
    - Handle expired tokens
    - _Requirements: All authenticated endpoints_
  
  - [ ] 3.4 Implement password reset functionality
    - Create password reset request endpoint
    - Generate secure reset tokens
    - Send reset emails
    - _Requirements: 1.5_
  
  - [ ] 3.5 Implement role-based access control (RBAC)
    - Create middleware to check user roles
    - Implement permission checks for SME vs consumer actions
    - Support staff account permissions
    - _Requirements: 18.2, 18.3_

- [ ] 4. Build SME management service
  - [ ] 4.1 Implement business registration endpoint
    - Create API to register new businesses
    - Validate business information
    - Store business location as geographic point
    - Send confirmation email
    - _Requirements: 1.1, 1.2, 1.3, 1.5_
  
  - [ ] 4.2 Implement business profile management
    - Create endpoints to update business details
    - Support updating address, contact info, operating hours
    - Validate geographic coordinates
    - Update map coordinates within 10 seconds
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [ ] 4.3 Implement business verification workflow
    - Create endpoint to submit verification documents
    - Store documents securely with encryption
    - Create admin review interface
    - Send verification status notifications
    - Display verified badge on profiles
    - _Requirements: 1.4, 12.1, 12.2, 12.3, 12.4_
  
  - [ ] 4.4 Implement staff account management
    - Create endpoints to add/remove staff members
    - Implement role assignment (owner, manager, staff)
    - Create permission management system
    - Log all staff actions
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

- [ ] 5. Build product and inventory service
  - [ ] 5.1 Implement product creation and management
    - Create endpoints to add/update/delete products
    - Support product images upload to S3
    - Validate product data
    - Support product categorization
    - _Requirements: 2.1, 2.5_
  
  - [ ] 5.2 Implement inventory tracking
    - Create endpoint to update product quantities
    - Automatically mark products out of stock when quantity is zero
    - Update inventory within 5 seconds
    - Trigger low inventory notifications
    - _Requirements: 2.2, 2.3, 2.4, 20.1_
  
  - [ ] 5.3 Implement product search with Elasticsearch
    - Set up Elasticsearch index for products
    - Index products with business location data
    - Create search endpoint with keyword, category, price filters
    - Return results within 2 seconds
    - _Requirements: 4.1, 4.2_
  
  - [ ] 5.4 Implement product search results display
    - Format search results with images, prices, SME names, locations
    - Support sorting by price, distance, ratings
    - Display detailed product information
    - _Requirements: 4.3, 4.4, 4.5_

- [ ] 6. Build geolocation service
  - [ ] 6.1 Implement map-based business discovery
    - Create endpoint to find businesses within radius
    - Use PostGIS spatial queries for distance calculations
    - Request user location permission
    - Display all SMEs on interactive map
    - _Requirements: 3.1, 3.2_
  
  - [ ] 6.2 Implement business markers and filtering
    - Display business type indicators on map markers
    - Create preview popup with business info and products
    - Implement filters for business type, distance, ratings, categories
    - _Requirements: 3.3, 3.4, 3.5_
  
  - [ ] 6.3 Implement geocoding utilities
    - Integrate with Google Maps or OpenStreetMap API
    - Create address to coordinates conversion
    - Validate geographic locations
    - Cache geocoding results in Redis
    - _Requirements: 5.4_
  
  - [ ] 6.4 Implement directions and distance calculations
    - Calculate distances between consumer and SME locations
    - Provide directions to physical locations
    - _Requirements: 6.4_

- [ ] 7. Build order management service
  - [ ] 7.1 Implement shopping cart functionality
    - Create endpoints to add/remove items from cart
    - Support multiple SMEs in single cart
    - Calculate totals per SME
    - _Requirements: 8.1_
  
  - [ ] 7.2 Implement order creation and checkout
    - Create separate orders for each SME
    - Validate product availability
    - Calculate order totals
    - Support pickup or delivery selection
    - _Requirements: 8.2, 8.5_
  
  - [ ] 7.3 Implement order status management
    - Create endpoints to update order status
    - Support status transitions (pending → confirmed → ready → delivered)
    - Update inventory when order is accepted
    - Send status change notifications
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 9.1, 9.2_
  
  - [ ] 7.4 Implement order history and tracking
    - Create endpoints to retrieve consumer order history
    - Create endpoints to retrieve SME order history
    - Display order details and status
    - _Requirements: 9.4_

- [ ] 8. Integrate payment gateways
  - [ ] 8.1 Implement payment gateway integration
    - Integrate Stripe/PayPal/M-Pesa APIs
    - Create payment processing endpoint
    - Encrypt payment data
    - Handle payment success/failure callbacks
    - _Requirements: 10.1, 10.2_
  
  - [ ] 8.2 Implement payment receipts and transaction history
    - Generate payment receipts for consumers and SMEs
    - Store transaction records
    - Display transaction history for SMEs
    - Calculate and deduct platform fees
    - Transfer funds to SME accounts
    - _Requirements: 10.3, 10.4, 10.5_

- [ ] 9. Integrate delivery services
  - [ ] 9.1 Implement delivery service integration
    - Integrate Uber API and Pick Up Mtaani API
    - Create endpoint to fetch available delivery options
    - Display delivery costs and estimated times
    - _Requirements: 8.3, 8.4_
  
  - [ ] 9.2 Implement delivery tracking
    - Arrange delivery through selected service
    - Retrieve tracking information from delivery APIs
    - Display tracking updates to consumers
    - Show estimated delivery times
    - _Requirements: 9.3, 9.5_

- [ ] 10. Build rating and review service
  - [ ] 10.1 Implement consumer-to-SME ratings
    - Create endpoint for consumers to rate SMEs and products
    - Support 1-5 star ratings with written reviews
    - Store criteria ratings (quality, service, value)
    - Prevent duplicate ratings for same order
    - Prompt consumers after order completion
    - _Requirements: 11.1, 11.2, 11.5_
  
  - [ ] 10.2 Implement SME-to-consumer ratings (trust score)
    - Create endpoint for SMEs to rate consumers
    - Support compliance scoring (payment, communication, compliance)
    - Calculate overall consumer trust score
    - Display trust score to SMEs during order processing
    - _Requirements: 11A.1, 11A.2, 11A.3, 11A.4, 11A.5_
  
  - [ ] 10.3 Implement rating display and aggregation
    - Calculate and display average ratings
    - Show rating counts on profiles and products
    - Allow SMEs to respond to reviews
    - Display ratings on business profiles
    - _Requirements: 11.3, 11.4, 6.3_

- [ ] 11. Build messaging service
  - [ ] 11.1 Implement real-time messaging with WebSocket
    - Set up WebSocket server for real-time communication
    - Create messaging interface for consumers and SMEs
    - Send notifications within 30 seconds
    - _Requirements: 17.1, 17.2_
  
  - [ ] 11.2 Implement message history and conversation threads
    - Store messages in database
    - Create endpoint to retrieve conversation history
    - Mark messages as read
    - Display message threads
    - _Requirements: 17.3_
  
  - [ ] 11.3 Implement automated responses
    - Create interface for SMEs to set auto-responses
    - Trigger auto-responses for common questions
    - Display SME response time and availability
    - _Requirements: 17.4, 17.5_

- [ ] 12. Build notification service
  - [ ] 12.1 Implement multi-channel notification system
    - Create notification service supporting email, SMS, push, in-app
    - Implement notification templates
    - Send notifications for orders, messages, reviews, inventory
    - _Requirements: 20.1_
  
  - [ ] 12.2 Implement notification preferences
    - Create endpoint to manage notification preferences
    - Allow users to configure channels per notification type
    - Prioritize urgent notifications
    - Batch non-urgent notifications
    - _Requirements: 20.2, 20.3, 20.4_
  
  - [ ] 12.3 Implement notification history
    - Store notifications in database
    - Create endpoint to retrieve notification history
    - Mark notifications as read
    - _Requirements: 20.5_

- [ ] 13. Build analytics service
  - [ ] 13.1 Implement business metrics tracking
    - Track product views, orders, revenue, ratings
    - Calculate conversion rates and average order values
    - Store metrics with timestamps
    - _Requirements: 14.1_
  
  - [ ] 13.2 Implement analytics dashboard
    - Create endpoints to retrieve metrics by time period
    - Display daily, weekly, monthly trends
    - Show top-performing products
    - Provide customer demographics
    - Identify peak ordering times
    - _Requirements: 14.2, 14.3, 14.4_
  
  - [ ] 13.3 Implement data export functionality
    - Create endpoint to export analytics data
    - Support CSV format
    - _Requirements: 14.5_

- [ ] 14. Build admin moderation system
  - [ ] 14.1 Implement content flagging system
    - Create automated flagging for suspicious content
    - Implement consumer reporting mechanism
    - Notify administrators within 5 minutes
    - _Requirements: 13.1, 13.3, 13.4_
  
  - [ ] 14.2 Implement admin moderation interface
    - Create admin dashboard to review flagged content
    - Implement account suspension/removal functionality
    - Maintain audit log of admin actions
    - _Requirements: 13.2, 13.5_

- [ ] 15. Implement promotions and discounts
  - [ ] 15.1 Create promotion management system
    - Create endpoints to create/update/delete discount codes
    - Support percentage and fixed amount discounts
    - Set validity periods and usage limits
    - _Requirements: 16.1, 16.2_
  
  - [ ] 15.2 Implement discount application
    - Validate discount codes during checkout
    - Calculate and display reduced prices
    - Track promotion usage
    - Display active promotions on listings
    - _Requirements: 16.3, 16.4, 16.5_

- [ ] 16. Implement favorites and wishlist
  - [ ] 16.1 Create favorites management
    - Create endpoints to add/remove favorites
    - Support favoriting SMEs and products
    - Create dedicated favorites page
    - Allow custom list organization
    - _Requirements: 15.1, 15.2, 15.5_
  
  - [ ] 16.2 Implement favorite notifications
    - Notify when favorited product price changes
    - Notify when favorited SME adds new products
    - _Requirements: 15.3, 15.4_

- [ ] 17. Build frontend web application
  - [ ] 17.1 Set up React/Vue project with routing
    - Initialize frontend framework
    - Configure routing for all pages
    - Set up state management (Redux/Vuex)
    - Configure API client with authentication
    - _Requirements: All frontend requirements_
  
  - [ ] 17.2 Implement authentication UI
    - Create registration forms for SMEs and consumers
    - Create login page
    - Implement password reset flow
    - Handle JWT token storage
    - _Requirements: 1.1, 1.2_
  
  - [ ] 17.3 Implement SME dashboard
    - Create business profile management interface
    - Build product inventory management UI
    - Create order management interface
    - Display analytics dashboard
    - _Requirements: 2.1, 5.1, 7.4, 14.2_
  
  - [ ] 17.4 Implement consumer shopping interface
    - Create homepage with search bar
    - Build product search results page
    - Implement shopping cart UI
    - Create checkout flow
    - _Requirements: 4.1, 4.3, 8.1, 8.2_
  
  - [ ] 17.5 Implement interactive map with Leaflet/Google Maps
    - Integrate mapping library
    - Display SME markers with business type icons
    - Implement map filters
    - Create business preview popups
    - Request location permission
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [ ] 17.6 Implement business profile pages
    - Display business information and photos
    - Show product listings with inventory status
    - Display ratings and reviews
    - Show directions and contact info
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ] 17.7 Implement order tracking interface
    - Create order history page
    - Display order status with progress indicators
    - Show delivery tracking information
    - _Requirements: 9.1, 9.4_
  
  - [ ] 17.8 Implement rating and review UI
    - Create rating forms for consumers
    - Create rating forms for SMEs
    - Display ratings on profiles and products
    - Allow SMEs to respond to reviews
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11A.1, 11A.2_
  
  - [ ] 17.9 Implement messaging interface
    - Create chat UI with conversation list
    - Implement real-time message updates with WebSocket
    - Show message history
    - Display SME availability status
    - _Requirements: 17.1, 17.2, 17.3, 17.5_
  
  - [ ] 17.10 Implement notification center
    - Create notification dropdown/panel
    - Display notification history
    - Mark notifications as read
    - Show notification badges
    - _Requirements: 20.1, 20.5_
  
  - [ ] 17.11 Implement mobile responsive design
    - Apply responsive CSS for mobile screens
    - Optimize touch gestures for map navigation
    - Ensure all features work on mobile
    - Optimize images for mobile data
    - Test page load times on mobile networks
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

- [ ] 18. Implement caching with Redis
  - Create Redis connection and configuration
  - Cache frequently accessed data (business locations, product searches)
  - Implement cache invalidation strategies
  - Cache geocoding results
  - _Requirements: Performance optimization for 2.2, 4.2, 5.2_

- [ ] 19. Set up file storage for images
  - Configure AWS S3 or similar object storage
  - Implement secure file upload endpoints
  - Validate file types and sizes
  - Generate and store image URLs
  - _Requirements: 1.4, 2.1, 5.3_

- [ ] 20. Implement error handling and logging
  - Create standardized error response format
  - Implement error handling middleware
  - Set up logging system (Winston, Sentry)
  - Log critical errors and transactions
  - Implement retry logic for external integrations
  - _Requirements: All requirements need proper error handling_

- [ ]* 21. Write integration tests
  - [ ]* 21.1 Test end-to-end order flow
    - Test browse → cart → checkout → payment → delivery flow
    - Verify inventory updates
    - _Requirements: 2.3, 7.3, 8.1, 8.2, 10.2_
  
  - [ ]* 21.2 Test business registration and verification
    - Test SME registration workflow
    - Test verification document submission
    - _Requirements: 1.1, 1.2, 1.3, 12.1, 12.2_
  
  - [ ]* 21.3 Test geolocation and search
    - Test map-based business discovery
    - Test product search with filters
    - _Requirements: 3.1, 3.2, 4.1, 4.2_
  
  - [ ]* 21.4 Test payment and delivery integrations
    - Mock payment gateway responses
    - Mock delivery service APIs
    - _Requirements: 10.1, 10.2, 8.3, 9.3_

- [ ]* 22. Perform security testing
  - [ ]* 22.1 Test authentication security
    - Verify JWT token security
    - Test password hashing
    - Test token expiration
    - _Requirements: 1.1, 1.2_
  
  - [ ]* 22.2 Test input validation and SQL injection prevention
    - Test all input fields for SQL injection
    - Verify XSS protection
    - Test file upload validation
    - _Requirements: All input endpoints_
  
  - [ ]* 22.3 Test payment data encryption
    - Verify payment data is encrypted
    - Test secure document storage
    - _Requirements: 1.4, 10.2_

- [ ] 23. Deploy application infrastructure
  - Set up cloud infrastructure (AWS/GCP/Azure)
  - Configure load balancer
  - Set up PostgreSQL database with PostGIS
  - Configure Redis cluster
  - Set up CDN for static assets
  - Configure SSL certificates
  - _Requirements: All requirements depend on deployment_

- [ ] 24. Set up monitoring and observability
  - Implement application performance monitoring
  - Set up error tracking (Sentry)
  - Configure infrastructure monitoring (Prometheus/Grafana)
  - Set up uptime monitoring
  - Create alerts for critical failures
  - _Requirements: System reliability for all requirements_
