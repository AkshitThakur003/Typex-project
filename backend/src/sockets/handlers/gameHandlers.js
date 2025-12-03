// Game-related socket handlers (start, progress, rematch, end)
const { getTextByDifficulty } = require('../../data/texts');
const { makeTextFromWords } = require('../../data/words');
const GameResult = require('../../models/GameResult');
const Leaderboard = require('../../models/Leaderboard');
const { addXpForUser } = require('../../services/xpService');
const { now, serializeRoom, calcAccuracy, assignNewHost, deleteRoom, getRooms } = require('../utils/roomUtils');

let ioRef = null;

// Anti-cheat and validation constants
const MAX_REALISTIC_WPM = 250; // World record is ~216 WPM
const MIN_KEYSTROKE_AVG_MS = 40; // Minimum average time between keystrokes (25 chars/sec = 40ms)
const MIN_FINISH_TIME_SECONDS = 3; // Minimum time to finish a race
const PROGRESS_RATE_LIMIT_MS = 100; // Rate limit progress updates to every 100ms

// Track last progress update time per player for rate limiting
const playerProgressTimestamps = new Map();

function setIo(io) {
  ioRef = io;
}

function finishIfDone(room) {
  const allDone = [...room.players.values()].filter(p=>p.role!=='spectator').every(p => p.finished);
  if (allDone) endGame(room, 'all-finished');
}

