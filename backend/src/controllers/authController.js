const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { validatePassword } = require('../utils/passwordValidator');

/**
 * Request password reset token
 * POST /api/auth/request-reset
 */
async function requestReset(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Normalize email (lowercase and trim)
    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email
    const user = await User.findOne({ email: normalizedEmail });
    
    // Always return success to prevent email enumeration
    // But only generate token if user exists
    if (user) {
      // Generate secure reset token using crypto.randomBytes
      const token = crypto.randomBytes(32).toString('hex');
      
      // Store reset token and expiry (15 minutes from now)
      user.resetToken = token;
      user.resetTokenExpiry = Date.now() + (15 * 60 * 1000); // 15 minutes
      await user.save();
      
      // SECURITY: In production, send token via email instead of returning it
      // For development/demo purposes, we log it and return a masked version
      const NODE_ENV = process.env.NODE_ENV || 'development';
      
      if (NODE_ENV === 'production') {
        // TODO: Integrate email service (SendGrid, Nodemailer, etc.)
        // await sendPasswordResetEmail(user.email, token);
        console.log('[Password Reset] Token generated for:', normalizedEmail);
        return res.json({ 
          success: true, 
          message: 'If an account exists with this email, a password reset link has been sent.'
        });
      } else {
        // Development only: return token for testing
        console.log('[Password Reset] DEV MODE - Token:', token);
        return res.json({ 
          success: true, 
          message: 'Reset token generated (dev mode)',
          token, // Only in development
          expiresIn: '15 minutes'
        });
      }
    }
    
    // Return success even if user doesn't exist (security: don't reveal if email exists)
    res.json({ 
      success: true, 
      message: 'If an account exists with this email, a password reset link has been sent.'
    });
  } catch (err) {
    console.error('[Request Reset] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

/**
 * Reset password using token
 * POST /api/auth/reset-password
 */
async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    // Validate new password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.error });
    }

    // Find user with matching token and non-expired token
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() } // Token must not be expired
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Hash new password using bcrypt
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    // Update password and clear reset token fields
    user.passwordHash = passwordHash;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    console.error('[Reset Password] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = {
  requestReset,
  resetPassword,
};

