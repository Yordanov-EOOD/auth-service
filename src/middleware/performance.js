/**
 * Performance monitoring middleware for auth service
 * Tracks response times, cache hit rates, and other performance metrics
 */

import logger from '../utils/logger.js';
import { userCache } from '../utils/cache.js';

// Performance metrics storage
const performanceMetrics = {
  requestCount: 0,
  totalResponseTime: 0,
  averageResponseTime: 0,
  slowRequests: 0, // Requests > 1000ms
  cacheHitRate: 0,
  lastReset: Date.now()
};

/**
 * Performance monitoring middleware
 */
export const performanceMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Track request count
  performanceMetrics.requestCount++;
  
  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(...args) {
    const responseTime = Date.now() - startTime;
    
    // Update performance metrics
    performanceMetrics.totalResponseTime += responseTime;
    performanceMetrics.averageResponseTime = 
      performanceMetrics.totalResponseTime / performanceMetrics.requestCount;
    
    if (responseTime > 1000) {
      performanceMetrics.slowRequests++;
    }
    
    // Log slow requests
    if (responseTime > 2000) {
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.originalUrl,
        responseTime,
        statusCode: res.statusCode,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
    }
    
    // Add performance headers for debugging
    if (process.env.NODE_ENV === 'development') {
      res.set('X-Response-Time', `${responseTime}ms`);
      res.set('X-Cache-Stats', JSON.stringify(userCache.getStats()));
    }
    
    originalEnd.apply(res, args);
  };
  
  next();
};

/**
 * Get current performance metrics
 */
export const getPerformanceMetrics = () => {
  // Update cache hit rate
  const cacheStats = userCache.getStats();
  performanceMetrics.cacheHitRate = cacheStats.hitRate;
  
  return {
    ...performanceMetrics,
    uptime: Date.now() - performanceMetrics.lastReset,
    cacheStats
  };
};

/**
 * Reset performance metrics
 */
export const resetPerformanceMetrics = () => {
  performanceMetrics.requestCount = 0;
  performanceMetrics.totalResponseTime = 0;
  performanceMetrics.averageResponseTime = 0;
  performanceMetrics.slowRequests = 0;
  performanceMetrics.lastReset = Date.now();
  
  // Reset cache stats
  userCache.resetStats();
  
  logger.info('Performance metrics reset');
};

/**
 * Log performance summary (called periodically)
 */
export const logPerformanceSummary = () => {
  const metrics = getPerformanceMetrics();
  
  logger.info('Performance summary', {
    requestCount: metrics.requestCount,
    averageResponseTime: Math.round(metrics.averageResponseTime),
    slowRequests: metrics.slowRequests,
    cacheHitRate: `${(metrics.cacheHitRate * 100).toFixed(1)}%`,
    cacheSize: metrics.cacheStats.size,
    uptime: `${Math.round(metrics.uptime / 1000)}s`
  });
};

// Log performance summary every 5 minutes in production
if (process.env.NODE_ENV === 'production') {
  setInterval(logPerformanceSummary, 5 * 60 * 1000);
}

export default performanceMiddleware;