async function endGame(room, reason='time') {
  if (!room.endsAt) room.endsAt = now();
  const results = [...room.players.values()].filter(p=>p.role!=='spectator');
  // Sort by WPM, then accuracy, then finish time (faster wins)
  results.sort((a, b) => {
    if (b.wpm !== a.wpm) return b.wpm - a.wpm;
    if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
    // Lower finish time wins (faster completion)
    return (a.finishTime || Infinity) - (b.finishTime || Infinity);
  });
  
  let winner = results[0] || null;
  let teamResults = null;
  let winningTeam = null;
  
  // Calculate team results if in team mode
  if (room.teamMode) {
    const redTeam = results.filter(p => p.team === 'red');
    const blueTeam = results.filter(p => p.team === 'blue');
    
    const redAvgWpm = redTeam.length > 0 ? Math.round(redTeam.reduce((sum, p) => sum + p.wpm, 0) / redTeam.length) : 0;
    const blueAvgWpm = blueTeam.length > 0 ? Math.round(blueTeam.reduce((sum, p) => sum + p.wpm, 0) / blueTeam.length) : 0;
    
    const redAvgAcc = redTeam.length > 0 ? Math.round(redTeam.reduce((sum, p) => sum + p.accuracy, 0) / redTeam.length) : 0;
    const blueAvgAcc = blueTeam.length > 0 ? Math.round(blueTeam.reduce((sum, p) => sum + p.accuracy, 0) / blueTeam.length) : 0;
    
    teamResults = {
      red: { avgWpm: redAvgWpm, avgAccuracy: redAvgAcc, players: redTeam.length },
      blue: { avgWpm: blueAvgWpm, avgAccuracy: blueAvgAcc, players: blueTeam.length },
    };
    
    winningTeam = redAvgWpm > blueAvgWpm ? 'red' : blueAvgWpm > redAvgWpm ? 'blue' : 'tie';
  }
  
  const payload = { 
    reason, 
    winner: winner ? { id: winner.id, name: winner.name, wpm: winner.wpm, accuracy: winner.accuracy, finishTime: winner.finishTime || null, team: winner.team || null } : null, 
    results: results.map(r => ({ id: r.id, name: r.name, wpm: r.wpm, accuracy: r.accuracy, finished: r.finished, finishTime: r.finishTime || null, wpmHistory: r.wpmHistory || [], cheatStatus: r.cheatStatus || 'verified', team: r.team || null })),
    teamMode: room.teamMode || false,
    teamResults,
    winningTeam,
  };

  // persist
  try {
    console.log('[Game End] Saving results for room:', room.code, 'Players:', results.length);
    
    // Save to GameResult collection
    const gameResult = await GameResult.create({
      roomCode: room.code,
      difficulty: room.difficulty,
      timeLimit: room.timeLimit,
      startedAt: room.startedAt ? new Date(room.startedAt) : null,
      endedAt: new Date(),
      players: results.map(r => ({ username: r.name, wpm: r.wpm, accuracy: r.accuracy, finished: r.finished, finishTime: r.finishTime || null })),
    });
    console.log('[Game End] GameResult saved:', gameResult._id);
    
    // Also persist to Leaderboard per player with mode 'multiplayer'
    const docs = results
      .filter(r => r.role !== 'spectator' && r.finished)
      .map(r => ({ 
        username: r.name, 
        wpm: typeof r.wpm === 'number' ? r.wpm : 0, 
        accuracy: typeof r.accuracy === 'number' ? r.accuracy : 0, 
        finishTime: typeof r.finishTime === 'number' ? r.finishTime : null,
        mode: 'multiplayer' 
      }))
      .filter(doc => doc.wpm >= 0 && doc.accuracy >= 0 && doc.accuracy <= 100);
    
    if (docs.length > 0) {
      const saved = await Leaderboard.insertMany(docs, { ordered: false });
      console.log('[Game End] Leaderboard entries saved:', saved.length, 'for players:', docs.map(d => d.username));
    } else {
      console.warn('[Game End] No valid leaderboard entries to save (all spectators or invalid data)');
    }

    // Award XP to players
    for (let i = 0; i < results.length; i++) {
      const player = results[i];
      if (player.userId && player.role !== 'spectator' && player.finished) {
        const rank = i + 1;
        const playerSocket = Array.from(ioRef.sockets.sockets.values()).find(
          s => s.user?.id === player.userId
        );
        
        try {
          await addXpForUser(
            player.userId,
            {
              mode: 'multiplayer',
              wpm: player.wpm || 0,
              accuracy: player.accuracy || 0,
              rank,
            },
            ioRef,
            playerSocket?.id
          );
          console.log(`[Game End] XP awarded to player ${player.name} (rank ${rank})`);
        } catch (xpErr) {
          console.error(`[Game End] Failed to award XP to ${player.name}:`, xpErr);
        }
      }
    }
  } catch (e) {
    console.error('[Game End] Failed to save result:', e);
    console.error('[Game End] Error stack:', e.stack);
  }

  // notify and cleanup
  room.status = 'results';
  ioRef.to(room.code).emit('game:ended', payload);
  ioRef.to(room.code).emit('gameResults', { roomCode: room.code, ...payload });
  ioRef.to(room.code).emit('room:state', serializeRoom(room));
  
  // Auto-delete room after 5 minutes
  setTimeout(() => {
    const rooms = getRooms();
    const stillExists = rooms.get(room.code);
    if (stillExists && stillExists.status === 'results') {
      console.log(`[Game End] Auto-deleting room ${room.code} after 5 minutes`);
      deleteRoom(room.code);
      ioRef.to(room.code).emit('room:closed');
    }
  }, 5 * 60 * 1000);
}

