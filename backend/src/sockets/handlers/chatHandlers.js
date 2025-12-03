// Chat-related socket handlers
const { now, getRooms } = require('../utils/roomUtils');

function registerChatHandlers(socket, io) {
  const rooms = getRooms();

  socket.on('chat:send', ({ code, text, name }, cb) => {
    const room = rooms.get(code);
    if (!room || !text) return cb && cb({ error: 'Invalid' });
    const msg = { name: name || socket.user?.username || 'Anon', text, ts: Date.now() };
    room.chat.push(msg);
    if (room.chat.length > 200) room.chat.shift();
    io.to(code).emit('chat:message', msg);
    cb && cb({ ok: true });
  });

  socket.on('chat:history', ({ code }, cb) => {
    const room = rooms.get(code);
    cb && cb({ history: room ? room.chat : [] });
  });

  // Typing indicator events
  socket.on('chat:typing', ({ code }) => {
    const room = rooms.get(code);
    if (!room || !socket.user?.username) return;
    
    const username = socket.user.username;
    room.typingUsers.set(username, now());
    
    const typingList = Array.from(room.typingUsers.keys()).filter(u => u !== username);
    socket.to(code).emit('chat:typing:update', { typingUsers: typingList });
    
    // Auto-clear typing status after 3 seconds
    setTimeout(() => {
      if (room.typingUsers.has(username)) {
        room.typingUsers.delete(username);
        const updatedList = Array.from(room.typingUsers.keys());
        io.to(code).emit('chat:typing:update', { typingUsers: updatedList });
      }
    }, 3000);
  });

  socket.on('chat:typing:stop', ({ code }) => {
    const room = rooms.get(code);
    if (!room || !socket.user?.username) return;
    
    const username = socket.user.username;
    room.typingUsers.delete(username);
    
    const typingList = Array.from(room.typingUsers.keys());
    io.to(code).emit('chat:typing:update', { typingUsers: typingList });
  });
}

module.exports = { registerChatHandlers };

