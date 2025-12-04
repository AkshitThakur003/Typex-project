const nodemailer = require('nodemailer');

/**
 * Email Service using Nodemailer
 * Handles sending verification emails, password reset emails, etc.
 */

// Create reusable transporter
let transporter = null;

/**
 * Initialize email transporter
 * @returns {Object} Nodemailer transporter
 */
function getTransporter() {
  if (transporter) {
    return transporter;
  }

  const NODE_ENV = process.env.NODE_ENV || 'development';
  
  // In development, use Ethereal Email (test account) if SMTP not configured
  if (NODE_ENV === 'development' && !process.env.SMTP_HOST) {
    // Return null to indicate email sending is disabled in dev without SMTP
    console.warn('[Email Service] SMTP not configured. Email sending disabled in development.');
    return null;
  }

  // Production or development with SMTP configured
  const config = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  };

  // Validate required config
  if (!config.auth.user || !config.auth.pass) {
    console.warn('[Email Service] SMTP credentials not configured. Email sending disabled.');
    return null;
  }

  transporter = nodemailer.createTransport(config);

  // Verify connection
  transporter.verify((error, success) => {
    if (error) {
      console.error('[Email Service] SMTP connection failed:', error.message);
    } else {
      console.log('[Email Service] SMTP server is ready to send emails');
    }
  });

  return transporter;
}

/**
 * Get email sender address
 * @returns {string} Email sender address
 */
function getFromAddress() {
  return process.env.EMAIL_FROM || process.env.SMTP_USER || 'noreply@typex.com';
}

/**
 * Get frontend URL for email links
 * @returns {string} Frontend URL
 */
function getFrontendUrl() {
  return process.env.CLIENT_ORIGIN || 'http://localhost:5173';
}

/**
 * Send email verification email
 * @param {string} email - Recipient email
 * @param {string} username - Username
 * @param {string} token - Verification token
 * @returns {Promise<Object>} Email send result
 */
async function sendVerificationEmail(email, username, token) {
  const emailTransporter = getTransporter();
  if (!emailTransporter) {
    console.warn('[Email Service] Cannot send verification email - transporter not configured');
    return { sent: false, error: 'Email service not configured' };
  }

  const verificationUrl = `${getFrontendUrl()}/api/auth/verify-email/${token}`;
  
  const mailOptions = {
    from: `"TypeX" <${getFromAddress()}>`,
    to: email,
    subject: 'Verify Your TypeX Account',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email - TypeX</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: #fff; margin: 0; font-size: 28px;">TypeX</h1>
            <p style="color: #94a3b8; margin: 10px 0 0 0;">Fast Typing Practice & Multiplayer Races</p>
          </div>
          
          <div style="background: #fff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #0f172a; margin-top: 0;">Welcome to TypeX, ${username}!</h2>
            
            <p style="color: #475569;">Thank you for signing up. To complete your registration and start typing, please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #64748b; font-size: 14px; margin-top: 30px;">Or copy and paste this link into your browser:</p>
            <p style="color: #10b981; font-size: 12px; word-break: break-all; background: #f1f5f9; padding: 10px; border-radius: 5px; margin: 10px 0;">
              ${verificationUrl}
            </p>
            
            <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
              This verification link will expire in <strong>24 hours</strong>.
            </p>
            
            <p style="color: #64748b; font-size: 14px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
              If you didn't create an account with TypeX, you can safely ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;">
            <p>© ${new Date().getFullYear()} TypeX. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `
      Welcome to TypeX, ${username}!
      
      Thank you for signing up. To complete your registration, please verify your email address by visiting:
      
      ${verificationUrl}
      
      This verification link will expire in 24 hours.
      
      If you didn't create an account with TypeX, you can safely ignore this email.
    `,
  };

  try {
    const info = await emailTransporter.sendMail(mailOptions);
    console.log('[Email Service] Verification email sent:', info.messageId);
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email Service] Failed to send verification email:', error);
    return { sent: false, error: error.message };
  }
}

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} username - Username
 * @param {string} token - Reset token
 * @returns {Promise<Object>} Email send result
 */
async function sendPasswordResetEmail(email, username, token) {
  const emailTransporter = getTransporter();
  if (!emailTransporter) {
    console.warn('[Email Service] Cannot send password reset email - transporter not configured');
    return { sent: false, error: 'Email service not configured' };
  }

  const resetUrl = `${getFrontendUrl()}/reset-password?token=${token}`;
  
  const mailOptions = {
    from: `"TypeX" <${getFromAddress()}>`,
    to: email,
    subject: 'Reset Your TypeX Password',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Password - TypeX</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: #fff; margin: 0; font-size: 28px;">TypeX</h1>
            <p style="color: #94a3b8; margin: 10px 0 0 0;">Fast Typing Practice & Multiplayer Races</p>
          </div>
          
          <div style="background: #fff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #0f172a; margin-top: 0;">Password Reset Request</h2>
            
            <p style="color: #475569;">Hello ${username},</p>
            
            <p style="color: #475569;">We received a request to reset your password. Click the button below to create a new password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                Reset Password
              </a>
            </div>
            
            <p style="color: #64748b; font-size: 14px; margin-top: 30px;">Or copy and paste this link into your browser:</p>
            <p style="color: #10b981; font-size: 12px; word-break: break-all; background: #f1f5f9; padding: 10px; border-radius: 5px; margin: 10px 0;">
              ${resetUrl}
            </p>
            
            <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
              This reset link will expire in <strong>1 hour</strong>.
            </p>
            
            <p style="color: #ef4444; font-size: 14px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
              <strong>Important:</strong> If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;">
            <p>© ${new Date().getFullYear()} TypeX. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `
      Password Reset Request
      
      Hello ${username},
      
      We received a request to reset your password. Visit the following link to create a new password:
      
      ${resetUrl}
      
      This reset link will expire in 1 hour.
      
      If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
    `,
  };

  try {
    const info = await emailTransporter.sendMail(mailOptions);
    console.log('[Email Service] Password reset email sent:', info.messageId);
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email Service] Failed to send password reset email:', error);
    return { sent: false, error: error.message };
  }
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  getTransporter,
};

