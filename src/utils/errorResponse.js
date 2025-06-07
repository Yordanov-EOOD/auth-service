import { logger } from '../config/logger.js';

/**
 * Standardized error response utility
 * Provides consistent error formatting and logging across the application
 */

export class AppError extends Error {
  constructor(message, statusCode = 500, code = null, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Send standardized error response
 * @param {Object} res - Express response object
 * @param {Error} error - Error object
 * @param {Object} req - Express request object for logging context
 */
export const sendErrorResponse = (res, error, req = null) => {
  const statusCode = error.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Log error with context
  const logData = {
    error: error.message,
    statusCode,
    stack: error.stack,
    ...(req && {
      correlationId: req.correlationId,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    }),
    ...(error.details && { details: error.details })
  };
  
  if (statusCode >= 500) {
    logger.error('Server error occurred', logData);
  } else {
    logger.warn('Client error occurred', logData);
  }
  
  // Prepare response
  const response = {
    success: false,
    error: {
      message: error.message,
      ...(error.code && { code: error.code }),
      ...(req?.correlationId && { correlationId: req.correlationId })
    }
  };
  
  // Add additional details in development
  if (!isProduction) {
    response.error.stack = error.stack;
    if (error.details) {
      response.error.details = error.details;
    }
  }
  
  res.status(statusCode).json(response);
};

/**
 * Create validation error response
 * @param {Array} validationErrors - Array of validation errors
 */
export const createValidationError = (validationErrors) => {
  const details = validationErrors.map(err => ({
    field: err.path || err.param,
    message: err.msg || err.message,
    value: err.value
  }));
  
  return new AppError(
    'Validation failed',
    400,
    'VALIDATION_ERROR',
    details
  );
};

/**
 * Create authentication error
 * @param {string} message - Error message
 */
export const createAuthError = (message = 'Authentication failed') => {
  return new AppError(message, 401, 'AUTH_ERROR');
};

/**
 * Create authorization error
 * @param {string} message - Error message
 */
export const createAuthorizationError = (message = 'Access denied') => {
  return new AppError(message, 403, 'AUTHORIZATION_ERROR');
};

/**
 * Create not found error
 * @param {string} resource - Resource that was not found
 */
export const createNotFoundError = (resource = 'Resource') => {
  return new AppError(`${resource} not found`, 404, 'NOT_FOUND');
};

/**
 * Create rate limit error
 * @param {string} message - Error message
 */
export const createRateLimitError = (message = 'Too many requests') => {
  return new AppError(message, 429, 'RATE_LIMIT_EXCEEDED');
};

/**
 * Create conflict error
 * @param {string} message - Error message
 */
export const createConflictError = (message = 'Resource already exists') => {
  return new AppError(message, 409, 'CONFLICT');
};

/**
 * Create internal server error
 * @param {string} message - Error message
 */
export const createInternalError = (message = 'Internal server error') => {
  return new AppError(message, 500, 'INTERNAL_ERROR');
};

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 */
export const sendSuccessResponse = (res, data = null, message = 'Success', statusCode = 200) => {
  const response = {
    success: true,
    message,
    ...(data && { data })
  };
  
  res.status(statusCode).json(response);
};
