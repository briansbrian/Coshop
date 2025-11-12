import React, { useState, useEffect } from 'react';
import { useAuthStore, useCartStore, useNotificationStore } from '../store';
import {
  authService,
  productService,
  orderService,
  notificationService,
} from '../services';

/**
 * Example component demonstrating API client and state management usage
 * This is for reference only and should not be used in production
 */
function ApiUsageExample() {
  const { user, isAuthenticated, setAuth, logout } = useAuthStore();
  const { items, addItem, getTotalPrice, getItemCount } = useCartStore();
  const { notifications, unreadCount, setNotifications } = useNotificationStore();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Example: Fetch notifications on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated]);

  // Example: Login
  const handleLogin = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authService.login({ email, password });
      setAuth(response.user, response.accessToken, response.refreshToken);
      
      console.log('Login successful:', response.user);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Login failed');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Example: Search products
  const searchProducts = async (keyword) => {
    try {
      setLoading(true);
      setError(null);
      
      const results = await productService.searchProducts({
        keyword,
        sortBy: 'price',
      });
      
      setProducts(results);
      console.log('Products found:', results);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Search failed');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Example: Add product to cart
  const handleAddToCart = (product) => {
    addItem(product, 1);
    console.log('Added to cart:', product.name);
  };

  // Example: Create order
  const handleCheckout = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const orderData = {
        items: items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        deliveryMethod: 'delivery',
      };
      
      const order = await orderService.createOrder(orderData);
      console.log('Order created:', order);
      
      // Clear cart after successful order
      useCartStore.getState().clearCart();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Checkout failed');
      console.error('Checkout error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Example: Fetch notifications
  const fetchNotifications = async () => {
    try {
      const notifs = await notificationService.getNotifications();
      setNotifications(notifs);
      console.log('Notifications loaded:', notifs);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  // Example: Mark notification as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      useNotificationStore.getState().markAsRead(notificationId);
      console.log('Notification marked as read');
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">API Usage Examples</h1>
      
      {/* Authentication Status */}
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-semibold mb-2">Authentication</h2>
        {isAuthenticated ? (
          <div>
            <p>Logged in as: {user?.email}</p>
            <button
              onClick={logout}
              className="mt-2 px-4 py-2 bg-red-500 text-white rounded"
            >
              Logout
            </button>
          </div>
        ) : (
          <div>
            <p>Not logged in</p>
            <button
              onClick={() => handleLogin('test@example.com', 'password123')}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
            >
              Login (Demo)
            </button>
          </div>
        )}
      </div>

      {/* Cart Status */}
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-semibold mb-2">Shopping Cart</h2>
        <p>Items: {getItemCount()}</p>
        <p>Total: ${getTotalPrice().toFixed(2)}</p>
        {items.length > 0 && (
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="mt-2 px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
          >
            Checkout
          </button>
        )}
      </div>

      {/* Notifications */}
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-semibold mb-2">
          Notifications ({unreadCount} unread)
        </h2>
        <div className="space-y-2">
          {notifications.slice(0, 5).map((notif) => (
            <div
              key={notif.id}
              className={`p-2 rounded ${notif.read ? 'bg-white' : 'bg-blue-100'}`}
            >
              <p className="font-medium">{notif.title}</p>
              <p className="text-sm">{notif.message}</p>
              {!notif.read && (
                <button
                  onClick={() => handleMarkAsRead(notif.id)}
                  className="text-xs text-blue-600 mt-1"
                >
                  Mark as read
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Product Search */}
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-semibold mb-2">Product Search</h2>
        <input
          type="text"
          placeholder="Search products..."
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              searchProducts(e.target.value);
            }
          }}
          className="w-full p-2 border rounded mb-2"
        />
        <div className="space-y-2">
          {products.map((product) => (
            <div key={product.id} className="p-2 bg-white rounded flex justify-between">
              <div>
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-gray-600">${product.price}</p>
              </div>
              <button
                onClick={() => handleAddToCart(product)}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="p-4 bg-blue-100 text-blue-700 rounded">
          Loading...
        </div>
      )}
    </div>
  );
}

export default ApiUsageExample;
