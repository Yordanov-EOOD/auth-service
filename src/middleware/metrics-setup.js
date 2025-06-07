import client from 'prom-client';
import logger from '../config/logger.js';

// Create a Registry to register metrics
const register = new client.Registry();

// Add default metrics (process, eventloop, heap, etc)
client.collectDefaultMetrics({ register });

// HTTP Request metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code', 'handler'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000]
});

// HTTP Request Counter
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status_code', 'handler']
});

// Authentication operations counter
const authOperationsTotal = new client.Counter({
  name: 'auth_operations_total',
  help: 'Total number of authentication operations',
  labelNames: ['operation', 'status']
});

// Register metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(authOperationsTotal);

// Middleware to track HTTP requests
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  const path = req.originalUrl || req.url;
  const method = req.method;
  const handler = req.route?.path || 'unknown';
  
  // When response is finished, record metrics
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode.toString();
    
    httpRequestsTotal.inc({
      method, 
      path, 
      status_code: statusCode,
      handler
    });
    
    httpRequestDuration.observe(
      { 
        method, 
        route: path, 
        status_code: statusCode,
        handler
      }, 
      duration
    );
    
    // Only log if request takes more than 1 second
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        method,
        path,
        duration,
        statusCode
      });
    }
  });
  
  next();
};

// Metrics endpoint handler
const metricsHandler = async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// Helper to record authentication operations
const recordAuthOperation = (operation, status) => {
  authOperationsTotal.inc({ operation, status });
};

export {
  register,
  metricsMiddleware,
  metricsHandler,
  recordAuthOperation
};
