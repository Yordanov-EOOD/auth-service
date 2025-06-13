import rateLimit from 'express-rate-limit';

// Create rate limiter with memory store
const createRateLimiter = (options) => {  const config = {
  windowMs: options.windowMs,
  max: options.max,
  message: {
    error: options.message || 'Too many requests, please try again later',
    retryAfter: options.windowMs / 1000
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Custom key generator to include IP and optionally email
  keyGenerator: (req) => {
    const ip = req.ip || req.connection.remoteAddress;
    const email = req.body?.email;
    return email ? `${ip}:${email}` : ip;
  },
  // Skip successful requests in count for login attempts
  skipSuccessfulRequests: options.skipSuccessfulRequests || false,
  handler: (req, res) => {
    console.warn(`Rate limit exceeded for ${req.ip}`, {
      endpoint: req.path,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
    res.status(429).json({
      error: options.message || 'Too many requests, please try again later',
      retryAfter: options.windowMs / 1000
    });
  }
};

return rateLimit(config);
};

// Strict rate limiting for authentication endpoints (prevent brute force)
export const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Maximum 5 attempts per 15 minutes
  message: 'Too many login attempts, please try again in 15 minutes',
  skipSuccessfulRequests: true // Don't count successful logins
});

// Moderate rate limiting for registration
export const registerRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Maximum 3 registration attempts per hour
  message: 'Too many registration attempts, please try again in 1 hour'
});

// Lenient rate limiting for refresh token endpoint
export const refreshRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 refresh attempts per 15 minutes
  message: 'Too many token refresh attempts, please try again later'
});

// General API rate limiting
export const generalRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: 'Too many requests, please slow down'
});

// Account lockout tracking
const failedAttempts = new Map();

export const trackFailedLogin = (req, res, next) => {
  const originalSend = res.json;
  
  res.json = function(data) {
    // If this is a failed login attempt
    if (res.statusCode === 401 && req.body?.email) {
      const email = req.body.email;
      const attempts = failedAttempts.get(email) || { count: 0, lastAttempt: Date.now() };
      
      attempts.count++;
      attempts.lastAttempt = Date.now();
      failedAttempts.set(email, attempts);
      
      // Log security event
      console.warn('Failed login attempt', {
        email,
        ip: req.ip,
        attempts: attempts.count,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
      
      // If too many attempts, temporarily lock account
      if (attempts.count >= 10) {
        data.error = 'Account temporarily locked due to too many failed attempts. Please try again in 30 minutes.';
        
        // Clean up old attempts (30 minutes)
        setTimeout(() => {
          failedAttempts.delete(email);
        }, 30 * 60 * 1000);
      }
    }
    
    // If successful login, clear failed attempts
    if (res.statusCode === 200 && req.body?.email) {
      failedAttempts.delete(req.body.email);
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};
