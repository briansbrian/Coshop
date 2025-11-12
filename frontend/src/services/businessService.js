import apiClient from '../utils/apiClient';

const businessService = {
  /**
   * Register a new business
   */
  registerBusiness: async (businessData) => {
    const response = await apiClient.post('/businesses', businessData);
    return response.data;
  },

  /**
   * Get business by ID
   */
  getBusinessById: async (businessId) => {
    const response = await apiClient.get(`/businesses/${businessId}`);
    return response.data;
  },

  /**
   * Update business profile
   */
  updateBusiness: async (businessId, updates) => {
    const response = await apiClient.put(`/businesses/${businessId}`, updates);
    return response.data;
  },

  /**
   * Get nearby businesses
   */
  getNearbyBusinesses: async (latitude, longitude, radius, filters = {}) => {
    const response = await apiClient.get('/businesses/nearby', {
      params: {
        latitude,
        longitude,
        radius,
        ...filters,
      },
    });
    return response.data;
  },

  /**
   * Submit business verification documents
   */
  submitVerification: async (businessId, documents) => {
    const formData = new FormData();
    documents.forEach((doc) => {
      formData.append('documents', doc);
    });

    const response = await apiClient.post(
      `/businesses/${businessId}/verification`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Add staff member to business
   */
  addStaffMember: async (businessId, staffData) => {
    const response = await apiClient.post(
      `/businesses/${businessId}/staff`,
      staffData
    );
    return response.data;
  },

  /**
   * Remove staff member from business
   */
  removeStaffMember: async (businessId, staffId) => {
    const response = await apiClient.delete(
      `/businesses/${businessId}/staff/${staffId}`
    );
    return response.data;
  },

  /**
   * Get business ratings
   */
  getBusinessRatings: async (businessId) => {
    const response = await apiClient.get(`/businesses/${businessId}/ratings`);
    return response.data;
  },

  /**
   * Get business products
   */
  getBusinessProducts: async (businessId) => {
    const response = await apiClient.get(`/businesses/${businessId}/products`);
    return response.data;
  },
};

export default businessService;
