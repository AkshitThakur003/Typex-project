const express = require('express');
const router = express.Router();
const GameResult = require('../models/GameResult');
const User = require('../models/User');

// Get recent multiplayer races
router.get('/recent-races', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const races = await GameResult.find({})
      .sort({ endedAt: -1 })
      .limit(limit)
      .lean();
    
    // Populate avatar data for players
    const racesWithAvatars = await Promise.all(races.map(async (race) => {
      if (!race.players || race.players.length === 0) return race;
      
      const playersWithAvatars = await Promise.all(race.players.map(async (player) => {
        if (!player.username) return player;
        
        const user = await User.findOne({ username: player.username })
          .select('preferences avatarChoice avatarUrl oauthAvatar')
          .lean();
        
        if (user) {
          return {
            ...player,
            avatarChoice: user.preferences?.avatarChoice || user.avatarChoice || null,
            avatarUrl: user.preferences?.avatarUrl || user.avatarUrl || null,
            oauthAvatar: user.oauthAvatar || null,
          };
        }
        return player;
      }));
      
      return {
        ...race,
        players: playersWithAvatars,
      };
    }));
    
    res.json({ races: racesWithAvatars });
  } catch (err) {
    console.error('[Recent Races] Error:', err);
    res.status(500).json({ error: 'Failed to fetch recent races' });
  }
});

module.exports = router;

