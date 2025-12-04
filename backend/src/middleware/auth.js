const jwt = require('jsonwebtoken');

// SECURITY: Ensure JWT_SECRET is set in production
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    console.error('[CRITICAL] JWT_SECRET is not set in production! Server will reject all tokens.');
    return null;
  }
  if (!secret) {
    console.warn('[WARNING] JWT_SECRET not set. Using development fallback. DO NOT USE IN PRODUCTION!');
    return 'dev_secret_DO_NOT_USE_IN_PRODUCTION';
  }
  return secret;
};

module.exports = function auth(req, res, next) {
  // Try to get token from cookie first (preferred method)
  let token = req.cookies?.accessToken;
  
  // Debug logging in development
  if (process.env.NODE_ENV === 'development' && req.path === '/api/auth/me') {
    console.log('[Auth Middleware] Cookies received:', Object.keys(req.cookies || {}));
    console.log('[Auth Middleware] Has accessToken cookie:', !!req.cookies?.accessToken);
  }
  
  // Fall back to Authorization header for backward compatibility
  if (!token) {
    const header = req.headers.authorization || '';
    token = header.startsWith('Bearer ') ? header.slice(7) : null;
  }
  
  if (!token) {
    // In development, log why auth failed
    if (process.env.NODE_ENV === 'development' && req.path === '/api/auth/me') {
      console.log('[Auth Middleware] No token found - user not authenticated (this is normal if not logged in)');
    }
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const secret = getJwtSecret();
  if (!secret) {
    return res.status(500).json({ error: 'Server configuration error' });
  }
  
  try {
    const payload = jwt.verify(token, secret);
    req.user = payload;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};
