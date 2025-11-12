import apiClient from '../utils/apiClient';

const orderService = {
  /**
   * Create a new order
   */
  createOrder: async (orderData) => {
    const response = await apiClient.post('/orders', orderData);
    return response.data;
  },

  /**
   * Get order by ID
   */
  getOrderById: async (orderId) => {
    const response = await apiClient.get(`/orders/${orderId}`);
    return response.data;
  },

  /**
   * Get orders for current user (consumer or SME)
   */
  getOrders: async (filters = {}) => {
    const response = await apiClient.get('/orders', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Update order status (SME only)
   */
  updateOrderStatus: async (orderId, status) => {
    const response = await apiClient.patch(`/orders/${orderId}/status`, {
      status,
    });
    return response.data;
  },

  /**
   * Cancel order
   */
  cancelOrder: async (orderId, reason) => {
    const response = await apiClient.patch(`/orders/${orderId}/cancel`, {
      reason,
    });
    return response.data;
  },

  /**
   * Get order history for consumer
   */
  getOrderHistory: async () => {
    const response = await apiClient.get('/orders/history');
    return response.data;
  },
};

export default orderService;
