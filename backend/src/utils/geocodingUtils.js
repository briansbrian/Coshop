import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Geocoding Utilities
 * Convert addresses to coordinates and vice versa
 */

/**
 * Convert address to geographic coordinates using OpenStreetMap Nominatim
 * Falls back to Google Maps Geocoding API if configured
 */
export const geocodeAddress = async (address, city, country) => {
  const fullAddress = `${address}, ${city}, ${country}`;
  
  try {
    // Try OpenStreetMap Nominatim first (free, no API key required)
    const nominatimUrl = 'https://nominatim.openstreetmap.org/search';
    const response = await axios.get(nominatimUrl, {
      params: {
        q: fullAddress,
        format: 'json',
        limit: 1
      },
      headers: {
        'User-Agent': 'CoShop-Marketplace/1.0'
      }
    });

    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        formattedAddress: result.display_name
      };
    }

    // If Nominatim fails and Google Maps API key is available, try Google
    if (process.env.GOOGLE_MAPS_API_KEY) {
      return await geocodeWithGoogle(fullAddress);
    }

    throw {
      status: 400,
      code: 'GEOCODING_FAILED',
      message: 'Could not geocode the provided address'
    };

  } catch (error) {
    if (error.status) {
      throw error;
    }
    
    throw {
      status: 502,
      code: 'GEOCODING_SERVICE_ERROR',
      message: 'Geocoding service unavailable',
      details: error.message
    };
  }
};

/**
 * Geocode using Google Maps Geocoding API
 */
const geocodeWithGoogle = async (address) => {
  try {
    const googleUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
    const response = await axios.get(googleUrl, {
      params: {
        address: address,
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const result = response.data.results[0];
      return {
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        formattedAddress: result.formatted_address
      };
    }

    throw {
      status: 400,
      code: 'GEOCODING_FAILED',
      message: 'Could not geocode the provided address'
    };

  } catch (error) {
    if (error.status) {
      throw error;
    }
    
    throw {
      status: 502,
      code: 'GEOCODING_SERVICE_ERROR',
      message: 'Google Maps geocoding service unavailable',
      details: error.message
    };
  }
};

/**
 * Reverse geocode: convert coordinates to address
 */
export const reverseGeocode = async (latitude, longitude) => {
  try {
    // Use OpenStreetMap Nominatim for reverse geocoding
    const nominatimUrl = 'https://nominatim.openstreetmap.org/reverse';
    const response = await axios.get(nominatimUrl, {
      params: {
        lat: latitude,
        lon: longitude,
        format: 'json'
      },
      headers: {
        'User-Agent': 'CoShop-Marketplace/1.0'
      }
    });

    if (response.data && response.data.display_name) {
      return {
        address: response.data.display_name,
        city: response.data.address?.city || response.data.address?.town || '',
        country: response.data.address?.country || ''
      };
    }

    throw {
      status: 400,
      code: 'REVERSE_GEOCODING_FAILED',
      message: 'Could not reverse geocode the provided coordinates'
    };

  } catch (error) {
    if (error.status) {
      throw error;
    }
    
    throw {
      status: 502,
      code: 'GEOCODING_SERVICE_ERROR',
      message: 'Reverse geocoding service unavailable',
      details: error.message
    };
  }
};

/**
 * Validate geographic coordinates
 */
export const validateCoordinates = (latitude, longitude) => {
  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);

  if (isNaN(lat) || isNaN(lon)) {
    return false;
  }

  // Valid latitude range: -90 to 90
  // Valid longitude range: -180 to 180
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
};
