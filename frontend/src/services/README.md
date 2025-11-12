# API Services Documentation

This directory contains all API service modules for communicating with the CoShop backend.

## API Client

The `apiClient` (in `utils/apiClient.js`) is a configured axios instance with:

- Base URL from environment variable `VITE_API_URL`
- Automatic JWT token injection in request headers
- Token refresh logic on 401 responses
- Automatic redirect to login on authentication failure

## Available Services

### Authentication Service (`authService.js`)
- `register(userData)` - Register new user (SME or consumer)
- `login(credentials)` - Login with email/password
- `refreshToken(refreshToken)` - Refresh access token
- `requestPasswordReset(email)` - Request password reset
- `resetPassword(token, newPassword)` - Reset password
- `getCurrentUser()` - Get current user profile

### Business Service (`businessService.js`)
- `registerBusiness(businessData)` - Register new business
- `getBusinessById(businessId)` - Get business details
- `updateBusiness(businessId, updates)` - Update business profile
- `getNearbyBusinesses(lat, lng, radius, filters)` - Find nearby businesses
- `submitVerification(businessId, documents)` - Submit verification docs
- `addStaffMember(businessId, staffData)` - Add staff member
- `removeStaffMember(businessId, staffId)` - Remove staff member
- `getBusinessRatings(businessId)` - Get business ratings
- `getBusinessProducts(businessId)` - Get business products

### Product Service (`productService.js`)
- `createProduct(productData)` - Create new product
- `getProductById(productId)` - Get product details
- `updateProduct(productId, updates)` - Update product
- `deleteProduct(productId)` - Delete product
- `updateInventory(productId, quantity)` - Update inventory
- `searchProducts(searchParams)` - Search products with filters
- `uploadImages(productId, images)` - Upload product images

### Order Service (`orderService.js`)
- `createOrder(orderData)` - Create new order
- `getOrderById(orderId)` - Get order details
- `getOrders(filters)` - Get orders with filters
- `updateOrderStatus(orderId, status)` - Update order status (SME)
- `cancelOrder(orderId, reason)` - Cancel order
- `getOrderHistory()` - Get order history

### Rating Service (`ratingService.js`)
- `createRating(ratingData)` - Create rating (bidirectional)
- `getBusinessRatings(businessId, params)` - Get business ratings
- `getConsumerTrustScore(consumerId)` - Get consumer trust score
- `respondToReview(ratingId, response)` - Respond to review (SME)
- `getMyRatings()` - Get ratings given by current user

### Message Service (`messageService.js`)
- `sendMessage(receiverId, content)` - Send message
- `getConversations()` - Get all conversations
- `getConversation(userId)` - Get conversation with user
- `markAsRead(messageId)` - Mark message as read
- `getUnreadCount()` - Get unread message count

### Notification Service (`notificationService.js`)
- `getNotifications(params)` - Get notifications
- `markAsRead(notificationId)` - Mark notification as read
- `markAllAsRead()` - Mark all notifications as read
- `getUnreadCount()` - Get unread count
- `updatePreferences(preferences)` - Update notification preferences
- `getPreferences()` - Get notification preferences
- `deleteNotification(notificationId)` - Delete notification

### Geolocation Service (`geolocationService.js`)
- `getNearbyBusinesses(lat, lng, radius, filters)` - Get nearby businesses
- `geocodeAddress(address)` - Convert address to coordinates
- `reverseGeocode(lat, lng)` - Convert coordinates to address
- `calculateDistance(from, to)` - Calculate distance between points
- `getCurrentLocation()` - Get user's current location (browser API)

### Payment Service (`paymentService.js`)
- `createPaymentIntent(orderId, paymentMethod)` - Create payment intent
- `confirmPayment(paymentIntentId)` - Confirm payment
- `getPaymentHistory(filters)` - Get payment history
- `getPaymentDetails(paymentId)` - Get payment details
- `requestRefund(paymentId, reason)` - Request refund

### Delivery Service (`deliveryService.js`)
- `getDeliveryOptions(orderId)` - Get delivery options
- `bookDelivery(orderId, serviceId, details)` - Book delivery
- `trackDelivery(deliveryId)` - Track delivery
- `cancelDelivery(deliveryId, reason)` - Cancel delivery
- `getDeliveryHistory(filters)` - Get delivery history

### Analytics Service (`analyticsService.js`)
- `getBusinessMetrics(businessId, startDate, endDate)` - Get business metrics
- `getProductPerformance(businessId)` - Get product performance
- `getCustomerDemographics(businessId)` - Get customer demographics
- `exportData(businessId, format)` - Export analytics data
- `getSalesTrends(businessId, period)` - Get sales trends

### Upload Service (`uploadService.js`)
- `uploadFile(file, type)` - Upload single file
- `uploadFiles(files, type)` - Upload multiple files
- `deleteFile(fileUrl)` - Delete uploaded file

## Usage Example

```javascript
import { authService, productService } from './services';

// Login
const { user, accessToken, refreshToken } = await authService.login({
  email: 'user@example.com',
  password: 'password123'
});

// Search products
const products = await productService.searchProducts({
  keyword: 'laptop',
  category: 'electronics',
  minPrice: 100,
  maxPrice: 1000
});
```

## Error Handling

All services throw errors that should be caught and handled:

```javascript
try {
  const result = await authService.login(credentials);
} catch (error) {
  if (error.response) {
    // Server responded with error
    console.error(error.response.data.error);
  } else if (error.request) {
    // Request made but no response
    console.error('Network error');
  } else {
    // Other errors
    console.error(error.message);
  }
}
```
