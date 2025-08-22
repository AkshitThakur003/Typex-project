import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { AnimatePresence, motion as m } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { usePreferences } from '../settings/PreferencesContext.jsx';
import LoginOverlay from '../components/LoginOverlay.jsx';
// Modular Multiplayer Components
import Lobby from '../components/multiplayer/Lobby.jsx';
import Room from '../components/multiplayer/Room.jsx';
import Race from '../components/multiplayer/Race.jsx';
import Results from '../components/multiplayer/Results.jsx';
// ChatBox removed from race/results views; chat now lives only in Room.jsx

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
const WS_BASE = API_BASE;

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
  const typingGlowTimer = useRef(null);
  // Track previous players to emit accurate join/leave toasts
  const prevPlayersRef = useRef(new Map()); // id -> name
  const hasSeenPlayersRef = useRef(false);
  const winnerToastShownRef = useRef(false);

  // central socket initializer (re)runs when auth state changes
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      // ensure no stale socket when logged out
      socket?.disconnect?.();
      setSocket(null);
      return;
    }
    const url = WS_BASE;
    const s = io(url, {
      path: '/socket.io',
      auth: { token },
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 2000,
      timeout: 10000,
    });
    setSocket(s);
  s.on('connect', () => {
      console.log('socket connected');
      // auto-rejoin current room after reconnect
      if (room?.code) {
    s.emit('room:join', { code: room.code, spectator: false }, () => {});
      }
    });
    s.on('connect_error', (err) => {
      if (String(err?.message || '').toLowerCase().includes('unauthorized')) {
        toast.error('Please log in to play Multiplayer');
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
    });
    // Start instantly: switch to race on game:started
    s.on('game:started', ({ startedAt, endsAt, text }) => {
      setInput('');
      setEnded(null);
      setStartedAt(startedAt);
      setEndsAt(endsAt);
  winnerToastShownRef.current = false;
      setRoom((prev) => (prev ? { ...prev, text: text ?? prev.text } : prev));
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
      } catch {}
      setEnded((prev) => prev ?? data);
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

    return () => s?.disconnect?.();
    // reinit when auth (user) changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!user]);

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
    socket.emit('room:create', options, ({ code, text, error }) => {
      if (error) return toast.error(error);
      setCode(code);
      setInput('');
      toast.success(`Room ${code} created`);
  // lastTelemetry initialized above; no-op effect removed
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

  // optional: future chat wiring if server adds it
  function sendChat(text) {
    if (!socket || !room?.code) return;
    socket.emit('chat:send', { code: room.code, text }, () => {});
  }

  const overlay = !isAuthenticated;
  const iAmWinner = ended?.winner?.name && (ended.winner.name === (user?.username || ''));
  return (
    <div className="relative max-w-7xl mx-auto p-4 space-y-6 md:space-y-8">
      {iAmWinner && <Confetti width={width} height={height} />}
      <div className={overlay ? 'relative z-0 pointer-events-none brightness-50 transition-all duration-300' : ''}>
  <AnimatePresence mode="wait">
        {uiState === 'lobby' && (
          <m.div key="lobby" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <Lobby
              onJoin={joinRoom}
              onCreate={({ wordCount, roomName }) => createRoom({ wordCount, roomName })}
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
              onLeave={() => {
                if (!socket) return;
                // server has no room:leave; disconnect to leave all rooms
                socket.disconnect();
                setRoom(null);
                setUiState('lobby');
                // create a fresh socket for lobby actions
                const s = io(WS_BASE, { transports: ['websocket'] });
                setSocket(s);
                s.on('room:state', (state) => {
                  setRoom(state);
                  if (state?.code) setUiState('room');
                });
                s.on('room:closed', () => {
                  toast('Room closed');
                  setRoom(null);
                  setUiState('lobby');
                });
                // Start instantly: switch to race on game:started
                s.on('game:started', ({ startedAt, endsAt, text }) => {
                  setInput('');
                  setEnded(null);
                  setStartedAt(startedAt);
                  setEndsAt(endsAt);
                  setRoom((prev) => (prev ? { ...prev, text: text ?? prev.text } : prev));
                  setUiState('race');
                });
                s.on('game:ended', (payload) => {
                  setEnded(payload);
                  setUiState('results');
                });
                s.on('gameResults', (data) => setEnded((prev) => prev ?? data));
              }}
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
