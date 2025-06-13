import promClient from 'prom-client';
import os from 'os';

// Create a Registry which registers the metrics
const register = new promClient.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'auth-service'
});

// Enable the collection of default metrics
promClient.collectDefaultMetrics({ register });

// Create custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code', 'handler', 'path'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status_code', 'handler']
});

const httpRequestTotal = new promClient.Counter({
  name: 'http_request_total',
  help: 'Total number of HTTP requests for error tracking',
  labelNames: ['method', 'path', 'status_code']
});

const authOperationsTotal = new promClient.Counter({
  name: 'auth_operations_total',
  help: 'Total number of authentication operations',
  labelNames: ['operation', 'status']
});

const activeConnections = new promClient.Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

const dbConnections = new promClient.Gauge({
  name: 'database_connections_active',
  help: 'Number of active database connections'
});

// Register custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(httpRequestTotal);
register.registerMetric(authOperationsTotal);
register.registerMetric(activeConnections);
register.registerMetric(dbConnections);

// Add CPU and Memory metrics
const processCpuPercent = new promClient.Gauge({
  name: 'process_cpu_percent',
  help: 'Process CPU usage percentage'
});

const processMemoryPercent = new promClient.Gauge({
  name: 'process_memory_percent',
  help: 'Process memory usage percentage'
});

// Only register CPU and memory metrics since nodejs metrics are already registered by collectDefaultMetrics
register.registerMetric(processCpuPercent);
register.registerMetric(processMemoryPercent);

// Middleware to track HTTP requests
export const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000; // Convert to seconds for Prometheus convention
    const path = req.originalUrl || req.url;
    const route = req.route ? req.route.path : req.path;
    const handler = req.route?.path || 'unknown';
    
    // Record request duration in seconds
    httpRequestDuration
      .labels(req.method, route, res.statusCode, handler, path)
      .observe(duration);
    
    // Record HTTP requests with handler info
    httpRequestsTotal
      .labels(req.method, path, res.statusCode, handler)
      .inc();
    
    // Record HTTP requests for error tracking
    httpRequestTotal
      .labels(req.method, path, res.statusCode)
      .inc();
    // Update CPU and memory usage periodically
    const usage = process.memoryUsage();
    const memoryUsedMB = usage.rss / 1024 / 1024;
    const totalMemoryMB = os.totalmem() / 1024 / 1024;
    const memoryPercent = (memoryUsedMB / totalMemoryMB) * 100;
    
    processMemoryPercent.set(memoryPercent);
    
    // We'll estimate CPU usage with a simple load average approach
    const cpuUsage = os.loadavg()[0] * 10; // Multiply by 10 to get percentage (rough estimate)
    processCpuPercent.set(Math.min(cpuUsage, 100)); // Cap at 100%
  });
  
  next();
};

// Function to track auth operations
export const trackAuthOperation = (operation, status) => {
  authOperationsTotal.labels(operation, status).inc();
  // Update CPU and memory usage
  const usage = process.memoryUsage();
  const memoryUsedMB = usage.rss / 1024 / 1024;
  const totalMemoryMB = os.totalmem() / 1024 / 1024;
  const memoryPercent = (memoryUsedMB / totalMemoryMB) * 100;
  
  processMemoryPercent.set(memoryPercent);
  
  const cpuUsage = os.loadavg()[0] * 10; 
  processCpuPercent.set(Math.min(cpuUsage, 100));
};

// Alias for trackAuthOperation - for better naming consistency with metrics-setup.js
export const recordAuthOperation = trackAuthOperation;

// Function to set active connections
export const setActiveConnections = (count) => {
  activeConnections.set(count);
};

// Function to set database connections
export const setDbConnections = (count) => {
  dbConnections.set(count);
};

// Metrics endpoint handler
export const metricsHandler = (req, res) => {
  res.set('Content-Type', register.contentType);
  register.metrics().then(data => {
    res.send(data);
  }).catch(err => {
    res.status(500).send(err);
  });
};

export { 
  register,
  processCpuPercent,
  processMemoryPercent
};
