// Friend-related socket handlers
const Friend = require('../../models/Friend');

// Track online users by userId
const onlineUsers = new Map(); // userId -> Set of socketIds

function getOnlineUsers() {
  return onlineUsers;
}

function registerFriendHandlers(socket, io) {
  // Track user online status on connect
  if (socket.user?.id) {
    if (!onlineUsers.has(socket.user.id)) {
      onlineUsers.set(socket.user.id, new Set());
    }
    onlineUsers.get(socket.user.id).add(socket.id);
    
    // Notify friends that user is online
    Friend.find({
      $or: [
        { requester: socket.user.id, status: 'accepted' },
        { recipient: socket.user.id, status: 'accepted' },
      ],
    }).then(friendships => {
      friendships.forEach(friendship => {
        const friendId = friendship.requester.toString() === socket.user.id.toString()
          ? friendship.recipient.toString()
          : friendship.requester.toString();
        
        io.sockets.sockets.forEach(s => {
          if (s.user?.id?.toString() === friendId) {
            s.emit('friend:online', { userId: socket.user.id, username: socket.user.username });
          }
        });
      });
    }).catch(err => console.error('[Friend Online] Error:', err));
  }

  // Friend status request handler
  socket.on('friend:status', async () => {
    if (!socket.user?.id) return;
    try {
      const friends = await Friend.getFriends(socket.user.id);
      const onlineFriendIds = new Set();
      
      friends.forEach(friend => {
        const friendId = friend._id.toString();
        if (onlineUsers.has(friendId) && onlineUsers.get(friendId).size > 0) {
          onlineFriendIds.add(friendId);
        }
      });
      
      socket.emit('friends:status', {
        online: Array.from(onlineFriendIds),
      });
    } catch (err) {
      console.error('[Friend Status] Error:', err);
    }
  });
}

function handleFriendDisconnect(socket, io) {
  if (socket.user?.id) {
    const userSockets = onlineUsers.get(socket.user.id);
    if (userSockets) {
      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        onlineUsers.delete(socket.user.id);
        
        // Notify friends that user went offline
        Friend.find({
          $or: [
            { requester: socket.user.id, status: 'accepted' },
            { recipient: socket.user.id, status: 'accepted' },
          ],
        }).then(friendships => {
          friendships.forEach(friendship => {
            const friendId = friendship.requester.toString() === socket.user.id.toString()
              ? friendship.recipient.toString()
              : friendship.requester.toString();
            
            io.sockets.sockets.forEach(s => {
              if (s.user?.id?.toString() === friendId) {
                s.emit('friend:offline', { userId: socket.user.id });
              }
            });
          });
        }).catch(err => console.error('[Friend Offline] Error:', err));
      }
    }
  }
}

module.exports = { registerFriendHandlers, handleFriendDisconnect, getOnlineUsers };

