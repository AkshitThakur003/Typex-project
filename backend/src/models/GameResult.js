const mongoose = require('mongoose');

const playerResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  username: String,
  wpm: Number,
  accuracy: Number,
  finished: Boolean,
});

const gameResultSchema = new mongoose.Schema({
  roomCode: String,
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'easy' },
  timeLimit: Number,
  startedAt: Date,
  endedAt: Date,
  players: [playerResultSchema],
});

module.exports = mongoose.model('GameResult', gameResultSchema);
