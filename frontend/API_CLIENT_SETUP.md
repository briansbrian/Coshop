# API Client and State Management Setup

This document describes the API client and state management implementation for the CoShop Marketplace frontend.

## Overview

The frontend uses:
- **Axios** for HTTP requests with automatic JWT token handling
- **Zustand** for lightweight state management
- **Service modules** for organized API communication

## Architecture

```
frontend/src/
├── utils/
│   └── apiClient.js          # Configured axios instance
├── store/
│   ├── authStore.js          # Authentication state
│   ├── cartStore.js          # Shopping cart state
│   ├── notificationStore.js  # Notifications state
│   └── index.js              # Store exports
├── services/
│   ├── authService.js        # Authentication API
│   ├── businessService.js    # Business management API
│   ├── productService.js     # Product/inventory API
│   ├── orderService.js       # Order management API
│   ├── ratingService.js      # Rating/review API
│   ├── messageService.js     # Messaging API
│   ├── notificationService.js # Notification API
│   ├── geolocationService.js # Geolocation API
│   ├── paymentService.js     # Payment processing API
│   ├── deliveryService.js    # Delivery integration API
│   ├── analyticsService.js   # Analytics API
│   ├── uploadService.js      # File upload API
│   └── index.js              # Service exports
└── examples/
    └── ApiUsageExample.jsx   # Usage examples
```

## API Client Features

### 1. Base Configuration
- Base URL from environment variable `VITE_API_URL`
- 10-second timeout
- JSON content type by default

### 2. Request Interceptor
- Automatically adds JWT token to Authorization header
- Reads token from localStorage

### 3. Response Interceptor
- Handles 401 (Unauthorized) responses
- Automatically refreshes expired tokens
- Retries failed requests with new token
- Redirects to login on refresh failure

### 4. Error Handling
All API errors follow this structure:
```javascript
{
  error: {
    code: string,
    message: string,
    details?: any,
    timestamp: string
  }
}
```

## State Management

### Auth Store
Manages user authentication and session:
```javascript
import { useAuthStore } from './store';

const { user, isAuthenticated, setAuth, logout } = useAuthStore();
```

**State:**
- `user` - Current user object
- `accessToken` - JWT access token
- `refreshToken` - JWT refresh token
- `isAuthenticated` - Authentication status

**Actions:**
- `setAuth(user, accessToken, refreshToken)` - Set auth data
- `updateUser(userData)` - Update user info
- `logout()` - Clear auth and logout
- `clearAuth()` - Clear all auth data

### Cart Store
Manages shopping cart:
```javascript
import { useCartStore } from './store';

const { items, addItem, getTotalPrice } = useCartStore();
```

**State:**
- `items` - Array of cart items

**Actions:**
- `addItem(product, quantity)` - Add to cart
- `removeItem(productId)` - Remove from cart
- `updateQuantity(productId, quantity)` - Update quantity
- `clearCart()` - Clear cart
- `getItemCount()` - Get total items
- `getTotalPrice()` - Get total price
- `getItemsByBusiness()` - Group by business

### Notification Store
Manages notifications:
```javascript
import { useNotificationStore } from './store';

const { notifications, unreadCount, markAsRead } = useNotificationStore();
```

**State:**
- `notifications` - Array of notifications
- `unreadCount` - Unread count

**Actions:**
- `addNotification(notification)` - Add notification
- `setNotifications(notifications)` - Set all notifications
- `markAsRead(notificationId)` - Mark as read
- `markAllAsRead()` - Mark all as read
- `removeNotification(notificationId)` - Remove notification
- `clearNotifications()` - Clear all
- `getUnreadNotifications()` - Get unread
- `getNotificationsByType(type)` - Filter by type

## Service Modules

Each service module provides methods for a specific domain:

### Authentication Service
```javascript
import { authService } from './services';

// Register
await authService.register({
  email: 'user@example.com',
  password: 'password123',
  userType: 'consumer'
});

// Login
const { user, accessToken, refreshToken } = await authService.login({
  email: 'user@example.com',
  password: 'password123'
});
```

### Product Service
```javascript
import { productService } from './services';

// Search products
const products = await productService.searchProducts({
  keyword: 'laptop',
  category: 'electronics',
  minPrice: 100,
  maxPrice: 1000,
  sortBy: 'price'
});

// Get product details
const product = await productService.getProductById('product-id');
```

### Order Service
```javascript
import { orderService } from './services';

// Create order
const order = await orderService.createOrder({
  items: [
    { productId: 'prod-1', quantity: 2 },
    { productId: 'prod-2', quantity: 1 }
  ],
  deliveryMethod: 'delivery'
});

// Get order history
const orders = await orderService.getOrderHistory();
```

