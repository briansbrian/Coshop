# Order Management for Consumers

This implementation provides comprehensive order management functionality for consumers, including order history, detailed order tracking, and rating capabilities.

## Components

### 1. OrderHistoryPage
**Location:** `frontend/src/pages/OrderHistoryPage.jsx`

A comprehensive order history page that displays all consumer orders with filtering capabilities.

**Features:**
- Displays all orders with status badges
- Filter tabs: All Orders, Active, Completed, Cancelled
- Order cards showing:
  - Order ID and date
  - Business name (with link)
  - Item preview (first 2 items + count)
  - Total amount
  - Current status
  - Action buttons (View Details, Rate Order)
- Empty state with call-to-action
- Loading and error states
- Responsive design for mobile and desktop

**API Integration:**
- `orderService.getOrders()` - Fetches all orders for the current user

### 2. OrderDetailPage
**Location:** `frontend/src/pages/OrderDetailPage.jsx`

Detailed view of a single order with status tracking and rating functionality.

**Features:**
- Order header with ID, date, and status
- Business information with link
- Visual status tracking timeline:
  - Order Placed → Confirmed → Ready → Out for Delivery → Delivered
  - Progress bar showing completion
  - Current status highlighted
- Complete order items list with pricing
- Delivery information (method, address, contact)
- Rating prompt for delivered orders
- Cancelled order messaging
- Navigation back to order history
- Link to business profile

**Status Tracking:**
- Visual progress indicator
- Step-by-step status display
- Contextual messages for each status
- Special handling for cancelled orders

**API Integration:**
- `orderService.getOrderById(orderId)` - Fetches order details

### 3. RatingModal
**Location:** `frontend/src/components/RatingModal.jsx`

Modal component for rating orders after delivery.

**Features:**
- Overall star rating (1-5 stars, required)
- Detailed criteria ratings (optional):
  - Product Quality
  - Service
  - Value for Money
- Written review text area (optional)
- Interactive star hover effects
- Rating labels (Poor, Fair, Good, Very Good, Excellent)
- Form validation
- Loading state during submission
- Error handling with user feedback

**API Integration:**
- `ratingService.createRating(ratingData)` - Submits rating

**Rating Data Structure:**
```javascript
{
  orderId: string,
  businessId: string,
  stars: number (1-5),
  review: string,
  criteria: {
    productQuality: number,
    service: number,
    value: number
  }
}
```

## Routes

### Order History
- **Path:** `/orders`
- **Protection:** Consumer only
- **Component:** `OrderHistoryPage`

### Order Details
- **Path:** `/orders/:orderId`
- **Protection:** Consumer only
- **Component:** `OrderDetailPage`
- **Query Params:** 
  - `?rate=true` - Opens rating modal automatically

## User Flow

### Viewing Orders
1. Consumer navigates to "My Orders" from navigation
2. Sees list of all orders with filter tabs
3. Can filter by: All, Active, Completed, Cancelled
4. Each order card shows summary information
5. Click "View Details" to see full order information

### Order Details
1. Consumer clicks on an order card
2. Sees complete order information:
   - Status tracking timeline
   - All order items with prices
   - Delivery information
   - Business details
3. Can navigate to business profile
4. For delivered orders, sees rating prompt

### Rating an Order
1. After order is delivered, rating prompt appears
2. Consumer can click "Rate Order" button
3. Rating modal opens with:
   - Overall rating (required)
   - Detailed criteria ratings (optional)
   - Written review (optional)
4. Submit rating
5. Order updates to show rating has been given
6. Rating prompt no longer appears

## Status Colors

The implementation uses consistent color coding for order statuses:

- **Pending:** Yellow (bg-yellow-100 text-yellow-800)
- **Confirmed:** Blue (bg-blue-100 text-blue-800)
- **Ready:** Purple (bg-purple-100 text-purple-800)
- **Out for Delivery:** Indigo (bg-indigo-100 text-indigo-800)
- **Delivered:** Green (bg-green-100 text-green-800)
- **Cancelled:** Red (bg-red-100 text-red-800)

## Requirements Satisfied

This implementation satisfies the following requirements from the spec:

- **Requirement 9.1:** Display order status updates (pending, confirmed, ready for pickup, out for delivery, delivered)
- **Requirement 9.4:** Provide an order history view for consumers to track past and current orders
- **Requirement 11.1:** Prompt consumers to rate the SME and product after order completion

## Mobile Responsiveness

All components are fully responsive:
- Flexible layouts that adapt to screen size
- Touch-friendly buttons and interactive elements
- Optimized spacing for mobile devices
- Horizontal scrolling prevention
- Readable text sizes on all devices

## Error Handling

- Network errors display user-friendly messages
- Failed API calls show retry options
- Missing orders redirect to order history
- Form validation prevents invalid submissions
- Loading states prevent duplicate submissions

## Future Enhancements

Potential improvements for future iterations:
- Real-time order status updates via WebSocket
- Order cancellation functionality
- Reorder functionality
- Order filtering by date range
- Export order history
- Print order receipts
- Push notifications for status changes
- Order search functionality
