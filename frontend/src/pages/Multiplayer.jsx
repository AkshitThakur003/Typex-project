import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { AnimatePresence, motion as m } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { usePreferences } from '../settings/PreferencesContext.jsx';
import { LoginOverlay } from '../components/auth';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
// Modular Multiplayer Components
import Lobby from '../components/multiplayer/Lobby.jsx';
import Room from '../components/multiplayer/Room.jsx';
import Race from '../components/multiplayer/Race.jsx';
import Results from '../components/multiplayer/Results.jsx';
import Invites from '../components/multiplayer/Invites.jsx';
// ChatBox removed from race/results views; chat now lives only in Room.jsx

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
const WS_BASE = API_BASE;

// Connection status component
function ConnectionStatus({ status }) {
  if (status === 'connected') return null;
  
  return (
    <m.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium shadow-lg ${
        status === 'reconnecting' 
          ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400'
          : 'bg-red-500/20 border border-red-500/30 text-red-400'
      }`}
    >
      {status === 'reconnecting' ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Reconnecting...
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          Disconnected
        </>
      )}
    </m.div>
  );
}

export default function Multiplayer() {
  const { width, height } = useWindowSize();
  const { user, isAuthenticated } = usePreferences();
  const [socket, setSocket] = useState(null);
  // available rooms feature removed
  const [room, setRoom] = useState(null); // current room state
  const [code, setCode] = useState('');
  const [messages, setMessages] = useState([]); // chat messages for current room
  const [input, setInput] = useState(''); // typing input for race
  const [uiState, setUiState] = useState('lobby'); // 'lobby' | 'room' | 'race' | 'results'
  // race state
  const [startedAt, setStartedAt] = useState(null);
  const [endsAt, setEndsAt] = useState(null);
  const [ended, setEnded] = useState(null);
  const [wpmData, setWpmData] = useState({}); // { [playerId]: [{ time, wpm }] }
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]); // Array of usernames currently typing
  const typingGlowTimer = useRef(null);
  // Track previous players to emit accurate join/leave toasts
  const prevPlayersRef = useRef(new Map()); // id -> name
  const hasSeenPlayersRef = useRef(false);
  const winnerToastShownRef = useRef(false);
  // Room invites
  const [invites, setInvites] = useState([]); // Array of pending room invites
  // Connection status
  const [connectionStatus, setConnectionStatus] = useState('connected'); // 'connected' | 'reconnecting' | 'disconnected'
  // Socket ref to prevent memory leaks
  const socketRef = useRef(null);

  // Auto-expire old invites (older than 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setInvites(prev => prev.filter(inv => {
        const age = now - (inv.receivedAt || 0);
        return age < 5 * 60 * 1000; // 5 minutes
      }));
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // central socket initializer (re)runs when auth state changes
  useEffect(() => {
    // With cookie-based auth, we check if user is authenticated via the user state
    // instead of checking localStorage for token
    if (!isAuthenticated) {
      // ensure no stale socket when logged out - clean up properly
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
      setInvites([]); // Clear invites on logout
      setConnectionStatus('disconnected');
      return;
    }
    
    // Clean up existing socket before creating new one (prevents memory leaks)
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
    }
    
    const url = WS_BASE;
    const s = io(url, {
      path: '/socket.io',
      // Tokens are now in httpOnly cookies, which are sent automatically
      // No need to pass token in auth object - backend will read from cookies
      withCredentials: true, // Send cookies with socket.io requests
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 2000,
      timeout: 10000,
    });
    
    socketRef.current = s;
    setSocket(s);
    
    // Connection status handlers
    s.on('connect', () => {
      console.log('socket connected');
      setConnectionStatus('connected');
      // auto-rejoin current room after reconnect
      if (room?.code) {
        s.emit('room:join', { code: room.code, spectator: false }, () => {});
      }
    });
    
    s.on('disconnect', (reason) => {
      console.log('socket disconnected:', reason);
      if (reason === 'io server disconnect' || reason === 'io client disconnect') {
        setConnectionStatus('disconnected');
      } else {
        setConnectionStatus('reconnecting');
      }
    });
    
    s.on('reconnect_attempt', (attempt) => {
      console.log('reconnect attempt:', attempt);
      setConnectionStatus('reconnecting');
    });
    
    s.on('reconnect', () => {
      console.log('socket reconnected');
      setConnectionStatus('connected');
      toast.success('Reconnected!');
    });
    
    s.on('reconnect_failed', () => {
      console.log('reconnect failed');
      setConnectionStatus('disconnected');
      toast.error('Connection lost. Please refresh the page.');
    });
    
    s.on('connect_error', (err) => {
      if (String(err?.message || '').toLowerCase().includes('unauthorized')) {
        toast.error('Please log in to play Multiplayer');
        setConnectionStatus('disconnected');
      }
    });
    // Room state
    s.on('room:state', (state) => {
      // Diff players for join/leave toasts using a ref to avoid stale closures
      if (Array.isArray(state?.players)) {
        const prevMap = prevPlayersRef.current; // id -> name
        const nextMap = new Map();
        state.players.forEach((p) => nextMap.set(p.id, p.name));

        if (hasSeenPlayersRef.current) {
          // Joined: present in next, not in prev
          for (const [id, name] of nextMap) {
            if (!prevMap.has(id)) toast.success(`🔥 ${name} joined`);
          }
          // Left: present in prev, not in next
          for (const [id, name] of prevMap) {
            if (!nextMap.has(id)) toast(`👋 ${name} left`, { icon: '👋' });
          }
        }
        prevPlayersRef.current = nextMap;
        hasSeenPlayersRef.current = true;
      }
      console.log('[Room State] Received:', { code: state?.code, textLength: state?.text?.length, modifiers: state?.modifiers, isCustomText: state?.isCustomText });
      setRoom(state);
      // UI state sync: lobby → room, race → race. Do NOT auto-switch to results here.
      if (state?.status === 'lobby') setUiState('room');
      if (state?.status === 'race') {
        setUiState('race');
        // Backfill timers if reconnecting mid-race
        if (state.startedAt && !startedAt) setStartedAt(state.startedAt);
        if (state.endsAt && !endsAt) setEndsAt(state.endsAt);
      }
    });
    s.on('room:closed', () => {
      toast('Room closed');
      setRoom(null);
      setUiState('lobby');
      // Clear any invites for closed rooms
      setInvites(prev => prev.filter(inv => {
        // Keep invites that are still valid (not for closed room)
        return true; // We'll filter by checking if room still exists when accepting
      }));
    });
    // Start instantly: switch to race on game:started
    s.on('game:started', ({ startedAt, endsAt, text, modifiers, teamMode, isCustomText, difficulty }) => {
      console.log('[Game Started] Received:', { textLength: text?.length, modifiers, teamMode, isCustomText, difficulty });
      setInput('');
      setEnded(null);
      setStartedAt(startedAt);
      setEndsAt(endsAt);
      winnerToastShownRef.current = false;
      // Preserve all room properties including modifiers, teamMode, isCustomText, difficulty
      // Prioritize text from game:started event as it's the authoritative source
      setRoom((prev) => {
        if (prev) {
          const updatedRoom = {
            ...prev,
            text: (text !== undefined && text !== null) ? text : prev.text, // Use text from event if provided, otherwise keep previous
            modifiers: Array.isArray(modifiers) ? modifiers : (prev.modifiers || []), // Ensure modifiers is always an array
            teamMode: teamMode !== undefined ? teamMode : prev.teamMode,
            isCustomText: isCustomText !== undefined ? isCustomText : prev.isCustomText,
            difficulty: difficulty || prev.difficulty
          };
          console.log('[Game Started] Updated room:', { textLength: updatedRoom.text?.length, modifiers: updatedRoom.modifiers, teamMode: updatedRoom.teamMode, isCustomText: updatedRoom.isCustomText });
          return updatedRoom;
        }
        // Fallback: if room state doesn't exist yet, create minimal room object
        // This shouldn't happen normally as room:state is emitted first, but handle edge case
        console.warn('[Game Started] No previous room state found!');
        return prev;
      });
      setUiState('race');
    });
    // End of race → only here move to results
    s.on('game:ended', (payload) => {
      if (!winnerToastShownRef.current) {
        toast.success(`🏆 Winner: ${payload?.winner?.name || 'N/A'}`);
        winnerToastShownRef.current = true;
      }
      setEnded(payload);
      setUiState('results');
      
      // Trigger leaderboard/profile refresh after multiplayer race ends
      // Results are saved server-side, so we need to notify frontend to refresh
      window.dispatchEvent(new CustomEvent('leaderboard-updated'));
    });
    // Store results payload if provided; seed wpm history
    s.on('gameResults', (data) => {
      try {
        if (Array.isArray(data?.results)) {
          const seed = {};
          data.results.forEach((r) => {
            if (r.id && Array.isArray(r.wpmHistory)) seed[r.id] = r.wpmHistory;
          });
          if (Object.keys(seed).length) setWpmData((prev) => ({ ...prev, ...seed }));
        }
      } catch (err) {
        console.error('[Multiplayer] Error processing game results:', err);
      }
      setEnded((prev) => prev ?? data);
      
      // Trigger leaderboard/profile refresh after multiplayer race ends
      // Results are saved server-side, so we need to notify frontend to refresh
      window.dispatchEvent(new CustomEvent('leaderboard-updated'));
    });
    // Live WPM updates
    s.on('wpmUpdate', ({ playerId, wpm, time }) => {
      if (!playerId) return;
      setWpmData((prev) => ({
        ...prev,
        [playerId]: [ ...(prev[playerId] || []), { time, wpm } ],
      }));
    });
    // Chat
    s.on('chat:message', (msg) => setMessages((prev) => [...prev, msg]));
    
    // Typing indicator
    s.on('chat:typing:update', ({ typingUsers: users }) => {
      setTypingUsers(users || []);
    });
    
    // XP gain events
    s.on('xp:gain', (data) => {
      console.log('[Multiplayer] XP gained:', data);
      // Dispatch custom event for XpToast
      window.dispatchEvent(new CustomEvent('xp:gain', { detail: data }));
    });
    
    // Friend online status
    s.on('friend:online', ({ userId, username }) => {
      // You can add friend online status tracking here
      // For now, just show a toast
      toast(`🟢 ${username} is now online`, { duration: 3000 });
    });
    s.on('friend:offline', ({ userId }) => {
      // Handle friend offline
    });
    s.on('friends:status', ({ online }) => {
      // Store online friends list if needed
    });
    
    // Request friend status on connect
    if (user?.id) {
      s.emit('friend:status');
    }
    
    // Kicked handling
    s.on('playerKicked', ({ username, reason }) => {
      // If this client is kicked, show friendly message and return to lobby
      toast((t) => (
        <div className="text-sm">
          <div className="font-semibold">You have been removed</div>
          <div className="text-slate-300">{reason || 'Suspicious activity detected'}</div>
        </div>
      ), { duration: 4000 });
      setRoom(null);
      setUiState('lobby');
      setInput('');
      setEnded(null);
    });
    
    // Eliminated handling (sudden death)
    s.on('playerEliminated', ({ reason }) => {
      toast.error(`💀 You were eliminated! ${reason || 'Exceeded mistake limit'}`);
      setRoom(null);
      setUiState('lobby');
      setInput('');
      setEnded(null);
    });

    // Room invite received
    s.on('room:invite:received', (invite) => {
      console.log('[Multiplayer] Received invite:', invite);
      const inviteWithId = {
        ...invite,
        id: `${invite.roomCode}-${invite.hostId}-${Date.now()}`, // Unique ID for the invite
        receivedAt: Date.now(),
      };
      setInvites(prev => {
        // Remove any existing invite for the same room
        const filtered = prev.filter(inv => inv.roomCode !== invite.roomCode);
        return [...filtered, inviteWithId];
      });
      
      // Show toast notification with theme matching
      toast((t) => (
        <div className="bg-slate-900/95 backdrop-blur-md border border-emerald-500/30 rounded-lg p-4 shadow-lg shadow-emerald-500/20 min-w-[320px]">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 flex items-center justify-center text-xl">
              🎮
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-base font-bold text-emerald-400 mb-1">Room Invite!</div>
              <div className="text-sm text-slate-200 mb-1">
                <span className="font-semibold text-white">{invite.hostName}</span> invited you
              </div>
              <div className="text-xs text-slate-400 font-mono bg-slate-800/50 px-2 py-1 rounded border border-slate-700/50 inline-block mt-1">
                {invite.roomName || 'Untitled Room'} • {invite.roomCode}
              </div>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="flex-shrink-0 text-slate-400 hover:text-slate-200 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      ), { 
        duration: 6000,
        style: {
          background: 'transparent',
          boxShadow: 'none',
          padding: 0,
        },
      });
    });

    return () => s?.disconnect?.();
    // reinit when auth state changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const progress = useMemo(() => {
    if (!room?.text) return 0;
    let i = 0;
    while (i < input.length && input[i] === room.text[i]) i++;
    return Math.round((i / room.text.length) * 100);
  }, [input, room]);

  useEffect(() => {
    if (socket && room?.code && startedAt) {
      const elapsedMs = Date.now() - startedAt;
      const minutes = Math.max(1 / 60, elapsedMs / 60000);
      const wpm = Math.round((input.length / 5) / minutes);
      socket.emit('game:progress', { code: room.code, typed: input, elapsedMs });
    }
  }, [input, startedAt]);

  const myRole = useMemo(() => room?.players?.find((p) => p.id === socket?.id)?.role, [room, socket]);
  const isSpectator = myRole === 'spectator';
  const isHost = room?.players?.find((p) => p.id === socket?.id)?.role === 'host';
  // Subtle typing glow feedback (used by RaceTrack input)
  const lastTelemetry = useRef({});
  const handleTyping = (val, telemetry) => {
    if (telemetry) lastTelemetry.current = telemetry;
    setInput(val);
    setIsTyping(true);
    if (typingGlowTimer.current) clearTimeout(typingGlowTimer.current);
    typingGlowTimer.current = setTimeout(() => setIsTyping(false), 180);
  };
  function createRoom(options = {}) {
    if (!socket) return;
    const { wordCount, roomName, modifiers, customText, teamMode, difficulty, timeLimit } = options;
    console.log('[Multiplayer createRoom] Sending to backend:', { wordCount, modifiers, customText, teamMode, difficulty, timeLimit });
    socket.emit('room:create', {
      name: user?.username,
      wordCount,
      roomName,
      modifiers: modifiers || [],
      customText: customText || null,
      teamMode: teamMode || false,
      difficulty: difficulty || 'easy',
      timeLimit: timeLimit || 60,
    }, (roomData) => {
      if (roomData.error) return toast.error(roomData.error);
      const { code, ...roomState } = roomData;
      console.log('[Room Create Callback] Received room state:', { code, textLength: roomState.text?.length, modifiers: roomState.modifiers, isCustomText: roomState.isCustomText });
      setCode(code);
      setInput('');
      // Set room state immediately from creation response to ensure all properties are available (including text)
      setRoom(roomState);
      toast.success(`Room ${code} created`);
      // Auto-join created room
      socket.emit('room:join', { code, spectator: false }, ({ error: jerr }) => {
        if (jerr) return toast.error(jerr);
        toast.success(`Joined ${code}`);
        // load chat history
        socket.emit('chat:history', { code }, ({ history }) => setMessages(history || []));
      });
    });
  }

  function joinRoom(targetCode = code) {
    if (!targetCode) return toast.error('Enter room code');
    socket.emit('room:join', { code: targetCode, spectator: false }, ({ error }) => {
      if (error) return toast.error(error);
      setInput('');
      setCode(targetCode);
      // Clear invites for the room we just joined
      setInvites(prev => prev.filter(inv => inv.roomCode !== targetCode));
      toast.success(`Joined ${targetCode}`);
      socket.emit('chat:history', { code: targetCode }, ({ history }) => setMessages(history || []));
    });
  }

  function spectateRoom(targetCode = code) {
    const upper = (targetCode || '').toUpperCase();
    if (!upper) return toast.error('Enter room code');
    if (!socket) return toast.error('Please log in to spectate');
    socket.emit('room:join', { code: upper, spectator: true }, ({ error }) => {
      if (error) return toast.error(error);
      setInput('');
      setCode(upper);
      toast.success(`Spectating ${upper}`);
      socket.emit('chat:history', { code: upper }, ({ history }) => setMessages(history || []));
    });
  }

  function startGame() {
    if (!room?.code) return;
    socket.emit('game:start', { code: room.code }, (resp) => {
      if (resp?.error) {
        toast.error(resp.error);
      }
    });
  }

  function quickRematch() {
    if (!room?.code || !socket) return;
    console.log('[Quick Rematch] Requesting rematch for room:', room.code);
    socket.emit('game:rematch', { code: room.code }, (resp) => {
      if (resp?.error) {
        console.error('[Quick Rematch] Error:', resp.error);
        toast.error(resp.error);
      } else {
        console.log('[Quick Rematch] Rematch started successfully');
        toast.success('Rematch starting!');
        // Reset local state
        setInput('');
        setEnded(null);
        setStartedAt(null);
        setEndsAt(null);
        setWpmData({});
        winnerToastShownRef.current = false;
        // The game:started event will switch UI to race state
      }
    });
  }

  function handleAcceptInvite(invite) {
    if (!socket) return;
    // Remove all invites for this room
    setInvites(prev => prev.filter(inv => inv.roomCode !== invite.roomCode));
    // Join the room
    joinRoom(invite.roomCode);
    toast.success(`Joined ${invite.roomName || invite.roomCode}!`);
  }

  function handleDeclineInvite(invite) {
    setInvites(prev => prev.filter(inv => inv.id !== invite.id));
    toast(`Declined invite from ${invite.hostName}`);
  }

  // optional: future chat wiring if server adds it
  function sendChat(text) {
    if (!socket || !room?.code) return;
    socket.emit('chat:send', { code: room.code, text }, () => {});
  }

  // Host control functions
  function handleLockRoom() {
    if (!socket || !room?.code) return;
    const isHost = room?.players?.find((p) => p.id === socket?.id)?.role === 'host';
    if (!isHost) return;
    const newLockState = !room.isLocked;
    socket.emit('room:lock', { code: room.code, lock: newLockState }, ({ error, isLocked }) => {
      if (error) {
        toast.error(error);
      } else {
        toast.success(`Room ${isLocked ? 'locked' : 'unlocked'}`);
      }
    });
  }

  function handleKickPlayer(playerId) {
    if (!socket || !room?.code) return;
    const isHost = room?.players?.find((p) => p.id === socket?.id)?.role === 'host';
    if (!isHost) return;
    socket.emit('room:kick', { code: room.code, playerId }, ({ error }) => {
      if (error) {
        toast.error(error);
      }
    });
  }

  function handlePromoteHost(playerId) {
    if (!socket || !room?.code) return;
    const isHost = room?.players?.find((p) => p.id === socket?.id)?.role === 'host';
    if (!isHost) return;
    socket.emit('room:promote', { code: room.code, playerId }, ({ error }) => {
      if (error) {
        toast.error(error);
      } else {
        toast.success('Host role transferred');
      }
    });
  }

  function handleSetSuddenDeathLimit(limit) {
    if (!socket || !room?.code) return;
    const isHost = room?.players?.find((p) => p.id === socket?.id)?.role === 'host';
    if (!isHost) return;
    socket.emit('room:setSuddenDeathLimit', { code: room.code, limit }, ({ error, suddenDeathLimit }) => {
      if (error) {
        toast.error(error);
      } else if (suddenDeathLimit) {
        toast.success(`Sudden death limit set to ${suddenDeathLimit}`);
      }
    });
  }

  // Proper leave room handler that reuses socket instead of creating new one
  const handleLeaveRoom = useCallback(() => {
    if (!socket) return;
    const leavingRoomCode = room?.code;
    
    // Emit leave event instead of disconnecting
    socket.emit('room:leave', { code: leavingRoomCode });
    
    // Reset room state
    setRoom(null);
    setUiState('lobby');
    setMessages([]);
    setInput('');
    setEnded(null);
    setStartedAt(null);
    setEndsAt(null);
    
    // Clear invites for the room we left
    if (leavingRoomCode) {
      setInvites(prev => prev.filter(inv => inv.roomCode !== leavingRoomCode));
    }
    
    // Reset player tracking refs
    prevPlayersRef.current = new Map();
    hasSeenPlayersRef.current = false;
    winnerToastShownRef.current = false;
  }, [socket, room?.code]);

  const overlay = !isAuthenticated;
  const iAmWinner = ended?.winner?.name && (ended.winner.name === (user?.username || ''));

  return (
    <div className="relative max-w-7xl mx-auto p-4 space-y-6 md:space-y-8">
      {iAmWinner && <Confetti width={width} height={height} />}
      
      {/* Connection Status Indicator */}
      <AnimatePresence>
        {connectionStatus !== 'connected' && (
          <ConnectionStatus status={connectionStatus} />
        )}
      </AnimatePresence>

      <div className={overlay ? 'relative z-0 pointer-events-none brightness-50 transition-all duration-300' : ''}>
  <AnimatePresence mode="wait">
        {uiState === 'lobby' && (
          <m.div key="lobby" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-6">
            {/* Room Invites Section */}
            {invites.length > 0 && (
              <Invites
                invites={invites}
                onAccept={handleAcceptInvite}
                onDecline={handleDeclineInvite}
              />
            )}
            
            <Lobby
              onJoin={(code) => joinRoom(code)}
              onCreate={(options) => createRoom(options)}
              code={code}
              setCode={setCode}
              onSpectate={() => spectateRoom()}
              canStart={Boolean(room?.code && (room?.players?.length || 0) > 0)}
              isHost={room?.players?.find((p) => p.id === socket?.id)?.role === 'host'}
              onStart={startGame}
            />
          </m.div>
        )}
    {uiState === 'room' && (
          <m.div key="room" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <Room
              room={room}
              isHost={room?.players?.find((p) => p.id === socket?.id)?.role === 'host'}
              onStart={startGame}
              socket={socket}
              messages={messages}
              onSendMessage={sendChat}
              chatDisabled={!room?.code}
              typingUsers={typingUsers}
              onKickPlayer={handleKickPlayer}
              onPromoteHost={handlePromoteHost}
              onSetSuddenDeathLimit={handleSetSuddenDeathLimit}
              onLockRoom={handleLockRoom}
              onLeave={handleLeaveRoom}
            />
          </m.div>
        )}
        {uiState === 'race' && (
          <m.div key="race" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <div className="grid grid-cols-1 gap-4 items-start">
              <div className="col-span-1">
                <Race
                  room={room}
                  text={room?.text || ''}
                  input={input}
                  onInputChange={handleTyping}
                  progress={progress}
                  startedAt={startedAt}
                  endsAt={endsAt}
                  isSpectator={isSpectator}
                  isTyping={isTyping}
                />
              </div>
            </div>
          </m.div>
        )}
        {uiState === 'results' && (
          <m.div key="results" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <Results
              ended={ended}
              wpmData={wpmData}
              isHost={isHost}
              onQuickRematch={quickRematch}
              onPlayAgain={() => {
                // After end, server deletes the room; go back to lobby
                setInput('');
                setEnded(null);
                setStartedAt(null);
                setWpmData({});
                setRoom(null);
                setUiState('lobby');
              }}
              onBackToLobby={() => {
                setInput('');
                setEnded(null);
                setStartedAt(null);
                setWpmData({});
                setUiState('lobby');
              }}
            />
          </m.div>
        )}
  </AnimatePresence>
  </div>
  {/* Login modal overlay */}
  {overlay && <LoginOverlay onSuccess={() => { /* socket will auto-init via auth effect */ }} />}
    </div>
  );
}
