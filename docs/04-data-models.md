# Data Models

## Overview

This document describes how database records are transformed into application data models. Services query the database and return structured objects that are sent to API clients.

## Model Transformation Pattern

### Database → Application Model
Services transform database rows into clean JavaScript objects:
1. Query database with SQL
2. Extract relevant fields from result rows
3. Transform column names (snake_case → camelCase)
4. Parse data types (DECIMAL → number, JSONB → object)
5. Structure nested objects (location, contactInfo)
6. Return formatted model

### Why Transform?
- **API Consistency:** Camel case matches JavaScript conventions
- **Data Hiding:** Exclude sensitive fields (password_hash)
- **Structure:** Group related fields into nested objects
- **Type Safety:** Convert database types to JavaScript types
- **Clarity:** Provide clean, documented interfaces

## Core Data Models

### User Model

**Database Source:** `users` table

**Application Model:**
```javascript
{
  id: "uuid-string",
  email: "user@example.com",
  userType: "sme" | "consumer",
  createdAt: Date
}
```

**Transformation:**
- `user_type` → `userType`
- `created_at` → `createdAt`
- `password_hash` excluded (never exposed)
- `updated_at` excluded (internal use only)

**Usage Context:**
- Returned after registration
- Returned after login
- Attached to JWT token payload
- Used in authentication middleware

**Security Notes:**
- Password hash NEVER included in model
- Email only visible to authenticated user
- User type determines access permissions

### Business Model

**Database Source:** `businesses` table

**Application Model:**
```javascript
{
  id: "uuid-string",
  ownerId: "uuid-string",
  name: "Business Name",
  description: "Business description",
  businessType: "shop" | "business" | "service",
  location: {
    latitude: 40.7128,
    longitude: -74.0060,
    address: "123 Main St",
    city: "New York",
    country: "USA"
  },
  contactInfo: {
    email: "business@example.com",
    phone: "+1234567890"
  },
  verified: false,
  rating: 4.5,
  totalRatings: 120,
  operatingHours: [
    {
      day: "monday",
      open: "09:00",
      close: "17:00",
      closed: false
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

**Transformation:**
- `owner_id` → `ownerId`
- `business_type` → `businessType`
- PostGIS POINT extracted to `latitude`/`longitude`
- Location fields grouped into `location` object
- Contact fields grouped into `contactInfo` object
- `contact_email` → `email` (within contactInfo)
- `contact_phone` → `phone` (within contactInfo)
- DECIMAL rating converted to number
- Timestamps converted to Date objects

**PostGIS Extraction:**
```sql
ST_Y(location::geometry) as latitude,
ST_X(location::geometry) as longitude
```
- `ST_Y` extracts latitude (Y coordinate)
- `ST_X` extracts longitude (X coordinate)
- `::geometry` casts GEOGRAPHY to GEOMETRY for extraction

**Usage Context:**
- Business profile pages
- Map markers
- Search results
- Owner dashboard

**Visibility:**
- Public: All fields except owner_id
- Owner: All fields including management options
- Admin: All fields including verification status

### Product Model

**Database Source:** `products` table

**Application Model:**
```javascript
{
  id: "uuid-string",
  businessId: "uuid-string",
  name: "Product Name",
  description: "Product description",
  price: 29.99,
  quantity: 50,
  category: "electronics",
  images: [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],
  inStock: true,
  createdAt: Date,
  updatedAt: Date
}
```

**Transformation:**
- `business_id` → `businessId`
- `in_stock` → `inStock`
- DECIMAL price converted to number
- TEXT[] images array preserved
- Timestamps converted to Date objects

**Generated Field:**
- `inStock` automatically computed from `quantity > 0`
- Stored in database (not computed at query time)
- Indexed for fast filtering

**Usage Context:**
- Product listings
- Search results
- Shopping cart
- Order details

**Business Rules:**
- Price always positive
- Quantity cannot be negative
- Images array can be empty
- Category from predefined list (enforced by application)

### Order Model

**Database Source:** `orders` and `order_items` tables

**Application Model:**
```javascript
{
  id: "uuid-string",
  consumerId: "uuid-string",
  businessId: "uuid-string",
  items: [
    {
      id: "uuid-string",
      productId: "uuid-string",
      productName: "Product Name",
      quantity: 2,
      priceAtPurchase: 29.99,
      subtotal: 59.98
    }
  ],
  totalAmount: 59.98,
  status: "pending" | "confirmed" | "ready" | "out_for_delivery" | "delivered" | "cancelled",
  deliveryMethod: "pickup" | "delivery",
  deliveryInfo: {
    service: "Uber",
    trackingId: "TRACK123",
    estimatedDelivery: Date,
    cost: 5.00
  },
  paymentStatus: "pending" | "completed" | "failed",
  createdAt: Date,
  updatedAt: Date
}
```

**Transformation:**
- `consumer_id` → `consumerId`
- `business_id` → `businessId`
- `total_amount` → `totalAmount`
- `delivery_method` → `deliveryMethod`
- `payment_status` → `paymentStatus`
- Order items joined from `order_items` table
- Product details enriched from `products` table
- Subtotal calculated per item
- Timestamps converted to Date objects

**Status Workflow:**
```
pending → confirmed → ready → out_for_delivery → delivered
   ↓
