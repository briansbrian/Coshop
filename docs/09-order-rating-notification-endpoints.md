# Order, Rating, and Notification Endpoints

## Overview

This document details the implemented endpoints for order management, bidirectional ratings, and notifications. These endpoints complete the core marketplace functionality.

## Order Endpoints

### POST /api/v1/orders

**Purpose:** Create new order with automatic cart splitting per SME.

**Authentication:** Required (Consumer only)

**Request Body:**
```json
{
  "items": [
    {
      "productId": "uuid",
      "quantity": 2
    }
  ],
  "deliveryMethod": "pickup"
}
```

**Validation:**
- `items` - Array of at least 1 item (required)
- `productId` - Valid UUID (required)
- `quantity` - Integer >= 1 (required)
- `deliveryMethod` - Either "pickup" or "delivery" (required)

**Response (201 Created):**
```json
[
  {
    "id": "order-uuid",
    "consumerId": "consumer-uuid",
    "businessId": "business-uuid",
    "businessName": "Tech Store",
    "totalAmount": 599.98,
    "status": "pending",
    "deliveryMethod": "pickup",
    "paymentStatus": "pending",
    "items": [
      {
        "id": "item-uuid",
        "productId": "product-uuid",
        "productName": "Laptop",
        "quantity": 2,
        "priceAtPurchase": 299.99
      }
    ],
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

**Business Logic:**
- Validates all products exist and are in stock
- Checks sufficient inventory for requested quantities
- Splits cart into separate orders per business (multi-vendor support)
- Calculates total amount per order
- Creates order_items for each product
- Triggers notification to business owner
- Uses database transaction for atomicity

**Error Responses:**
- 400: Validation error, product out of stock, insufficient inventory
- 404: Product not found

**Example:**
```bash
curl -X POST http://localhost:5000/api/v1/orders \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"productId": "123e4567-e89b-12d3-a456-426614174000", "quantity": 2}
    ],
    "deliveryMethod": "pickup"
  }'
