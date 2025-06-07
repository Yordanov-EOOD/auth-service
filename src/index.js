import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoute from './route/authRoute.js';
import logoutRoute from './route/logoutRoute.js';
import refreshTokenRoute from './route/refreshTokenRoute.js';
import { errorHandler } from './middleware/errorHandler.js';
import verifyJWT from './middleware/verifyJWT.js';
import registerRoute from './route/registerRoute.js';
import { initKafka } from './config/kafkaInit.js';
import { createUserHttpClient, createYeetHttpClient } from '/app/shared/http-client.js';
import { PrismaClient } from '@prisma/client';

// Import new middleware and configuration
import config, { validateConfig } from './config/index.js';
import { logger, addRequestId, requestLogger } from './config/logger.js';
import { securityHeaders, additionalSecurity } from './middleware/security.js';
import { generalRateLimit } from './middleware/rateLimit.js';
import { sanitizeInput } from './middleware/validation.js';
import tokenCleanupService from './services/tokenCleanupService.js';
import { metricsMiddleware, metricsHandler, trackAuthOperation, recordAuthOperation } from './middleware/metrics.js';

// Initialize Prisma client
const prisma = new PrismaClient();

// Validate configuration on startup
try {
  validateConfig();
  logger.info('Configuration validation passed');
} catch (error) {
  logger.error('Configuration validation failed', { error: error.message });
  process.exit(1);
}

const app = express();

// Security middleware
app.use(securityHeaders);
app.use(additionalSecurity);

// Request tracking and logging
app.use(addRequestId);
app.use(requestLogger);

// General rate limiting
app.use(generalRateLimit);

// Input sanitization
app.use(sanitizeInput);

// Metrics middleware
app.use(metricsMiddleware);

// Enable credentials for JWT cookies
app.use(cors(config.cors));



// Create circuit breaker HTTP clients
export const userServiceClient = createUserHttpClient('auth-service');
export const yeetServiceClient = createYeetHttpClient('auth-service');

// Required for refresh token cookies
app.use(cookieParser());
app.use(express.json());

// Authentication endpoints with appropriate rate limiting
// Stricter rate limiting for login and registration to prevent brute force attacks
app.use('/register', registerRoute);
app.use('/auth', authRoute);          // Login
app.use('/refresh', refreshTokenRoute); // Token refresh
app.use('/logout', verifyJWT, logoutRoute); // Requires valid JWT

app.use(errorHandler);

const PORT = config.server.port;

// Health check endpoint (not rate-limited)
app.get('/health', (req, res) => {
  const healthStatus = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.server.nodeEnv,
    version: process.env.npm_package_version || '1.0.0',
    tokenCleanupService: tokenCleanupService.getStatus()
  };
  
  res.json(healthStatus);
});

// Metrics endpoint for Prometheus
app.get('/metrics', metricsHandler);

// Detailed health check for monitoring
app.get('/health/detailed', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    const healthStatus = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      services: {
        database: 'healthy',
        tokenCleanup: tokenCleanupService.isRunning ? 'running' : 'stopped'
      }
    };
    
    res.json(healthStatus);
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({
      status: 'UNHEALTHY',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Start the server with enhanced Kafka integration
const startServer = async () => {
  try {
    // Initialize Kafka with improved error handling
    const kafka = await initKafka();
    logger.info('Kafka initialization result', { 
      success: kafka ? 'Success' : 'Failed' 
    });
    
    // Start token cleanup service
    tokenCleanupService.start();
    
    const server = app.listen(PORT, () => {
      logger.info('Auth Service started successfully', {
        port: PORT,
        environment: config.server.nodeEnv,
        nodeVersion: process.version
      });
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal) => {
      logger.info(`Received ${signal}, starting graceful shutdown`);
      
      // Stop accepting new connections
      server.close(async () => {
        try {
          // Stop token cleanup service
          tokenCleanupService.stop();
          
          // Close database connections
          await prisma.$disconnect();
          
          logger.info('Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during graceful shutdown', { error: error.message });
          process.exit(1);
        }
      });
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    logger.error('Failed to start auth-service', { 
      error: error.message,
      stack: error.stack 
    });
    process.exit(1);
  }
};

startServer();