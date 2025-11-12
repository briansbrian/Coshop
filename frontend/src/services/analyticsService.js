import apiClient from '../utils/apiClient';

const analyticsService = {
  /**
   * Get business metrics
   */
  getBusinessMetrics: async (businessId, startDate, endDate) => {
    const response = await apiClient.get(`/analytics/business/${businessId}`, {
      params: {
        start_date: startDate,
        end_date: endDate,
      },
    });
    return response.data;
  },

  /**
   * Get product performance metrics
   */
  getProductPerformance: async (businessId) => {
    const response = await apiClient.get(
      `/analytics/business/${businessId}/products`
    );
    return response.data;
  },

  /**
   * Get customer demographics
   */
  getCustomerDemographics: async (businessId) => {
    const response = await apiClient.get(
      `/analytics/business/${businessId}/demographics`
    );
    return response.data;
  },

  /**
   * Export analytics data
   */
  exportData: async (businessId, format = 'csv') => {
    const response = await apiClient.get(
      `/analytics/business/${businessId}/export`,
      {
        params: { format },
        responseType: 'blob',
      }
    );
    return response.data;
  },

  /**
   * Get sales trends
   */
  getSalesTrends: async (businessId, period = 'monthly') => {
    const response = await apiClient.get(
      `/analytics/business/${businessId}/trends`,
      {
        params: { period },
      }
    );
    return response.data;
  },
};

export default analyticsService;
