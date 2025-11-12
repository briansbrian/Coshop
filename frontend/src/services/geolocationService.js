import apiClient from '../utils/apiClient';

const geolocationService = {
  /**
   * Get nearby businesses based on location
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
   * Geocode an address to coordinates
   */
  geocodeAddress: async (address) => {
    const response = await apiClient.post('/geolocation/geocode', {
      address,
    });
    return response.data;
  },

  /**
   * Reverse geocode coordinates to address
   */
  reverseGeocode: async (latitude, longitude) => {
    const response = await apiClient.post('/geolocation/reverse-geocode', {
      latitude,
      longitude,
    });
    return response.data;
  },

  /**
   * Calculate distance between two points
   */
  calculateDistance: async (from, to) => {
    const response = await apiClient.post('/geolocation/distance', {
      from,
      to,
    });
    return response.data;
  },

  /**
   * Get user's current location (browser API)
   */
  getCurrentLocation: () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    });
  },
};

export default geolocationService;
