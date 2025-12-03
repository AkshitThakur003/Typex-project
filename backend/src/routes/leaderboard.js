const router = require('express').Router();
const GameResult = require('../models/GameResult');
const Leaderboard = require('../models/Leaderboard');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { leaderboardLimiter } = require('../middleware/rateLimiter');
const { optimizeAvatarUrl } = require('../utils/imageOptimizer');

// Apply rate limiting to all leaderboard routes
router.use(leaderboardLimiter);

// Validation constants
const MAX_REALISTIC_WPM = 250; // World record is ~216 WPM, allow some buffer
const MIN_FINISH_TIME = 3; // Minimum 3 seconds to complete (prevents impossible times)
const MIN_ACCURACY = 0;
const MAX_ACCURACY = 100;

// Helper function to get date filter based on period
function getDateFilter(period) {
  const now = new Date();
  switch (period) {
    case 'today':
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { createdAt: { $gte: todayStart } };
    case 'week':
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - 7);
      return { createdAt: { $gte: weekStart } };
    case 'month':
      const monthStart = new Date(now);
      monthStart.setDate(monthStart.getDate() - 30);
      return { createdAt: { $gte: monthStart } };
    default:
      return {};
  }
}

// POST /api/leaderboard - Save a practice or multiplayer score (requires auth)
router.post('/', auth, async (req, res) => {
  try {
    const { username, wpm, accuracy, finishTime, mode } = req.body || {};
    console.log('[Leaderboard POST] Received:', { username, wpm, accuracy, finishTime, mode, userId: req.user?.id });
    
    // Verify the authenticated user matches the username being submitted
    if (req.user.username !== username) {
      console.error('[Leaderboard POST] Username mismatch:', { tokenUsername: req.user.username, submittedUsername: username });
      return res.status(403).json({ error: 'Cannot submit scores for other users' });
    }
    
    if (!username || typeof wpm !== 'number' || typeof accuracy !== 'number' || !mode) {
      console.error('[Leaderboard POST] Validation failed:', { 
        username, 
        wpm, 
        wpmType: typeof wpm, 
        accuracy, 
        accuracyType: typeof accuracy, 
        mode 
      });
      return res.status(400).json({ error: 'username, wpm, accuracy and mode are required' });
    }
    if (!['practice', 'multiplayer'].includes(mode)) {
      console.error('[Leaderboard POST] Invalid mode:', mode);
      return res.status(400).json({ error: 'Invalid mode. Must be "practice" or "multiplayer"' });
    }
    
    // Server-side validation for realistic values
    if (wpm < 0 || wpm > MAX_REALISTIC_WPM) {
      console.error('[Leaderboard POST] Unrealistic WPM:', wpm);
      return res.status(400).json({ error: `WPM must be between 0 and ${MAX_REALISTIC_WPM}` });
    }
    
    if (accuracy < MIN_ACCURACY || accuracy > MAX_ACCURACY) {
      console.error('[Leaderboard POST] Invalid accuracy:', accuracy);
      return res.status(400).json({ error: 'Accuracy must be between 0 and 100' });
    }
    
    // Validate finish time if provided
    let validatedFinishTime = null;
    if (typeof finishTime === 'number') {
      if (finishTime < MIN_FINISH_TIME) {
        console.error('[Leaderboard POST] Unrealistic finish time:', finishTime);
        return res.status(400).json({ error: `Finish time must be at least ${MIN_FINISH_TIME} seconds` });
      }
      validatedFinishTime = finishTime;
    }
    
    const doc = await Leaderboard.create({ 
      username, 
      wpm: Math.round(wpm), // Round to prevent decimal manipulation
      accuracy: Math.round(accuracy * 10) / 10, // Round to 1 decimal
      finishTime: validatedFinishTime,
      mode 
    });
    console.log('[Leaderboard POST] Successfully saved:', { 
      id: doc._id, 
      username: doc.username, 
      wpm: doc.wpm, 
      accuracy: doc.accuracy, 
      finishTime: doc.finishTime,
      mode: doc.mode,
      createdAt: doc.createdAt 
    });
    res.json({ ok: true, id: doc._id });
  } catch (e) {
    console.error('[Leaderboard POST] Error:', e);
    console.error('[Leaderboard POST] Error stack:', e.stack);
    res.status(500).json({ error: 'Failed to save score', details: e.message });
  }
});

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

