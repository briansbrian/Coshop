# Database Schema

## Overview

PostgreSQL 14+ with PostGIS extension for geospatial data. All tables use UUID primary keys and include `created_at`/`updated_at` timestamps.

## Tables

### users

Stores all platform users (SMEs and consumers).

**Columns:**
- `id` UUID PRIMARY KEY (auto-generated)
- `email` VARCHAR(255) UNIQUE NOT NULL
- `password_hash` VARCHAR(255) NOT NULL (bcrypt hashed)
- `user_type` VARCHAR(20) NOT NULL ('sme' or 'consumer')
- `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

**Indexes:**
- Primary key on `id`
- Unique index on `email`

**Triggers:**
- `update_users_updated_at` - Auto-updates `updated_at` on row modification

**Relationships:**
- One user can own multiple businesses (1:N)
- One user can place multiple orders (1:N)
- One user can send/receive multiple messages (1:N)

### businesses

Stores SME business profiles with geospatial location data.

**Columns:**
- `id` UUID PRIMARY KEY (auto-generated)
- `owner_id` UUID REFERENCES users(id) ON DELETE CASCADE
- `name` VARCHAR(255) NOT NULL
- `description` TEXT
- `business_type` VARCHAR(20) ('shop', 'business', or 'service')
- `location` GEOGRAPHY(POINT, 4326) - PostGIS geographic point
- `address` TEXT
- `city` VARCHAR(100)
- `country` VARCHAR(100)
- `contact_email` VARCHAR(255)
- `contact_phone` VARCHAR(50)
- `verified` BOOLEAN DEFAULT FALSE
- `rating` DECIMAL(3,2) DEFAULT 0 (0.00 to 5.00)
- `total_ratings` INTEGER DEFAULT 0
- `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

**Indexes:**
- Primary key on `id`
- GIST spatial index on `location` (enables fast geospatial queries)
- B-tree index on `verified`
- B-tree index on `owner_id`

**Triggers:**
- `update_businesses_updated_at` - Auto-updates `updated_at`

**Geospatial Details:**
- Location stored as GEOGRAPHY(POINT) in WGS84 (SRID 4326)
- Format: `POINT(longitude latitude)`
- Enables distance calculations in meters
- Supports radius-based queries with `ST_DWithin()`

**Relationships:**
- Belongs to one user (owner)
- Has many products (1:N)
- Has many orders (1:N)

### products

Stores product catalog with inventory tracking.

**Columns:**
- `id` UUID PRIMARY KEY (auto-generated)
- `business_id` UUID REFERENCES businesses(id) ON DELETE CASCADE
- `name` VARCHAR(255) NOT NULL
- `description` TEXT
- `price` DECIMAL(10,2) NOT NULL
- `quantity` INTEGER NOT NULL DEFAULT 0
- `category` VARCHAR(100)
- `images` TEXT[] (array of image URLs)
- `in_stock` BOOLEAN GENERATED ALWAYS AS (quantity > 0) STORED
- `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

**Indexes:**
- Primary key on `id`
- B-tree index on `business_id`
- B-tree index on `category`
- B-tree index on `in_stock`

**Triggers:**
- `update_products_updated_at` - Auto-updates `updated_at`

**Generated Columns:**
- `in_stock` automatically computed from `quantity > 0`
- Updated automatically when quantity changes
- Indexed for fast filtering

**Relationships:**
- Belongs to one business
- Referenced by order_items (1:N)

### orders

Stores customer orders.

**Columns:**
- `id` UUID PRIMARY KEY (auto-generated)
- `consumer_id` UUID REFERENCES users(id)
- `business_id` UUID REFERENCES businesses(id)
- `total_amount` DECIMAL(10,2) NOT NULL
- `status` VARCHAR(50) NOT NULL
- `delivery_method` VARCHAR(20) ('pickup' or 'delivery')
- `payment_status` VARCHAR(20) ('pending', 'completed', or 'failed')
- `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

**Indexes:**
- Primary key on `id`
- B-tree index on `consumer_id`
- B-tree index on `business_id`
- B-tree index on `status`

**Triggers:**
- `update_orders_updated_at` - Auto-updates `updated_at`

**Relationships:**
- Belongs to one consumer (user)
- Belongs to one business
- Has many order_items (1:N)
- Has many ratings (1:N)

### order_items

Stores individual items within an order.