function registerGameHandlers(socket, io) {
  ioRef = io;
  const rooms = getRooms();

  socket.on('game:start', ({ code }, cb) => {
    const room = rooms.get(code);
    if (!room) return cb && cb({ error: 'Room not found' });
    if (socket.id !== room.hostId) return cb && cb({ error: 'Only host can start the game' });
    if (room.startedAt) return cb && cb({ error: 'Already started' });
    
    const isZenMode = room.modifiers && room.modifiers.includes('zen');
    
    room.status = 'race';
    room.startedAt = now();
    room.endsAt = isZenMode ? room.startedAt + (365 * 24 * 60 * 60 * 1000) : room.startedAt + room.timeLimit * 1000;
    
    io.to(code).emit('room:state', serializeRoom(room));
    
    console.log('[Game Start] Starting race:', code, 'Text length:', room.text?.length, 'Modifiers:', room.modifiers);
    io.to(code).emit('game:started', { 
      roomCode: code, 
      text: room.text, 
      startedAt: room.startedAt, 
      endsAt: room.endsAt, 
      modifiers: room.modifiers || [],
      teamMode: room.teamMode || false,
      isCustomText: room.isCustomText || false,
      difficulty: room.difficulty || 'easy'
    });
    
    cb && cb({ ok: true });
    
    if (!isZenMode) {
      setTimeout(() => {
        const live = rooms.get(code);
        if (live && live.endsAt && now() >= live.endsAt) endGame(live, 'time');
      }, room.timeLimit * 1000 + 50);
    }
  });

  socket.on('game:rematch', ({ code }, cb) => {
    const room = rooms.get(code);
    if (!room) return cb && cb({ error: 'Room not found' });
    if (socket.id !== room.hostId) return cb && cb({ error: 'Only host can start rematch' });
    if (room.status !== 'results') return cb && cb({ error: 'Can only rematch after game ends' });
    
    console.log('[Rematch] Starting rematch for room:', code);
    
    let newText;
    if (room.isCustomText && room.text) {
      newText = room.text;
    } else {
      const finalWordCount = (room.modifiers && room.modifiers.includes('sprint')) ? 15 : room.wordCount;
      newText = finalWordCount ? makeTextFromWords(finalWordCount) : getTextByDifficulty(room.difficulty || 'easy');
    }
    room.text = newText;
    
    for (const player of room.players.values()) {
      player.progress = 0;
      player.wpm = 0;
      player.accuracy = 100;
      player.finished = false;
      player.finishedAt = null;
      player.finishTime = null;
      player.wpmHistory = [];
      player.mistakes = 0;
    }
    
    const isZenMode = room.modifiers && room.modifiers.includes('zen');
    
    room.status = 'race';
    room.startedAt = now();
    room.endsAt = isZenMode ? room.startedAt + (365 * 24 * 60 * 60 * 1000) : room.startedAt + room.timeLimit * 1000;
    
    console.log('[Rematch] New text generated, length:', newText.length, 'Modifiers:', room.modifiers);
    
    io.to(code).emit('room:state', serializeRoom(room));
    io.to(code).emit('game:started', { 
      roomCode: code, 
      text: room.text, 
      startedAt: room.startedAt, 
      endsAt: room.endsAt, 
      modifiers: room.modifiers || [],
      teamMode: room.teamMode || false,
      isCustomText: room.isCustomText || false,
      difficulty: room.difficulty || 'easy'
    });
    cb && cb({ ok: true });
    
    if (!isZenMode) {
      setTimeout(() => {
        const live = rooms.get(code);
        if (live && live.endsAt && now() >= live.endsAt) endGame(live, 'time');
      }, room.timeLimit * 1000 + 50);
    }
  });

  socket.on('game:progress', ({ code, typed, elapsedMs, keystrokeTimestamps, pasteEvents }, cb) => {
    const room = rooms.get(code);
    if (!room) return cb && cb({ error: 'Room not found' });
    const player = room.players.get(socket.id);
    if (!player || player.role === 'spectator') return;
    if (!room.startedAt) return;
    
    // Rate limiting: prevent spam updates (Issue #5)
    const playerKey = `${code}:${socket.id}`;
    const lastUpdate = playerProgressTimestamps.get(playerKey) || 0;
    const currentTime = now();
    if (currentTime - lastUpdate < PROGRESS_RATE_LIMIT_MS) {
      return cb && cb({ ok: true, throttled: true });
    }
    playerProgressTimestamps.set(playerKey, currentTime);
    
    const target = room.text;
    
    // Server-side elapsed time validation (Issue #9)
    const serverElapsed = now() - room.startedAt;
    const clientElapsed = elapsedMs || serverElapsed;
    // Allow 2 second tolerance for network latency, but use server time if client is too far off
    const elapsed = Math.abs(clientElapsed - serverElapsed) > 2000 ? serverElapsed : clientElapsed;
    
    // Calculate correct characters for WPM (Issue #4 - consistency with practice mode)
    let correctChars = 0;
    for (let i = 0; i < typed.length && i < target.length; i++) {
      if (typed[i] === target[i]) correctChars++;
    }
    
    const accuracy = calcAccuracy(typed, target);
    const minutes = Math.max(0.001, elapsed / 60000);
    // Use correct characters for WPM calculation (consistent with practice mode)
    const wpm = Math.round((correctChars / 5) / minutes);
    
    // Ensure progress doesn't exceed 100% (Issue #10)
    const typedLength = Math.min(typed.length, target.length);
    const progress = Math.min(100, Math.round((typedLength / target.length) * 100));
    
    // Track mistakes for sudden death mode
    if (room.modifiers && room.modifiers.includes('sudden-death')) {
      let mistakeCount = 0;
      for (let i = 0; i < typed.length && i < target.length; i++) {
        if (typed[i] !== target[i]) mistakeCount++;
      }
      if (typed.length > target.length) {
        mistakeCount += (typed.length - target.length);
      }
      player.mistakes = mistakeCount;
      
      const limit = room.suddenDeathLimit || 1;
      
      console.log(`[Sudden Death] Player: ${player.name}, Mistakes: ${mistakeCount}, Limit: ${limit}`);
      
      if (mistakeCount >= limit) {
        console.log(`[Sudden Death] Eliminating player ${player.name}`);
        const msg = { name: 'System', text: `${player.name} was eliminated (${mistakeCount} mistake${mistakeCount > 1 ? 's' : ''})`, ts: Date.now(), system: true };
        room.chat.push(msg);
        if (room.chat.length > 200) room.chat.shift();
        io.to(code).emit('chat:message', msg);
        socket.emit('playerEliminated', { reason: `Exceeded mistake limit (${limit})` });
        socket.leave(code);
        room.players.delete(socket.id);
        playerProgressTimestamps.delete(playerKey);
        
        if (socket.id === room.hostId) {
          const newHost = assignNewHost(room);
          if (newHost) {
            const hostMsg = { name: 'System', text: `${newHost.name} is now the host`, ts: Date.now(), system: true };
            room.chat.push(hostMsg);
            if (room.chat.length > 200) room.chat.shift();
            io.to(code).emit('chat:message', hostMsg);
          }
        }
        
        if (room.players.size === 0) {
          io.to(code).emit('room:closed');
          deleteRoom(code);
        } else {
          io.to(code).emit('room:state', serializeRoom(room));
        }
        return cb && cb({ ok: true, eliminated: true });
      }
    }
    
    player.wpm = wpm;
    player.accuracy = accuracy;
    player.progress = progress;
    player.finished = progress >= 100;
    
    // Track finish time when player completes (with validation - Issue #6)
    if (player.finished && !player.finishedAt) {
      player.finishedAt = now();
      const rawFinishTime = (player.finishedAt - room.startedAt) / 1000;
      // Validate finish time is realistic (Issue #6)
      player.finishTime = rawFinishTime >= MIN_FINISH_TIME_SECONDS 
        ? Math.round(rawFinishTime * 10) / 10 
        : MIN_FINISH_TIME_SECONDS;
    }
    
    // Enhanced Anti-cheat (Issue #2 - applies to ALL players including host, Issue #8 - improved thresholds)
    try {
      let suspicious = false;
      let suspiciousReason = '';
      
      // Check for paste events
      if (typeof pasteEvents === 'boolean' && pasteEvents) {
        suspicious = true;
        suspiciousReason = 'paste detected';
      }
      
      // Check for unrealistic WPM (Issue #3, #8)
      if (wpm > MAX_REALISTIC_WPM) {
        suspicious = true;
        suspiciousReason = `WPM too high (${wpm} > ${MAX_REALISTIC_WPM})`;
      }
      
      // Check keystroke timing (Issue #8 - improved threshold)
      if (Array.isArray(keystrokeTimestamps) && keystrokeTimestamps.length > 10) {
        let sum = 0, count = 0;
        for (let i = 1; i < keystrokeTimestamps.length; i++) {
          const dt = keystrokeTimestamps[i] - keystrokeTimestamps[i - 1];
          if (dt > 0 && dt < 2000) { sum += dt; count++; }
        }
        const avg = count ? (sum / count) : null;
        if (avg !== null && avg < MIN_KEYSTROKE_AVG_MS) {
          suspicious = true;
          suspiciousReason = `keystroke timing too fast (avg ${Math.round(avg)}ms < ${MIN_KEYSTROKE_AVG_MS}ms)`;
        }
      }
      
      const prevStatus = player.cheatStatus || 'verified';
      player.cheatStatus = suspicious ? 'suspicious' : 'verified';
      
      // Issue #2: Apply anti-cheat to ALL players (including host)
      if (player.cheatStatus !== prevStatus && player.cheatStatus === 'suspicious') {
        console.warn(`[anti-cheat] Suspicious activity detected: ${player.name} in ${code} - ${suspiciousReason}`);
        
        // Mark player as suspicious but don't auto-kick host (they can still be flagged)
        const isHost = socket.id === room.hostId;
        if (!isHost) {
          socket.emit('playerKicked', { username: player.name, reason: `Anti-cheat: ${suspiciousReason}` });
          const msg = { name: 'System', text: `${player.name} was removed for unfair play.`, ts: Date.now(), system: true };
          room.chat.push(msg);
          if (room.chat.length > 200) room.chat.shift();
          io.to(code).emit('chat:message', msg);
          socket.leave(code);
          room.players.delete(socket.id);
          playerProgressTimestamps.delete(playerKey);
          if (room.players.size === 0) {
            io.to(code).emit('room:closed');
            deleteRoom(code);
          } else {
            io.to(code).emit('room:state', serializeRoom(room));
          }
          return cb && cb({ ok: true });
        } else {
          // Host is flagged but not kicked - their results will show as suspicious
          const msg = { name: 'System', text: `Warning: Host ${player.name}'s activity flagged as suspicious.`, ts: Date.now(), system: true };
          room.chat.push(msg);
          if (room.chat.length > 200) room.chat.shift();
          io.to(code).emit('chat:message', msg);
        }
      }
    } catch (err) {
      console.error('[game.js] Anti-cheat detection error:', err?.message || err);
    }
    
    // Track WPM history
    try {
      const tSec = Math.max(0, Math.floor(elapsed / 1000));
      const hist = player.wpmHistory || (player.wpmHistory = []);
      const last = hist[hist.length - 1];
      if (!last || last.time !== tSec) hist.push({ time: tSec, wpm });
      else last.wpm = wpm;
      io.to(code).emit('wpmUpdate', { playerId: socket.id, wpm, time: tSec });
    } catch (err) {
      console.error('[game.js] WPM history tracking error:', err?.message || err);
    }
    
    io.to(code).emit('room:state', serializeRoom(room));
    if (player.finished) finishIfDone(room);
    cb && cb({ ok: true });
  });

  // Alias for progress updates
  socket.on('progressUpdate', ({ roomCode, typed, elapsedMs, keystrokeTimestamps, pasteEvents }, cb) => {
    if (!roomCode) return cb && cb({ error: 'Room not found' });
    socket.emit('game:progress', { 
      code: roomCode, 
      typed: typed || '', 
      elapsedMs, 
      keystrokeTimestamps, 
      pasteEvents 
    }, cb);
  });
}

module.exports = { registerGameHandlers, endGame, setIo };

