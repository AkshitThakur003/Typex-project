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
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No token provided' });
  
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
