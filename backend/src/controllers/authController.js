const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { validatePassword } = require('../utils/passwordValidator');
const { sendPasswordResetEmail } = require('../utils/emailService');

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
      user.resetTokenExpiry = new Date(Date.now() + (15 * 60 * 1000)); // 15 minutes
      await user.save();
      
      // Send password reset email
      const emailResult = await sendPasswordResetEmail(user.email, user.username, token);
      
      const NODE_ENV = process.env.NODE_ENV || 'development';
      
      // Always return success message (security: don't reveal if email exists)
      const response = {
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      };
      
      // In development, include token in response if email sending failed or SMTP not configured
      if (NODE_ENV === 'development' && !emailResult.sent) {
        response.token = token;
        response.emailNote = 'Email service not configured. Use the token above to reset manually.';
        response.expiresIn = '15 minutes';
      }

      // Log email sending result (don't expose to client)
      if (!emailResult.sent) {
        console.warn('[Password Reset] Reset email not sent:', emailResult.error);
      } else {
        console.log('[Password Reset] Reset email sent to:', normalizedEmail);
      }
      
      return res.json(response);
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

