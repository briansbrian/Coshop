import redisClient from '../config/redis.js';

/**
 * Cache utility functions
 * Provides get/set/delete operations with TTL support
 */

/**
 * Get value from cache
 * @param {string} key - Cache key
 * @returns {Promise<any|null>} Parsed value or null if not found
 */
export const getCached = async (key) => {
  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
};

/**
 * Set value in cache with TTL
 * @param {string} key - Cache key
 * @param {any} value - Value to cache (will be JSON stringified)
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<boolean>} Success status
 */
export const setCached = async (key, value, ttl = 300) => {
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Cache set error:', error);
    return false;
  }
};

/**
 * Delete value from cache
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} Success status
 */
export const deleteCached = async (key) => {
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error('Cache delete error:', error);
    return false;
  }
};

/**
 * Delete all keys matching a pattern
 * @param {string} pattern - Key pattern (e.g., 'products:*')
 * @returns {Promise<boolean>} Success status
 */
export const deleteCachedPattern = async (pattern) => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    return true;
  } catch (error) {
    console.error('Cache pattern delete error:', error);
    return false;
  }
};

/**
 * Generate cache key for product search
 * @param {object} searchParams - Search parameters
 * @returns {string} Cache key
 */
export const generateSearchCacheKey = (searchParams) => {
  const sortedParams = Object.keys(searchParams)
    .sort()
    .reduce((acc, key) => {
      if (searchParams[key] !== undefined && searchParams[key] !== null) {
        acc[key] = searchParams[key];
      }
      return acc;
    }, {});
  
  return `products:search:${JSON.stringify(sortedParams)}`;
};
