import prisma from '../config/db.js';
import { logger, logAuthEvent } from '../config/logger.js';
import { removeCachedUser } from '../utils/cache.js';

export const logoutUserService = async (userId) => {
  try {
    // Parallel operations: delete tokens and remove from cache
    const [result] = await Promise.all([
      prisma.token.deleteMany({
        where: { 
          userId,
          type: 'refresh' // Only delete refresh tokens, access tokens expire naturally
        }
      }),
      // Remove user from cache immediately
      Promise.resolve(removeCachedUser(userId))
    ]);

    // Log the logout event with context
    logAuthEvent('USER_LOGOUT', userId, {
      tokensInvalidated: result.count,
      timestamp: new Date().toISOString()
    });

    logger.info('User logged out successfully', {
      userId,
      tokensInvalidated: result.count
    });

    return { 
      success: true, 
      tokensInvalidated: result.count 
    };
  } catch (error) {
    logger.error('Logout service error', {
      userId,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};