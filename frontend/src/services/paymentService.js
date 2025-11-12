import apiClient from '../utils/apiClient';

const paymentService = {
  /**
   * Create payment intent for order
   */
  createPaymentIntent: async (orderId, paymentMethod) => {
    const response = await apiClient.post('/payments/create-intent', {
      orderId,
      paymentMethod,
    });
    return response.data;
  },

  /**
   * Confirm payment
   */
  confirmPayment: async (paymentIntentId) => {
    const response = await apiClient.post('/payments/confirm', {
      paymentIntentId,
    });
    return response.data;
  },

  /**
   * Get payment history
   */
  getPaymentHistory: async (filters = {}) => {
    const response = await apiClient.get('/payments/history', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Get payment details
   */
  getPaymentDetails: async (paymentId) => {
    const response = await apiClient.get(`/payments/${paymentId}`);
    return response.data;
  },

  /**
   * Request refund
   */
  requestRefund: async (paymentId, reason) => {
    const response = await apiClient.post(`/payments/${paymentId}/refund`, {
      reason,
    });
    return response.data;
  },
};

export default paymentService;
