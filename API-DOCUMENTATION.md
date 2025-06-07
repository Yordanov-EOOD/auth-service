# Auth Service API Documentation

## Overview
The Auth Service provides authentication and authorization functionality for the Twitter Clone application with enhanced security features including rate limiting, input validation, and comprehensive logging.

## Security Features
- **Rate Limiting**: Multi-tier rate limiting for different endpoints
- **Input Validation**: Comprehensive validation with XSS prevention
- **Security Headers**: Helmet.js integration with CSP, HSTS, and XSS protection
- **Token Management**: Automated cleanup of expired tokens
- **Account Lockout**: Protection against brute force attacks

## Base URL
```
http://localhost:3000
```

## Authentication Flow
1. **Register** - Create new user account
2. **Login** - Authenticate user and receive tokens
3. **Refresh** - Get new access token using refresh token
4. **Logout** - Invalidate tokens
5. **Verify** - Verify token validity

## Endpoints

### POST /register
Register a new user account.

**Rate Limit**: 3 requests per hour

**Request Body:**
```json
{
  "username": "string (3-30 chars, alphanumeric + underscore)",
  "email": "string (valid email format)",
  "password": "string (8+ chars, uppercase, lowercase, number, special char)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "userId": "string",
    "username": "string",
    "email": "string"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Validation errors
- `409 Conflict` - User already exists
- `429 Too Many Requests` - Rate limit exceeded

### POST /auth/login
Authenticate user and receive access/refresh tokens.

**Rate Limit**: 5 requests per 15 minutes

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "string",
    "user": {
      "id": "string",
      "username": "string",
      "email": "string"
    }
  }
}
```

**Cookies Set:**
- `jwt` - Refresh token (HttpOnly, Secure, SameSite)

**Error Responses:**
- `400 Bad Request` - Validation errors
- `401 Unauthorized` - Invalid credentials
- `423 Locked` - Account locked due to failed attempts
- `429 Too Many Requests` - Rate limit exceeded

### POST /auth/verify
Verify if the current access token is valid.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "user": {
      "id": "string",
      "username": "string",
      "email": "string"
    }
  }
}
```

### GET /refresh
Get a new access token using refresh token.

**Rate Limit**: 20 requests per 15 minutes

**Cookies Required:**
- `jwt` - Refresh token

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "string"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or expired refresh token
- `403 Forbidden` - Token rotation detected (security issue)

### POST /logout
Logout user and invalidate tokens.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Cookies Cleared:**
- `jwt` - Refresh token removed

## Health Endpoints

### GET /health
Basic health check.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-05-28T10:00:00.000Z",
  "uptime": 3600,
  "environment": "development",
  "version": "1.0.0",
  "tokenCleanupService": {
    "isRunning": true,
    "lastCleanup": "2025-05-28T09:00:00.000Z",
    "totalCleaned": 150
  }
}
```

### GET /health/detailed
Detailed health check with service status.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-05-28T10:00:00.000Z",
  "services": {
    "database": "healthy",
    "tokenCleanup": "running"
  }
}
```

## Rate Limiting

### Limits by Endpoint
| Endpoint | Requests | Window | Purpose |
|----------|----------|--------|---------|
| `/auth/login` | 5 | 15 minutes | Prevent brute force |
| `/register` | 3 | 1 hour | Prevent spam accounts |
| `/refresh` | 20 | 15 minutes | Normal token refresh |
| General API | 100 | 15 minutes | Overall protection |

### Account Lockout
- **Failed Attempts**: 5 consecutive failures
- **Lockout Duration**: 15 minutes
- **Reset**: Successful login or lockout expiry

## Error Handling

### Standard Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "correlationId": "req-123456789"
  }
}
```

### Error Codes
- `VALIDATION_ERROR` - Input validation failed
- `AUTH_ERROR` - Authentication failed
- `AUTHORIZATION_ERROR` - Access denied
- `RATE_LIMIT_EXCEEDED` - Rate limit hit
- `ACCOUNT_LOCKED` - Account temporarily locked
- `TOKEN_EXPIRED` - Token has expired
- `INVALID_TOKEN` - Token is invalid
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource already exists
- `INTERNAL_ERROR` - Server error

## Security Headers

The service automatically applies security headers:
- **Content Security Policy (CSP)**
- **HTTP Strict Transport Security (HSTS)**
- **X-Frame-Options**: DENY
- **X-XSS-Protection**: 1; mode=block
- **X-Content-Type-Options**: nosniff
- **Referrer-Policy**: strict-origin-when-cross-origin

## Token Management

### Access Tokens
- **Type**: JWT (JSON Web Token)
- **Expiration**: 15 minutes
- **Usage**: API authentication
- **Storage**: Client-side (memory/local storage)

### Refresh Tokens
- **Type**: JWT (JSON Web Token)
- **Expiration**: 7 days
- **Usage**: Get new access tokens
- **Storage**: HttpOnly cookie
- **Rotation**: New refresh token on each use

### Token Cleanup
- **Schedule**: Every 60 minutes
- **Target**: Expired and invalid tokens
- **Batch Size**: 1000 tokens per cleanup
- **Monitoring**: Available via health endpoints

## Environment Configuration

### Required Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# JWT Secrets
ACCESS_TOKEN_SECRET=your-access-secret
REFRESH_TOKEN_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Server
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://yourapp.com

# Rate Limiting
RATE_LIMIT_AUTH_REQUESTS=5
RATE_LIMIT_AUTH_WINDOW_MS=900000
RATE_LIMIT_REGISTER_REQUESTS=3
RATE_LIMIT_REGISTER_WINDOW_MS=3600000

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

## Logging

### Log Levels
- **error**: System errors and exceptions
- **warn**: Client errors and warnings
- **info**: General application flow
- **debug**: Detailed debugging information

### Log Context
All logs include:
- Timestamp
- Log level
- Message
- Correlation ID (for request tracking)
- Additional context (user ID, IP, etc.)

### Security Events
Special logging for:
- Failed login attempts
- Account lockouts
- Token violations
- Rate limit violations
- Suspicious activities

## Testing

### Running Tests
```bash
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

### Test Coverage
- **Integration Tests**: API endpoint testing
- **Unit Tests**: Service and utility testing
- **Security Tests**: Validation and rate limiting
- **Health Tests**: Service availability

## Deployment

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Setup
1. Set environment variables
2. Initialize database (Prisma migrate)
3. Start Redis instance
4. Configure Kafka (optional)
5. Start the service

## Monitoring

### Key Metrics
- Request rate and response times
- Authentication success/failure rates
- Rate limit violations
- Token cleanup statistics
- Database connection health
- Redis connection status

### Alerts
- High error rates
- Authentication failures spike
- Database connectivity issues
- Memory/CPU usage alerts
- Token cleanup failures

## Security Best Practices

### Implementation
- ✅ Input validation and sanitization
- ✅ Rate limiting and account lockout
- ✅ Secure token storage (HttpOnly cookies)
- ✅ Token rotation and cleanup
- ✅ Security headers and CSP
- ✅ Structured logging and monitoring
- ✅ Environment variable validation

### Recommendations
- Use HTTPS in production
- Implement WAF (Web Application Firewall)
- Monitor for suspicious patterns
- Regular security audits
- Keep dependencies updated
- Implement proper CORS policies
