const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const passport = require('../config/passport');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { validatePassword } = require('../utils/passwordValidator');
const { requestReset, resetPassword } = require('../controllers/authController');
const { sendVerificationEmail } = require('../utils/emailService');

// SECURITY: Get JWT secret with proper fallback handling
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    console.error('[CRITICAL] JWT_SECRET is not set in production!');
    return null;
  }
  if (!secret) {
    console.warn('[WARNING] JWT_SECRET not set. Using development fallback.');
    return 'dev_secret_DO_NOT_USE_IN_PRODUCTION';
  }
  return secret;
};

// Get refresh token secret (can be same as JWT_SECRET or separate)
const getRefreshTokenSecret = () => {
  return process.env.REFRESH_TOKEN_SECRET || getJwtSecret();
};

// Cookie configuration
const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true, // Prevent XSS attacks
    secure: isProduction, // Only send over HTTPS in production
    sameSite: isProduction ? 'strict' : 'lax', // CSRF protection
    path: '/',
    maxAge: isProduction ? 7 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000, // 7 days
  };
};

// Helper to set auth cookies
const setAuthCookies = (res, accessToken, refreshToken) => {
  const cookieOptions = getCookieOptions();
  
  // Set access token cookie (short-lived: 15 minutes)
  res.cookie('accessToken', accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
  
  // Set refresh token cookie (long-lived: 7 days)
  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// Helper to clear auth cookies
const clearAuthCookies = (res) => {
  const cookieOptions = getCookieOptions();
  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
};

// Generate access token (short-lived: 15 minutes)
const generateAccessToken = (user) => {
  const secret = getJwtSecret();
  if (!secret) return null;
  return jwt.sign(
    { id: user._id, username: user.username },
    secret,
    { expiresIn: '15m' }
  );
};

// Generate refresh token (long-lived: 7 days, stored in DB)
const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

// Input sanitization helper
const sanitizeInput = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().slice(0, 500); // Limit length to prevent DoS
};

// POST /api/auth/signup
router.post('/signup', authLimiter, async (req, res) => {
  try {
    // Sanitize inputs
    const username = sanitizeInput(req.body.username);
    const email = sanitizeInput(req.body.email);
    const password = req.body.password; // Don't trim password
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Check if user already exists with OAuth (prevent duplicate accounts)
    const existingOAuth = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { username }
      ],
      oauthProvider: { $ne: null }
    });
    if (existingOAuth) {
      return res.status(409).json({ error: 'An account with this email/username already exists via OAuth. Please use OAuth login.' });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.error });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate username (3-20 chars, alphanumeric and underscore)
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({ error: 'Username must be 3-20 characters and contain only letters, numbers, and underscores' });
    }

    const existing = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username }] });
    if (existing) return res.status(409).json({ error: 'User already exists' });

    // Get JWT secret securely
    const secret = getJwtSecret();
    if (!secret) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpiry = new Date(Date.now() + (24 * 60 * 60 * 1000)); // 24 hours

    // Generate refresh token
    const refreshToken = generateRefreshToken();
    const refreshTokenExpiry = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)); // 7 days

    const passwordHash = await bcrypt.hash(password, 10);
    // Don't include oauthProvider/oauthId for regular users - leave them undefined
    // This prevents them from being indexed by the partial index
    const user = await User.create({ 
      username, 
      email: email.toLowerCase(), 
      passwordHash,
      emailVerificationToken,
      emailVerificationExpiry,
      refreshToken,
      refreshTokenExpiry,
      emailVerified: false // Will be set to true after email verification
      // Note: oauthProvider and oauthId are intentionally omitted for regular users
    });

    // Generate access token
    const accessToken = generateAccessToken(user);
    if (!accessToken) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Set cookies
    setAuthCookies(res, accessToken, refreshToken);

    // Send verification email
    const emailResult = await sendVerificationEmail(user.email, user.username, emailVerificationToken);
    
    const NODE_ENV = process.env.NODE_ENV || 'development';
    const response = {
      user: { id: user._id, username: user.username, email: user.email, emailVerified: false },
      message: 'Account created successfully. Please verify your email.'
    };
    
    // In development, include token in response if email sending failed or SMTP not configured
    if (NODE_ENV === 'development' && !emailResult.sent) {
      response.verificationToken = emailVerificationToken;
      response.emailNote = 'Email service not configured. Use the token above to verify manually.';
    }

    // Log email sending result (don't expose to client)
    if (!emailResult.sent) {
      console.warn('[Signup] Verification email not sent:', emailResult.error);
    }

    res.status(201).json(response);
  } catch (err) {
    console.error('[Signup] Error:', err);
    // Provide more detailed error information in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[Signup] Error details:', {
        message: err.message,
        name: err.name,
        code: err.code,
        keyPattern: err.keyPattern,
        keyValue: err.keyValue,
        stack: err.stack
      });
      // Return more detailed error in development
      if (err.code === 11000) {
        // Duplicate key error
        const field = err.keyPattern ? Object.keys(err.keyPattern)[0] : 'field';
        return res.status(409).json({ 
          error: `${field} already exists`,
          details: err.keyValue 
        });
      }
      return res.status(500).json({ 
        error: 'Server error', 
        details: err.message,
        code: err.code 
      });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
