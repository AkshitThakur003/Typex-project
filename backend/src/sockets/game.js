const GameResult = require('../models/GameResult');
const Leaderboard = require('../models/Leaderboard');
const { getTextByDifficulty } = require('../data/texts');
const { makeTextFromWords } = require('../data/words');
const jwt = require('jsonwebtoken');
let ioGlobal;

const rooms = new Map();

function makeRoomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function now() { return Date.now(); }

function createRoom({ hostId, hostName, difficulty='easy', timeLimit=60, roomName = '', wordCount=null }) {
  const code = makeRoomCode();
  const text = (wordCount && Number(wordCount) > 0) ? makeTextFromWords(Number(wordCount)) : getTextByDifficulty(difficulty);
  const room = {
    code,
    text,
    difficulty,
    timeLimit, // seconds
  roomName: roomName || '',
    wordCount: wordCount ? Number(wordCount) : null,
    hostId,
  status: 'lobby', // 'lobby' | 'race' | 'results'
    startedAt: null,
    endsAt: null,
  players: new Map(), // socketId -> { id, name, role, progress, wpm, accuracy, finished, wpmHistory: [], cheatStatus }
  chat: [], // { name, text, ts }
  };
  room.players.set(hostId, { id: hostId, name: hostName || 'Host', role: 'host', progress: 0, wpm: 0, accuracy: 100, finished: false, wpmHistory: [], cheatStatus: 'verified' });
  rooms.set(code, room);
  return room;
}

function assignNewHost(room) {
  for (const p of room.players.values()) {
    if (p.id !== room.hostId && p.role !== 'spectator') {
      room.hostId = p.id;
      p.role = 'host';
      return p;
    }
  }
  return null;
}

function serializeRoom(room) {
  return {
    code: room.code,
    text: room.text,
    difficulty: room.difficulty,
    timeLimit: room.timeLimit,
  roomName: room.roomName || '',
  wordCount: room.wordCount || null,
    hostId: room.hostId,
  status: room.status || 'lobby',
    startedAt: room.startedAt,
    endsAt: room.endsAt,
  players: [...room.players.values()].map(p => ({ id: p.id, name: p.name, role: p.role, progress: p.progress, wpm: p.wpm, accuracy: p.accuracy, finished: p.finished, cheatStatus: p.cheatStatus || 'verified' })),
  spectators: [...room.players.values()].filter(p => p.role === 'spectator').map(p => ({ id: p.id, name: p.name })),
  };
}

// Available rooms list removed per requirements

function calcAccuracy(typed, target) {
  const n = Math.max(1, typed.length);
  let correct = 0;
  for (let i=0;i<typed.length;i++) {
    if (typed[i] === target[i]) correct++;
  }
  return Math.round((correct / n) * 100);
}

function finishIfDone(room) {
  const allDone = [...room.players.values()].filter(p=>p.role!=='spectator').every(p => p.finished);
  if (allDone) endGame(room, 'all-finished');
}

async function endGame(room, reason='time') {
  if (!room.endsAt) room.endsAt = now();
  const results = [...room.players.values()].filter(p=>p.role!=='spectator');
  results.sort((a,b) => b.wpm - a.wpm);
  const winner = results[0] || null;
  const payload = { reason, winner: winner ? { id: winner.id, name: winner.name, wpm: winner.wpm, accuracy: winner.accuracy } : null, results: results.map(r => ({ id: r.id, name: r.name, wpm: r.wpm, accuracy: r.accuracy, finished: r.finished, wpmHistory: r.wpmHistory || [], cheatStatus: r.cheatStatus || 'verified' })) };

  // persist
  try {
    await GameResult.create({
      roomCode: room.code,
      difficulty: room.difficulty,
      timeLimit: room.timeLimit,
      startedAt: room.startedAt ? new Date(room.startedAt) : null,
      endedAt: new Date(),
      players: results.map(r => ({ username: r.name, wpm: r.wpm, accuracy: r.accuracy, finished: r.finished })),
    });
  // also persist to Leaderboard per player with mode 'multiplayer'
  const docs = results.map(r => ({ username: r.name, wpm: r.wpm, accuracy: r.accuracy, mode: 'multiplayer' }));
  if (docs.length) await Leaderboard.insertMany(docs, { ordered: false });
  } catch (e) {
    console.error('Failed to save result', e);
  }

  // notify and cleanup
  ioGlobal.to(room.code).emit('game:ended', payload);
  ioGlobal.to(room.code).emit('gameResults', { roomCode: room.code, ...payload });
  rooms.delete(room.code);
}

