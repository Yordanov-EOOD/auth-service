/**
 * Health check controller with performance and cache metrics
 */

import { getPerformanceMetrics } from '../middleware/performance.js';
import { userCache } from '../utils/cache.js';
import logger from '../utils/logger.js';

/**
 * Basic health check endpoint
 */
export const handleHealthCheck = (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'auth-service',
    version: process.env.npm_package_version || '1.0.0'
  });
};

/**
 * Detailed health check with performance metrics
 */
export const handleDetailedHealthCheck = (req, res) => {
  try {
    const performanceMetrics = getPerformanceMetrics();
    const cacheStats = userCache.getStats();
    
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'auth-service',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
      },
      performance: {
        requestCount: performanceMetrics.requestCount,
        averageResponseTime: Math.round(performanceMetrics.averageResponseTime),
        slowRequests: performanceMetrics.slowRequests,
        slowRequestPercentage: performanceMetrics.requestCount > 0 
          ? ((performanceMetrics.slowRequests / performanceMetrics.requestCount) * 100).toFixed(2)
          : 0
      },
      cache: {
        hitRate: `${(cacheStats.hitRate * 100).toFixed(1)}%`,
        size: cacheStats.size,
        maxSize: cacheStats.maxSize,
        hits: cacheStats.hits,
        misses: cacheStats.misses,
        sets: cacheStats.sets,
        deletes: cacheStats.deletes,
        evictions: cacheStats.evictions
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };

    // Determine overall health status
    let status = 'healthy';
    const warnings = [];

    // Check performance thresholds
    if (performanceMetrics.averageResponseTime > 1000) {
      warnings.push('High average response time');
      status = 'warning';
    }

    if (performanceMetrics.slowRequests / performanceMetrics.requestCount > 0.1) {
      warnings.push('High percentage of slow requests');
      status = 'warning';
    }

    // Check cache performance
    if (cacheStats.hitRate < 0.5 && cacheStats.hits + cacheStats.misses > 100) {
      warnings.push('Low cache hit rate');
      status = 'warning';
    }

    // Check memory usage
    const memoryUsagePercent = process.memoryUsage().heapUsed / process.memoryUsage().heapTotal;
    if (memoryUsagePercent > 0.9) {
      warnings.push('High memory usage');
      status = 'warning';
    }

    healthData.status = status;
    if (warnings.length > 0) {
      healthData.warnings = warnings;
    }

    const statusCode = status === 'healthy' ? 200 : 200; // Still return 200 for warnings

    res.status(statusCode).json(healthData);

  } catch (error) {
    logger.error('Health check error', {
      error: error.message,
      stack: error.stack
    });

    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'auth-service',
      error: 'Health check failed'
    });
  }
};

/**
 * Cache statistics endpoint
 */
export const handleCacheStats = (req, res) => {
  try {
    const stats = userCache.getStats();
    
    res.json({
      cache: {
        type: 'LRU',
        hitRate: `${(stats.hitRate * 100).toFixed(2)}%`,
        size: stats.size,
        maxSize: stats.maxSize,
        hits: stats.hits,
        misses: stats.misses,
        sets: stats.sets,
        deletes: stats.deletes,
        evictions: stats.evictions,
        efficiency: stats.hits > 0 ? `${((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(1)}%` : '0%'
      }
    });
  } catch (error) {
    logger.error('Cache stats error', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      error: 'Failed to retrieve cache statistics'
    });
  }
};
