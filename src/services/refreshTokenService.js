import prisma from '../config/db.js';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { getAccessTokenOptions } from '../utils/jwtUtils.js';
import { logger, logAuthEvent, logSecurityEvent } from '../config/logger.js';

export const handleRefreshTokenService = async (refreshToken) => {
  try {
    if (!refreshToken) {
      throw new Error('Refresh token not provided');
    }

    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);

    // Single optimized query with both token validation and user check
    const tokenRecord = await prisma.token.findFirst({
      where: { 
        token: refreshToken, 
        userId: decoded.userId,
        valid: true,
        expiresAt: {
          gte: new Date()
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });

    if (!tokenRecord) {
      logSecurityEvent('INVALID_REFRESH_TOKEN', { userId: decoded.userId });
      throw new Error('Invalid or expired refresh token');
    }

    // Generate new access token using async approach for better performance
    const accessToken = await new Promise((resolve, reject) => {
      jwt.sign(
        { 
          userId: decoded.userId,
          email: tokenRecord.user.email
        },
        config.jwt.accessSecret,
        getAccessTokenOptions(),
        (err, token) => err ? reject(err) : resolve(token)
      );
    });

    // Log successful token refresh
    logAuthEvent('TOKEN_REFRESH', decoded.userId, { email: tokenRecord.user.email });

    return { accessToken, user: tokenRecord.user };
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      logSecurityEvent('INVALID_REFRESH_TOKEN_FORMAT', { error: error.message });
    }
    
    logger.error('Refresh token service error', {
      error: error.message
    });
    throw error;
  }
};