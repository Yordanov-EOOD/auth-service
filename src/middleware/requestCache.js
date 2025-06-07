/**
 * Request-level caching middleware for performance optimization
 * Caches data within a single request to avoid repeated operations
 */

const REQUEST_CACHE_TIMEOUT = 5000; // 5 seconds timeout for safety

/**
 * Request-level cache middleware
 * Attaches a cache object to the request that expires after the request
 */
export const requestCacheMiddleware = (req, res, next) => {
  // Create request-scoped cache
  req.cache = new Map();
  
  // Set cache expiration safety timeout
  const timeout = setTimeout(() => {
    req.cache?.clear();
  }, REQUEST_CACHE_TIMEOUT);
  
  // Clear cache when response finishes
  res.on('finish', () => {
    clearTimeout(timeout);
    req.cache?.clear();
  });
  
  next();
};

/**
 * Cache helper functions for request-level caching
 */
export const RequestCache = {
  /**
   * Get cached value or execute function and cache result
   * @param {Request} req - Express request object
   * @param {string} key - Cache key
   * @param {Function} fn - Function to execute if cache miss
   * @returns {Promise<any>} Cached or computed value
   */
  async getOrSet(req, key, fn) {
    if (!req.cache) {
      return await fn();
    }
    
    if (req.cache.has(key)) {
      return req.cache.get(key);
    }
    
    const result = await fn();
    req.cache.set(key, result);
    return result;
  },
  
  /**
   * Set value in request cache
   * @param {Request} req - Express request object
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   */
  set(req, key, value) {
    if (req.cache) {
      req.cache.set(key, value);
    }
  },
  
  /**
   * Get value from request cache
   * @param {Request} req - Express request object
   * @param {string} key - Cache key
   * @returns {any} Cached value or undefined
   */
  get(req, key) {
    return req.cache?.get(key);
  },
  
  /**
   * Check if key exists in request cache
   * @param {Request} req - Express request object
   * @param {string} key - Cache key
   * @returns {boolean} True if key exists
   */
  has(req, key) {
    return req.cache?.has(key) || false;
  },
  
  /**
   * Delete key from request cache
   * @param {Request} req - Express request object
   * @param {string} key - Cache key
   * @returns {boolean} True if key was deleted
   */
  delete(req, key) {
    return req.cache?.delete(key) || false;
  }
};

export default requestCacheMiddleware;