function registerGameSocket(io) {
  ioGlobal = io;
  // Socket auth middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('unauthorized'));
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
      socket.user = payload; // { id, username, ... }
      next();
    } catch (e) {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {

    const requireRoom = (code, cb) => {
      const room = rooms.get(code);
      if (!room) { cb && cb({ error: 'Room not found' }); return null; }
      return room;
    };
    const requireHost = (room, socket, cb) => {
      if (socket.id !== room.hostId) { cb && cb({ error: 'Only host can perform this action' }); return false; }
      return true;
    };
    socket.on('room:create', ({ name, difficulty='easy', timeLimit=60, roomName = '', wordCount=null } = {}, cb) => {
      const hostName = name || socket.user?.username || 'Host';
      const room = createRoom({ hostId: socket.id, hostName, difficulty, timeLimit, roomName, wordCount });
      socket.join(room.code);
      cb && cb({ ...serializeRoom(room) });
  ioGlobal.to(room.code).emit('room:state', serializeRoom(room));
    });

    socket.on('room:join', ({ code, name, spectator=false }, cb) => {
      const room = rooms.get(code);
      if (!room) return cb && cb({ error: 'Room not found' });
      socket.join(code);
      const role = spectator ? 'spectator' : (socket.id === room.hostId ? 'host' : 'player');
      const displayName = name || socket.user?.username || 'Player';
      room.players.set(socket.id, { id: socket.id, name: displayName, role, progress: 0, wpm: 0, accuracy: 100, finished: false, wpmHistory: [], cheatStatus: 'verified' });
      cb && cb({ ...serializeRoom(room) });
  ioGlobal.to(code).emit('room:state', serializeRoom(room));
    });

  socket.on('room:leave', ({ code } = {}, cb) => {
      const room = rooms.get(code);
      if (!room) return cb && cb({ ok: true });
      socket.leave(code);
      room.players.delete(socket.id);
      if (socket.id === room.hostId) {
        const newHost = assignNewHost(room);
        if (!newHost) {
          ioGlobal.to(code).emit('room:closed');
          rooms.delete(code);
          return cb && cb({ ok: true });
        }
      }
      if (room.players.size === 0) {
        rooms.delete(code);
      } else {
        ioGlobal.to(code).emit('room:state', serializeRoom(room));
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
      ioGlobal.to(code).emit('room:state', serializeRoom(room));
      cb && cb({ ok: true });
    });

    socket.on('game:start', ({ code }, cb) => {
      const room = rooms.get(code);
      if (!room) return cb && cb({ error: 'Room not found' });
      if (socket.id !== room.hostId) return cb && cb({ error: 'Only host can start the game' });
      if (room.startedAt) return cb && cb({ error: 'Already started' });
      // start race immediately
      room.status = 'race';
      room.startedAt = now();
      room.endsAt = room.startedAt + room.timeLimit * 1000;
      ioGlobal.to(code).emit('game:started', { roomCode: code, text: room.text, startedAt: room.startedAt, endsAt: room.endsAt });
      // hard stop timer
      setTimeout(() => {
        const live = rooms.get(code);
        if (live && live.endsAt && now() >= live.endsAt) endGame(live, 'time');
      }, room.timeLimit * 1000 + 50);
    });

  socket.on('game:progress', ({ code, typed, elapsedMs, keystrokeTimestamps, pasteEvents }, cb) => {
      const room = rooms.get(code);
      if (!room) return cb && cb({ error: 'Room not found' });
      const player = room.players.get(socket.id);
      if (!player || player.role === 'spectator') return; // spectators cannot type
      if (!room.startedAt) return; // not started
      // compute metrics
      const target = room.text;
      const accuracy = calcAccuracy(typed, target);
      const chars = typed.length;
  const elapsed = (elapsedMs || (now() - room.startedAt));
  const minutes = Math.max(0.001, elapsed / 60000);
  const wpm = Math.round((chars / 5) / minutes);
      const progress = Math.min(100, Math.round((chars / target.length) * 100));
      player.wpm = wpm;
      player.accuracy = accuracy;
      player.progress = progress;
      player.finished = progress >= 100;
      // Passive anti-cheat assessment (non-blocking)
      try {
        let suspicious = false;
        if (typeof pasteEvents === 'boolean' && pasteEvents) suspicious = true;
        if (wpm > 300) suspicious = true;
        if (Array.isArray(keystrokeTimestamps) && keystrokeTimestamps.length > 10) {
          let sum = 0, count = 0;
          for (let i = 1; i < keystrokeTimestamps.length; i++) {
            const dt = keystrokeTimestamps[i] - keystrokeTimestamps[i - 1];
            if (dt > 0 && dt < 2000) { sum += dt; count++; }
          }
          const avg = count ? (sum / count) : null;
          if (avg !== null && avg < 30) suspicious = true; // unrealistically fast average interval
        }
        const prevStatus = player.cheatStatus || 'verified';
        player.cheatStatus = suspicious ? 'suspicious' : 'verified';
        if (player.cheatStatus !== prevStatus && player.cheatStatus === 'suspicious') {
          // Host immune in this demo
          if (socket.id !== room.hostId) {
            console.warn(`[anti-cheat] Auto-kick: ${player.name} from ${code}`);
            try {
              // Notify the kicked player
              socket.emit('playerKicked', { username: player.name, reason: 'Anti-cheat: suspicious activity detected' });
              // System chat message to room
              const msg = { name: 'System', text: `${player.name} was removed for unfair play.`, ts: Date.now(), system: true };
              room.chat.push(msg);
              if (room.chat.length > 200) room.chat.shift();
              ioGlobal.to(code).emit('chat:message', msg);
              // Remove from room and update state
              socket.leave(code);
              room.players.delete(socket.id);
              if (room.players.size === 0) {
                ioGlobal.to(code).emit('room:closed');
                rooms.delete(code);
              } else {
                ioGlobal.to(code).emit('room:state', serializeRoom(room));
              }
            } catch (e) {
              console.error('Failed to kick player', e);
            }
            return cb && cb({ ok: true });
          }
        }
      } catch {}
      // Track WPM history at 1-second granularity and emit live update
      try {
        const tSec = Math.max(0, Math.floor(elapsed / 1000));
        const hist = player.wpmHistory || (player.wpmHistory = []);
        const last = hist[hist.length - 1];
        if (!last || last.time !== tSec) hist.push({ time: tSec, wpm });
        else last.wpm = wpm;
        ioGlobal.to(code).emit('wpmUpdate', { playerId: socket.id, wpm, time: tSec });
      } catch {}
      ioGlobal.to(code).emit('room:state', serializeRoom(room));
      if (player.finished) finishIfDone(room);
      cb && cb({ ok: true });
    });

    // alias for progress updates
  socket.on('progressUpdate', ({ roomCode, progress, wpm, typed, elapsedMs, keystrokeTimestamps, pasteEvents }, cb) => {
      // prefer typed/elapsedMs to compute same as primary path; fall back to provided values if needed
      const code = roomCode;
      if (!code) return cb && cb({ error: 'Room not found' });
      if (typed != null || elapsedMs != null) {
    return ioGlobal.sockets.get(socket.id)?.emit && socket.emit('game:progress', { code, typed: typed || '', elapsedMs, keystrokeTimestamps, pasteEvents }, cb);
      }
      const room = rooms.get(code);
      if (!room) return cb && cb({ error: 'Room not found' });
      const player = room.players.get(socket.id);
      if (!player || !room.startedAt) return cb && cb({ error: 'Invalid' });
      player.wpm = typeof wpm === 'number' ? Math.max(0, Math.round(wpm)) : player.wpm;
      player.progress = typeof progress === 'number' ? Math.max(0, Math.min(100, Math.round(progress))) : player.progress;
      player.finished = player.progress >= 100;
      ioGlobal.to(code).emit('room:state', serializeRoom(room));
      if (player.finished) finishIfDone(room);
      cb && cb({ ok: true });
    });

    // chat support (optional client feature)
    socket.on('chat:send', ({ code, text, name }, cb) => {
      const room = rooms.get(code);
      if (!room || !text) return cb && cb({ error: 'Invalid' });
      const msg = { name: name || socket.user?.username || 'Anon', text, ts: Date.now() };
      room.chat.push(msg);
      if (room.chat.length > 200) room.chat.shift();
      ioGlobal.to(code).emit('chat:message', msg);
      cb && cb({ ok: true });
    });
    socket.on('chat:history', ({ code }, cb) => {
      const room = rooms.get(code);
      cb && cb({ history: room ? room.chat : [] });
    });

  socket.on('disconnecting', () => {
      for (const code of socket.rooms) {
        const room = rooms.get(code);
        if (!room) continue;
        room.players.delete(socket.id);
        if (socket.id === room.hostId) {
          const newHost = assignNewHost(room);
          if (!newHost) {
            // dissolve room
            ioGlobal.to(code).emit('room:closed');
            rooms.delete(code);
            continue;
          }
      // reflect new host in current state
      ioGlobal.to(code).emit('room:state', serializeRoom(room));
        }
        if (room.players.size === 0) rooms.delete(code);
        else ioGlobal.to(code).emit('room:state', serializeRoom(room));
      }
    });
  });
}

module.exports = { registerGameSocket };
