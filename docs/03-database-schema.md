# Database Schema

## Overview

CoShop uses PostgreSQL 14+ with the PostGIS extension for geospatial data support. The schema is designed for data integrity, performance, and scalability with proper indexing, foreign key constraints, and generated columns.

**Schema Location:** `/database/init.sql`

## Database Extensions

### PostGIS
**Purpose:** Enables geospatial data types and spatial queries.

**Key Features:**
- GEOGRAPHY(POINT) type for storing coordinates
- Spatial indexes (GIST) for fast location queries
- Distance calculations with ST_Distance
- Geometry functions for spatial operations

**Usage:**
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

## Core Tables

### users

**Purpose:** Stores all user accounts (SMEs and consumers).

**Schema:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('sme', 'consumer')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**
- `id` - UUID primary key, auto-generated
- `email` - Unique email address for login
- `password_hash` - Bcrypt hashed password (never plain text)
- `user_type` - Role: 'sme' or 'consumer'
- `created_at` - Account creation timestamp
- `updated_at` - Last modification timestamp (auto-updated by trigger)

**Constraints:**
- Email must be unique
- User type restricted to 'sme' or 'consumer'

**Indexes:**
- Primary key on `id`
- Unique index on `email`

**Relationships:**
- One user can own multiple businesses (1:N)
- One user can place multiple orders (1:N)
- One user can send/receive multiple messages (1:N)
- One user can give/receive multiple ratings (1:N)

### businesses

**Purpose:** Stores SME business profiles with geospatial location data.

