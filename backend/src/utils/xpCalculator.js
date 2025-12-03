/**
 * XP & Level System Utilities
 * 
 * XP Rules:
 * - xpPerCorrectWord = 2
 * - xpPerTestComplete = 1
 * - accuracyBonus = 5 when accuracy >= 95%
 * - winBonus = 20 (multiplayer first place)
 * - pos2Bonus = 10 (multiplayer second place)
 * - wpmBonus = Math.floor(wpm / 10)
 * 
 * Level Formula:
 * - xpToNext(level) = 100 + (level - 1) * 35
 */

/**
 * Calculate XP required to reach next level
 * @param {number} level - Current level
 * @returns {number} XP required for next level
 */
function xpToNext(level) {
  if (level < 1) return 100;
  return 100 + (level - 1) * 35;
}

/**
 * Calculate total XP needed to reach a specific level
 * @param {number} targetLevel - Target level
 * @returns {number} Total XP needed
 */
function totalXpForLevel(targetLevel) {
  if (targetLevel <= 1) return 0;
  let total = 0;
  for (let l = 1; l < targetLevel; l++) {
    total += xpToNext(l);
  }
  return total;
}

/**
 * Calculate XP gained from a game result
 * @param {Object} params - Game result parameters
 * @param {string} params.mode - 'practice' or 'multiplayer'
 * @param {number} params.wpm - Words per minute
 * @param {number} params.accuracy - Accuracy percentage (0-100)
 * @param {number} [params.words] - Number of words typed (optional, for word-based calculation)
 * @param {number} [params.rank] - Final rank in multiplayer (1 = first, 2 = second, etc.)
 * @returns {Object} { xp, breakdown }
 */
function calcXpForResult({ mode, wpm, accuracy, words, rank }) {
  const breakdown = {
    base: 0,
    wordXp: 0,
    completion: 0,
    accuracyBonus: 0,
    wpmBonus: 0,
    winBonus: 0,
    pos2Bonus: 0,
  };

  // Base XP per correct word (estimate from WPM if words not provided)
  if (words && words > 0) {
    const correctWords = Math.floor((words * accuracy) / 100);
    breakdown.wordXp = correctWords * 2; // xpPerCorrectWord = 2
  } else if (wpm > 0) {
    // Estimate: assume 1 minute test, so words ≈ wpm
    const estimatedWords = Math.max(1, Math.floor(wpm));
    const correctWords = Math.floor((estimatedWords * accuracy) / 100);
    breakdown.wordXp = correctWords * 2;
  }

  // Completion bonus (xpPerTestComplete = 1)
  breakdown.completion = 1;

  // Accuracy bonus (5 XP if accuracy >= 95%)
  if (accuracy >= 95) {
    breakdown.accuracyBonus = 5;
  }

  // WPM bonus (Math.floor(wpm / 10))
  breakdown.wpmBonus = Math.floor(wpm / 10);

  // Multiplayer bonuses
  if (mode === 'multiplayer' && rank !== undefined) {
    if (rank === 1) {
      breakdown.winBonus = 20; // winBonus = 20
    } else if (rank === 2) {
      breakdown.pos2Bonus = 10; // pos2Bonus = 10
    }
  }

  const totalXp = breakdown.wordXp + breakdown.completion + breakdown.accuracyBonus + breakdown.wpmBonus + breakdown.winBonus + breakdown.pos2Bonus;

  return {
    xp: Math.max(0, totalXp), // Ensure non-negative
    breakdown,
  };
}

/**
 * Process level-up logic: add XP and handle level-ups
 * @param {number} currentXp - Current XP
 * @param {number} currentLevel - Current level
 * @param {number} xpGained - XP to add
 * @returns {Object} { newXp, newLevel, newXpToNext, levelsGained, totalXpGained }
 */
function processLevelUp(currentXp, currentLevel, xpGained) {
  // Ensure all inputs are numbers
  const xp = Number(currentXp) || 0;
  const level = Number(currentLevel) || 1;
  const gained = Number(xpGained) || 0;

  if (gained <= 0) {
    return {
      newXp: xp,
      newLevel: level,
      newXpToNext: xpToNext(level),
      levelsGained: 0,
      totalXpGained: 0,
    };
  }

  let newXp = xp + gained;
  let newLevel = level;
  let levelsGained = 0;
  let remainingXp = newXp;

  // Level up loop: keep leveling up if we have enough XP
  while (remainingXp >= xpToNext(newLevel)) {
    remainingXp -= xpToNext(newLevel);
    newLevel++;
    levelsGained++;
  }

  return {
    newXp: remainingXp,
    newLevel,
    newXpToNext: xpToNext(newLevel),
    levelsGained,
    totalXpGained: gained,
  };
}

module.exports = {
  xpToNext,
  totalXpForLevel,
  calcXpForResult,
  processLevelUp,
};

