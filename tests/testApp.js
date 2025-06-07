// Test application module for integration tests
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoute from '../src/route/authRoute.js';
import logoutRoute from '../src/route/logoutRoute.js';
import refreshTokenRoute from '../src/route/refreshTokenRoute.js';
import { errorHandler } from '../src/middleware/errorHandler.js';
import verifyJWT from '../src/middleware/verifyJWT.js';
import registerRoute from '../src/route/registerRoute.js';

// Mock the middleware for testing
jest.mock('../src/middleware/rateLimit.js', () => ({
  authRateLimit: (req, res, next) => next(),
  registerRateLimit: (req, res, next) => next(),
  refreshTokenRateLimit: (req, res, next) => next(),
  generalRateLimit: (req, res, next) => next()
}));

jest.mock('../src/middleware/security.js', () => ({
  securityHeaders: (req, res, next) => next(),
  additionalSecurity: (req, res, next) => next()
}));

jest.mock('../src/config/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  },
  addRequestId: (req, res, next) => {
    req.correlationId = 'test-correlation-id';
    next();
  },
  requestLogger: (req, res, next) => next()
}));

// Create a test application instance without starting the server
export function createTestApp() {
  const app = express();

  // Basic middleware setup
  app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
  }));

  // Add request ID for testing
  app.use((req, res, next) => {
    req.correlationId = 'test-correlation-id';
    next();
  });

  app.use(cookieParser());
  app.use(express.json());

  // Input sanitization (simplified for tests)
  app.use((req, res, next) => {
    // Simple sanitization mock
    next();
  });

  // Register routes (middleware is mocked)
  app.use('/register', registerRoute);
  app.use('/auth', authRoute);
  app.use('/refresh', refreshTokenRoute);
  app.use('/logout', verifyJWT, logoutRoute);

  // Health check endpoint
  app.get('/health', (req, res) => res.json({ status: 'OK' }));

  app.use(errorHandler);

  return app;
}