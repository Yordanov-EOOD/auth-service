import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'ACCESS_TOKEN_SECRET',
  'REFRESH_TOKEN_SECRET'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Required environment variable ${envVar} is not set`);
  }
}

// Centralized configuration object
export const config = {
  // Server configuration
  server: {
    port: parseInt(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development'
  },

  // Database configuration
  database: {
    url: process.env.DATABASE_URL,
    connectionLimit: parseInt(process.env.PRISMA_CONNECTION_LIMIT) || 10,
    activeTimeoutMs: parseInt(process.env.PRISMA_ACTIVE_TIMEOUT_MS) || 300000,
    idleTimeoutMs: parseInt(process.env.PRISMA_IDLE_TIMEOUT_MS) || 60000,
    transactionTimeoutMs: parseInt(process.env.PRISMA_TRANSACTION_TIMEOUT_MS) || 5000
  },

  // JWT configuration
  jwt: {
    accessSecret: process.env.ACCESS_TOKEN_SECRET,
    refreshSecret: process.env.REFRESH_TOKEN_SECRET,
    accessExpiration: process.env.ACCESS_TOKEN_EXPIRATION || '15m',
    refreshExpiration: process.env.REFRESH_TOKEN_EXPIRATION || '7d',
    issuer: process.env.JWT_ISSUER || 'auth-service',
    audience: process.env.JWT_AUDIENCE || 'twitter-clone'
  },

  // Security configuration
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    maxFailedLogins: parseInt(process.env.MAX_FAILED_LOGINS) || 10,
    lockoutDuration: parseInt(process.env.LOCKOUT_DURATION) || 30 * 60 * 1000, // 30 minutes
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || 24 * 60 * 60 * 1000 // 24 hours
  },

  // Rate limiting configuration
  rateLimit: {
    auth: {
      windowMs: parseInt(process.env.AUTH_RATE_WINDOW) || 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.AUTH_RATE_MAX) || 5
    },
    register: {
      windowMs: parseInt(process.env.REGISTER_RATE_WINDOW) || 60 * 60 * 1000, // 1 hour
      max: parseInt(process.env.REGISTER_RATE_MAX) || 3
    },
    refresh: {
      windowMs: parseInt(process.env.REFRESH_RATE_WINDOW) || 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.REFRESH_RATE_MAX) || 20
    },
    general: {
      windowMs: parseInt(process.env.GENERAL_RATE_WINDOW) || 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.GENERAL_RATE_MAX) || 100    }
  },

  // Kafka configuration
  kafka: {
    brokers: process.env.KAFKA_BROKERS?.split(',') || ['kafka:9092'],
    clientId: process.env.KAFKA_CLIENT_ID || 'auth-service',
    groupId: process.env.KAFKA_GROUP_ID || 'auth-service-group',
    retries: parseInt(process.env.KAFKA_RETRIES) || 5,
    retryDelayMs: parseInt(process.env.KAFKA_RETRY_DELAY) || 300
  },

  // External services
  services: {
    userService: {
      url: process.env.USER_SERVICE_URL || 'http://user-service:3000',
      timeout: parseInt(process.env.USER_SERVICE_TIMEOUT) || 5000
    },
    yeetService: {
      url: process.env.YEET_SERVICE_URL || 'http://yeet-service:3000',
      timeout: parseInt(process.env.YEET_SERVICE_TIMEOUT) || 5000
    }
  },

  // CORS configuration
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || [
      'http://localhost',
      'http://localhost:3000',
      'http://api-gateway:80',
      'http://localhost:8080'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Length', 'X-Powered-By'],
    credentials: true
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    enableQueryLogging: process.env.ENABLE_QUERY_LOGGING === 'true'
  },

  // Token cleanup configuration
  cleanup: {
    interval: parseInt(process.env.CLEANUP_INTERVAL) || 60 * 60 * 1000, // 1 hour
    batchSize: parseInt(process.env.CLEANUP_BATCH_SIZE) || 100
  }
};

// Validation functions
export const validateConfig = () => {
  const errors = [];

  // Validate JWT secrets strength
  if (config.jwt.accessSecret.length < 32) {
    errors.push('ACCESS_TOKEN_SECRET must be at least 32 characters long');
  }
  
  if (config.jwt.refreshSecret.length < 32) {
    errors.push('REFRESH_TOKEN_SECRET must be at least 32 characters long');
  }

  // Validate database URL format
  if (!config.database.url.startsWith('postgresql://')) {
    errors.push('DATABASE_URL must be a valid PostgreSQL connection string');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
};

export default config;