### Geolocation Service
```javascript
import { geolocationService } from './services';

// Get current location
const location = await geolocationService.getCurrentLocation();

// Find nearby businesses
const businesses = await geolocationService.getNearbyBusinesses(
  location.latitude,
  location.longitude,
  5000, // 5km radius
  { businessType: 'shop', verified: true }
);
```

## Usage Patterns

### 1. Authentication Flow
```javascript
import { useAuthStore } from './store';
import { authService } from './services';

function LoginPage() {
  const setAuth = useAuthStore(state => state.setAuth);
  
  const handleLogin = async (credentials) => {
    try {
      const data = await authService.login(credentials);
      setAuth(data.user, data.accessToken, data.refreshToken);
      // Redirect to dashboard
    } catch (error) {
      console.error('Login failed:', error);
    }
  };
  
  return <LoginForm onSubmit={handleLogin} />;
}
```

### 2. Shopping Cart Flow
```javascript
import { useCartStore } from './store';
import { orderService } from './services';

function CheckoutPage() {
  const { items, clearCart, getItemsByBusiness } = useCartStore();
  
  const handleCheckout = async () => {
    try {
      // Group items by business (separate orders per SME)
      const businessGroups = getItemsByBusiness();
      
      // Create order for each business
      for (const group of businessGroups) {
        await orderService.createOrder({
          businessId: group.businessId,
          items: group.items.map(item => ({
            productId: item.product.id,
            quantity: item.quantity
          })),
          deliveryMethod: 'delivery'
        });
      }
      
      clearCart();
      // Redirect to order confirmation
    } catch (error) {
      console.error('Checkout failed:', error);
    }
  };
  
  return <CheckoutForm onSubmit={handleCheckout} />;
}
```

### 3. Real-time Notifications
```javascript
import { useEffect } from 'react';
import { useNotificationStore } from './store';
import { notificationService } from './services';

function NotificationBell() {
  const { notifications, unreadCount, setNotifications } = useNotificationStore();
  
  useEffect(() => {
    // Load notifications on mount
    const loadNotifications = async () => {
      const notifs = await notificationService.getNotifications();
      setNotifications(notifs);
    };
    
    loadNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div>
      <button>
        🔔 {unreadCount > 0 && <span>{unreadCount}</span>}
      </button>
      {/* Notification dropdown */}
    </div>
  );
}
```

### 4. Protected Routes
```javascript
import { Navigate } from 'react-router-dom';
import { useAuthStore } from './store';

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

// Usage
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

## Environment Configuration

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_WS_URL=ws://localhost:5000
VITE_GOOGLE_MAPS_API_KEY=your_api_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key
```

## Error Handling Best Practices

```javascript
import { authService } from './services';

async function handleApiCall() {
  try {
    const result = await authService.login(credentials);
    return result;
  } catch (error) {
    if (error.response) {
      // Server responded with error status
      const { code, message } = error.response.data.error;
      console.error(`Error ${code}: ${message}`);
      
      // Handle specific error codes
      if (code === 'INVALID_CREDENTIALS') {
        // Show error to user
      }
    } else if (error.request) {
      // Request made but no response received
      console.error('Network error - no response from server');
    } else {
      // Other errors
      console.error('Error:', error.message);
    }
    
    throw error; // Re-throw if needed
  }
}
```

## Testing

### Testing Services
```javascript
import { authService } from './services';
import apiClient from './utils/apiClient';

jest.mock('./utils/apiClient');

describe('authService', () => {
  it('should login successfully', async () => {
    const mockResponse = {
      data: {
        user: { id: '1', email: 'test@example.com' },
        accessToken: 'token',
        refreshToken: 'refresh'
      }
    };
    
    apiClient.post.mockResolvedValue(mockResponse);
    
    const result = await authService.login({
      email: 'test@example.com',
      password: 'password'
    });
    
    expect(result).toEqual(mockResponse.data);
  });
});
```

### Testing Stores
```javascript
import { useAuthStore } from './store/authStore';

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });
  
  it('should set authentication', () => {
    const { setAuth } = useAuthStore.getState();
    
    setAuth(
      { id: '1', email: 'test@example.com' },
      'access-token',
      'refresh-token'
    );
    
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user.email).toBe('test@example.com');
  });
});
```

## Next Steps

1. Implement WebSocket connection for real-time features (messaging, notifications)
2. Add offline support with service workers
3. Implement request caching for better performance
4. Add request retry logic for failed requests
5. Implement optimistic updates for better UX

## References

- [Axios Documentation](https://axios-http.com/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [React Router Documentation](https://reactrouter.com/)
