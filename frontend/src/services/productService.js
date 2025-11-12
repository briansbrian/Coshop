import apiClient from '../utils/apiClient';

const productService = {
  /**
   * Create a new product
   */
  createProduct: async (productData) => {
    const response = await apiClient.post('/products', productData);
    return response.data;
  },

  /**
   * Get product by ID
   */
  getProductById: async (productId) => {
    const response = await apiClient.get(`/products/${productId}`);
    return response.data;
  },

  /**
   * Update product
   */
  updateProduct: async (productId, updates) => {
    const response = await apiClient.put(`/products/${productId}`, updates);
    return response.data;
  },

  /**
   * Delete product
   */
  deleteProduct: async (productId) => {
    const response = await apiClient.delete(`/products/${productId}`);
    return response.data;
  },

  /**
   * Update product inventory
   */
  updateInventory: async (productId, quantity) => {
    const response = await apiClient.patch(`/products/${productId}/inventory`, {
      quantity,
    });
    return response.data;
  },

  /**
   * Search products with filters
   */
  searchProducts: async (searchParams) => {
    const response = await apiClient.get('/products/search', {
      params: searchParams,
    });
    return response.data;
  },

  /**
   * Upload product images
   */
  uploadImages: async (productId, images) => {
    const formData = new FormData();
    images.forEach((image) => {
      formData.append('images', image);
    });

    const response = await apiClient.post(
      `/products/${productId}/images`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },
};

export default productService;
