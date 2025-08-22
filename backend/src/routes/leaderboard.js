const router = require('express').Router();
const GameResult = require('../models/GameResult');
const Leaderboard = require('../models/Leaderboard');

// GET top 10 global by WPM (tie-breaker accuracy)
router.get('/global', async (req, res) => {
  try {
    const pipeline = [
      { $unwind: '$players' },
      { $project: { username: '$players.username', wpm: '$players.wpm', accuracy: '$players.accuracy', finished: '$players.finished', endedAt: 1 } },
      { $match: { finished: true } },
      { $sort: { wpm: -1, accuracy: -1, endedAt: -1 } },
      { $limit: 10 },
    ];
    const rows = await GameResult.aggregate(pipeline);
    res.json({ rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load leaderboard' });
  }
});

// GET personal bests for a username (optional mode filter)
router.get('/user/:username', async (req, res) => {
  try {
    const username = req.params.username;
    const mode = req.query.mode;
    // Prefer Leaderboard collection (per-score with mode)
    const match = { username };
    if (mode && ['practice', 'multiplayer'].includes(mode)) match.mode = mode;
    const agg = await Leaderboard.aggregate([
      { $match: match },
      { $group: {
        _id: '$username',
        bestWpm: { $max: '$wpm' },
        bestAccuracy: { $max: '$accuracy' },
        games: { $sum: 1 },
        avgWpm: { $avg: '$wpm' },
      } },
    ]);
    if (agg && agg[0]) return res.json(agg[0]);
    // Fallback to GameResult if Leaderboard empty (legacy data)
    const pipeline = [
      { $unwind: '$players' },
      { $match: { 'players.username': username } },
      { $group: { _id: '$players.username', bestWpm: { $max: '$players.wpm' }, bestAccuracy: { $max: '$players.accuracy' }, games: { $sum: 1 }, avgWpm: { $avg: '$players.wpm' } } },
    ];
    const [doc] = await GameResult.aggregate(pipeline);
    res.json(doc || { username, bestWpm: 0, bestAccuracy: 0, games: 0, avgWpm: 0 });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load user stats' });
  }
});

module.exports = router;

// New endpoints for practice/multiplayer modes and combined
router.get('/', async (req, res) => {
  try {
    const scores = await Leaderboard.find().sort({ wpm: -1 }).limit(50).lean();
    res.json({ rows: scores });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load leaderboard' });
  }
});

router.get('/practice', async (req, res) => {
  try {
    const scores = await Leaderboard.find({ mode: 'practice' }).sort({ wpm: -1 }).limit(50).lean();
    res.json({ rows: scores });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load leaderboard' });
  }
});

router.get('/multiplayer', async (req, res) => {
  try {
    const scores = await Leaderboard.find({ mode: 'multiplayer' }).sort({ wpm: -1 }).limit(50).lean();
    res.json({ rows: scores });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load leaderboard' });
  }
});
