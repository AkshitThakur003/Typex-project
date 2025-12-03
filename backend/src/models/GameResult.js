const mongoose = require('mongoose');

const playerResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  username: String,
  wpm: Number,
  accuracy: Number,
  finished: Boolean,
  finishTime: Number, // Time in seconds to complete
});

const gameResultSchema = new mongoose.Schema({
  roomCode: String,
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'easy' },
  timeLimit: Number,
  startedAt: Date,
  endedAt: Date,
  players: [playerResultSchema],
}, { timestamps: true });

// Database indexes for query optimization
// Index for roomCode lookups
gameResultSchema.index({ roomCode: 1 });
// Index for player username lookups in players array
gameResultSchema.index({ 'players.username': 1 });
// Index for finished players
gameResultSchema.index({ 'players.username': 1, 'players.finished': 1 });
// Index for time-based queries
gameResultSchema.index({ endedAt: -1 });
// Index for startedAt queries
gameResultSchema.index({ startedAt: -1 });

module.exports = mongoose.model('GameResult', gameResultSchema);
