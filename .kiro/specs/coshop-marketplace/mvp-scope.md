# CoShop Marketplace - MVP Scope for Netlify Deployment

## Executive Summary

This MVP focuses on creating a **fully functional, production-ready marketplace** that demonstrates CoShop's core value proposition: connecting SMEs with consumers through geolocation-based discovery. The MVP will be deployable to Netlify (frontend) with a serverless backend, providing a complete, immersive user experience while maintaining realistic scope.

## MVP Philosophy

**What Makes This an MVP:**
- Focus on core user journeys (discover → browse → order)
- Simplified but complete features (no half-implementations)
- Real integrations where critical, mock/simulate where acceptable
- Production-quality UI/UX (looks and feels like a real product)
- Deployable and demonstrable immediately

**What Makes This Production-Ready:**
- Full authentication and security
- Real database with proper schema
- Complete order flow from discovery to completion
- Responsive, polished UI
- Error handling and validation
- Real payment processing (Stripe)

## Architecture for Netlify Deployment

### Frontend
- **Platform**: Netlify (static hosting + serverless functions)
- **Framework**: React.js with Vite
- **Styling**: Tailwind CSS (fast, modern, responsive)
- **Maps**: Leaflet with OpenStreetMap (free, no API key needed for MVP)
- **State**: React Context + React Query (simpler than Redux for MVP)

### Backend
- **Platform**: Netlify Functions (serverless)
- **Runtime**: Node.js
- **Database**: Supabase (PostgreSQL with PostGIS, free tier, managed)
- **Authentication**: Supabase Auth (built-in JWT)
- **Storage**: Supabase Storage (for images)
- **Payments**: Stripe (test mode)

### Why This Stack?
- ✅ **Zero infrastructure management** - everything is managed services
- ✅ **Free tier available** - can demo without costs
- ✅ **Fast deployment** - push to deploy
- ✅ **Scalable** - can handle real traffic
- ✅ **Production-ready** - not just prototypes

## Core Features (In Scope)

### 1. User Authentication ✅
**Why Essential**: Foundation for all personalized features

- SME and Consumer registration
- Email/password login
- JWT token management
- Password reset via email
- Role-based access (SME vs Consumer)

**Implementation**:
- Supabase Auth handles all complexity
- Custom UI for branding
- Protected routes in React

### 2. SME Business Management ✅
**Why Essential**: SMEs need to establish their presence

- Business registration with location
- Business profile (name, description, type, contact, hours)
- Upload business photos (1-5 images)
- Location picker on map
- Basic verification status (manual admin approval for MVP)

**Implementation**:
- Form-based registration
- Drag-and-drop image upload
- Interactive map for location selection
- Admin panel for verification (simple table view)

### 3. Product Catalog & Inventory ✅
**Why Essential**: Core marketplace functionality

- Add/edit/delete products
- Product details (name, description, price, quantity, category)
- Upload product images (1-3 per product)
- Automatic in-stock/out-of-stock status
- Product categories (predefined list)

**Implementation**:
- CRUD interface for SMEs
- Image optimization on upload
- Real-time inventory tracking
- Category dropdown (10-15 common categories)

### 4. Geolocation Discovery ✅
**Why Essential**: CoShop's unique value proposition

- Interactive map showing all SMEs
- Business type markers (shop/business/service)
- Click marker to see business preview
- Filter by business type
- Filter by distance radius
- Search by business name

**Implementation**:
- Leaflet map with custom markers
- PostGIS distance queries
- Client-side filtering for performance
- Geolocation API for user location

### 5. Product Search & Browse ✅
**Why Essential**: Consumers need to find products

- Search products by keyword
- Filter by category
- Filter by price range
- Sort by price, distance, rating
- View product details
- See which SME sells each product

**Implementation**:
- PostgreSQL full-text search (good enough for MVP)
- Filter UI with instant results
- Product cards with images
- Link to SME profile from product

### 6. Shopping Cart & Checkout ✅
**Why Essential**: Complete the purchase flow

- Add products to cart
- Multiple SMEs in one cart (creates separate orders)
- View cart with totals per SME
- Checkout with delivery address
- Choose pickup or delivery
- Payment with Stripe

**Implementation**:
- Local storage for cart persistence
- Order creation per SME
- Stripe Checkout integration (hosted page)
- Email confirmation

### 7. Order Management ✅
**Why Essential**: Both sides need to track orders

**For Consumers**:
- View order history
- See order status
- Track current orders
- View order details

**For SMEs**:
- Receive new order notifications
- Accept/reject orders
- Update order status (pending → confirmed → ready → completed)
- View order history

**Implementation**:
- Real-time updates via Supabase subscriptions
- Status workflow with clear states
- Email notifications for status changes
- Simple dashboard for both user types

### 8. Ratings & Reviews ✅
**Why Essential**: Trust and social proof

- Consumers rate SMEs after order completion (1-5 stars + review)
- Display average rating on SME profiles
- Show recent reviews
- SMEs can respond to reviews (optional for MVP)

**Implementation**:
- Rating prompt after order delivered
- Star rating component
- Review list on profile
- Average calculation

### 9. Basic Messaging ✅
**Why Essential**: Communication before purchase

- Send message to SME from their profile
- View conversation history
- Email notification for new messages
- Simple chat interface

**Implementation**:
- Database-backed messages (not real-time WebSocket for MVP)
- Polling for new messages (every 10 seconds when chat open)
- Email notification via Supabase
- Simple thread view

### 10. Responsive Mobile Design ✅
**Why Essential**: Most users will be on mobile

- Mobile-first design
- Touch-friendly map controls
- Optimized images
- Fast loading (<3s on 4G)

**Implementation**:
- Tailwind responsive utilities
- Mobile navigation menu
- Optimized image sizes
- Lazy loading

## Features Simplified for MVP

### 1. Delivery Integration → Simplified
**Full Version**: Integrate Uber API, Pick Up Mtaani API
**MVP Version**: 
- Delivery option selection (pickup vs delivery)
- Manual delivery coordination (SME contacts consumer)
- Fixed delivery fee per SME
- No real-time tracking

**Rationale**: Delivery API integration is complex and not core to demonstrating value. Manual coordination works for MVP.

### 2. Payment Processing → Simplified
**Full Version**: Multiple gateways (Stripe, PayPal, M-Pesa)
**MVP Version**:
- Stripe only (test mode)
- Credit card payments
- Simple success/failure flow

**Rationale**: Stripe is easiest to integrate and works globally. Can add M-Pesa later for Kenya market.

### 3. Business Verification → Simplified
**Full Version**: Document upload, automated review, 48-hour SLA
**MVP Version**:
- Manual admin approval
- Simple "verified" badge
- No doc