```

---

### GET /api/v1/orders/:id

**Purpose:** Get order details with items.

**Authentication:** Required (Consumer or Business Owner)

**URL Parameters:**
- `id` - Order UUID

**Response (200 OK):**
```json
{
  "id": "order-uuid",
  "consumerId": "consumer-uuid",
  "consumerEmail": "customer@example.com",
  "businessId": "business-uuid",
  "businessName": "Tech Store",
  "totalAmount": 599.98,
  "status": "confirmed",
  "deliveryMethod": "pickup",
  "paymentStatus": "pending",
  "items": [
    {
      "id": "item-uuid",
      "productId": "product-uuid",
      "productName": "Laptop",
      "productImages": ["url1", "url2"],
      "quantity": 2,
      "priceAtPurchase": 299.99,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:35:00Z"
}
```

**Authorization:**
- Consumer can view their own orders
- Business owner can view orders for their businesses

**Error Responses:**
- 403: Not authorized to view order
- 404: Order not found

---

### GET /api/v1/orders

**Purpose:** List orders for authenticated user.

**Authentication:** Required

**Query Parameters:**
- `status` - Filter by order status (optional)
- `limit` - Results per page (default: 50, max: 100)
- `offset` - Pagination offset (default: 0)

**Response (200 OK):**
```json
[
  {
    "id": "order-uuid",
    "consumerId": "consumer-uuid",
    "consumerEmail": "customer@example.com",
    "businessId": "business-uuid",
    "businessName": "Tech Store",
    "totalAmount": 599.98,
    "status": "delivered",
    "deliveryMethod": "pickup",
    "paymentStatus": "completed",
    "items": [
      {
        "id": "item-uuid",
        "productId": "product-uuid",
        "productName": "Laptop",
        "quantity": 2,
        "priceAtPurchase": 299.99
      }
    ],
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T14:00:00Z"
  }
]
```

**Behavior:**
- Consumers see orders they placed
- SMEs see orders for their businesses
- Results sorted by created_at DESC

**Example:**
```bash
curl -X GET "http://localhost:5000/api/v1/orders?status=delivered&limit=10" \
  -H "Authorization: Bearer <token>"
```

---

### PATCH /api/v1/orders/:id/status

**Purpose:** Update order status with workflow validation.

**Authentication:** Required (Business Owner only)

**URL Parameters:**
- `id` - Order UUID

**Request Body:**
```json
{
  "status": "confirmed"
}
```

**Valid Status Transitions:**
- `pending` → `confirmed`, `cancelled`
- `confirmed` → `ready`, `cancelled`
- `ready` → `out_for_delivery`, `delivered`, `cancelled`
- `out_for_delivery` → `delivered`, `cancelled`
- `delivered` → (terminal state)
- `cancelled` → (terminal state)

**Response (200 OK):**
```json
{
  "id": "order-uuid",
  "consumerId": "consumer-uuid",
  "businessId": "business-uuid",
  "totalAmount": 599.98,
  "status": "confirmed",
  "deliveryMethod": "pickup",
  "paymentStatus": "pending",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:35:00Z"
}
```

**Business Logic:**
- Validates status transition is allowed
- Deducts inventory when transitioning to `confirmed`
- Restores inventory if cancelled from `confirmed`
- Triggers notification to consumer
- Uses database transaction

**Error Responses:**
- 400: Invalid status transition, insufficient inventory
- 403: Not authorized (not business owner)
- 404: Order not found

---

## Rating Endpoints

### POST /api/v1/ratings/consumer

**Purpose:** Consumer rates SME after order completion.

**Authentication:** Required (Consumer only)

**Request Body:**
```json
{
  "orderId": "order-uuid",
  "businessId": "business-uuid",
  "stars": 5,
  "review": "Excellent service and quality products!",
  "criteria": {
    "productQuality": 5,
    "service": 5,
    "value": 4
  }
}
```

**Validation:**
- `orderId` - Valid UUID (required)
- `businessId` - Valid UUID (required)
- `stars` - Integer 1-5 (required)
- `review` - String, max 2000 chars (optional)
- `criteria.productQuality` - Integer 1-5 (required)
- `criteria.service` - Integer 1-5 (required)
- `criteria.value` - Integer 1-5 (required)

**Response (201 Created):**
```json
{
  "id": "rating-uuid",
  "orderId": "order-uuid",
  "raterId": "consumer-uuid",
  "ratedId": "sme-owner-uuid",
  "ratingType": "consumer_to_sme",
  "stars": 5,
  "review": "Excellent service and quality products!",
  "criteria": {
    "productQuality": 5,
    "service": 5,
    "value": 4
  },
  "createdAt": "2024-01-15T15:00:00Z"
}
```

**Business Logic:**
- Verifies order exists and consumer is the order owner
- Checks order status is `delivered` or `completed`
- Prevents duplicate ratings for same order
- Updates business aggregate rating and total_ratings
- Stores criteria as JSONB

**Error Responses:**
- 400: Order not completed, invalid business ID
- 403: Not authorized (not order consumer)
- 404: Order not found
- 409: Duplicate rating (already rated this order)

---

### POST /api/v1/ratings/sme

**Purpose:** SME rates consumer's transaction behavior.

**Authentication:** Required (SME only)

**Request Body:**
```json
{
  "orderId": "order-uuid",
  "consumerId": "consumer-uuid",
  "stars": 5,
  "feedback": "Great customer, prompt payment and communication.",
  "criteria": {
    "paymentTimeliness": 5,
    "communication": 5,
    "compliance": 5
  }
}
```

**Validation:**
- `orderId` - Valid UUID (required)
- `consumerId` - Valid UUID (required)
- `stars` - Integer 1-5 (required)
- `feedback` - String, max 2000 chars (optional)
- `criteria.paymentTimeliness` - Integer 1-5 (required)
- `criteria.communication` - Integer 1-5 (required)
- `criteria.compliance` - Integer 1-5 (required)

**Response (201 Created):**
```json
{
  "id": "rating-uuid",
  "orderId": "order-uuid",
  "raterId": "sme-owner-uuid",
  "ratedId": "consumer-uuid",
  "ratingType": "sme_to_consumer",
  "stars": 5,
  "feedback": "Great customer, prompt payment and communication.",
  "criteria": {
    "paymentTimeliness": 5,
    "communication": 5,
    "compliance": 5
  },
  "createdAt": "2024-01-15T15:00:00Z"
}
```

**Business Logic:**
- Verifies order exists and SME owns the business
- Checks order status is `delivered` or `completed`
- Prevents duplicate ratings for same order
- Contributes to consumer trust score
- Visible to other SMEs when processing orders

**Error Responses:**
- 400: Order not completed, invalid consumer ID
- 403: Not authorized (not business owner)
- 404: Order not found
- 409: Duplicate rating

---

### GET /api/v1/ratings/business/:id

**Purpose:** Get all consumer ratings for a business.

**Authentication:** None (Public)

**URL Parameters:**
- `id` - Business UUID

**Query Parameters:**
- `minStars` - Filter by minimum stars (optional)
- `maxStars` - Filter by maximum stars (optional)
- `limit` - Results per page (default: 50)
- `offset` - Pagination offset (default: 0)

**Response (200 OK):**
```json
[
  {
    "id": "rating-uuid",
    "orderId": "order-uuid",
    "raterId": "consumer-uuid",
    "raterEmail": "customer@example.com",
    "stars": 5,
    "review": "Excellent service!",
    "criteria": {
      "productQuality": 5,
      "service": 5,
      "value": 4
    },
    "createdAt": "2024-01-15T15:00:00Z"
  }
]
```

**Error Responses:**
- 404: Business not found

---

### GET /api/v1/ratings/consumer/:id/trust-score

**Purpose:** Get consumer's trust score based on SME ratings.

**Authentication:** Required (SME only)

**URL Parameters:**
- `id` - Consumer UUID

**Response (200 OK):**
```json
{
  "consumerId": "consumer-uuid",
  "overallScore": 4.8,
  "totalRatings": 15,
  "breakdown": {
    "paymentTimeliness": 4.9,
    "communication": 4.7,
    "compliance": 4.8
  }
}
```

**Calculation:**
- Averages all SME ratings for the consumer
- Calculates breakdown by criteria
- Returns 0 score if no ratings exist

**Use Case:**
- Helps SMEs identify trustworthy customers
- Displayed when processing orders
- Influences business decisions

**Error Responses:**
- 404: Consumer not found

---

## Notification Endpoints

### GET /api/v1/notifications

**Purpose:** Get user's notification history.

**Authentication:** Required

**Query Parameters:**
- `read` - Filter by read status: "true", "false", or omit for all (optional)
- `type` - Filter by notification type (optional)
- `limit` - Results per page (default: 50)
- `offset` - Pagination offset (default: 0)

**Response (200 OK):**
```json
[
  {
    "id": "notification-uuid",
    "userId": "user-uuid",
    "type": "new_order",
    "title": "New Order Received",
    "message": "You have a new order from customer@example.com for $599.98",
    "priority": "high",
    "read": false,
    "createdAt": "2024-01-15T10:30:00Z"
  },
  {
    "id": "notification-uuid-2",
    "userId": "user-uuid",
    "type": "order_status_change",
    "title": "Order Status Updated",
    "message": "Your order from Tech Store is now confirmed",
    "priority": "medium",
    "read": true,
    "createdAt": "2024-01-15T09:00:00Z"
  }
]
```

**Notification Types:**
- `new_order` - Business owner receives when order is placed
- `order_status_change` - Consumer receives when order status updates
- `message` - New message received (future)
- `review` - New review received (future)
- `low_inventory` - Product stock is low (future)
- `payment` - Payment-related notifications (future)
- `delivery_update` - Delivery status updates (future)

**Priority Levels:**
- `low` - Non-urgent notifications
- `medium` - Standard notifications
- `high` - Urgent notifications (new orders, payment issues)

**Example:**
```bash
curl -X GET "http://localhost:5000/api/v1/notifications?read=false&limit=20" \
  -H "Authorization: Bearer <token>"
```

---

### PATCH /api/v1/notifications/:id/read

**Purpose:** Mark notification as read.

**Authentication:** Required

**URL Parameters:**
- `id` - Notification UUID

**Response (200 OK):**
```json
{
  "id": "notification-uuid",
  "userId": "user-uuid",
  "type": "new_order",
  "title": "New Order Received",
  "message": "You have a new order from customer@example.com for $599.98",
  "priority": "high",
  "read": true,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**
- 403: Not authorized (not notification owner)
- 404: Notification not found

---

### GET /api/v1/notifications/unread/count

**Purpose:** Get count of unread notifications.

**Authentication:** Required

**Response (200 OK):**
```json
{
  "count": 5
}
```

**Use Case:**
- Display badge count in UI
- Lightweight endpoint for frequent polling
- No pagination needed

---

## Automatic Notification Triggers

Notifications are automatically created by the system for these events:

### New Order Notification
- **Trigger:** Order created
- **Recipient:** Business owner
- **Type:** `new_order`
- **Priority:** `high`
- **Message:** "You have a new order from {consumerEmail} for ${totalAmount}"

### Order Status Change Notification
- **Trigger:** Order status updated
- **Recipient:** Consumer
- **Type:** `order_status_change`
- **Priority:** `medium`
- **Message:** "Your order from {businessName} is now {status}"

---

## Implementation Notes

### Order Service
- Uses database transactions for atomicity
- Validates inventory before order creation
- Automatically deducts inventory on confirmation
- Restores inventory on cancellation
- Splits multi-vendor carts into separate orders
- Triggers notifications via `notificationUtils`

### Rating Service
- Prevents duplicate ratings per order
- Validates order completion before allowing rating
- Updates aggregate ratings automatically
- Stores flexible criteria as JSONB
- Calculates trust scores on-demand

### Notification Service
- Stores notifications in database for persistence
- Supports read/unread tracking
- Provides filtering and pagination
- Currently implements in-app notifications only
- Email, SMS, and push notifications planned for future

### Future Enhancements
- Email notification delivery
- SMS notification delivery
- Push notification delivery
- Notification preferences management
- Batching of non-urgent notifications
- WebSocket real-time delivery
- Notification templates
