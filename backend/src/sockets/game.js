// Main game socket module - orchestrates all handlers
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getRooms, serializeRoom, assignNewHost, deleteRoom } = require('./utils/roomUtils');
const { registerGameHandlers, setIo } = require('./handlers/gameHandlers');
const { registerRoomHandlers } = require('./handlers/roomHandlers');
const { registerChatHandlers } = require('./handlers/chatHandlers');
const { registerFriendHandlers, handleFriendDisconnect } = require('./handlers/friendHandlers');

// SECURITY: Get JWT secret with proper fallback handling
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    console.error('[CRITICAL] JWT_SECRET is not set in production!');
    return null;
  }
  if (!secret) {
    console.warn('[WARNING] JWT_SECRET not set. Using development fallback.');
    return 'dev_secret_DO_NOT_USE_IN_PRODUCTION';
  }
  return secret;
};

function registerGameSocket(io) {
  setIo(io);
  
  // Socket auth middleware with improved security
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('unauthorized'));
      
      const secret = getJwtSecret();
      if (!secret) {
        console.error('[Socket Auth] Server configuration error - no JWT secret');
        return next(new Error('server_error'));
      }
      
      const payload = jwt.verify(token, secret);
      socket.user = payload;
      next();
    } catch (e) {
      if (e.name === 'TokenExpiredError') {
        return next(new Error('token_expired'));
      }
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const rooms = getRooms();
    
    // Register all handlers
    registerFriendHandlers(socket, io);
    registerRoomHandlers(socket, io);
    registerGameHandlers(socket, io);
    registerChatHandlers(socket, io);

    // Handle disconnection
    socket.on('disconnecting', async () => {
      // Handle friend offline status
      handleFriendDisconnect(socket, io);

      // Handle room cleanup and disconnect penalty tracking (Issue #7)
      for (const code of socket.rooms) {
        const room = rooms.get(code);
        if (!room) continue;
        
        const player = room.players.get(socket.id);
        
        // Track mid-race disconnect penalty (Issue #7)
        if (player && room.status === 'race' && !player.finished && socket.user?.id) {
          try {
            // Player disconnected during an active race without finishing
            await User.findByIdAndUpdate(socket.user.id, {
              $inc: { raceDisconnects: 1 },
              $set: { lastDisconnectAt: new Date() }
            });
            console.log(`[Disconnect Penalty] User ${socket.user.username} disconnected mid-race from room ${code}`);
            
            // Notify room about the disconnect
            const msg = { 
              name: 'System', 
              text: `${player.name} disconnected during the race.`, 
              ts: Date.now(), 
              system: true 
            };
            room.chat.push(msg);
            if (room.chat.length > 200) room.chat.shift();
            io.to(code).emit('chat:message', msg);
          } catch (err) {
            console.error('[Disconnect Penalty] Failed to track disconnect:', err);
          }
        }
        
        room.players.delete(socket.id);
        if (socket.id === room.hostId) {
          const newHost = assignNewHost(room);
          if (!newHost) {
            io.to(code).emit('room:closed');
            deleteRoom(code);
            continue;
          }
          io.to(code).emit('room:state', serializeRoom(room));
        }
        if (room.players.size === 0) deleteRoom(code);
        else io.to(code).emit('room:state', serializeRoom(room));
      }
    });
  });
}

module.exports = { registerGameSocket };
