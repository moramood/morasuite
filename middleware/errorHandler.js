/**
 * MoraSuite — Global Error Handling Middleware
 * Consistent JSON error responses for all unhandled errors.
 */
const logger = require('../config/logger');

function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Error interno del servidor.';

  logger.error(`${req.method} ${req.originalUrl} → ${statusCode}: ${err.message}`, {
    stack: err.stack,
    body: req.body
  });

  res.status(statusCode).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV !== 'production' && { detail: err.message, stack: err.stack })
  });
}

/**
 * Custom operational error class.
 */
class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { errorHandler, AppError };
