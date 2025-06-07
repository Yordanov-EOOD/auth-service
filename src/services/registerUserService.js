import bcrypt from 'bcrypt';
import prisma from '../config/db.js';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { getAuthServiceProducer, TOPICS } from '/app/shared/kafka.js';
import { getExpirationTime, getAccessTokenOptions, getRefreshTokenOptions } from '../utils/jwtUtils.js';
import { setCachedUser } from '../utils/cache.js';
import { logger, logAuthEvent } from '../config/logger.js';

export const createUserService = async (userData) => {
  const { username, email, password } = userData;
  let authUser = null;

  try {
    // Parallel operations: hash password while preparing other data
    const [hashedPassword] = await Promise.all([
      bcrypt.hash(password, 12)
    ]);

    // Create user in Auth Service database
    authUser = await prisma.user.create({
      data: { email, password: hashedPassword },
      select: {
        id: true,
        email: true
      }
    });

    // Parallel JWT generation for better performance
    const [accessToken, refreshToken] = await Promise.all([
      new Promise((resolve, reject) => {
        jwt.sign(
          { 
            userId: authUser.id,
            email: authUser.email
          },
          config.jwt.accessSecret,
          getAccessTokenOptions(),
          (err, token) => err ? reject(err) : resolve(token)
        );
      }),
      new Promise((resolve, reject) => {
        jwt.sign(
          { 
            userId: authUser.id,
            type: 'refresh'
          },
          config.jwt.refreshSecret,
          getRefreshTokenOptions(),
          (err, token) => err ? reject(err) : resolve(token)
        );
      })
    ]);

    // Optimized expiration calculation
    const expirationTime = getExpirationTime(config.jwt.refreshExpiration);

    // Parallel operations: store token and publish to Kafka
    const [tokenResult] = await Promise.all([
      prisma.token.create({
        data: {
          token: refreshToken,
          type: 'refresh',
          valid: true,
          userId: authUser.id,
          expiresAt: expirationTime
        }
      }),
      // Publish to Kafka asynchronously (don't wait for result)
      publishUserCreatedEvent(authUser.id, email, username)
    ]);

    // Cache user data for future requests
    const userData = {
      id: authUser.id,
      email: authUser.email
    };
    setCachedUser(authUser.id, userData);

    // Log successful registration
    logAuthEvent('USER_REGISTRATION', authUser.id, { email: authUser.email, username });

    return { 
      id: authUser.id, 
      username, 
      email: authUser.email,
      accessToken,
      refreshToken,
      user: userData
    };
  } catch (error) {
    // If auth user was created but later steps failed
    if (authUser?.id) {
      logger.warn('Registration partially succeeded', {
        userId: authUser.id,
        error: error.message
      });
      
      // Return partial success with available data
      return { 
        id: authUser.id, 
        username, 
        email: authUser.email,
        user: { id: authUser.id, email: authUser.email },
        partialSuccess: true,
        error: error.message
      };
    }

    logger.error('Registration failed', {
      email,
      username,
      error: error.message
    });
    throw error;
  }
};

/**
 * Async function to publish user created event to Kafka
 * @param {string} authId - Auth user ID
 * @param {string} email - User email
 * @param {string} username - Username
 */
async function publishUserCreatedEvent(authId, email, username) {
  try {
    const producer = await getAuthServiceProducer();
    await producer.publishMessage(
      TOPICS.USER_CREATED,
      {
        authId,
        email,
        username,
        timestamp: new Date().toISOString()
      },
      authId // Use auth user ID as key for partitioning
    );
    
    logger.info('Published user.created event to Kafka', { authId, email });
  } catch (kafkaError) {
    // Don't fail registration if Kafka fails - log and continue
    logger.warn('Failed to publish user.created event to Kafka', {
      authId,
      email,
      error: kafkaError.message
    });
  }
}
