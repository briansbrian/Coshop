# Database Setup

## Prerequisites

- PostgreSQL 14+ installed
- PostGIS extension available

## Setup Instructions

1. Create the database:
```bash
createdb coshop_db
```

2. Run the initialization script:
```bash
psql -d coshop_db -f init.sql
```

3. Verify PostGIS installation:
```sql
SELECT PostGIS_Version();
```

## Database Schema

The database includes the following tables:
- `users` - User accounts (SMEs and consumers)
- `businesses` - SME business profiles with geospatial location
- `products` - Product catalog with inventory tracking
- `orders` - Order records
- `order_items` - Order line items
- `ratings` - Bidirectional ratings (consumer↔SME)
- `messages` - User messaging
- `notifications` - Multi-channel notifications

## Key Features

- PostGIS extension for geospatial queries
- Spatial indexes on business locations
- Generated columns for computed fields (e.g., `in_stock`)
- Automatic timestamp updates via triggers
- Foreign key constraints with cascading deletes
