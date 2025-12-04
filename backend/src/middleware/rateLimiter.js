const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

/**
 * General API rate limiter
 * Limits: 200 requests per 15 minutes per IP (increased for leaderboard polling)
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs (increased for leaderboard polling)
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Use ipKeyGenerator helper for proper IPv6 support
  keyGenerator: ipKeyGenerator,
  skip: (req) => {
    // Skip general limiter for leaderboard routes (they have their own limiter)
    return req.path.startsWith('/api/leaderboard');
  },
});

/**
 * Strict rate limiter for authentication endpoints
 * Limits: 10 requests per 15 minutes per IP (increased from 5 to allow for legitimate retries)
 * Note: Returns 429 (Too Many Requests), not 401
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs (increased for better UX)
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins against limit
  // Use ipKeyGenerator helper for proper IPv6 support
  keyGenerator: ipKeyGenerator,
});

/**
 * Leaderboard rate limiter
 * Limits: 100 requests per minute per IP (increased for polling)
 */
const leaderboardLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per minute (increased for leaderboard polling)
  message: { error: 'Too many leaderboard requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  // Use ipKeyGenerator helper for proper IPv6 support
  keyGenerator: ipKeyGenerator,
});

module.exports = {
  generalLimiter,
  authLimiter,
  leaderboardLimiter,
};

