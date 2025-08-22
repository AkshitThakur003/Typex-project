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
  avatarChoice: { type: String, default: 'emoji-rocket' },
  status: { type: String, default: 'Available' },
}, { _id: false });

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, minlength: 3 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  avatarUrl: { type: String, default: '' }, // legacy, prefer preferences.avatarChoice
  status: { type: String, default: '' }, // top-level status still accepted; preferences.status preferred
  preferences: { type: preferencesSchema, default: () => ({}) },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
