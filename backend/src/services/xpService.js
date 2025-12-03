/**
 * XP Service - Internal service for adding XP to users
 * Used by socket handlers and other internal services
 */

const User = require('../models/User');
const { calcXpForResult, processLevelUp } = require('../utils/xpCalculator');

/**
 * Add XP to a user from a game result
 * This is the internal function that should be called from socket handlers
 * 
 * @param {string} userId - User ID
 * @param {Object} result - Game result { mode, wpm, accuracy, words?, rank? }
 * @param {Object} io - Socket.io instance (optional, for emitting events)
 * @param {string} socketId - Socket ID (optional, for emitting to specific socket)
 * @returns {Promise<Object>} { xpGained, newLevel, oldLevel, xp, xpToNext, levelsGained, breakdown }
 */
async function addXpForUser(userId, result, io = null, socketId = null) {
  try {
    // Calculate XP
    const { xp: xpGained, breakdown } = calcXpForResult(result);

    if (xpGained <= 0) {
      return { xpGained: 0, skipped: true };
    }

    // Fetch current user state
    const user = await User.findById(userId).select('xp level xpToNext totalXp').lean();
    if (!user) {
      throw new Error('User not found');
    }

    // Handle missing XP fields (for existing users who haven't been migrated)
    const currentXp = user.xp !== undefined && user.xp !== null ? user.xp : 0;
    const currentLevel = user.level !== undefined && user.level !== null ? user.level : 1;
    const currentXpToNext = user.xpToNext !== undefined && user.xpToNext !== null ? user.xpToNext : 100;
    const currentTotalXp = user.totalXp !== undefined && user.totalXp !== null ? user.totalXp : 0;

    const oldLevel = currentLevel;
    const oldXp = currentXp;

    // Process level-up
    const levelUpResult = processLevelUp(currentXp, currentLevel, xpGained);

    // Atomic update
    await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          xp: levelUpResult.newXp,
          level: levelUpResult.newLevel,
          xpToNext: levelUpResult.newXpToNext,
          totalXp: currentTotalXp + xpGained,
        },
      },
      { runValidators: true }
    );

    // Emit socket event if io is provided
    if (io && socketId) {
      io.to(socketId).emit('xp:gain', {
        xpGained,
        newLevel: levelUpResult.newLevel,
        oldLevel,
        xp: levelUpResult.newXp,
        xpToNext: levelUpResult.newXpToNext,
        levelsGained: levelUpResult.levelsGained,
        breakdown,
      });
    }

    return {
      xpGained,
      newLevel: levelUpResult.newLevel,
      oldLevel,
      xp: levelUpResult.newXp,
      xpToNext: levelUpResult.newXpToNext,
      levelsGained: levelUpResult.levelsGained,
      breakdown,
    };
  } catch (err) {
    console.error('[XP Service] Error adding XP:', err);
    throw err;
  }
}

module.exports = {
  addXpForUser,
};

