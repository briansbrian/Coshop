# State Management Documentation

This directory contains Zustand stores for global state management in the CoShop frontend.

## Available Stores

### Auth Store (`authStore.js`)

Manages authentication state and user information.

**State:**
- `user` - Current user object
- `accessToken` - JWT access token
- `refreshToken` - JWT refresh token
- `isAuthenticated` - Boolean authentication status

**Actions:**
- `setAuth(user, accessToken, refreshToken)` - Set authentication data
- `updateUser(userData)` - Update user information
- `logout()` - Clear authentication and logout
- `clearAuth()` - Clear all auth data

**Usage:**
```javascript
import { useAuthStore } from './store';

function LoginComponent() {
  const { setAuth, isAuthenticated, user } = useAuthStore();
  
  const handleLogin = async (credentials) => {
    const { user, accessToken, refreshToken } = await authService.login(credentials);
    setAuth(user, accessToken, refreshToken);
  };
  
  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {user.email}</p>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
```

### Cart Store (`cartStore.js`)

Manages shopping cart state and operations.

**State:**
- `items` - Array of cart items with product and quantity

**Actions:**
- `addItem(product, quantity)` - Add product to cart
- `removeItem(productId)` - Remove product from cart
- `updateQuantity(productId, quantity)` - Update item quantity
- `clearCart()` - Clear all items from cart
- `getItemCount()` - Get total number of items
- `getTotalPrice()` - Get total cart price
- `getItemsByBusiness()` - Get items grouped by business

**Usage:**
```javascript
import { useCartStore } from './store';

function ProductCard({ product }) {
  const { addItem, items } = useCartStore();
  
  const handleAddToCart = () => {
    addItem(product, 1);
  };
  
  return (
    <div>
      <h3>{product.name}</h3>
      <p>${product.price}</p>
      <button onClick={handleAddToCart}>Add to Cart</button>
    </div>
  );
}

function CartSummary() {
  const { items, getTotalPrice, getItemCount } = useCartStore();
  
  return (
    <div>
      <p>Items: {getItemCount()}</p>
      <p>Total: ${getTotalPrice().toFixed(2)}</p>
    </div>
  );
}
```

### Notification Store (`notificationStore.js`)

Manages notifications and unread counts.

**State:**
- `notifications` - Array of notification objects
- `unreadCount` - Number of unread notifications

**Actions:**
- `addNotification(notification)` - Add new notification
- `setNotifications(notifications)` - Set all notifications
- `markAsRead(notificationId)` - Mark notification as read
- `markAllAsRead()` - Mark all notifications as read
- `removeNotification(notificationId)` - Remove notification
- `clearNotifications()` - Clear all notifications
- `getUnreadNotifications()` - Get unread notifications
- `getNotificationsByType(type)` - Get notifications by type

**Usage:**
```javascript
import { useNotificationStore } from './store';

function NotificationBell() {
  const { unreadCount, notifications, markAsRead } = useNotificationStore();
  
  return (
    <div>
      <button>
        Notifications ({unreadCount})
      </button>
      <div>
        {notifications.map(notif => (
          <div key={notif.id} onClick={() => markAsRead(notif.id)}>
            <p>{notif.title}</p>
            <p>{notif.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Store Persistence

The auth store automatically persists tokens to localStorage:
- Access token stored as `accessToken`
- Refresh token stored as `refreshToken`

Cart and notification stores are in-memory only. For persistence, you can extend them with localStorage or use Zustand's persist middleware.

## Best Practices

1. **Use selectors for performance:**
```javascript
// Good - only re-renders when user changes
const user = useAuthStore(state => state.user);

// Less optimal - re-renders on any auth store change
const { user } = useAuthStore();
```

2. **Access actions outside components:**
```javascript
import { useAuthStore } from './store';

// In utility functions or API interceptors
const logout = () => {
  useAuthStore.getState().logout();
};
```

3. **Combine with API services:**
```javascript
import { useAuthStore } from './store';
import { authService } from './services';

const handleLogin = async (credentials) => {
  try {
    const data = await authService.login(credentials);
    useAuthStore.getState().setAuth(data.user, data.accessToken, data.refreshToken);
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

## Testing Stores

Zustand stores can be easily tested:

```javascript
import { useAuthStore } from './authStore';

describe('Auth Store', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('should set authentication', () => {
    const { setAuth, isAuthenticated } = useAuthStore.getState();
    
    setAuth(
      { id: '1', email: 'test@example.com' },
      'access-token',
      'refresh-token'
    );
    
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });
});
```
