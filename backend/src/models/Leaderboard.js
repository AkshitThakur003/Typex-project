const mongoose = require('mongoose');

const leaderboardSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true },
  wpm: { type: Number, required: true, min: 0 },
  accuracy: { type: Number, required: true, min: 0, max: 100 },
  finishTime: { type: Number, default: null }, // Time in seconds to complete
  mode: { type: String, enum: ['practice', 'multiplayer'], required: true },
}, { timestamps: true });

// Database indexes for query optimization
// Index for username lookups
leaderboardSchema.index({ username: 1 });
// Index for mode-based queries
leaderboardSchema.index({ mode: 1 });
// Compound index for mode + username queries
leaderboardSchema.index({ mode: 1, username: 1 });
// Index for sorting by WPM and accuracy
leaderboardSchema.index({ wpm: -1, accuracy: -1 });
// Compound index for time-based filtering with mode
leaderboardSchema.index({ mode: 1, createdAt: -1 });
// Compound index for best score queries (mode + username + wpm)
leaderboardSchema.index({ mode: 1, username: 1, wpm: -1, accuracy: -1 });

module.exports = mongoose.model('Leaderboard', leaderboardSchema);
