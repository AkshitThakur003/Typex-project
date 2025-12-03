// ============================================
// Friend Model - Friend System V2
// ============================================

const mongoose = require('mongoose');

const friendSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'blocked'],
    default: 'pending',
    required: true,
  },
  // Track who blocked (if status is 'blocked')
  blockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
}, {
  timestamps: true,
});

// Compound index to ensure unique friend relationships
friendSchema.index({ requester: 1, recipient: 1 }, { unique: true });

// Prevent self-friending
friendSchema.pre('save', function(next) {
  if (this.requester.toString() === this.recipient.toString()) {
    return next(new Error('Cannot send friend request to yourself'));
  }
  next();
});

// Static method to find friendship between two users
friendSchema.statics.findFriendship = async function(userId1, userId2) {
  return this.findOne({
    $or: [
      { requester: userId1, recipient: userId2 },
      { requester: userId2, recipient: userId1 },
    ],
  });
};

// Static method to get all friends for a user
friendSchema.statics.getFriends = async function(userId) {
  const friendships = await this.find({
    $or: [
      { requester: userId, status: 'accepted' },
      { recipient: userId, status: 'accepted' },
    ],
  }).populate('requester', 'username email avatarChoice avatarUrl preferences oauthAvatar')
    .populate('recipient', 'username email avatarChoice avatarUrl preferences oauthAvatar');

  return friendships.map(friendship => {
    // Return the other user (not the current user)
    const friend = friendship.requester._id.toString() === userId.toString()
      ? friendship.recipient
      : friendship.requester;
    return {
      _id: friend._id,
      username: friend.username,
      email: friend.email,
      avatarChoice: friend.preferences?.avatarChoice || friend.avatarChoice || null,
      avatarUrl: friend.preferences?.avatarUrl || friend.avatarUrl || null,
      oauthAvatar: friend.oauthAvatar,
      friendshipId: friendship._id,
      createdAt: friendship.createdAt,
    };
  });
};

// Static method to get pending requests for a user
friendSchema.statics.getPendingRequests = async function(userId) {
  return this.find({
    recipient: userId,
    status: 'pending',
  }).populate('requester', 'username email avatarChoice avatarUrl preferences oauthAvatar')
    .sort({ createdAt: -1 });
};

// Static method to get sent requests (pending)
friendSchema.statics.getSentRequests = async function(userId) {
  return this.find({
    requester: userId,
    status: 'pending',
  }).populate('recipient', 'username email avatarChoice avatarUrl preferences oauthAvatar')
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('Friend', friendSchema);

