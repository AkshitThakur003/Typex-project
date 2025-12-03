import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';
import Race from '../components/multiplayer/Race.jsx';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
const WS_BASE = API_BASE;

export default function MultiplayerRace() {
  const { roomCode } = useParams();
  const nav = useNavigate();
  const { state } = useLocation();
  const [socket, setSocket] = useState(null);
  const [input, setInput] = useState('');
  const keystrokesRef = useRef([]);
  const pastedRef = useRef(false);
  const [startedAt, setStartedAt] = useState(null);
  const [endsAt, setEndsAt] = useState(null);
  const [messages, setMessages] = useState([]);
  const [room, setRoom] = useState({ code: roomCode, text: state?.text });
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const url = WS_BASE; // connect directly to backend to avoid proxy WS resets
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
      // auto-rejoin race room
      s.emit('room:join', { code: roomCode, spectator: false }, () => {});
    });
    s.on('connect_error', (e) => console.warn('socket error', e?.message));
    s.on('room:state', (r) => setRoom(r));
    s.on('game:started', ({ startedAt, endsAt, text }) => {
      setInput('');
      setStartedAt(startedAt);
      setEndsAt(endsAt);
      setRoom((prev) => (prev ? { ...prev, text: text ?? prev.text } : prev));
      setGameStarted(true);
    });
    // countdown removed
    s.on('gameResults', (payload) => {
      nav(`/results/${roomCode}`, { state: payload });
    });
    s.on('chat:message', (msg) => setMessages((prev) => [...prev, msg]));
    s.on('playerKicked', ({ username, reason }) => {
      nav('/', { state: { kicked: true, reason: reason || 'You have been removed due to suspicious activity.' } });
    });
  return () => s.disconnect();
  }, [roomCode, nav]);

  const progress = useMemo(() => {
    if (!room?.text) return 0;
    let i = 0;
    while (i < input.length && input[i] === room.text[i]) i++;
    return Math.round((i / room.text.length) * 100);
  }, [input, room]);

  useEffect(() => {
    if (!socket || !startedAt) return;
    const elapsedMs = Date.now() - startedAt;
    socket.emit('progressUpdate', {
      roomCode,
      typed: input,
      elapsedMs,
      keystrokeTimestamps: keystrokesRef.current,
      pasteEvents: !!pastedRef.current,
    }, () => {});
  }, [input, startedAt, socket, roomCode]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start landscape-compact">
      <div className="xl:col-span-2 order-1">
        <Race
          room={room}
          text={room?.text || state?.text || ''}
          input={input}
          onInputChange={(val, telemetry) => {
            if (telemetry?.keystrokeTimestamps) keystrokesRef.current = telemetry.keystrokeTimestamps;
            if (telemetry?.pasteEvents) pastedRef.current = true;
            setInput(val);
          }}
          progress={progress}
          startedAt={startedAt}
          endsAt={endsAt}
          isSpectator={false}
          isTyping={gameStarted}
        />
      </div>
      <div className="xl:col-span-1 order-2 landscape-hide">
        <ChatBox messages={messages} onSend={(text) => socket?.emit('chat:send', { code: roomCode, text })} disabled={!roomCode} />
      </div>
    </div>
  );
}
