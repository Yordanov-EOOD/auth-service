import { loginUserService, verifyTokenService } from '../services/authService.js';
import { COOKIE_CONFIG } from '../utils/jwtUtils.js';
import logger from '../utils/logger.js';
import { trackAuthOperation } from '../middleware/metrics.js';

const handleLogin = async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { email, password } = req.body;
    
    // Call service layer
    const { accessToken, refreshToken, user } = await loginUserService(email, password);

    // Set HTTP-only cookie for refresh token using optimized config
    res.cookie('jwt', refreshToken, COOKIE_CONFIG.REFRESH_TOKEN);    // Log successful login with performance metrics
    logger.info('User login successful', {
      userId: user.id,
      email: user.email,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString()
    });

    // Track successful login operation
    trackAuthOperation('login', 'success');

    // Return standardized response
    res.json({ 
      success: true,
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    });

  } catch (error) {    // Log security event for failed login
    logger.warn('Login attempt failed', {
      email: req.body?.email,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      error: error.message,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString()
    });

    // Track failed login operation
    trackAuthOperation('login', 'failure');

    res.status(401).json({
      success: false,
      error: 'Invalid credentials' // Don't expose internal error details
    });
  }
};

const handleVerify = async (req, res) => {
  const startTime = Date.now();
  
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        valid: false,
        error: 'Missing or invalid authorization header' 
      });
    }
    
    const token = authHeader.split(' ')[1];
    const { valid, user, error } = await verifyTokenService(token);

    if (!valid) {
      logger.warn('Token verification failed', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        error,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });
      
      return res.status(401).json({ 
        success: false,
        valid: false,
        error: 'Invalid or expired token' 
      });
    }

    // Log successful verification
    logger.debug('Token verification successful', {
      userId: user.id,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString()
    });

    res.json({ 
      success: true,
      valid: true, 
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    });

  } catch (error) {
    logger.error('Token verification error', {
      error: error.message,
      stack: error.stack,
      ip: req.ip,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({ 
      success: false,
      valid: false,
      error: 'Internal server error' 
    });
  }
};

export { handleLogin, handleVerify };