**Columns:**
- `id` UUID PRIMARY KEY (auto-generated)
- `order_id` UUID REFERENCES orders(id) ON DELETE CASCADE
- `product_id` UUID REFERENCES products(id)
- `quantity` INTEGER NOT NULL
- `price_at_purchase` DECIMAL(10,2) NOT NULL (captures price at time of order)
- `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

**Indexes:**
- Primary key on `id`
- B-tree index on `order_id`

**Design Notes:**
- `price_at_purchase` preserves historical pricing
- Cascade delete when order is deleted
- No `updated_at` (order items are immutable)

**Relationships:**
- Belongs to one order
- References one product

### ratings

Stores bidirectional ratings (consumer→SME and SME→consumer).

**Columns:**
- `id` UUID PRIMARY KEY (auto-generated)
- `order_id` UUID REFERENCES orders(id)
- `rater_id` UUID REFERENCES users(id) (who gave the rating)
- `rated_id` UUID REFERENCES users(id) (who received the rating)
- `rating_type` VARCHAR(20) ('consumer_to_sme' or 'sme_to_consumer')
- `stars` INTEGER CHECK (stars >= 1 AND stars <= 5)
- `review` TEXT
- `criteria` JSONB (flexible criteria storage)
- `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

**Indexes:**
- Primary key on `id`
- Composite index on `(rated_id, rating_type)`
- B-tree index on `order_id`

**JSONB Criteria Examples:**
- Consumer→SME: `{"productQuality": 5, "service": 4, "value": 5}`
- SME→Consumer: `{"paymentTimeliness": 5, "communication": 4, "compliance": 5}`

**Relationships:**
- Belongs to one order
- References two users (rater and rated)

### messages

Stores user-to-user messages.

**Columns:**
- `id` UUID PRIMARY KEY (auto-generated)
- `sender_id` UUID REFERENCES users(id)
- `receiver_id` UUID REFERENCES users(id)
- `content` TEXT NOT NULL
- `read` BOOLEAN DEFAULT FALSE
- `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

**Indexes:**
- Primary key on `id`
- Composite index on `(sender_id, receiver_id)` (conversation lookup)
- Composite index on `(receiver_id, read)` (unread messages)

**Relationships:**
- References two users (sender and receiver)

### notifications

Stores user notifications.

**Columns:**
- `id` UUID PRIMARY KEY (auto-generated)
- `user_id` UUID REFERENCES users(id) ON DELETE CASCADE
- `type` VARCHAR(50) NOT NULL
- `title` VARCHAR(255) NOT NULL
- `message` TEXT NOT NULL
- `priority` VARCHAR(20)
- `read` BOOLEAN DEFAULT FALSE
- `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

**Indexes:**
- Primary key on `id`
- Composite index on `(user_id, read)` (unread notifications)

**Notification Types:**
- new_order
- message
- review
- low_inventory
- payment
- delivery_update

**Relationships:**
- Belongs to one user

## Relationships Diagram

```
users (1) ──────< (N) businesses
  │                      │
  │                      └──< (N) products
  │                               │
  │                               └──< (N) order_items
  │                                        │
  └──< (N) orders ─────────────────────────┘
       │
       └──< (N) ratings

users (1) ──< (N) messages (sender)
users (1) ──< (N) messages (receiver)
users (1) ──< (N) notifications
```

## PostGIS Functions Used

**Distance Calculation:**
```sql
ST_Distance(location1, location2) -- Returns distance in meters
```

**Radius Search:**
```sql
ST_DWithin(location, point, radius_meters) -- Returns true if within radius
```

**Point Creation:**
```sql
ST_GeogFromText('POINT(longitude latitude)')
```

**Coordinate Extraction:**
```sql
ST_X(location::geometry) -- Longitude
ST_Y(location::geometry) -- Latitude
```

## Cascade Behavior

**ON DELETE CASCADE:**
- Deleting a user deletes their businesses, orders, messages, notifications
- Deleting a business deletes its products
- Deleting an order deletes its order_items

**Why:** Maintains referential integrity and prevents orphaned records.

## Automatic Timestamp Updates

All tables with `updated_at` have triggers that automatically update the timestamp on row modification using the `update_updated_at_column()` function.

## Data Integrity Constraints

- CHECK constraints on enums (user_type, business_type, delivery_method, payment_status, rating_type)
- CHECK constraint on ratings (1-5 stars)
- UNIQUE constraint on user email
- NOT NULL constraints on required fields
- Foreign key constraints with appropriate cascade rules
