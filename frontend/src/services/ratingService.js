import apiClient from '../utils/apiClient';

const ratingService = {
  /**
   * Create a rating (consumer to SME or SME to consumer)
   */
  createRating: async (ratingData) => {
    const response = await apiClient.post('/ratings', ratingData);
    return response.data;
  },

  /**
   * Get ratings for a business
   */
  getBusinessRatings: async (businessId, params = {}) => {
    const response = await apiClient.get(`/businesses/${businessId}/ratings`, {
      params,
    });
    return response.data;
  },

  /**
   * Get consumer trust score
   */
  getConsumerTrustScore: async (consumerId) => {
    const response = await apiClient.get(`/consumers/${consumerId}/trust-score`);
    return response.data;
  },

  /**
   * Respond to a review (SME only)
   */
  respondToReview: async (ratingId, response) => {
    const responseData = await apiClient.post(`/ratings/${ratingId}/response`, {
      response,
    });
    return responseData.data;
  },

  /**
   * Get ratings given by current user
   */
  getMyRatings: async () => {
    const response = await apiClient.get('/ratings/my-ratings');
    return response.data;
  },
};

export default ratingService;