// NOTE: No password validation here - only validate on signup
// This ensures backward compatibility with all existing user passwords
router.post('/login', authLimiter, async (req, res) => {
  try {
    // Sanitize email input
    const email = sanitizeInput(req.body.email);
    const password = req.body.password; // Don't trim password
    
    // Basic input validation (not password strength - that's only for signup)
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user by email (case-insensitive since email is lowercase in schema)
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    
    if (!user) {
      // Don't reveal if user exists or not (security best practice)
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user signed up via OAuth (no password)
    if (user.oauthProvider && !user.passwordHash) {
      return res.status(401).json({ 
        error: `This account uses ${user.oauthProvider} login. Please sign in with ${user.oauthProvider}.`,
        oauthProvider: user.oauthProvider
      });
    }

    // Ensure passwordHash exists (backward compatibility check)
    if (!user.passwordHash) {
      console.error('[Login] User found but passwordHash is missing:', user.email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Compare password using bcrypt.compare
    const valid = await bcrypt.compare(password, user.passwordHash);
    
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get JWT secret securely
    const secret = getJwtSecret();
    if (!secret) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Generate new refresh token (token rotation)
    const refreshToken = generateRefreshToken();
    const refreshTokenExpiry = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)); // 7 days
    
    // Update user with new refresh token
    user.refreshToken = refreshToken;
    user.refreshTokenExpiry = refreshTokenExpiry;
    await user.save();

    // Generate access token
    const accessToken = generateAccessToken(user);
    if (!accessToken) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Set cookies
    setAuthCookies(res, accessToken, refreshToken);

    // Return user info (tokens are in httpOnly cookies)
    res.json({ 
      user: { 
        id: user._id, 
        username: user.username, 
        email: user.email,
        emailVerified: user.emailVerified || false
      } 
    });
  } catch (err) {
    console.error('[Login] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/refresh - Refresh access token using refresh token
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    
    if (!refreshToken) {
      // Clear any stale cookies
      clearAuthCookies(res);
      return res.status(401).json({ error: 'No refresh token provided' });
    }

    // Find user with matching refresh token
    const user = await User.findOne({
      refreshToken: refreshToken,
      refreshTokenExpiry: { $gt: Date.now() } // Token must not be expired
    });

    if (!user) {
      clearAuthCookies(res);
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    // Generate new access token
    const accessToken = generateAccessToken(user);
    if (!accessToken) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Optionally rotate refresh token (security best practice)
    const newRefreshToken = generateRefreshToken();
    const refreshTokenExpiry = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)); // 7 days
    
    user.refreshToken = newRefreshToken;
    user.refreshTokenExpiry = refreshTokenExpiry;
    await user.save();

    // Set new cookies
    setAuthCookies(res, accessToken, newRefreshToken);

    res.json({ 
      user: { 
        id: user._id, 
        username: user.username, 
        email: user.email,
        emailVerified: user.emailVerified || false
      } 
    });
  } catch (err) {
    console.error('[Refresh] Error:', err);
    clearAuthCookies(res);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/logout - Clear auth cookies
router.post('/logout', auth, async (req, res) => {
  try {
    // Clear refresh token from database
    const user = await User.findById(req.user.id);
    if (user) {
      user.refreshToken = null;
      user.refreshTokenExpiry = null;
      await user.save();
    }

    // Clear cookies
    clearAuthCookies(res);
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('[Logout] Error:', err);
    clearAuthCookies(res);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/verify-email/:token - Verify email address
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpiry: { $gt: Date.now() } // Token must not be expired
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    // Mark email as verified and clear token
    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpiry = null;
    await user.save();

    const frontendUrl = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/login?verified=true`);
  } catch (err) {
    console.error('[Verify Email] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/resend-verification - Resend verification email
router.post('/resend-verification', authLimiter, auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Generate new verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpiry = new Date(Date.now() + (24 * 60 * 60 * 1000)); // 24 hours

    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationExpiry = emailVerificationExpiry;
    await user.save();

    // Send verification email
    const emailResult = await sendVerificationEmail(user.email, user.username, emailVerificationToken);
    
    const NODE_ENV = process.env.NODE_ENV || 'development';
    const response = {
      message: 'Verification email sent. Please check your inbox.'
    };
    
    // In development, include token in response if email sending failed or SMTP not configured
    if (NODE_ENV === 'development' && !emailResult.sent) {
      response.verificationToken = emailVerificationToken;
      response.emailNote = 'Email service not configured. Use the token above to verify manually.';
    }

    // Log email sending result (don't expose to client)
    if (!emailResult.sent) {
      console.warn('[Resend Verification] Verification email not sent:', emailResult.error);
    }

    res.json(response);
  } catch (err) {
    console.error('[Resend Verification] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Below: profile & preferences
router.get('/me', auth, async (req, res) => {
  const user = await User.findById(req.user.id).lean();
  if (!user) return res.status(404).json({ error: 'Not found' });
  delete user.passwordHash;
  res.json(user);
});

router.patch('/profile', auth, async (req, res) => {
  const { username, avatarUrl, avatarChoice, status } = req.body;
  const updates = {};
  if (username) updates.username = username;
  if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl; // legacy support
  if (status !== undefined) updates.status = status;
  // Save avatarChoice, avatarUrl, and status in preferences for app-wide use
  const prefSet = {};
  if (avatarChoice !== undefined) prefSet['preferences.avatarChoice'] = avatarChoice;
  if (avatarUrl !== undefined) prefSet['preferences.avatarUrl'] = avatarUrl;
  if (status !== undefined) prefSet['preferences.status'] = status;
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { ...(Object.keys(updates).length ? updates : {}), ...(Object.keys(prefSet).length ? { $set: prefSet } : {}) },
      { new: true }
    );
    res.json({ ok: true, user: { id: user.id, username: user.username, avatarChoice: user.preferences?.avatarChoice, status: user.preferences?.status || user.status } });
  } catch (e) {
    res.status(400).json({ error: 'Update failed', details: e.message });
  }
});

router.patch('/preferences', auth, async (req, res) => {
  const allowed = ['defaultDifficulty','defaultTime','caretStyle','fontStyle','fontSize','sounds','animations','theme','avatarChoice','avatarUrl','status'];
  const payload = {};
  for (const k of allowed) if (k in req.body) payload[`preferences.${k}`] = req.body[k];
  try {
    const user = await User.findByIdAndUpdate(req.user.id, { $set: payload }, { new: true }).lean();
    delete user.passwordHash;
    res.json({ ok: true, preferences: user.preferences });
  } catch (e) {
    res.status(400).json({ error: 'Preferences update failed', details: e.message });
  }
});

router.post('/change-password', auth, authLimiter, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }

  // Validate new password strength
  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.valid) {
    return res.status(400).json({ error: passwordValidation.error });
  }

  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid current password' });
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();
  res.json({ ok: true });
});

router.delete('/me', auth, async (req, res) => {
  await User.findByIdAndDelete(req.user.id);
  res.json({ ok: true });
});

// POST /api/auth/request-reset
// Request password reset token
router.post('/request-reset', authLimiter, requestReset);
// GET /api/auth/request-reset - Return 405 Method Not Allowed
router.get('/request-reset', (req, res) => {
  res.status(405).json({ error: 'Method Not Allowed. Use POST to request a password reset.' });
});

// POST /api/auth/reset-password
// Reset password using token
router.post('/reset-password', authLimiter, resetPassword);
// GET /api/auth/reset-password - Return 405 Method Not Allowed
router.get('/reset-password', (req, res) => {
  res.status(405).json({ error: 'Method Not Allowed. Use POST to reset password.' });
});

// OAuth Routes (only register if credentials are configured)
// Google OAuth
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const frontendUrl = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  
  router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

  router.get('/google/callback',
    passport.authenticate('google', { 
      session: false, 
      failureRedirect: `${frontendUrl}/login?error=oauth_failed` 
    }),
    async (req, res) => {
      try {
        // Get JWT secret securely
        const secret = getJwtSecret();
        if (!secret) {
          return res.redirect(`${frontendUrl}/login?error=server_config`);
        }
        
        const user = req.user;
        
        // Generate refresh token (token rotation)
        const refreshToken = generateRefreshToken();
        const refreshTokenExpiry = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)); // 7 days
        
        // Update user with new refresh token
        user.refreshToken = refreshToken;
        user.refreshTokenExpiry = refreshTokenExpiry;
        // OAuth users have verified emails (from Google)
        if (!user.emailVerified) {
          user.emailVerified = true;
        }
        await user.save();
        
        // Generate access token
        const accessToken = generateAccessToken(user);
        if (!accessToken) {
          return res.redirect(`${frontendUrl}/login?error=server_config`);
        }
        
        // Set cookies
        setAuthCookies(res, accessToken, refreshToken);
        
        // Redirect to frontend (tokens are in httpOnly cookies)
        res.redirect(`${frontendUrl}/auth/callback?username=${encodeURIComponent(user.username)}`);
      } catch (err) {
        console.error('[OAuth Callback] Error:', err);
        res.redirect(`${frontendUrl}/login?error=oauth_failed`);
      }
    }
  );
} else {
  // Placeholder routes that return helpful error messages
  router.get('/google', (req, res) => {
    res.status(503).json({ 
      error: 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.',
      configured: false
    });
  });
  router.get('/google/callback', (req, res) => {
    res.status(503).json({ 
      error: 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.',
      configured: false
    });
  });
}

module.exports = router;
