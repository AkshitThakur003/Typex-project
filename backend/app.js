/**
 * Express app configuration
 * Exported for testing and server startup
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { generalLimiter } = require('./src/middleware/rateLimiter');

const authRoutes = require('./src/routes/auth');
const leaderboardRoutes = require('./src/routes/leaderboard');
const friendsRoutes = require('./src/routes/friends');
const profileRoutes = require('./src/routes/profile');
const xpRoutes = require('./src/routes/xp');
const multiplayerRoutes = require('./src/routes/multiplayer');
const authMiddleware = require('./src/middleware/auth');

const NODE_ENV = process.env.NODE_ENV || 'development';
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// Build allowed origins from environment
const allowedOrigins = new Set();
if (CLIENT_ORIGIN) {
  allowedOrigins.add(CLIENT_ORIGIN);
}
if (process.env.ALLOWED_ORIGINS) {
  process.env.ALLOWED_ORIGINS.split(',').forEach(origin => {
    const trimmed = origin.trim();
    if (trimmed) allowedOrigins.add(trimmed);
  });
}
if (NODE_ENV === 'development' || NODE_ENV === 'test') {
  allowedOrigins.add('http://localhost:5173');
  allowedOrigins.add('http://127.0.0.1:5173');
}

function createApp() {
  const app = express();

  // Trust proxy
  app.set('trust proxy', 1);

  // Security headers with Helmet
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "ws:", "wss:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // CORS configuration
  app.use(cors({
    credentials: true,
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, Postman)
      if (!origin) {
        return callback(null, true);
      }
      
      // Allow all origins in development/test
      if (NODE_ENV === 'test' || NODE_ENV === 'development') {
        return callback(null, true);
      }
      
      // Normalize origin (remove trailing slash, ensure lowercase for comparison)
      const normalizedOrigin = origin.toLowerCase().replace(/\/$/, '');
      
      // Check exact match in allowed origins (normalized)
      const normalizedAllowedOrigins = Array.from(allowedOrigins).map(o => o.toLowerCase().replace(/\/$/, ''));
      if (normalizedAllowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }
      
      // Allow all Vercel deployments (preview and production)
      // Check if origin ends with .vercel.app (case-insensitive)
      if (normalizedOrigin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      
      // Log rejected origin for debugging (only in production to avoid spam)
      if (NODE_ENV === 'production') {
        console.log(`[CORS] Rejected origin: ${origin} (normalized: ${normalizedOrigin})`);
        console.log(`[CORS] Allowed origins:`, Array.from(allowedOrigins));
        console.log(`[CORS] NODE_ENV: ${NODE_ENV}`);
      }
      
      return callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
    },
  }));

  // Body parser
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  
  // Cookie parser
  app.use(cookieParser());

  // CDN configuration endpoint
  app.get('/api/cdn/config', (_req, res) => {
    const { getCdnConfig } = require('./src/utils/cdn');
    res.json(getCdnConfig());
  });

  // Apply general rate limiting (skip in test)
  if (NODE_ENV !== 'test') {
    app.use('/api', generalLimiter);
  }

  app.get('/api/health', (_req, res) => {
    res.json({ 
      ok: true, 
      timestamp: new Date().toISOString(),
      origin: _req.headers.origin || 'none',
      corsConfigured: allowedOrigins.size > 0,
    });
  });

  // CORS debug endpoint (available in all environments)
  app.get('/api/debug/cors-check', (req, res) => {
    const origin = req.headers.origin;
    const normalizedOrigin = origin ? origin.toLowerCase().replace(/\/$/, '') : null;
    const normalizedAllowedOrigins = Array.from(allowedOrigins).map(o => o.toLowerCase().replace(/\/$/, ''));
    
    res.json({
      origin: origin || 'none',
      normalizedOrigin: normalizedOrigin || 'none',
      nodeEnv: NODE_ENV,
      allowedOrigins: Array.from(allowedOrigins),
      normalizedAllowedOrigins: normalizedAllowedOrigins,
      isInAllowedOrigins: origin ? normalizedAllowedOrigins.includes(normalizedOrigin) : false,
      endsWithVercelApp: normalizedOrigin ? normalizedOrigin.endsWith('.vercel.app') : false,
      wouldBeAllowed: !origin || 
                     NODE_ENV === 'test' || 
                     NODE_ENV === 'development' || 
                     (origin && normalizedAllowedOrigins.includes(normalizedOrigin)) ||
                     (normalizedOrigin && normalizedOrigin.endsWith('.vercel.app')),
    });
  });

  // Debug endpoints (development only, not in test)
  if (NODE_ENV === 'development') {
    app.get('/api/debug/cookies', (req, res) => {
      res.json({
        cookies: req.cookies || {},
        cookieHeader: req.headers.cookie || 'none',
        hasAccessToken: !!req.cookies?.accessToken,
        hasRefreshToken: !!req.cookies?.refreshToken,
      });
    });

    app.get('/api/debug/routes', (_req, res) => {
      const routes = [];
      app._router?.stack?.forEach((middleware) => {
        if (middleware.route) {
          routes.push({
            path: middleware.route.path,
            methods: Object.keys(middleware.route.methods),
          });
        } else if (middleware.name === 'router') {
          middleware.handle?.stack?.forEach((handler) => {
            if (handler.route) {
              routes.push({
                path: (middleware.regexp.source.replace('\\/?', '').replace('(?=\\/|$)', '') + handler.route.path).replace(/\/\//g, '/'),
                methods: Object.keys(handler.route.methods),
              });
            }
          });
        }
      });
      res.json({ routes, authRoutesMounted: !!authRoutes });
    });

    app.get('/api/debug/cors', (_req, res) => {
      res.json({
        nodeEnv: NODE_ENV,
        clientOrigin: CLIENT_ORIGIN,
        allowedOrigins: Array.from(allowedOrigins),
        requestOrigin: _req.headers.origin || 'none',
        isAllowed: _req.headers.origin ? allowedOrigins.has(_req.headers.origin) : false,
        jwtSecretSet: !!process.env.JWT_SECRET,
      });
    });

    app.get('/api/debug/oauth', (_req, res) => {
      const protocol = NODE_ENV === 'production' ? 'https' : 'http';
      const host = process.env.SERVER_HOST || 'localhost';
      const port = process.env.PORT || 5000;
      const callbackURL = process.env.GOOGLE_CALLBACK_URL || 
        (NODE_ENV === 'production' 
          ? `${protocol}://${host}/api/auth/google/callback`
          : `${protocol}://${host}:${port}/api/auth/google/callback`);
      
      res.json({
        configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        hasClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: callbackURL,
        callbackURLFromEnv: process.env.GOOGLE_CALLBACK_URL || 'NOT SET (using default)',
        expectedFrontendCallback: `${CLIENT_ORIGIN}/auth/callback`,
      });
    });
  }

  // Handle OAuth callback at both paths
  if (process.env.GOOGLE_CALLBACK_URL && process.env.GOOGLE_CALLBACK_URL.includes('/auth/google/callback') && !process.env.GOOGLE_CALLBACK_URL.includes('/api/auth/google/callback')) {
    app.use('/auth', authRoutes);
  }
  
  app.use('/api/auth', authRoutes);
  app.use('/api/leaderboard', leaderboardRoutes);
  app.use('/api/friends', friendsRoutes);
  app.use('/api/multiplayer', multiplayerRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/profile/xp', xpRoutes);

  // Example protected route
  app.get('/api/protected', authMiddleware, (req, res) => {
    res.json({ ok: true, user: req.user });
  });

  return app;
}

module.exports = createApp;

