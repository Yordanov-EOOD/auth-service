import prisma from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { logger, logAuthEvent, logSecurityEvent } from '../config/logger.js';
import { getExpirationTime, getAccessTokenOptions, getRefreshTokenOptions } from '../utils/jwtUtils.js';
import { getCachedUser, setCachedUser, removeCachedUser } from '../utils/cache.js';

export const loginUserService = async (email, password) => {
  try {
    // Single optimized query with only needed fields
    const user = await prisma.user.findUnique({ 
      where: { email },
      select: {
        id: true,
        email: true,
        password: true
      }
    });
    
    if (!user) {
      logSecurityEvent('INVALID_LOGIN_ATTEMPT', { email, reason: 'user_not_found' });
      throw new Error('Invalid credentials');
    }
    
    // Use async bcrypt.compare for better performance
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      logSecurityEvent('INVALID_LOGIN_ATTEMPT', { email, userId: user.id, reason: 'invalid_password' });
      throw new Error('Invalid credentials');
    }

    // Parallel JWT generation for better performance
    const [accessToken, refreshToken] = await Promise.all([
      new Promise((resolve, reject) => {
        jwt.sign(
          { 
            userId: user.id,
            email: user.email
          },
          config.jwt.accessSecret,
          getAccessTokenOptions(),
          (err, token) => err ? reject(err) : resolve(token)
        );
      }),
      new Promise((resolve, reject) => {
        jwt.sign(
          { 
            userId: user.id,
            type: 'refresh'
          },
          config.jwt.refreshSecret,
          getRefreshTokenOptions(),
          (err, token) => err ? reject(err) : resolve(token)
        );
      })
    ]);

    // Optimized expiration calculation using utility
    const expirationTime = getExpirationTime(config.jwt.refreshExpiration);

    // Single database operation with upsert
    await prisma.token.upsert({
      where: { userId: user.id },
      update: { 
        token: refreshToken,
        valid: true,
        expiresAt: expirationTime
      },
      create: {
        token: refreshToken,
        type: 'refresh',
        valid: true,
        userId: user.id,
        expiresAt: expirationTime
      }
    });

    // Cache user data for future requests
    const userData = {
      id: user.id,
      email: user.email
    };
    setCachedUser(user.id, userData);

    // Log successful login
    logAuthEvent('USER_LOGIN', user.id, { email: user.email });
    
    return {
      accessToken,
      refreshToken,
      user: userData
    };
  } catch (error) {
    logger.error('Login service error', {
      email,
      error: error.message
    });
    throw error;
  }
};

export const verifyTokenService = async (token) => {
  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret);
    
    // Validate token structure
    if (!decoded.userId) {
      return { valid: false, error: 'Invalid token structure' };
    }
    
    // Check cache first for better performance
    let user = getCachedUser(decoded.userId);
    
    if (!user) {
      // Query database only if not in cache
      user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true
        }
      });
      
      if (!user) {
        logSecurityEvent('INVALID_TOKEN_USER_NOT_FOUND', { userId: decoded.userId });
        return { valid: false, error: 'User not found' };
      }
      
      // Cache the user data
      setCachedUser(decoded.userId, user);
    }

    return { valid: true, user };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return { valid: false, error: 'Token expired' };
    } else if (error.name === 'JsonWebTokenError') {
      logSecurityEvent('INVALID_TOKEN_FORMAT', { error: error.message });
      return { valid: false, error: 'Invalid token' };
    }
    
    logger.error('Token verification error', {
      error: error.message
    });
    return { valid: false, error: error.message };
  }
};