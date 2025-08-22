const mongoose = require('mongoose');

const leaderboardSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true },
  wpm: { type: Number, required: true, min: 0 },
  accuracy: { type: Number, required: true, min: 0, max: 100 },
  mode: { type: String, enum: ['practice', 'multiplayer'], required: true },
}, { timestamps: true });

module.exports = mongoose.model('Leaderboard', leaderboardSchema);
