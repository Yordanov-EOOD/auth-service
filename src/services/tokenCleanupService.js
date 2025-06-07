import prisma from '../config/db.js';
import config from '../config/index.js';
import { logger } from '../config/logger.js';

class TokenCleanupService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
  }

  /**
   * Start the token cleanup service
   */
  start() {
    if (this.isRunning) {
      logger.warn('Token cleanup service is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting token cleanup service', {
      interval: `${config.cleanup.interval}ms`,
      batchSize: config.cleanup.batchSize
    });

    // Run cleanup immediately
    this.cleanup();

    // Schedule periodic cleanup
    this.intervalId = setInterval(() => {
      this.cleanup();
    }, config.cleanup.interval);
  }

  /**
   * Stop the token cleanup service
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    logger.info('Token cleanup service stopped');
  }

  /**
   * Perform token cleanup
   */
  async cleanup() {
    try {
      const startTime = Date.now();
      
      // Delete expired tokens
      const expiredTokensResult = await prisma.token.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } }, // Expired tokens
            { valid: false } // Invalid tokens
          ]
        }
      });

      // Delete tokens older than 30 days (safety measure)
      const oldTokensResult = await prisma.token.deleteMany({
        where: {
          createdAt: {
            lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
          }
        }
      });

      const duration = Date.now() - startTime;
      const totalDeleted = expiredTokensResult.count + oldTokensResult.count;

      if (totalDeleted > 0) {
        logger.info('Token cleanup completed', {
          expiredTokens: expiredTokensResult.count,
          oldTokens: oldTokensResult.count,
          totalDeleted,
          duration: `${duration}ms`
        });
      }

      // Log cleanup statistics
      await this.logCleanupStats();

    } catch (error) {
      logger.error('Token cleanup failed', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Log cleanup statistics
   */
  async logCleanupStats() {
    try {
      const stats = await prisma.token.aggregate({
        _count: { id: true },
        where: { valid: true }
      });

      const oldestToken = await prisma.token.findFirst({
        where: { valid: true },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true }
      });

      logger.debug('Token cleanup stats', {
        activeTokens: stats._count.id,
        oldestTokenAge: oldestToken ? 
          `${Math.floor((Date.now() - oldestToken.createdAt.getTime()) / (1000 * 60 * 60 * 24))} days` : 
          'N/A'
      });

    } catch (error) {
      logger.error('Failed to log cleanup stats', {
        error: error.message
      });
    }
  }

  /**
   * Manual cleanup trigger (useful for testing or admin operations)
   */
  async manualCleanup() {
    logger.info('Manual token cleanup triggered');
    await this.cleanup();
  }

  /**
   * Get cleanup service status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      interval: config.cleanup.interval,
      batchSize: config.cleanup.batchSize,
      nextCleanup: this.intervalId ? 
        new Date(Date.now() + config.cleanup.interval) : 
        null
    };
  }

  /**
   * Invalidate all tokens for a specific user
   */
  async invalidateUserTokens(userId) {
    try {
      const result = await prisma.token.updateMany({
        where: { userId },
        data: { valid: false }
      });

      logger.info('User tokens invalidated', {
        userId,
        tokensInvalidated: result.count
      });

      return result.count;
    } catch (error) {
      logger.error('Failed to invalidate user tokens', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Clean up tokens for a specific user (usually called on user deletion)
   */
  async cleanupUserTokens(userId) {
    try {
      const result = await prisma.token.deleteMany({
        where: { userId }
      });

      logger.info('User tokens cleaned up', {
        userId,
        tokensDeleted: result.count
      });

      return result.count;
    } catch (error) {
      logger.error('Failed to cleanup user tokens', {
        userId,
        error: error.message
      });
      throw error;
    }
  }
}

// Create singleton instance
export const tokenCleanupService = new TokenCleanupService();

// Graceful shutdown handling
process.on('SIGINT', () => {
  logger.info('Received SIGINT, stopping token cleanup service');
  tokenCleanupService.stop();
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, stopping token cleanup service');
  tokenCleanupService.stop();
});

export default tokenCleanupService;
