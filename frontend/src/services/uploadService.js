import apiClient from '../utils/apiClient';

const uploadService = {
  /**
   * Upload single file
   */
  uploadFile: async (file, type = 'image') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await apiClient.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Upload multiple files
   */
  uploadFiles: async (files, type = 'image') => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('type', type);

    const response = await apiClient.post('/upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Delete uploaded file
   */
  deleteFile: async (fileUrl) => {
    const response = await apiClient.delete('/upload', {
      data: { fileUrl },
    });
    return response.data;
  },
};

export default uploadService;
