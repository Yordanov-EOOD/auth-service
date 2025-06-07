// Test configuration
// Overrides production config for testing environment

export default {
  server: {
    port: 3001,
    nodeEnv: 'test'
  },
  jwt: {
    accessExpiration: '15m',
    refreshExpiration: '7d',
    issuer: 'auth-service-test',
    audience: 'twitter-clone-test'
  },
  cors: {
    origin: 'http://localhost:3000',
    credentials: true
  },
  rateLimit: {
    // Disabled for tests
    auth: {
      requests: 1000,
      windowMs: 60000
    },
    register: {
      requests: 1000,
      windowMs: 60000
    },
    refresh: {
      requests: 1000,
      windowMs: 60000
    },
    general: {
      requests: 1000,
      windowMs: 60000
    },
    failedLogin: {
      maxAttempts: 100,
      lockoutDuration: 1
    }
  },
  redis: {
    host: 'localhost',
    port: 6379,
    password: '',
    db: 1 // Use different DB for tests
  },
  tokenCleanup: {
    intervalMinutes: 1440, // Daily for tests
    batchSize: 100
  },
  logging: {
    level: 'error', // Minimal logging for tests
    format: 'simple'
  },
  kafka: {
    broker: 'localhost:9092',
    clientId: 'auth-service-test',
    retryAttempts: 1,
    retryDelay: 100
  }
};

export const validateConfig = () => {
  // Minimal validation for test config
  return true;
};