cancelled
```

**Usage Context:**
- Consumer order history
- SME order management
- Order tracking
- Payment processing

**Access Control:**
- Consumer: Own orders only
- SME: Orders for their business only
- Admin: All orders

### Rating Model

**Database Source:** `ratings` table

**Application Model:**

**Consumer Rating SME:**
```javascript
{
  id: "uuid-string",
  orderId: "uuid-string",
  raterId: "uuid-string",
  ratedId: "uuid-string",
  ratingType: "consumer_to_sme",
  stars: 4,
  review: "Great service!",
  criteria: {
    productQuality: 5,
    service: 4,
    value: 4
  },
  createdAt: Date
}
```

**SME Rating Consumer:**
```javascript
{
  id: "uuid-string",
  orderId: "uuid-string",
  raterId: "uuid-string",
  ratedId: "uuid-string",
  ratingType: "sme_to_consumer",
  stars: 5,
  feedback: "Excellent customer",
  criteria: {
    paymentTimeliness: 5,
    communication: 5,
    compliance: 5
  },
  createdAt: Date
}
```

**Transformation:**
- `order_id` → `orderId`
- `rater_id` → `raterId`
- `rated_id` → `ratedId`
- `rating_type` → `ratingType`
- JSONB criteria parsed to object
- Timestamp converted to Date

**Trust Score Model:**
```javascript
{
  consumerId: "uuid-string",
  overallScore: 4.7,
  totalRatings: 25,
  breakdown: {
    paymentTimeliness: 4.8,
    communication: 4.6,
    compliance: 4.7
  }
}
```

**Calculation:**
- Average of all SME ratings for consumer
- Breakdown averages each criterion
- Minimum 5 ratings for reliable score

**Usage Context:**
- Business profile pages
- Consumer trust display
- Rating submission
- Review management

### Message Model

**Database Source:** `messages` table

**Application Model:**
```javascript
{
  id: "uuid-string",
  senderId: "uuid-string",
  receiverId: "uuid-string",
  content: "Message text",
  read: false,
  timestamp: Date
}
```

**Transformation:**
- `sender_id` → `senderId`
- `receiver_id` → `receiverId`
- `created_at` → `timestamp`

**Conversation Model:**
```javascript
{
  userId: "uuid-string",
  userName: "John Doe",
  userType: "sme" | "consumer",
  lastMessage: "Last message text",
  lastMessageTime: Date,
  unreadCount: 3
}
```

**Usage Context:**
- Messaging interface
- Conversation list
- Unread message count
- Real-time chat

### Notification Model

**Database Source:** `notifications` table

**Application Model:**
```javascript
{
  id: "uuid-string",
  userId: "uuid-string",
  type: "new_order" | "message" | "review" | "low_inventory" | "payment" | "delivery_update",
  title: "Notification Title",
  message: "Notification content",
  priority: "low" | "medium" | "high",
  read: false,
  timestamp: Date
}
```

**Transformation:**
- `user_id` → `userId`
- `created_at` → `timestamp`

**Usage Context:**
- Notification center
- Unread count badge
- Push notifications
- Email notifications

## Validation Models

### Registration Input

**Consumer Registration:**
```javascript
{
  email: "consumer@example.com",
  password: "securepass123",
  userType: "consumer"
}
```

**SME Registration:**
```javascript
{
  email: "sme@example.com",
  password: "securepass123",
  userType: "sme",
  businessInfo: {
    name: "My Business",
    businessType: "shop",
    description: "Business description",
    address: "123 Main St",
    city: "New York",
    country: "USA",
    contactEmail: "contact@business.com",
    contactPhone: "+1234567890"
  }
}
```

**Validation Rules:**
- Email: Valid format, unique
- Password: Minimum 8 characters
- User type: 'sme' or 'consumer'
- Business info: Required for SME, forbidden for consumer
- Business type: 'shop', 'business', or 'service'

### Business Update Input

```javascript
{
  name: "Updated Name",
  description: "Updated description",
  businessType: "service",
  address: "456 New St",
  city: "Boston",
  country: "USA",
  contactEmail: "new@business.com",
  contactPhone: "+0987654321",
  operatingHours: [
    {
      day: "monday",
      open: "08:00",
      close: "18:00",
      closed: false
    }
  ]
}
```

**Validation Rules:**
- All fields optional (partial updates allowed)
- Name: 2-255 characters
- Description: Max 5000 characters
- Operating hours: HH:MM format
- Address changes trigger geocoding

### Product Input

```javascript
{
  name: "Product Name",
  description: "Product description",
  price: 29.99,
  quantity: 100,
  category: "electronics",
  images: [
    "https://example.com/image1.jpg"
  ]
}
```

**Validation Rules:**
- Name: Required, max 255 characters
- Price: Required, positive number
- Quantity: Required, non-negative integer
- Category: From predefined list
- Images: Array of valid URLs

## Error Models

### Standard Error Response

```javascript
{
  error: {
    code: "ERROR_CODE",
    message: "Human-readable error message",
    details: "Additional context or validation errors",
    timestamp: "2025-11-12T10:30:00.000Z"
  }
}
```

**Error Codes:**
- `VALIDATION_ERROR` (400) - Invalid input data
- `AUTHENTICATION_REQUIRED` (401) - No token provided
- `INVALID_CREDENTIALS` (401) - Wrong email/password
- `TOKEN_EXPIRED` (401) - JWT token expired
- `FORBIDDEN` (403) - Insufficient permissions
- `USER_NOT_FOUND` (404) - User doesn't exist
- `BUSINESS_NOT_FOUND` (404) - Business doesn't exist
- `USER_EXISTS` (409) - Email already registered
- `INVALID_ADDRESS` (400) - Geocoding failed
- `GEOCODING_SERVICE_ERROR` (502) - External service unavailable
- `INTERNAL_SERVER_ERROR` (500) - Unexpected error

## JWT Token Payload

**Access Token:**
```javascript
{
  userId: "uuid-string",
  email: "user@example.com",
  userType: "sme" | "consumer",
  iat: 1699876543,  // Issued at
  exp: 1699877443   // Expires in 15 minutes
}
```

**Refresh Token:**
```javascript
{
  userId: "uuid-string",
  email: "user@example.com",
  userType: "sme" | "consumer",
  iat: 1699876543,  // Issued at
  exp: 1700481343   // Expires in 7 days
}
```

**Token Response:**
```javascript
{
  accessToken: "eyJhbGciOiJIUzI1NiIs...",
  refreshToken: "eyJhbGciOiJIUzI1NiIs...",
  expiresIn: "15m"
}
```

## Geolocation Models

### Geocoding Result

```javascript
{
  latitude: 40.7128,
  longitude: -74.0060,
  formattedAddress: "123 Main St, New York, NY 10001, USA"
}
```

**Source:** OpenStreetMap Nominatim or Google Maps API

### Reverse Geocoding Result

```javascript
{
  address: "123 Main St, New York, NY 10001, USA",
  city: "New York",
  country: "USA"
}
```

### Nearby Search Query

```javascript
{
  latitude: 40.7128,
  longitude: -74.0060,
  radius: 5000,  // meters
  businessType: "shop" | "business" | "service",
  verified: true,
  minRating: 4.0
}
```

### Distance Calculation

```javascript
{
  businessId: "uuid-string",
  distance: 1234.56,  // meters
  distanceKm: 1.23,
  distanceMiles: 0.77
}
```

## Model Relationships

### User → Business (1:N)
- One user (SME) can own multiple businesses
- Business includes ownerId reference
- Cascading delete when user deleted

### Business → Product (1:N)
- One business has many products
- Product includes businessId reference
- Cascading delete when business deleted

### User → Order (1:N as consumer)
- One consumer places many orders
- Order includes consumerId reference

### Business → Order (1:N as seller)
- One business receives many orders
- Order includes businessId reference

### Order → OrderItem (1:N)
- One order contains many items
- OrderItem includes orderId reference
- Cascading delete when order deleted

### Order → Rating (1:2)
- One order can have two ratings
- Consumer rates business
- Business rates consumer
- Rating includes orderId reference

### User ↔ Message (N:N)
- Users send and receive messages
- Message includes senderId and receiverId

### User → Notification (1:N)
- One user receives many notifications
- Notification includes userId reference
- Cascading delete when user deleted