**Schema:**
```sql
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  business_type VARCHAR(20) CHECK (business_type IN ('shop', 'business', 'service')),
  location GEOGRAPHY(POINT, 4326),
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  verified BOOLEAN DEFAULT FALSE,
  rating DECIMAL(3,2) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**
- `id` - UUID primary key
- `owner_id` - Foreign key to users table
- `name` - Business name
- `description` - Business description (optional)
- `business_type` - Type: 'shop', 'business', or 'service'
- `location` - PostGIS GEOGRAPHY(POINT) with SRID 4326 (WGS84)
- `address` - Street address
- `city` - City name
- `country` - Country name
- `contact_email` - Business contact email
- `contact_phone` - Business phone number
- `verified` - Verification status (default false)
- `rating` - Average rating (0.00 to 5.00)
- `total_ratings` - Count of ratings received
- `created_at` - Business registration timestamp
- `updated_at` - Last modification timestamp

**Constraints:**
- Business type restricted to 'shop', 'business', 'service'
- Cascading delete when owner is deleted

**Indexes:**
```sql
CREATE INDEX idx_businesses_location ON businesses USING GIST(location);
CREATE INDEX idx_businesses_verified ON businesses(verified);
CREATE INDEX idx_businesses_owner ON businesses(owner_id);
```

**Index Purposes:**
- `idx_businesses_location` - GIST spatial index for nearby searches
- `idx_businesses_verified` - Filter verified businesses
- `idx_businesses_owner` - Query businesses by owner

**Geospatial Data:**
- Location stored as GEOGRAPHY(POINT, 4326)
- SRID 4326 = WGS84 coordinate system (standard GPS)
- Enables distance calculations in meters
- Supports radius-based queries

### products

**Purpose:** Stores product catalog and inventory for each business.

**Schema:**
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  category VARCHAR(100),
  images TEXT[],
  in_stock BOOLEAN GENERATED ALWAYS AS (quantity > 0) STORED,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**
- `id` - UUID primary key
- `business_id` - Foreign key to businesses table
- `name` - Product name
- `description` - Product description
- `price` - Product price (2 decimal places)
- `quantity` - Available inventory count
- `category` - Product category
- `images` - Array of image URLs
- `in_stock` - Generated column (true if quantity > 0)
- `created_at` - Product creation timestamp
- `updated_at` - Last modification timestamp

**Constraints:**
- Cascading delete when business is deleted
- Price must be positive (enforced by application)

**Generated Columns:**
- `in_stock` - Automatically computed from quantity
- Stored (not virtual) for indexing
- Updates automatically when quantity changes

**Indexes:**
```sql
CREATE INDEX idx_products_business ON products(business_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_in_stock ON products(in_stock);
```

**Index Purposes:**
- `idx_products_business` - List products by business
- `idx_products_category` - Filter by category
- `idx_products_in_stock` - Show only available products

### orders

**Purpose:** Stores order transactions between consumers and businesses.

**Schema:**
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_id UUID REFERENCES users(id),
  business_id UUID REFERENCES businesses(id),
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) NOT NULL,
  delivery_method VARCHAR(20) CHECK (delivery_method IN ('pickup', 'delivery')),
  payment_status VARCHAR(20) CHECK (payment_status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**
- `id` - UUID primary key
- `consumer_id` - Foreign key to users (buyer)
- `business_id` - Foreign key to businesses (seller)
- `total_amount` - Order total (2 decimal places)
- `status` - Order status (pending, confirmed, ready, out_for_delivery, delivered, cancelled)
- `delivery_method` - 'pickup' or 'delivery'
- `payment_status` - 'pending', 'completed', or 'failed'
- `created_at` - Order creation timestamp
- `updated_at` - Last status update timestamp

**Constraints:**
- Delivery method restricted to 'pickup' or 'delivery'
- Payment status restricted to 'pending', 'completed', 'failed'

**Indexes:**
```sql
CREATE INDEX idx_orders_consumer ON orders(consumer_id);
CREATE INDEX idx_orders_business ON orders(business_id);
CREATE INDEX idx_orders_status ON orders(status);
```

**Index Purposes:**
- `idx_orders_consumer` - Consumer order history
- `idx_orders_business` - Business order management
- `idx_orders_status` - Filter by order status

**Status Workflow:**
1. pending - Order created, awaiting confirmation
2. confirmed - Business accepted order
3. ready - Order ready for pickup/delivery
4. out_for_delivery - In transit (delivery only)
5. delivered - Order completed
6. cancelled - Order cancelled

### order_items

**Purpose:** Stores individual products within each order.

**Schema:**
```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price_at_purchase DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**
- `id` - UUID primary key
- `order_id` - Foreign key to orders table
- `product_id` - Foreign key to products table
- `quantity` - Number of units ordered
- `price_at_purchase` - Product price at time of order (historical record)
- `created_at` - Item creation timestamp

**Constraints:**
- Cascading delete when order is deleted

**Indexes:**
```sql
CREATE INDEX idx_order_items_order ON order_items(order_id);
```

**Index Purpose:**
- `idx_order_items_order` - Retrieve all items for an order

**Design Rationale:**
- `price_at_purchase` preserves historical pricing
- Allows product price changes without affecting past orders
- Quantity stored per item for flexible ordering

### ratings

**Purpose:** Stores bidirectional ratings between consumers and SMEs.

**Schema:**
```sql
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  rater_id UUID REFERENCES users(id),
  rated_id UUID REFERENCES users(id),
  rating_type VARCHAR(20) CHECK (rating_type IN ('consumer_to_sme', 'sme_to_consumer')),
  stars INTEGER CHECK (stars >= 1 AND stars <= 5),
  review TEXT,
  criteria JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**
- `id` - UUID primary key
- `order_id` - Foreign key to orders (rating context)
- `rater_id` - User giving the rating
- `rated_id` - User receiving the rating
- `rating_type` - 'consumer_to_sme' or 'sme_to_consumer'
- `stars` - Rating value (1-5)
- `review` - Written review text (optional)
- `criteria` - JSONB object with detailed criteria scores
- `created_at` - Rating creation timestamp

**Constraints:**
- Rating type restricted to two directions
- Stars must be between 1 and 5

**Indexes:**
```sql
CREATE INDEX idx_ratings_rated ON ratings(rated_id, rating_type);
CREATE INDEX idx_ratings_order ON ratings(order_id);
```

**Index Purposes:**
- `idx_ratings_rated` - Retrieve ratings for a user by type
- `idx_ratings_order` - Check if order has been rated

**JSONB Criteria Structure:**

Consumer rating SME:
```json
{
  "productQuality": 4,
  "service": 5,
  "value": 4
}
```

SME rating consumer:
```json
{
  "paymentTimeliness": 5,
  "communication": 4,
  "compliance": 5
}
```

### messages

**Purpose:** Stores conversation messages between users.

**Schema:**
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES users(id),
  receiver_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**
- `id` - UUID primary key
- `sender_id` - User who sent the message
- `receiver_id` - User who receives the message
- `content` - Message text
- `read` - Read status (default false)
- `created_at` - Message timestamp

**Indexes:**
```sql
CREATE INDEX idx_messages_conversation ON messages(sender_id, receiver_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id, read);
```

**Index Purposes:**
- `idx_messages_conversation` - Retrieve conversation thread
- `idx_messages_receiver` - Unread message count

### notifications

**Purpose:** Stores in-app notifications for users.

**Schema:**
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  priority VARCHAR(20),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**
- `id` - UUID primary key
- `user_id` - User receiving notification
- `type` - Notification type (new_order, message, review, etc.)
- `title` - Notification title
- `message` - Notification content
- `priority` - Priority level (low, medium, high)
- `read` - Read status (default false)
- `created_at` - Notification timestamp

**Constraints:**
- Cascading delete when user is deleted

**Indexes:**
```sql
CREATE INDEX idx_notifications_user ON notifications(user_id, read);
```

**Index Purpose:**
- `idx_notifications_user` - Retrieve unread notifications

**Notification Types:**
- `new_order` - New order received
- `message` - New message received
- `review` - New rating/review
- `low_inventory` - Product stock low
- `payment` - Payment status update
- `delivery_update` - Delivery status change

## Database Triggers

### Auto-Update Timestamps

**Purpose:** Automatically update `updated_at` column on row modifications.

**Function:**
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';
```

**Triggers:**
```sql
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_businesses_updated_at 
  BEFORE UPDATE ON businesses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at 
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at 
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Relationship Diagram

```
users (1) ──────────────> (N) businesses
  │                            │
  │                            │
  │ (1)                   (N) │
  │                            │
  ├──────> (N) orders <────────┘
  │            │
  │            │ (1)
  │            │
  │       (N) │
  │            │
  │       order_items (N) ───> (1) products
  │
  ├──────> (N) ratings (as rater)
  │
  ├──────> (N) ratings (as rated)
  │
  ├──────> (N) messages (as sender)
  │
  ├──────> (N) messages (as receiver)
  │
  └──────> (N) notifications
```

## Indexing Strategy

### Primary Keys
All tables use UUID primary keys for:
- Global uniqueness
- Security (non-sequential)
- Distributed system compatibility

### Foreign Keys
All foreign key columns are indexed for:
- Fast JOIN operations
- Referential integrity checks
- Cascading delete performance

### Spatial Indexes
GIST indexes on geospatial columns for:
- Nearby business queries
- Distance calculations
- Bounding box searches

### Composite Indexes
Multi-column indexes for common query patterns:
- `(sender_id, receiver_id)` for conversations
- `(user_id, read)` for unread notifications
- `(rated_id, rating_type)` for rating aggregation

### Generated Column Indexes
Indexes on computed columns:
- `in_stock` for product availability filtering

## Performance Considerations

### Query Optimization
- Indexes on all foreign keys
- Spatial indexes for geolocation queries
- Composite indexes for common filters
- Generated columns for computed values

### Data Integrity
- Foreign key constraints with cascading deletes
- CHECK constraints for enum-like values
- NOT NULL constraints on required fields
- UNIQUE constraints on email addresses

### Scalability
- UUID primary keys for distributed systems
- Timestamp columns for audit trails
- JSONB for flexible schema evolution
- Array types for multi-value fields

## Future Schema Additions (Planned)

### promotions
- Discount codes and campaigns
- Usage tracking and limits

### staff_accounts
- Multiple users per business
- Role-based permissions

### verification_documents
- Business verification files
- Document status tracking

### analytics_events
- User behavior tracking
- Business metrics aggregation

### favorites
- Consumer saved businesses/products
- Wishlist functionality
