import config from '../config/index.js';

/**
 * JWT Utility Functions for Performance Optimization
 */

// Pre-calculate JWT options to avoid repeated object creation
const accessTokenOptions = {
  issuer: config.jwt.issuer,
  audience: config.jwt.audience,
  expiresIn: config.jwt.accessExpiration
};

const refreshTokenOptions = {
  issuer: config.jwt.issuer,
  audience: config.jwt.audience,
  expiresIn: config.jwt.refreshExpiration
};

// Cache expiration calculation to avoid repeated parsing
const expirationCache = new Map();

/**
 * Get expiration time from JWT expiration string
 * @param {string} expiration - JWT expiration string (e.g., '7d', '15m')
 * @returns {Date} Expiration date
 */
export const getExpirationTime = (expiration) => {
  if (expirationCache.has(expiration)) {
    const cachedMs = expirationCache.get(expiration);
    return new Date(Date.now() + cachedMs);
  }

  let milliseconds;
  const value = parseInt(expiration);
  const unit = expiration.slice(-1);

  switch (unit) {
    case 'd':
      milliseconds = value * 24 * 60 * 60 * 1000;
      break;
    case 'h':
      milliseconds = value * 60 * 60 * 1000;
      break;
    case 'm':
      milliseconds = value * 60 * 1000;
      break;
    case 's':
      milliseconds = value * 1000;
      break;
    default:
      milliseconds = 7 * 24 * 60 * 60 * 1000; // Default 7 days
  }

  // Cache the calculation
  expirationCache.set(expiration, milliseconds);
  return new Date(Date.now() + milliseconds);
};

/**
 * Get optimized JWT signing options
 */
export const getAccessTokenOptions = () => ({ ...accessTokenOptions });
export const getRefreshTokenOptions = () => ({ ...refreshTokenOptions });

/**
 * Cookie configuration constants
 */
export const COOKIE_CONFIG = {
  REFRESH_TOKEN: {
    httpOnly: true,
    secure: config.server.nodeEnv === 'production',
    sameSite: 'Strict',
    maxAge: getExpirationTime(config.jwt.refreshExpiration).getTime() - Date.now()
  }
};
