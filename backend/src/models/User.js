const mongoose = require('mongoose');

const preferencesSchema = new mongoose.Schema({
  // Legacy fields (kept for backward compatibility)
  defaultDifficulty: { type: String, enum: ['easy','medium','hard'], default: 'easy' },
  defaultTime: { type: Number, default: 60 },
  sounds: { type: Boolean, default: true },
  animations: { type: Boolean, default: true },
  theme: { type: String, enum: ['dark','light'], default: 'dark' },
  // Current used fields
  caretStyle: { type: String, enum: ['solid','blink','highlight'], default: 'solid' },
  fontStyle: { type: String, enum: ['monospace','sans','typewriter'], default: 'monospace' },
  fontSize: { type: String, enum: ['small','medium','large','xl'], default: 'medium' },
  avatarChoice: { type: String, default: 'emoji-rocket' },
  status: { type: String, default: 'Available' },
}, { _id: false });

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, minlength: 3 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: false }, // Optional for OAuth users
  avatarUrl: { type: String, default: '' }, // legacy, prefer preferences.avatarChoice
  status: { type: String, default: '' }, // top-level status still accepted; preferences.status preferred
  preferences: { type: preferencesSchema, default: () => ({}) },
  resetToken: { type: String, default: null },
  resetTokenExpiry: { type: Date, default: null },
  // Email verification
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String, default: null },
  emailVerificationExpiry: { type: Date, default: null },
  // Refresh token for JWT rotation
  refreshToken: { type: String, default: null },
  refreshTokenExpiry: { type: Date, default: null },
  // OAuth fields
  oauthProvider: { type: String, enum: ['google'], default: null },
  oauthId: { type: String, default: null }, // Provider-specific user ID
  oauthAvatar: { type: String, default: null }, // Avatar from OAuth provider
  // XP & Level System
  xp: { type: Number, default: 0, min: 0 },
  level: { type: Number, default: 1, min: 1 },
  xpToNext: { type: Number, default: 100, min: 0 },
  totalXp: { type: Number, default: 0, min: 0 }, // Total XP ever earned (never decreases)
  // Race statistics
  raceDisconnects: { type: Number, default: 0, min: 0 }, // Number of mid-race disconnects
  lastDisconnectAt: { type: Date, default: null }, // When the last disconnect happened
}, { timestamps: true });

// Compound index for OAuth lookups
// Use partial index to only index documents where oauthProvider is a string (not null)
// This prevents duplicate key errors for regular users (where both fields are null)
userSchema.index(
  { oauthProvider: 1, oauthId: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { oauthProvider: { $type: 'string' } }
  }
);
// Note: username and email already have unique indexes from the schema definition (unique: true)
// Index for XP/level queries
userSchema.index({ level: -1, totalXp: -1 });

module.exports = mongoose.model('User', userSchema);
