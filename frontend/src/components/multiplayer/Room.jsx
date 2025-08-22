import { motion as m } from "framer-motion";
import PlayerList from "./PlayerList.jsx";
import { toast } from 'react-hot-toast';
import { useEffect, useRef, useState } from 'react';
import { Clipboard, Check } from 'lucide-react';
import { usePreferences } from '../../settings/PreferencesContext.jsx';
import Avatar from '../Avatar.jsx';

export default function Room({ room, isHost, onStart, onLeave, messages = [], onSendMessage, chatDisabled, socket }) {
  if (!room) return null;
  const host = room.players?.find((p) => p.id === room.hostId);
  const status = room.status || 'lobby';
  // Navigation is handled centrally in Multiplayer.jsx on game:starting
  const statusClass =
    status === 'race' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-600/40' :
    status === 'countdown' ? 'bg-amber-500/20 text-amber-300 border-amber-600/40' :
    status === 'results' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-600/40' :
    'bg-slate-700/40 text-slate-300 border-slate-600/40';

  const [copied, setCopied] = useState(false);
  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.code || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-6xl mx-auto p-6">
      {/* Header Card: Room Name + Code + Actions */}
      <m.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="w-full">
        <div className="bg-slate-900/70 backdrop-blur-md rounded-xl p-4 border border-slate-800">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
            {/* Left: Title + Code */}
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-semibold text-white">Room {room.roomName ? `· ${room.roomName}` : ''}</h1>
              <div className="flex items-center gap-2 text-slate-300 text-sm">
                <span className="opacity-80">Room Code:</span>
                <span className="font-mono tracking-widest text-white">{room.code}</span>
                <button
                  onClick={copyCode}
                  className="inline-flex items-center justify-center p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition"
                  aria-label="Copy room code"
                  title={copied ? 'Copied!' : 'Copy Code'}
                >
                  {copied ? <Check size={16} /> : <Clipboard size={16} />}
                </button>
                <span className={`text-xs ${copied ? 'text-emerald-400' : 'text-transparent'}`}>Copied!</span>
                <span aria-live="polite" className={`ml-2 text-[10px] px-2 py-0.5 rounded-full border ${statusClass}`}>{status.toUpperCase()}</span>
              </div>
              <p className="text-slate-400 text-sm">Host: <span className="text-slate-200 font-medium">{host?.name || '—'}</span></p>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 md:justify-end">
              {isHost ? (
                status === 'lobby' ? (
                  <button
                    onClick={onStart}
                    className="px-4 py-2 rounded-lg bg-emerald-600 text-black font-semibold hover:bg-emerald-500 transition"
                  >
                    🚀 Start Game
                  </button>
                ) : (
                  <span className="px-3 py-2 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 text-sm">
                    {status === 'countdown' ? 'Starting…' : status === 'race' ? 'Race live' : status}
                  </span>
                )
              ) : (
                status === 'lobby' ? (
                  <button
                    onClick={() => toast.error('Only the host can start the game')}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-white font-medium cursor-not-allowed opacity-70"
                    aria-disabled
                    title="Waiting for host"
                  >
                    ⏳ Waiting for host
                  </button>
                ) : (
                  <span className="px-3 py-2 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 text-sm">
                    {status === 'countdown' ? 'Starting…' : status === 'race' ? 'Race live' : status}
                  </span>
                )
              )}
              <button
                onClick={onLeave}
                className="px-4 py-2 rounded-lg border border-slate-600 text-slate-100 hover:border-red-400 hover:text-white transition"
              >
                ❌ Leave
              </button>
            </div>
          </div>
        </div>
      </m.div>

      {/* 2-column layout: Chat left, Players right */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2">
          {/* Inline Chat UI (bubble style) */}
          <InlineChat
            messages={messages}
            onSend={onSendMessage}
            disabled={chatDisabled}
          />
        </div>
        <div className="lg:col-span-1">
          <div className="max-h-[70vh] overflow-y-auto">
            <PlayerList players={room.players || []} />
          </div>
        </div>
      </div>

      {/* Animated Waiting Message (only in lobby for non-hosts) */}
      {!isHost && status === 'lobby' && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-slate-400 text-base"
        >
          ⏳ Waiting for host to start...
        </m.div>
      )}
    </div>
  );
}

// Inline chat component to keep changes local to Room.jsx
function InlineChat({ messages = [], onSend, disabled }) {
  const { user, preferences } = usePreferences();
  const [text, setText] = useState('');
  const endRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    // Auto-scroll to bottom on new messages
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSend?.(text);
    setText('');
  };

  const fmtTime = (ts) => {
    try {
      if (!ts) return '';
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="bg-slate-900/70 backdrop-blur-md rounded-xl border border-slate-800 shadow-lg overflow-hidden">
      {/* Messages scroll area */}
      <div
        ref={scrollRef}
        className="max-h-[60vh] overflow-y-auto p-3 sm:p-4 space-y-3"
        aria-live="polite"
      >
        {messages.map((msg, idx) => {
      const shade = idx % 2 === 0 ? 'bg-slate-800' : 'bg-slate-900';
      const isMe = user && msg?.name === user.username;
          return (
            <div key={idx} className="flex items-start gap-3 w-full">
              {/* Avatar */}
        <Avatar name={msg?.name || 'User'} size={32} isMe={Boolean(isMe)} />
              {/* Bubble */}
              <div className={`w-full md:max-w-[70%] ${shade} border border-slate-700/60 rounded-2xl px-3.5 py-2.5`}> 
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-slate-100 font-semibold truncate">{msg?.name || 'Anon'}</div>
                    <div className="text-slate-300 mt-0.5 break-words whitespace-pre-wrap">{msg?.text}</div>
                  </div>
                  {msg?.ts && (
                    <div className="text-xs text-slate-400 whitespace-nowrap ml-2" title={new Date(msg.ts).toLocaleString()}>
                      {fmtTime(msg.ts)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Sticky input bar at bottom of card */}
      <form onSubmit={submit} className="border-t border-slate-800/80 p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={disabled}
            placeholder={disabled ? 'Join a room to chat' : 'Type a message'}
            className="flex-1 bg-slate-800/90 text-slate-100 border border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={disabled}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-black font-semibold hover:bg-emerald-500 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