// Helper function to enrich leaderboard rows with avatar data (optimized)
async function enrichWithAvatars(rows) {
  if (!rows || rows.length === 0) return rows;
  
  // Extract unique usernames
  const usernames = [...new Set(rows.map(r => r.username).filter(Boolean))];
  if (usernames.length === 0) return rows;
  
  // Optimized query: use indexed username field, select only needed fields
  const users = await User.find({ username: { $in: usernames } })
    .select('username preferences avatarChoice avatarUrl oauthAvatar')
    .lean()
    .maxTimeMS(5000); // Timeout after 5 seconds
  
  // Create map for O(1) lookups
  const userMap = new Map();
  users.forEach(user => {
    const avatarUrl = user.preferences?.avatarUrl || user.avatarUrl || user.oauthAvatar || null;
    userMap.set(user.username, {
      avatarChoice: user.preferences?.avatarChoice || user.avatarChoice || null,
      avatarUrl: avatarUrl ? optimizeAvatarUrl(avatarUrl, 64) : null,
      oauthAvatar: user.oauthAvatar ? optimizeAvatarUrl(user.oauthAvatar, 64) : null,
    });
  });
  
  return rows.map(row => ({
    ...row,
    ...(userMap.get(row.username) || {}),
  }));
}

// New endpoints for practice/multiplayer modes and combined
router.get('/', async (req, res) => {
  try {
    // Use aggregation to get only the best entry per user (across all modes)
    const scores = await Leaderboard.aggregate([
      { $sort: { wpm: -1, accuracy: -1, finishTime: 1, createdAt: -1 } }, // Sort by WPM, then accuracy, then finish time (faster wins)
      {
        $group: {
          _id: '$username',
          wpm: { $first: '$wpm' }, // Get the best WPM (first after sorting)
          accuracy: { $first: '$accuracy' }, // Get corresponding accuracy
          finishTime: { $first: '$finishTime' }, // Get finish time
          createdAt: { $first: '$createdAt' }, // Get the date of best score
          username: { $first: '$username' },
          mode: { $first: '$mode' }, // Keep mode for reference
        }
      },
      { $sort: { wpm: -1, accuracy: -1, finishTime: 1 } }, // Sort grouped results
      { $limit: 50 },
      { $project: { _id: 0, username: 1, wpm: 1, accuracy: 1, finishTime: 1, createdAt: 1, mode: 1 } } // Clean up output
    ]);
    const enriched = await enrichWithAvatars(scores);
    res.json({ rows: enriched });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load leaderboard' });
  }
});

router.get('/practice', async (req, res) => {
  try {
    const period = req.query.period;
    const dateFilter = getDateFilter(period);
    
    // Use aggregation to get only the best entry per user
    const scores = await Leaderboard.aggregate([
      { $match: { mode: 'practice', ...dateFilter } },
      { $sort: { wpm: -1, accuracy: -1, finishTime: 1, createdAt: -1 } }, // Sort by WPM, then accuracy, then finish time
      {
        $group: {
          _id: '$username',
          wpm: { $first: '$wpm' }, // Get the best WPM (first after sorting)
          accuracy: { $first: '$accuracy' }, // Get corresponding accuracy
          finishTime: { $first: '$finishTime' }, // Get finish time
          createdAt: { $first: '$createdAt' }, // Get the date of best score
          username: { $first: '$username' },
        }
      },
      { $sort: { wpm: -1, accuracy: -1, finishTime: 1 } }, // Sort grouped results
      { $limit: 50 },
      { $project: { _id: 0, username: 1, wpm: 1, accuracy: 1, finishTime: 1, createdAt: 1 } } // Clean up output
    ]);
    const enriched = await enrichWithAvatars(scores);
    res.json({ rows: enriched });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load leaderboard' });
  }
});

router.get('/multiplayer', async (req, res) => {
  try {
    const period = req.query.period;
    const dateFilter = getDateFilter(period);
    
    // Use aggregation to get only the best entry per user
    const scores = await Leaderboard.aggregate([
      { $match: { mode: 'multiplayer', ...dateFilter } },
      { $sort: { wpm: -1, accuracy: -1, finishTime: 1, createdAt: -1 } }, // Sort by WPM, then accuracy, then finish time
      {
        $group: {
          _id: '$username',
          wpm: { $first: '$wpm' }, // Get the best WPM (first after sorting)
          accuracy: { $first: '$accuracy' }, // Get corresponding accuracy
          finishTime: { $first: '$finishTime' }, // Get finish time
          createdAt: { $first: '$createdAt' }, // Get the date of best score
          username: { $first: '$username' },
        }
      },
      { $sort: { wpm: -1, accuracy: -1, finishTime: 1 } }, // Sort grouped results
      { $limit: 50 },
      { $project: { _id: 0, username: 1, wpm: 1, accuracy: 1, finishTime: 1, createdAt: 1 } } // Clean up output
    ]);
    const enriched = await enrichWithAvatars(scores);
    res.json({ rows: enriched });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load leaderboard' });
  }
});

