const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Friend = require('../models/Friend');
const User = require('../models/User');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// GET /api/friends - Get all friends
router.get('/', async (req, res) => {
  try {
    const friends = await Friend.getFriends(req.user.id);
    res.json({ friends });
  } catch (err) {
    console.error('[Friends] Get friends error:', err);
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
});

// GET /api/friends/requests - Get pending friend requests
router.get('/requests', async (req, res) => {
  try {
    const [received, sent] = await Promise.all([
      Friend.getPendingRequests(req.user.id),
      Friend.getSentRequests(req.user.id),
    ]);
    res.json({
      received: received.map(r => ({
        _id: r._id,
        user: {
          _id: r.requester._id,
          username: r.requester.username,
          email: r.requester.email,
          avatarChoice: r.requester.avatarChoice,
          oauthAvatar: r.requester.oauthAvatar,
        },
        createdAt: r.createdAt,
      })),
      sent: sent.map(s => ({
        _id: s._id,
        user: {
          _id: s.recipient._id,
          username: s.recipient.username,
          email: s.recipient.email,
          avatarChoice: s.recipient.avatarChoice,
          oauthAvatar: s.recipient.oauthAvatar,
        },
        createdAt: s.createdAt,
      })),
    });
  } catch (err) {
    console.error('[Friends] Get requests error:', err);
    res.status(500).json({ error: 'Failed to fetch friend requests' });
  }
});

// POST /api/friends/search - Search users by username
router.post('/search', async (req, res) => {
  try {
    // Verify authentication
    if (!req.user || !req.user.id) {
      console.error('[Friends Search] No user in request:', req.user);
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { query } = req.body;
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const searchTerm = query.trim();
    const searchRegex = new RegExp(searchTerm, 'i');
    
    
    // Convert req.user.id to ObjectId for proper MongoDB comparison
    const currentUserId = mongoose.Types.ObjectId.isValid(req.user.id) 
      ? new mongoose.Types.ObjectId(req.user.id)
      : req.user.id;
    
    const users = await User.find({
      username: searchRegex,
      _id: { $ne: currentUserId }, // Exclude current user
    })
      .select('username email avatarChoice avatarUrl preferences oauthAvatar')
      .limit(20);
    

    // Check friendship status for each user
    const userIds = users.map(u => u._id);
    const friendships = await Friend.find({
      $or: [
        { requester: currentUserId, recipient: { $in: userIds } },
        { requester: { $in: userIds }, recipient: currentUserId },
      ],
    }).lean();

    const friendshipMap = new Map();
    friendships.forEach(f => {
      const otherUserId = f.requester.toString() === currentUserId.toString()
        ? f.recipient.toString()
        : f.requester.toString();
      friendshipMap.set(otherUserId, f.status);
    });

    const results = users.map(user => ({
      _id: user._id,
      username: user.username,
      email: user.email,
      avatarChoice: user.preferences?.avatarChoice || user.avatarChoice || null,
      avatarUrl: user.preferences?.avatarUrl || user.avatarUrl || null,
      oauthAvatar: user.oauthAvatar,
      status: friendshipMap.get(user._id.toString()) || null,
    }));

    res.json({ users: results });
  } catch (err) {
    console.error('[Friends] Search error:', err);
    console.error('[Friends] Search error stack:', err.stack);
    console.error('[Friends] Search error details:', {
      message: err.message,
      name: err.name,
      query: req.body?.query,
      userId: req.user?.id,
    });
    res.status(500).json({ 
      error: 'Failed to search users',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// POST /api/friends/send - Send friend request
router.post('/send', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (userId === req.user.id.toString()) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    const recipient = await User.findById(userId);
    if (!recipient) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if friendship already exists
    const existing = await Friend.findFriendship(req.user.id, userId);
    if (existing) {
      if (existing.status === 'accepted') {
        return res.status(400).json({ error: 'Already friends' });
      }
      if (existing.status === 'blocked') {
        return res.status(403).json({ error: 'Cannot send request to blocked user' });
      }
      if (existing.status === 'pending') {
        if (existing.requester.toString() === req.user.id.toString()) {
          return res.status(400).json({ error: 'Friend request already sent' });
        } else {
          // Auto-accept if recipient is sending request back
          existing.status = 'accepted';
          await existing.save();
          return res.json({ message: 'Friend request accepted', friendship: existing });
        }
      }
    }

    const friendship = await Friend.create({
      requester: req.user.id,
      recipient: userId,
      status: 'pending',
    });

    res.status(201).json({
      message: 'Friend request sent',
      friendship: {
        _id: friendship._id,
        status: friendship.status,
        createdAt: friendship.createdAt,
      },
    });
  } catch (err) {
    console.error('[Friends] Send request error:', err);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Friend request already exists' });
    }
    res.status(500).json({ error: 'Failed to send friend request' });
  }
});

// POST /api/friends/accept - Accept friend request
router.post('/accept', async (req, res) => {
  try {
    const { requestId } = req.body;
    if (!requestId) {
      return res.status(400).json({ error: 'Request ID is required' });
    }

    const friendship = await Friend.findById(requestId);
    if (!friendship) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    if (friendship.recipient.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Not authorized to accept this request' });
    }

    if (friendship.status !== 'pending') {
      return res.status(400).json({ error: 'Request is not pending' });
    }

    friendship.status = 'accepted';
    await friendship.save();

    res.json({ message: 'Friend request accepted', friendship });
  } catch (err) {
    console.error('[Friends] Accept request error:', err);
    res.status(500).json({ error: 'Failed to accept friend request' });
  }
});

// POST /api/friends/decline - Decline friend request
router.post('/decline', async (req, res) => {
  try {
    const { requestId } = req.body;
    if (!requestId) {
      return res.status(400).json({ error: 'Request ID is required' });
    }

    const friendship = await Friend.findById(requestId);
    if (!friendship) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    if (friendship.recipient.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Not authorized to decline this request' });
    }

    await Friend.deleteOne({ _id: requestId });

    res.json({ message: 'Friend request declined' });
  } catch (err) {
    console.error('[Friends] Decline request error:', err);
    res.status(500).json({ error: 'Failed to decline friend request' });
  }
});

// POST /api/friends/remove - Remove friend (unfriend)
router.post('/remove', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const friendship = await Friend.findFriendship(req.user.id, userId);
    if (!friendship) {
      return res.status(404).json({ error: 'Friendship not found' });
    }

    if (friendship.status !== 'accepted') {
      return res.status(400).json({ error: 'Not friends with this user' });
    }

    await Friend.deleteOne({ _id: friendship._id });

    res.json({ message: 'Friend removed' });
  } catch (err) {
    console.error('[Friends] Remove friend error:', err);
    res.status(500).json({ error: 'Failed to remove friend' });
  }
});

// POST /api/friends/block - Block user
router.post('/block', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (userId === req.user.id.toString()) {
      return res.status(400).json({ error: 'Cannot block yourself' });
    }

    let friendship = await Friend.findFriendship(req.user.id, userId);
    
    if (friendship) {
      friendship.status = 'blocked';
      friendship.blockedBy = req.user.id;
      await friendship.save();
    } else {
      friendship = await Friend.create({
        requester: req.user.id,
        recipient: userId,
        status: 'blocked',
        blockedBy: req.user.id,
      });
    }

    res.json({ message: 'User blocked', friendship });
  } catch (err) {
    console.error('[Friends] Block user error:', err);
    res.status(500).json({ error: 'Failed to block user' });
  }
});

// POST /api/friends/unblock - Unblock user
router.post('/unblock', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const friendship = await Friend.findFriendship(req.user.id, userId);
    if (!friendship || friendship.status !== 'blocked') {
      return res.status(404).json({ error: 'User is not blocked' });
    }

    if (friendship.blockedBy?.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Not authorized to unblock this user' });
    }

    await Friend.deleteOne({ _id: friendship._id });

    res.json({ message: 'User unblocked' });
  } catch (err) {
    console.error('[Friends] Unblock user error:', err);
    res.status(500).json({ error: 'Failed to unblock user' });
  }
});

module.exports = router;

