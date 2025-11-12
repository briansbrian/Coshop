import apiClient from '../utils/apiClient';

const deliveryService = {
  /**
   * Get available delivery options for an order
   */
  getDeliveryOptions: async (orderId) => {
    const response = await apiClient.get('/delivery/options', {
      params: { orderId },
    });
    return response.data;
  },

  /**
   * Book delivery for an order
   */
  bookDelivery: async (orderId, deliveryServiceId, deliveryDetails) => {
    const response = await apiClient.post('/delivery/book', {
      orderId,
      deliveryServiceId,
      ...deliveryDetails,
    });
    return response.data;
  },

  /**
   * Track delivery
   */
  trackDelivery: async (deliveryId) => {
    const response = await apiClient.get(`/delivery/track/${deliveryId}`);
    return response.data;
  },

  /**
   * Cancel delivery
   */
  cancelDelivery: async (deliveryId, reason) => {
    const response = await apiClient.post(`/delivery/${deliveryId}/cancel`, {
      reason,
    });
    return response.data;
  },

  /**
   * Get delivery history
   */
  getDeliveryHistory: async (filters = {}) => {
    const response = await apiClient.get('/delivery/history', {
      params: filters,
    });
    return response.data;
  },
};

export default deliveryService;
