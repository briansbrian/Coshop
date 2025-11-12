import apiClient from '../utils/apiClient';

const messageService = {
  /**
   * Send a message
   */
  sendMessage: async (receiverId, content) => {
    const response = await apiClient.post('/messages', {
      receiverId,
      content,
    });
    return response.data;
  },

  /**
   * Get all conversations for current user
   */
  getConversations: async () => {
    const response = await apiClient.get('/messages/conversations');
    return response.data;
  },

  /**
   * Get conversation with specific user
   */
  getConversation: async (userId) => {
    const response = await apiClient.get(`/messages/conversation/${userId}`);
    return response.data;
  },

  /**
   * Mark message as read
   */
  markAsRead: async (messageId) => {
    const response = await apiClient.patch(`/messages/${messageId}/read`);
    return response.data;
  },

  /**
   * Get unread message count
   */
  getUnreadCount: async () => {
    const response = await apiClient.get('/messages/unread/count');
    return response.data;
  },
};

export default messageService;