// GET practice history for a specific user
router.get('/practice/:username', async (req, res) => {
  try {
    const username = req.params.username;
    const limit = parseInt(req.query.limit) || 50;
    const sortBy = req.query.sortBy || 'date'; // 'date' or 'wpm'
    
    const query = { username, mode: 'practice' };
    let sort = {};
    
    if (sortBy === 'wpm') {
      sort = { wpm: -1, accuracy: -1, finishTime: 1, createdAt: -1 };
    } else {
      sort = { createdAt: -1 }; // newest first by default
    }
    
    const results = await Leaderboard.find(query)
      .sort(sort)
      .limit(limit)
      .select('wpm accuracy finishTime createdAt mode')
      .lean();
    
    res.json({ rows: results });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load practice history' });
  }
});

// GET personal multiplayer race history for a specific user
router.get('/multiplayer/:username', async (req, res) => {
  try {
    const username = req.params.username;
    const limit = parseInt(req.query.limit) || 100;
    const sortBy = req.query.sortBy || 'date'; // 'date' or 'wpm'
    
    // Get all races where user participated - use a better approach
    const allRaces = await GameResult.find({
      'players.username': username,
      'players.finished': true
    })
    .sort({ endedAt: -1 })
    .limit(limit * 2) // Get more to filter
    .lean();
    
    // Process races to extract user data and calculate rank
    const races = allRaces.map(race => {
      const userPlayer = race.players.find(p => p.username === username && p.finished);
      if (!userPlayer) return null;
      
      // Sort players to calculate rank
      const sortedPlayers = [...race.players]
        .filter(p => p.finished)
        .sort((a, b) => {
          if (b.wpm !== a.wpm) return b.wpm - a.wpm;
          if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
          return (a.finishTime || Infinity) - (b.finishTime || Infinity); // Faster wins
        });
      
      const rank = sortedPlayers.findIndex(p => p.username === username) + 1;
      
      return {
        roomCode: race.roomCode,
        difficulty: race.difficulty,
        timeLimit: race.timeLimit,
        startedAt: race.startedAt,
        endedAt: race.endedAt,
        players: race.players,
        wpm: userPlayer.wpm,
        accuracy: userPlayer.accuracy,
        finishTime: userPlayer.finishTime || null,
        finished: userPlayer.finished,
        rank: rank || 1,
        totalPlayers: sortedPlayers.length,
        isWinner: rank === 1,
      };
    }).filter(Boolean); // Remove null entries
    
    // Sort results
    let sortedRaces;
    if (sortBy === 'wpm') {
      sortedRaces = races.sort((a, b) => {
        if ((b.wpm || 0) !== (a.wpm || 0)) return (b.wpm || 0) - (a.wpm || 0);
        if ((b.accuracy || 0) !== (a.accuracy || 0)) return (b.accuracy || 0) - (a.accuracy || 0);
        return (a.finishTime || Infinity) - (b.finishTime || Infinity);
      });
    } else {
      sortedRaces = races.sort((a, b) => new Date(b.endedAt || 0) - new Date(a.endedAt || 0));
    }
    
    // Limit results
    const limitedRaces = sortedRaces.slice(0, limit);
    
    // Optimized: Batch fetch all users at once instead of N+1 queries
    const allPlayerUsernames = [...new Set(
      limitedRaces.flatMap(race => 
        (race.players || []).map(p => p.username).filter(Boolean)
      )
    )];
    
    const usersMap = new Map();
    if (allPlayerUsernames.length > 0) {
      const users = await User.find({ username: { $in: allPlayerUsernames } })
        .select('username preferences avatarChoice avatarUrl oauthAvatar')
        .lean()
        .maxTimeMS(5000);
      
      users.forEach(user => {
        const avatarUrl = user.preferences?.avatarUrl || user.avatarUrl || user.oauthAvatar || null;
        usersMap.set(user.username, {
          avatarChoice: user.preferences?.avatarChoice || user.avatarChoice || null,
          avatarUrl: avatarUrl ? optimizeAvatarUrl(avatarUrl, 64) : null,
          oauthAvatar: user.oauthAvatar ? optimizeAvatarUrl(user.oauthAvatar, 64) : null,
        });
      });
    }
    
    // Enrich races with avatar data
    const enrichedRaces = limitedRaces.map(race => {
      if (!race.players || race.players.length === 0) return race;
      
      const playersWithAvatars = race.players.map(player => {
        if (!player.username) return player;
        
        const userData = usersMap.get(player.username);
        if (userData) {
          return {
            ...player,
            ...userData,
          };
        }
        return player;
      });
      
      return {
        ...race,
        players: playersWithAvatars,
      };
    });
    
    res.json({ rows: enrichedRaces });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load multiplayer race history' });
  }
});

module.exports = router;
