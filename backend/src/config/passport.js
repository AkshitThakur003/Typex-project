const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Google OAuth Strategy (only if credentials are configured)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  // Construct absolute callback URL for Google OAuth
  // Google requires absolute URLs, not relative paths
  // IMPORTANT: Use EXACTLY what's in GOOGLE_CALLBACK_URL env var
  // Make sure this matches EXACTLY what's in Google Cloud Console
  const getCallbackURL = () => {
    // Use explicit env var if provided - use it EXACTLY as-is
    if (process.env.GOOGLE_CALLBACK_URL) {
      return process.env.GOOGLE_CALLBACK_URL;
    }
    
    // Construct from server URL if not provided
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    // Use RENDER_EXTERNAL_URL or construct from known production URL
    const host = process.env.RENDER_EXTERNAL_URL 
      ? new URL(process.env.RENDER_EXTERNAL_URL).hostname
      : (process.env.SERVER_HOST || (process.env.NODE_ENV === 'production' ? 'typex-backend.onrender.com' : 'localhost'));
    const port = process.env.PORT || 5000;
    
    // For production, use the Render URL (no port in URL)
    if (process.env.NODE_ENV === 'production') {
      const productionUrl = process.env.RENDER_EXTERNAL_URL || `https://${host}`;
      return `${productionUrl}/api/auth/google/callback`;
    }
    
    // For development, include port
    return `${protocol}://${host}:${port}/api/auth/google/callback`;
  };
  
  const callbackURL = getCallbackURL();
  console.log('[Passport] Google OAuth callback URL:', callbackURL);
  
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: callbackURL,
  }, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user exists with this Google ID
    let user = await User.findOne({ 
      oauthProvider: 'google',
      oauthId: profile.id
    });

    if (user) {
      // OAuth users use initials, not Google profile pictures
      // No need to update oauthAvatar
      return done(null, user);
    }

    // Check if email matches existing user (account linking)
    if (profile.emails && profile.emails[0]) {
      const email = profile.emails[0].value.toLowerCase();
      user = await User.findOne({ email });
      
      if (user) {
        // Link OAuth to existing account
        user.oauthProvider = 'google';
        user.oauthId = profile.id;
        // OAuth users use initials, not Google profile pictures
        // Don't store oauthAvatar
        await user.save();
        return done(null, user);
      }
    }

    // Create new user
    const displayName = profile.displayName || profile.name?.givenName || `user_${profile.id}`;
    // Generate username from display name
    let username = displayName.toLowerCase().replace(/[^a-z0-9_]/g, '_').substring(0, 20);
    if (username.length < 3) username = `user_${profile.id}`;
    
    // Ensure unique username
    let uniqueUsername = username;
    let counter = 1;
    while (await User.findOne({ username: uniqueUsername })) {
      uniqueUsername = `${username}_${counter}`;
      counter++;
    }

    user = await User.create({
      username: uniqueUsername,
      email: profile.emails?.[0]?.value?.toLowerCase() || `${profile.id}@google.oauth`,
      passwordHash: null, // OAuth users don't need password
      oauthProvider: 'google',
      oauthId: profile.id,
      // OAuth users use initials - don't store oauthAvatar
      oauthAvatar: null,
    });

    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
  }));
} else {
  console.warn('[Passport] Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable.');
}

module.exports = passport;

