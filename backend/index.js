require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const { Server } = require('socket.io');
const connectDB = require('./src/config/db');

const authRoutes = require('./src/routes/auth');
const { registerGameSocket } = require('./src/sockets/game');
const leaderboardRoutes = require('./src/routes/leaderboard');
const friendsRoutes = require('./src/routes/friends');
const profileRoutes = require('./src/routes/profile');
const xpRoutes = require('./src/routes/xp');
const multiplayerRoutes = require('./src/routes/multiplayer');
const authMiddleware = require('./src/middleware/auth');
const { generalLimiter } = require('./src/middleware/rateLimiter');
const passport = require('./src/config/passport');

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// Build allowed origins from environment
const allowedOrigins = new Set();
if (CLIENT_ORIGIN) {
  allowedOrigins.add(CLIENT_ORIGIN);
}
// Add additional origins from env if provided (comma-separated)
if (process.env.ALLOWED_ORIGINS) {
  process.env.ALLOWED_ORIGINS.split(',').forEach(origin => {
    const trimmed = origin.trim();
    if (trimmed) allowedOrigins.add(trimmed);
  });
}
// Development fallbacks
if (NODE_ENV === 'development') {
  allowedOrigins.add('http://localhost:5173');
  allowedOrigins.add('http://127.0.0.1:5173');
}

async function start() {
  await connectDB();

  // Log environment configuration for debugging
  console.log('[Config] NODE_ENV:', NODE_ENV);
  console.log('[Config] CLIENT_ORIGIN:', CLIENT_ORIGIN);
  console.log('[Config] Allowed origins:', Array.from(allowedOrigins));
  console.log('[Config] JWT_SECRET:', process.env.JWT_SECRET ? '***SET***' : 'NOT SET (using default)');

  const app = express();

  // Trust proxy - REQUIRED for Render and other reverse proxies
  // Set to 1 to trust only the first proxy (Render's load balancer)
  // This prevents rate limiting bypass while still allowing proper IP detection
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
    crossOriginEmbedderPolicy: false, // Allow Socket.io
  }));

  // CORS configuration - environment-based
  app.use(cors({
    credentials: true,
    origin: (origin, callback) => {
      // Log for debugging (remove in production if sensitive)
      if (NODE_ENV === 'development') {
        console.log('[CORS] Request from origin:', origin);
        console.log('[CORS] Allowed origins:', Array.from(allowedOrigins));
      }
      
      // Allow requests with no origin for health checks and internal services
      // Render health checks and some internal requests don't send origin headers
      if (!origin) {
        // Allow health check endpoint without origin
        if (NODE_ENV === 'development') {
          return callback(null, true);
        }
        // In production, only allow health checks without origin
        // This will be checked by the route handler
        return callback(null, true);
      }
      // Allow requests with no origin in development (for testing)
      if (!origin && NODE_ENV === 'development') {
        return callback(null, true);
      }
      // Check if origin is in allowed list
      if (allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      // Reject all other origins
      console.warn('[CORS] Rejected origin:', origin);
      return callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
    },
  }));

  // Body parser with size limit
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // CDN configuration endpoint
  app.get('/api/cdn/config', (_req, res) => {
    const { getCdnConfig } = require('./src/utils/cdn');
    res.json(getCdnConfig());
  });

  // Apply general rate limiting to all API routes
  app.use('/api', generalLimiter);

  app.get('/api/health', (_req, res) => {
    res.json({ 
      ok: true, 
      timestamp: new Date().toISOString(),
      origin: _req.headers.origin || 'none',
      corsConfigured: allowedOrigins.size > 0,
    });
  });

  // Debug endpoints - ONLY available in development mode
  if (NODE_ENV === 'development') {
    // Diagnostic endpoint to check if auth routes are loaded
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

    // Debug endpoint to check CORS configuration
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

    // Debug endpoint to check OAuth configuration
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
        authRoutesAvailable: {
          '/api/auth/google': 'GET',
          '/api/auth/google/callback': 'GET',
          '/auth/google/callback': 'GET (redirects to /api/auth/google/callback)',
        },
        note: 'IMPORTANT: The callbackURL above must match EXACTLY what is in Google Cloud Console Authorized redirect URIs'
      });
    });
    
    console.log('[Security] Debug endpoints enabled (development mode only)');
  }

  // Handle OAuth callback at both paths to support different configurations
  // If GOOGLE_CALLBACK_URL uses /auth/google/callback (without /api), handle it here
  // Otherwise, the route under /api/auth will handle it
  if (process.env.GOOGLE_CALLBACK_URL && process.env.GOOGLE_CALLBACK_URL.includes('/auth/google/callback') && !process.env.GOOGLE_CALLBACK_URL.includes('/api/auth/google/callback')) {
    // Mount auth routes at /auth as well to handle callback without /api prefix
    app.use('/auth', authRoutes);
    console.log('[OAuth] Supporting callback path: /auth/google/callback (without /api prefix)');
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

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      credentials: true,
      methods: ['GET', 'POST'],
      origin: (origin, callback) => {
        // Allow requests with no origin (for health checks, internal services)
        if (!origin) {
          return callback(null, true);
        }
        // Check if origin is in allowed list
        if (allowedOrigins.has(origin)) {
          return callback(null, true);
        }
        // Reject all other origins
        return callback(new Error('Not allowed by CORS'));
      },
    },
  });

  registerGameSocket(io);

  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
