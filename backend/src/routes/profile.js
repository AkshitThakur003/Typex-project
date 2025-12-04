// ============================================
// User Profile & Statistics API Routes
// ============================================

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Leaderboard = require('../models/Leaderboard');
const GameResult = require('../models/GameResult');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimiter');

// Apply rate limiting
router.use(generalLimiter);

// GET /api/profile/:username - Get user profile and statistics
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    // Get user info (optimized with index)
    const user = await User.findOne({ username })
      .select('username email preferences avatarChoice avatarUrl oauthAvatar createdAt')
      .lean()
      .maxTimeMS(5000);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get comprehensive statistics from Leaderboard (optimized with index)
    const leaderboardCount = await Leaderboard.countDocuments({ username }).maxTimeMS(5000);
    
    const leaderboardStats = await Leaderboard.aggregate([
      { $match: { username } }, // Uses username index
      {
        $group: {
          _id: null,
          totalRaces: { $sum: 1 },
          bestWpm: { $max: '$wpm' },
          bestAccuracy: { $max: '$accuracy' },
          avgWpm: { $avg: '$wpm' },
          avgAccuracy: { $avg: '$accuracy' },
          practiceRaces: {
            $sum: { $cond: [{ $eq: ['$mode', 'practice'] }, 1, 0] }
          },
          multiplayerRaces: {
            $sum: { $cond: [{ $eq: ['$mode', 'multiplayer'] }, 1, 0] }
          },
        }
      }
    ]).option({ maxTimeMS: 10000 }); // 10 second timeout for aggregation
    

    // Get win rate from GameResult (multiplayer only)
    // Also verify that Leaderboard has multiplayer entries for this user
    const leaderboardMultiplayerCount = await Leaderboard.countDocuments({ 
      username, 
      mode: 'multiplayer' 
    }).maxTimeMS(5000); // Uses compound index (mode + username)
    
    const multiplayerResults = await GameResult.aggregate([
      { $unwind: '$players' },
      { $match: { 'players.username': username, 'players.finished': true } }, // Uses players.username index
      {
        $group: {
          _id: '$roomCode',
          players: { $push: '$$ROOT.players' },
          roomCode: { $first: '$roomCode' },
          endedAt: { $first: '$endedAt' },
        }
      }
    ]).option({ maxTimeMS: 10000 }); // 10 second timeout


    let wins = 0;
    let multiplayerRaces = 0;
    multiplayerResults.forEach(room => {
      multiplayerRaces++;
      const players = room.players.flat();
      const userPlayer = players.find(p => p.username === username);
      if (userPlayer) {
        const maxWpm = Math.max(...players.map(p => p.wpm || 0));
        if (userPlayer.wpm === maxWpm && userPlayer.wpm > 0) {
          wins++;
        }
      }
    });

    const winRate = multiplayerRaces > 0 ? (wins / multiplayerRaces) * 100 : 0;

    // Get WPM and accuracy trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trends = await Leaderboard.aggregate([
      { $match: { username, createdAt: { $gte: thirtyDaysAgo } } }, // Uses username + createdAt indexes
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          avgWpm: { $avg: '$wpm' },
          avgAccuracy: { $avg: '$accuracy' },
          count: { $sum: 1 },
        }
      },
      { $sort: { _id: 1 } },
    ]).option({ maxTimeMS: 10000 }); // 10 second timeout

    // Get recent races (last 10)
    const recentRaces = await Leaderboard.find({ username })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('wpm accuracy mode createdAt')
      .lean();

    // Calculate achievements
    const stats = leaderboardStats[0] || {
      totalRaces: 0,
      bestWpm: 0,
      bestAccuracy: 0,
      avgWpm: 0,
      avgAccuracy: 0,
      practiceRaces: 0,
      multiplayerRaces: 0,
    };

    const achievements = calculateAchievements({
      totalRaces: stats.totalRaces,
      bestWpm: stats.bestWpm,
      bestAccuracy: stats.bestAccuracy,
      wins,
      multiplayerRaces,
    });

    // Get XP data
    const xpData = await User.findOne({ username }).select('xp level xpToNext totalXp').lean();
    const xpProgress = xpData?.xpToNext > 0 
      ? Math.round((xpData.xp / xpData.xpToNext) * 100) 
      : 0;

    res.json({
      user: {
        username: user.username,
        email: user.email,
        avatarChoice: user.preferences?.avatarChoice || user.avatarChoice || null,
        avatarUrl: user.preferences?.avatarUrl || user.avatarUrl || null,
        oauthAvatar: user.oauthAvatar,
        createdAt: user.createdAt,
        xp: xpData?.xp || 0,
        level: xpData?.level || 1,
        xpToNext: xpData?.xpToNext || 100,
        totalXp: xpData?.totalXp || 0,
        xpProgress: Math.min(100, Math.max(0, xpProgress)),
      },
      statistics: {
        totalRaces: stats.totalRaces,
        practiceRaces: stats.practiceRaces,
        multiplayerRaces: stats.multiplayerRaces,
        bestWpm: Math.round(stats.bestWpm || 0),
        bestAccuracy: Math.round(stats.bestAccuracy || 0),
        avgWpm: Math.round(stats.avgWpm || 0),
        avgAccuracy: Math.round(stats.avgAccuracy || 0),
        wins,
        winRate: Math.round(winRate * 10) / 10,
      },
      trends,
      recentRaces,
      achievements,
    });
  } catch (err) {
    console.error('[Profile] Error:', err);
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

// GET /api/profile/:username/stats - Get only statistics (lighter endpoint)
router.get('/:username/stats', async (req, res) => {
  try {
    const { username } = req.params;
    
    const leaderboardStats = await Leaderboard.aggregate([
      { $match: { username } },
      {
        $group: {
          _id: null,
          totalRaces: { $sum: 1 },
          bestWpm: { $max: '$wpm' },
          bestAccuracy: { $max: '$accuracy' },
          avgWpm: { $avg: '$wpm' },
          avgAccuracy: { $avg: '$accuracy' },
        }
      }
    ]);

    const stats = leaderboardStats[0] || {
      totalRaces: 0,
      bestWpm: 0,
      bestAccuracy: 0,
      avgWpm: 0,
      avgAccuracy: 0,
    };

    res.json({
      totalRaces: stats.totalRaces,
      bestWpm: Math.round(stats.bestWpm || 0),
      bestAccuracy: Math.round(stats.bestAccuracy || 0),
      avgWpm: Math.round(stats.avgWpm || 0),
      avgAccuracy: Math.round(stats.avgAccuracy || 0),
    });
  } catch (err) {
    console.error('[Profile] Stats error:', err);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

// Helper function to calculate achievements
function calculateAchievements({ totalRaces, bestWpm, bestAccuracy, wins, multiplayerRaces }) {
  const achievements = [];

  // Race count achievements
  if (totalRaces >= 1) achievements.push({ id: 'first-race', name: 'First Race', description: 'Complete your first race', icon: '🎯' });
  if (totalRaces >= 10) achievements.push({ id: 'rookie', name: 'Rookie', description: 'Complete 10 races', icon: '🏃' });
  if (totalRaces >= 50) achievements.push({ id: 'veteran', name: 'Veteran', description: 'Complete 50 races', icon: '⭐' });
  if (totalRaces >= 100) achievements.push({ id: 'champion', name: 'Champion', description: 'Complete 100 races', icon: '👑' });
  if (totalRaces >= 500) achievements.push({ id: 'legend', name: 'Legend', description: 'Complete 500 races', icon: '🌟' });

  // WPM achievements
  if (bestWpm >= 30) achievements.push({ id: 'speedster', name: 'Speedster', description: 'Reach 30 WPM', icon: '⚡' });
  if (bestWpm >= 50) achievements.push({ id: 'fast-typer', name: 'Fast Typer', description: 'Reach 50 WPM', icon: '🚀' });
  if (bestWpm >= 70) achievements.push({ id: 'speed-demon', name: 'Speed Demon', description: 'Reach 70 WPM', icon: '🔥' });
  if (bestWpm >= 100) achievements.push({ id: 'typing-master', name: 'Typing Master', description: 'Reach 100 WPM', icon: '💨' });
  if (bestWpm >= 120) achievements.push({ id: 'typing-god', name: 'Typing God', description: 'Reach 120 WPM', icon: '⚡️' });

  // Accuracy achievements
  if (bestAccuracy >= 95) achievements.push({ id: 'accurate', name: 'Accurate', description: 'Achieve 95% accuracy', icon: '🎯' });
  if (bestAccuracy >= 98) achievements.push({ id: 'precise', name: 'Precise', description: 'Achieve 98% accuracy', icon: '✨' });
  if (bestAccuracy >= 100) achievements.push({ id: 'perfect', name: 'Perfect', description: 'Achieve 100% accuracy', icon: '💯' });

  // Win achievements
  if (wins >= 1) achievements.push({ id: 'first-win', name: 'First Win', description: 'Win your first multiplayer race', icon: '🏆' });
  if (wins >= 10) achievements.push({ id: 'winner', name: 'Winner', description: 'Win 10 multiplayer races', icon: '🥇' });
  if (wins >= 50) achievements.push({ id: 'champion', name: 'Multiplayer Champion', description: 'Win 50 multiplayer races', icon: '👑' });

  // Multiplayer achievements
  if (multiplayerRaces >= 10) achievements.push({ id: 'social', name: 'Social', description: 'Play 10 multiplayer races', icon: '👥' });
  if (multiplayerRaces >= 50) achievements.push({ id: 'team-player', name: 'Team Player', description: 'Play 50 multiplayer races', icon: '🤝' });

  return achievements;
}

module.exports = router;

