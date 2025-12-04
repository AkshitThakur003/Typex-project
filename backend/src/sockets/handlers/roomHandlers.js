// Room-related socket handlers (create, join, leave, settings, host controls)
const { getTextByDifficulty } = require('../../data/texts');
const { makeTextFromWords } = require('../../data/words');
const { now, createRoom, serializeRoom, assignNewHost, getRooms, deleteRoom } = require('../utils/roomUtils');

function registerRoomHandlers(socket, io) {
  const rooms = getRooms();

  socket.on('room:create', async ({ name, difficulty='easy', timeLimit=60, roomName = '', wordCount=null, modifiers=[], customText=null, teamMode=false } = {}, cb) => {
    try {
      const hostName = name || socket.user?.username || 'Host';
      const hostUserId = socket.user?.id || null;
      
      if (customText && typeof customText === 'string') {
        const trimmedLength = customText.trim().length;
        if (trimmedLength < 50 || trimmedLength > 500) {
          return cb && cb({ error: 'Custom text must be between 50 and 500 characters' });
        }
      }
      
      const room = createRoom({ 
        hostId: socket.id, 
        hostName, 
        difficulty, 
        timeLimit, 
        roomName, 
        wordCount,
        hostUserId,
        modifiers,
        customText,
        teamMode,
      });
      socket.join(room.code);
      const textMode = customText ? 'custom' : (room.wordCount ? `wordCount:${room.wordCount}` : `difficulty:${difficulty}`);
      cb && cb({ ...serializeRoom(room) });
      io.to(room.code).emit('room:state', serializeRoom(room));
    } catch (err) {
      console.error('[Room Create] Error:', err);
      cb && cb({ error: 'Failed to create room' });
    }
  });

  socket.on('room:join', async ({ code, name, spectator=false } = {}, cb) => {
    try {
      const room = rooms.get(code);
      if (!room) return cb && cb({ error: 'Room not found' });
      
      const userId = socket.user?.id || null;
      const displayName = name || socket.user?.username || 'Player';
      
      socket.join(code);
      const role = spectator ? 'spectator' : (socket.id === room.hostId ? 'host' : 'player');
      room.players.set(socket.id, { id: socket.id, name: displayName, role, progress: 0, wpm: 0, accuracy: 100, finished: false, wpmHistory: [], cheatStatus: 'verified', userId, team: null, mistakes: 0 });
      cb && cb({ ...serializeRoom(room) });
      io.to(code).emit('room:state', serializeRoom(room));
    } catch (err) {
      console.error('[Room Join] Error:', err);
      cb && cb({ error: 'Failed to join room' });
    }
  });

  socket.on('room:leave', ({ code } = {}, cb) => {
    const room = rooms.get(code);
    if (!room) return cb && cb({ ok: true });
    socket.leave(code);
    room.players.delete(socket.id);
    if (socket.id === room.hostId) {
      const newHost = assignNewHost(room);
      if (!newHost) {
        io.to(code).emit('room:closed');
        deleteRoom(code);
        return cb && cb({ ok: true });
      }
    }
    if (room.players.size === 0) {
      deleteRoom(code);
    } else {
      io.to(code).emit('room:state', serializeRoom(room));
    }
    cb && cb({ ok: true });
  });

  socket.on('room:updateSettings', ({ code, difficulty, timeLimit, wordCount, roomName }, cb) => {
    const room = rooms.get(code);
    if (!room) return cb && cb({ error: 'Room not found' });
    if (socket.id !== room.hostId) return cb && cb({ error: 'Only host can update settings' });
    room.difficulty = difficulty || room.difficulty;
    room.timeLimit = Number(timeLimit) || room.timeLimit;
    if (typeof roomName === 'string') room.roomName = roomName;
    if (wordCount) {
      room.wordCount = Number(wordCount);
      room.text = makeTextFromWords(room.wordCount);
    } else {
      room.text = getTextByDifficulty(room.difficulty);
      room.wordCount = null;
    }
    io.to(code).emit('room:state', serializeRoom(room));
    cb && cb({ ok: true });
  });

  // Host controls
  socket.on('room:lock', ({ code, lock }, cb) => {
    try {
      const room = rooms.get(code);
      if (!room) return cb && cb({ error: 'Room not found' });
      if (socket.id !== room.hostId) return cb && cb({ error: 'Only host can lock room' });
      
      room.isLocked = lock !== false;
      io.to(code).emit('room:state', serializeRoom(room));
      cb && cb({ ok: true, isLocked: room.isLocked });
    } catch (err) {
      console.error('[Room Lock] Error:', err);
      cb && cb({ error: 'Failed to lock room' });
    }
  });

  socket.on('room:kick', ({ code, playerId }, cb) => {
    try {
      const room = rooms.get(code);
      if (!room) return cb && cb({ error: 'Room not found' });
      if (socket.id !== room.hostId) return cb && cb({ error: 'Only host can kick players' });
      
      const player = room.players.get(playerId);
      if (!player) return cb && cb({ error: 'Player not found' });
      if (playerId === room.hostId) return cb && cb({ error: 'Cannot kick host' });
      
      const playerSocket = io.sockets.sockets.get(playerId);
      if (playerSocket) {
        playerSocket.emit('playerKicked', { username: player.name, reason: 'Kicked by host' });
        playerSocket.leave(code);
      }
      
      room.players.delete(playerId);
      
      const msg = { name: 'System', text: `${player.name} was kicked from the room.`, ts: now(), system: true };
      room.chat.push(msg);
      if (room.chat.length > 200) room.chat.shift();
      io.to(code).emit('chat:message', msg);
      
      if (room.players.size === 0) {
        io.to(code).emit('room:closed');
        deleteRoom(code);
      } else {
        io.to(code).emit('room:state', serializeRoom(room));
      }
      
      cb && cb({ ok: true });
    } catch (err) {
      console.error('[Room Kick] Error:', err);
      cb && cb({ error: 'Failed to kick player' });
    }
  });

  socket.on('room:promote', ({ code, playerId }, cb) => {
    try {
      const room = rooms.get(code);
      if (!room) return cb && cb({ error: 'Room not found' });
      if (socket.id !== room.hostId) return cb && cb({ error: 'Only host can promote players' });
      
      const player = room.players.get(playerId);
      if (!player) return cb && cb({ error: 'Player not found' });
      if (player.role === 'spectator') return cb && cb({ error: 'Cannot promote spectator' });
      
      const oldHost = room.players.get(room.hostId);
      if (oldHost) {
        oldHost.role = 'player';
      }
      
      room.hostId = playerId;
      player.role = 'host';
      room.hostUserId = player.userId;
      
      const msg = { name: 'System', text: `${player.name} is now the host.`, ts: now(), system: true };
      room.chat.push(msg);
      if (room.chat.length > 200) room.chat.shift();
      io.to(code).emit('chat:message', msg);
      
      io.to(code).emit('room:state', serializeRoom(room));
      
      cb && cb({ ok: true });
    } catch (err) {
      console.error('[Room Promote] Error:', err);
      cb && cb({ error: 'Failed to promote player' });
    }
  });

  socket.on('room:setTeam', ({ code, playerId, team }, cb) => {
    try {
      const room = rooms.get(code);
      if (!room) return cb && cb({ error: 'Room not found' });
      if (socket.id !== room.hostId) return cb && cb({ error: 'Only host can assign teams' });
      if (!room.teamMode) return cb && cb({ error: 'Room is not in team mode' });
      
      const player = room.players.get(playerId);
      if (!player) return cb && cb({ error: 'Player not found' });
      if (player.role === 'spectator') return cb && cb({ error: 'Cannot assign team to spectator' });
      
      if (team && team !== 'red' && team !== 'blue') {
        return cb && cb({ error: 'Invalid team. Must be "red", "blue", or null' });
      }
      
      player.team = team;
      io.to(code).emit('room:state', serializeRoom(room));
      cb && cb({ ok: true });
    } catch (err) {
      console.error('[Room Set Team] Error:', err);
      cb && cb({ error: 'Failed to set team' });
    }
  });

  socket.on('room:setSuddenDeathLimit', ({ code, limit }, cb) => {
    try {
      const room = rooms.get(code);
      if (!room) return cb && cb({ error: 'Room not found' });
      if (socket.id !== room.hostId) return cb && cb({ error: 'Only host can change sudden death limit' });
      if (!room.modifiers || !room.modifiers.includes('sudden-death')) {
        return cb && cb({ error: 'Sudden death mode is not active' });
      }
      const newLimit = Math.max(1, Math.min(10, Number(limit) || 1));
      room.suddenDeathLimit = newLimit;
      const msg = { name: 'System', text: `Sudden death limit changed to ${newLimit} mistake${newLimit > 1 ? 's' : ''}`, ts: Date.now(), system: true };
      room.chat.push(msg);
      if (room.chat.length > 200) room.chat.shift();
      io.to(code).emit('chat:message', msg);
      io.to(code).emit('room:state', serializeRoom(room));
      cb && cb({ ok: true, suddenDeathLimit: newLimit });
    } catch (err) {
      console.error('[Set Sudden Death Limit] Error:', err);
      cb && cb({ error: 'Failed to update sudden death limit' });
    }
  });

  socket.on('room:invite', async ({ code, friendId, friendUsername }, cb) => {
    try {
      const room = rooms.get(code);
      if (!room) return cb && cb({ error: 'Room not found' });
      if (socket.id !== room.hostId) return cb && cb({ error: 'Only host can invite friends' });
      
      let friendSocket = null;
      for (const [socketId, s] of io.sockets.sockets) {
        if (s.user?.id?.toString() === String(friendId)) {
          friendSocket = s;
          break;
        }
      }
      
      if (!friendSocket) {
        return cb && cb({ error: 'Friend is not online' });
      }
      
      friendSocket.emit('room:invite:received', {
        roomCode: code,
        roomName: room.roomName || 'Untitled Room',
        hostName: socket.user?.username || 'Host',
        hostId: socket.user?.id,
        modifiers: room.modifiers || [],
        teamMode: room.teamMode || false,
      });
      
      cb && cb({ ok: true });
    } catch (err) {
      console.error('[Room Invite] Error:', err);
      cb && cb({ error: 'Failed to send invite' });
    }
  });
}

module.exports = { registerRoomHandlers };

