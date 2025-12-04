/**
 * XP & Level System API Routes
 */

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { calcXpForResult, processLevelUp } = require('../utils/xpCalculator');

// Apply rate limiting (stricter for XP endpoints to prevent spam)
const xpLimiter = require('express-rate-limit')({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  message: { error: 'Too many XP requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(xpLimiter);
router.use(auth); // All XP routes require authentication

/**
 * POST /api/profile/add-xp
 * Add XP to user's profile from a game result
 * 
 * Body: {
 *   mode: 'practice' | 'multiplayer',
 *   wpm: number,
 *   accuracy: number (0-100),
 *   words?: number (optional),
 *   rank?: number (optional, for multiplayer),
 *   gameId?: string (optional, for duplicate detection)
 * }
 * 
 * Returns: {
 *   xpGained: number,
 *   newLevel: number,
 *   oldLevel: number,
 *   xp: number,
 *   xpToNext: number,
 *   levelsGained: number,
 *   breakdown: object
 * }
 */
router.post('/add-xp', async (req, res) => {
  try {
    const userId = req.user.id;
    const { mode, wpm, accuracy, words, rank, gameId } = req.body;

    // Validate required fields
    if (!mode || typeof wpm !== 'number' || typeof accuracy !== 'number') {
      return res.status(400).json({ error: 'mode, wpm, and accuracy are required' });
    }

    if (!['practice', 'multiplayer'].includes(mode)) {
      return res.status(400).json({ error: 'mode must be "practice" or "multiplayer"' });
    }

    if (wpm < 0 || accuracy < 0 || accuracy > 100) {
      return res.status(400).json({ error: 'Invalid wpm or accuracy values' });
    }

    // Calculate XP from result
    const { xp: xpGained, breakdown } = calcXpForResult({
      mode,
      wpm,
      accuracy,
      words,
      rank,
    });

    if (xpGained <= 0) {
      return res.status(400).json({ error: 'No XP to award for this result' });
    }

    // Atomic update: fetch user, calculate new values, update
    // Use findByIdAndUpdate with $inc for atomicity, but we need to handle level-ups
    // So we'll use a transaction-like approach with findOneAndUpdate in a loop
    
    let updated = false;
    let attempts = 0;
    const maxAttempts = 5;

    while (!updated && attempts < maxAttempts) {
      attempts++;
      
      // Fetch current user state
      const user = await User.findById(userId).select('xp level xpToNext totalXp').lean();
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Handle missing XP fields (for existing users who haven't been migrated)
      const currentXp = (user.xp !== undefined && user.xp !== null) ? Number(user.xp) : 0;
      const currentLevel = (user.level !== undefined && user.level !== null) ? Number(user.level) : 1;
      const currentXpToNext = (user.xpToNext !== undefined && user.xpToNext !== null) ? Number(user.xpToNext) : 100;
      const currentTotalXp = (user.totalXp !== undefined && user.totalXp !== null) ? Number(user.totalXp) : 0;

      const oldLevel = currentLevel;
      const oldXp = currentXp;

      // Process level-up
      const result = processLevelUp(currentXp, currentLevel, xpGained);

      // Atomic update using findByIdAndUpdate with computed values
      const updateResult = await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            xp: result.newXp,
            level: result.newLevel,
            xpToNext: result.newXpToNext,
            totalXp: currentTotalXp + xpGained,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (updateResult) {
        updated = true;

        // Emit socket event if levels gained
        if (result.levelsGained > 0) {
          // Note: Socket emission should be handled by the caller or via a service
          // We'll return the data and let the caller handle socket emission
        }

        return res.json({
          xpGained,
          newLevel: result.newLevel,
          oldLevel,
          xp: result.newXp,
          xpToNext: result.newXpToNext,
          levelsGained: result.levelsGained,
          breakdown,
        });
      }

      // If update failed, retry (shouldn't happen often, but handle race conditions)
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // If we exhausted attempts, return error
    return res.status(500).json({ error: 'Failed to update XP after multiple attempts' });
  } catch (err) {
    console.error('[XP] Add XP error:', err.message);
    res.status(500).json({ error: 'Failed to add XP' });
  }
});

/**
 * GET /api/profile/xp/me
 * Get current user's XP and level information
 * 
 * Returns: {
 *   xp: number,
 *   level: number,
 *   xpToNext: number,
 *   totalXp: number,
 *   progress: number (0-100, percentage to next level)
 * }
 */
router.get('/me', async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('xp level xpToNext totalXp').lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Handle missing XP fields (for existing users who haven't been migrated)
    const xp = user.xp !== undefined && user.xp !== null ? user.xp : 0;
    const level = user.level !== undefined && user.level !== null ? user.level : 1;
    const xpToNext = user.xpToNext !== undefined && user.xpToNext !== null ? user.xpToNext : 100;
    const totalXp = user.totalXp !== undefined && user.totalXp !== null ? user.totalXp : 0;

    const progress = xpToNext > 0 
      ? Math.round((xp / xpToNext) * 100) 
      : 0;

    res.json({
      xp,
      level,
      xpToNext,
      totalXp,
      progress: Math.min(100, Math.max(0, progress)),
    });
  } catch (err) {
    console.error('[XP] Get XP error:', err.message);
    res.status(500).json({ error: 'Failed to get XP' });
  }
});

module.exports = router;

