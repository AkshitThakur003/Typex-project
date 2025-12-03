// Room utility functions
const { getTextByDifficulty } = require('../../data/texts');
const { makeTextFromWords } = require('../../data/words');

const rooms = new Map();

function makeRoomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function now() { return Date.now(); }

function createRoom({ hostId, hostName, difficulty='easy', timeLimit=60, roomName = '', wordCount=null, hostUserId=null, modifiers=[], customText=null, teamMode=false }) {
  const code = makeRoomCode();
  
  let text;
  let isCustom = false;
  
  // Use custom text if provided and valid
  if (customText && typeof customText === 'string' && customText.trim().length >= 50 && customText.trim().length <= 500) {
    text = customText.trim();
    isCustom = true;
  } else {
    // Handle sprint modifier - override wordCount to 15
    const finalWordCount = (modifiers && modifiers.includes('sprint')) ? 15 : (wordCount && Number(wordCount) > 0 ? Number(wordCount) : null);
    
    // If wordCount is specified (or sprint mode), use word count. Otherwise use difficulty.
    if (finalWordCount) {
      text = makeTextFromWords(finalWordCount);
    } else {
      // Use difficulty to generate text
      text = getTextByDifficulty(difficulty || 'easy');
    }
  }
  
  const room = {
    code,
    text,
    difficulty: difficulty || 'easy',
    timeLimit: timeLimit || 60,
    roomName: roomName || '',
    wordCount: isCustom ? null : (modifiers && modifiers.includes('sprint')) ? 15 : (wordCount && Number(wordCount) > 0 ? Number(wordCount) : null),
    modifiers: Array.isArray(modifiers) ? modifiers : [],
    isCustomText: isCustom,
    teamMode: teamMode || false,
    suddenDeathLimit: 1,
    hostId,
    hostUserId,
    status: 'lobby',
    startedAt: null,
    endsAt: null,
    isLocked: false,
    players: new Map(),
    chat: [],
    typingUsers: new Map(),
  };
  room.players.set(hostId, { id: hostId, name: hostName || 'Host', role: 'host', progress: 0, wpm: 0, accuracy: 100, finished: false, wpmHistory: [], cheatStatus: 'verified', userId: hostUserId, team: null, mistakes: 0 });
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
    modifiers: room.modifiers || [],
    isCustomText: room.isCustomText || false,
    teamMode: room.teamMode || false,
    suddenDeathLimit: room.suddenDeathLimit || 1,
    hostId: room.hostId,
    status: room.status || 'lobby',
    startedAt: room.startedAt,
    endsAt: room.endsAt,
    isLocked: room.isLocked || false,
    players: [...room.players.values()].map(p => ({ id: p.id, name: p.name, role: p.role, progress: p.progress, wpm: p.wpm, accuracy: p.accuracy, finished: p.finished, cheatStatus: p.cheatStatus || 'verified', userId: p.userId, team: p.team || null })),
    spectators: [...room.players.values()].filter(p => p.role === 'spectator').map(p => ({ id: p.id, name: p.name })),
  };
}

function calcAccuracy(typed, target) {
  const n = Math.max(1, typed.length);
  let correct = 0;
  for (let i=0;i<typed.length;i++) {
    if (typed[i] === target[i]) correct++;
  }
  return Math.round((correct / n) * 100);
}

function getRoom(code) {
  return rooms.get(code);
}

function deleteRoom(code) {
  rooms.delete(code);
}

function getRooms() {
  return rooms;
}

module.exports = {
  rooms,
  makeRoomCode,
  now,
  createRoom,
  assignNewHost,
  serializeRoom,
  calcAccuracy,
  getRoom,
  deleteRoom,
  getRooms,
};

