import apiClient from '../utils/apiClient';

const notificationService = {
  /**
   * Get all notifications for current user
   */
  getNotifications: async (params = {}) => {
    const response = await apiClient.get('/notifications', {
      params,
    });
    return response.data;
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (notificationId) => {
    const response = await apiClient.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  /**
   * Mark all notifications as read
   * Note: If backend doesn't support bulk operation, falls back to individual marking
   */
  markAllAsRead: async () => {
    try {
      const response = await apiClient.patch('/notifications/read-all');
      return response.data;
    } catch (error) {
      // Fallback: If endpoint doesn't exist, mark individually
      if (error.response?.status === 404) {
        const notificationsResponse = await apiClient.get('/notifications', {
          params: { read: false }
        });
        const unreadNotifications = notificationsResponse.data.notifications || [];
        
        // Mark each unread notification as read
        await Promise.all(
          unreadNotifications.map(notification => 
            apiClient.patch(`/notifications/${notification.id}/read`)
          )
        );
        
        return { message: 'All notifications marked as read' };
      }
      throw error;
    }
  },

  /**
   * Get unread notification count
   */
  getUnreadCount: async () => {
    const response = await apiClient.get('/notifications/unread/count');
    return response.data;
  },

  /**
   * Update notification preferences
   */
  updatePreferences: async (preferences) => {
    const response = await apiClient.put('/notifications/preferences', preferences);
    return response.data;
  },

  /**
   * Get notification preferences
   */
  getPreferences: async () => {
    const response = await apiClient.get('/notifications/preferences');
    return response.data;
  },

  /**
   * Delete notification
   */
  deleteNotification: async (notificationId) => {
    const response = await apiClient.delete(`/notifications/${notificationId}`);
    return response.data;
  },
};

export default notificationService;
