import { logoutUserService } from '../services/logoutService.js';
import { COOKIE_CONFIG } from '../utils/jwtUtils.js';
import logger from '../utils/logger.js';

export const handleLogout = async (req, res) => {
  const startTime = Date.now();
  const cookies = req.cookies;

  try {
    // Check if refresh token exists in cookies
    if (!cookies?.jwt) {
      logger.debug('Logout attempt without refresh token', {
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
      
      return res.status(200).json({
        success: true,
        message: 'Already logged out'
      });
    }

    // Get user info from JWT middleware if available
    const userId = req.user?.userId;
    
    if (userId) {
      // Delete the refresh token from the database and clear cache
      await logoutUserService(userId);
      
      logger.info('User logout successful', {
        userId,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });
    } else {
      logger.warn('Logout without user context', {
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
    }

    // Clear the refresh token cookie with proper security options
    res.clearCookie('jwt', {
      httpOnly: true,
      secure: COOKIE_CONFIG.REFRESH_TOKEN.secure,
      sameSite: COOKIE_CONFIG.REFRESH_TOKEN.sameSite
    });

    res.status(200).json({
      success: true,
      message: 'Successfully logged out'
    });
  } catch (error) {
    logger.error('Logout error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.userId,
      ip: req.ip,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString()
    });
    
    // Still clear the cookie even if service fails
    res.clearCookie('jwt', {
      httpOnly: true,
      secure: COOKIE_CONFIG.REFRESH_TOKEN.secure,
      sameSite: COOKIE_CONFIG.REFRESH_TOKEN.sameSite
    });
    
    res.status(500).json({ 
      success: false,
      error: 'Internal server error during logout' 
    });
  }
};