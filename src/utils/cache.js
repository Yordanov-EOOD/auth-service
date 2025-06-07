import { LRUCache } from 'lru-cache';
import config from '../config/index.js';
import { logger } from '../config/logger.js';

/**
 * User verification cache to reduce database queries
 * TTL matches access token expiration for security
 */
const userCache = new LRUCache({
  max: 1000, // Maximum 1000 cached users
  ttl: 15 * 60 * 1000, // 15 minutes (matches access token TTL)
  updateAgeOnGet: true,
  allowStale: false
});

/**
 * Get user from cache or return null
 * @param {string} userId - User ID
 * @returns {Object|null} Cached user data or null
 */
export const getCachedUser = (userId) => {
  const cached = userCache.get(userId);
  if (cached) {
    logger.debug('User cache hit', { userId });
  }
  return cached;
};

/**
 * Cache user data
 * @param {string} userId - User ID
 * @param {Object} userData - User data to cache
 */
export const setCachedUser = (userId, userData) => {
  userCache.set(userId, userData);
  logger.debug('User cached', { userId });
};

/**
 * Remove user from cache (e.g., on logout)
 * @param {string} userId - User ID
 */
export const removeCachedUser = (userId) => {
  userCache.delete(userId);
  logger.debug('User removed from cache', { userId });
};

/**
 * Clear all cached users (e.g., on significant security events)
 */
export const clearUserCache = () => {
  userCache.clear();
  logger.info('User cache cleared');
};

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
export const getCacheStats = () => {
  return {
    size: userCache.size,
    calculatedSize: userCache.calculatedSize,
    remainingTTL: userCache.getRemainingTTL,
    hitRate: userCache.hits / (userCache.hits + userCache.misses) || 0
  };
};
