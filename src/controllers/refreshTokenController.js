import { handleRefreshTokenService } from '../services/refreshTokenService.js';
import logger from '../utils/logger.js';

export const handleRefreshToken = async (req, res) => {
  const startTime = Date.now();
  const cookies = req.cookies;

  try {
    const refreshToken = cookies?.jwt;

    if (!refreshToken) {
      logger.warn('Refresh token attempt without token', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
      
      return res.status(401).json({
        success: false,
        error: 'No refresh token provided'
      });
    }

    const { accessToken, user } = await handleRefreshTokenService(refreshToken);
    
    logger.debug('Token refresh successful', {
      userId: user?.id,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString()
    });
    
    res.json({ 
      success: true,
      accessToken,
      user: user ? {
        id: user.id,
        email: user.email,
        username: user.username
      } : undefined
    });
  } catch (error) {
    logger.warn('Token refresh failed', {
      error: error.message,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString()
    });
    
    res.status(403).json({ 
      success: false,
      error: 'Invalid or expired refresh token'
    });
  }
};