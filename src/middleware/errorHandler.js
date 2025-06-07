import { sendErrorResponse, AppError, createInternalError } from '../utils/errorResponse.js';
import { logger } from '../config/logger.js';

export const errorHandler = (err, req, res, next) => {
  // If headers are already sent, delegate to Express default error handler
  if (res.headersSent) {
    return next(err);
  }
  
  let error = err;
  
  // Convert non-AppError instances to AppError
  if (!(error instanceof AppError)) {
    // Handle specific error types
    if (error.name === 'ValidationError') {
      error = new AppError('Validation Error', 400, 'VALIDATION_ERROR', error.errors);
    } else if (error.name === 'JsonWebTokenError') {
      error = new AppError('Invalid token', 401, 'INVALID_TOKEN');
    } else if (error.name === 'TokenExpiredError') {
      error = new AppError('Token expired', 401, 'TOKEN_EXPIRED');
    } else if (error.code === 'P2002') { // Prisma unique constraint
      error = new AppError('Duplicate entry', 409, 'DUPLICATE_ENTRY');
    } else if (error.code === 'P2025') { // Prisma record not found
      error = new AppError('Record not found', 404, 'NOT_FOUND');
    } else {
      // Generic server error
      error = createInternalError('An unexpected error occurred');
    }
  }
  
  // Send standardized error response
  sendErrorResponse(res, error, req);
};