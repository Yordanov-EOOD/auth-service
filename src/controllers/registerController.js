import { createUserService } from '../services/registerUserService.js';
import { getAuthServiceProducer, TOPICS } from '/app/shared/kafka.js';
import { COOKIE_CONFIG } from '../utils/jwtUtils.js';
import logger from '../utils/logger.js';
import { trackAuthOperation } from '../middleware/metrics.js';

export const handleNewUser = async (req, res) => {
  const startTime = Date.now();
  const { username, email, password } = req.body;
  
  // Validate required fields
  if (!username || !email || !password) {
    logger.warn('Registration failed - missing required fields', { 
      usernamePresent: !!username, 
      emailPresent: !!email, 
      passwordPresent: !!password,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
    
    return res.status(400).json({ 
      success: false,
      error: 'Missing required fields', 
      details: { 
        usernamePresent: !!username, 
        emailPresent: !!email, 
        passwordPresent: !!password 
      } 
    });
  }

  try {
    // Register user and get response including tokens and user info
    logger.info('Attempting user registration', { username, email });
    const result = await createUserService({ username, email, password });
    logger.info('User registration completed', { 
      id: result.id, 
      email: result.email,
      partialSuccess: result.partialSuccess || false,
      userServiceSuccess: result.userServiceSuccess,
      yeetServiceSuccess: result.yeetServiceSuccess,
      duration: Date.now() - startTime
    });
    
    // Track registration operation
    trackAuthOperation('registration', result.partialSuccess ? 'partial' : 'success');
    // Publish event to Kafka regardless of partial success
    try {
      const producer = await getAuthServiceProducer();
      await producer.publishMessage(
        TOPICS.USER_CREATED,
        {
          authId: result.id,
          email: result.email,
          username: username,
          registrationStatus: result.partialSuccess ? 'PARTIAL' : 'COMPLETE',
          userServiceSuccess: result.userServiceSuccess,
          yeetServiceSuccess: result.yeetServiceSuccess
        },
        result.id // Use auth user ID as key
      );
      logger.debug('Published user registration event to Kafka', { userId: result.id });
    } catch (kafkaError) {
      // Don't fail the registration if Kafka fails
      logger.error('Failed to publish registration event to Kafka', {
        error: kafkaError.message,
        userId: result.id,
        stack: kafkaError.stack
      });
    }
    // Handle partial success (user created in auth DB but failed in other services)
    if (result.partialSuccess) {
      // Still set refresh token if we have one
      if (result.refreshToken) {
        res.cookie('jwt', result.refreshToken, COOKIE_CONFIG.REFRESH_TOKEN);
      }
      
      // Return 201 Created with warning about partial success
      return res.status(201).json({
        success: true,
        accessToken: result.accessToken,
        user: result.user,
        message: 'Registration partially successful. Some features may be limited.',
        warning: result.error
      });
    }
    
    // Handle complete success but with some service failures
    if (!result.userServiceSuccess || !result.yeetServiceSuccess) {
      logger.warn('Registration successful but with service errors', {
        userServiceSuccess: result.userServiceSuccess,
        yeetServiceSuccess: result.yeetServiceSuccess,
        userId: result.id
      });
    }
    
    // Set HTTP-only cookie for refresh token if included
    if (result.refreshToken) {
      res.cookie('jwt', result.refreshToken, COOKIE_CONFIG.REFRESH_TOKEN);
    }

    // Return response with access token and user data - return 201 Created
    res.status(201).json({
      success: true,
      accessToken: result.accessToken,
      user: result.user || { id: result.id, email: result.email, username }
    });
  } catch (error) {    logger.error('Registration error', {
    error: error.message,
    stack: error.stack,
    email,
    username,
    ip: req.ip,
    duration: Date.now() - startTime,
    timestamp: new Date().toISOString()
  });
    
  // Track failed registration
  trackAuthOperation('registration', 'failure');
    
  res.status(400).json({ 
    success: false,
    error: error.message 
  });
  }
};