import winston from 'winston';
import config from './index.js';

// Custom log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Custom colors for log levels
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

winston.addColors(logColors);

// Create custom format for development
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Create custom format for production (structured JSON)
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: config.server.isDevelopment ? developmentFormat : productionFormat
  }),
  
  // File transport for errors
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }),
  
  // File transport for all logs
  new winston.transports.File({
    filename: 'logs/combined.log',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  })
];

// Create the logger
export const logger = winston.createLogger({
  level: config.logging.level,
  levels: logLevels,
  transports,
  exitOnError: false
});

// Add request ID tracking
export const addRequestId = (req, res, next) => {
  req.requestId = Math.random().toString(36).substring(2, 15);
  res.set('X-Request-ID', req.requestId);
  next();
};

// Security event logger
export const logSecurityEvent = (event, details = {}) => {
  logger.warn('SECURITY_EVENT', {
    event,
    timestamp: new Date().toISOString(),
    ...details
  });
};

// Authentication event logger
export const logAuthEvent = (event, userId, details = {}) => {
  logger.info('AUTH_EVENT', {
    event,
    userId,
    timestamp: new Date().toISOString(),
    ...details
  });
};

// Request logger middleware
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  logger.http('REQUEST', {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - startTime;
    
    logger.http('RESPONSE', {
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Database query logger
export const logDatabaseQuery = (model, action, duration) => {
  if (config.logging.enableQueryLogging) {
    logger.debug('DATABASE_QUERY', {
      model,
      action,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  }
};

// Error logger
export const logError = (error, context = {}) => {
  logger.error('APPLICATION_ERROR', {
    message: error.message,
    stack: error.stack,
    ...context,
    timestamp: new Date().toISOString()
  });
};

export default logger;
