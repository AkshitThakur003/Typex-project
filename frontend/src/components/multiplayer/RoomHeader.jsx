import { motion as m, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { Clipboard, Check, Settings, Lock, Unlock, LogOut, Rocket, Users } from 'lucide-react';
import { usePreferences } from '../../settings/PreferencesContext.jsx';

/**
 * RoomHeader component - Room info, status banner, host controls
 */
export default function RoomHeader({
  room,
  isHost = false,
  onStart = null,
  onLeave = null,
  onLockRoom = null,
  onKickPlayer = null,
  onPromoteHost = null,
}) {
  const { user } = usePreferences();
  const [copied, setCopied] = useState(false);
  const [showHostMenu, setShowHostMenu] = useState(false);
  const menuRef = useRef(null);

  const host = room?.players?.find((p) => p.id === room?.hostId);
  const status = room?.status || 'lobby';

  // Status badge configuration
  const statusConfig = {
    lobby: {
      label: 'LOBBY',
      color: 'bg-slate-700/40 text-slate-300 border-slate-600/40',
      icon: '🏠',
    },
    countdown: {
      label: 'STARTING',
      color: 'bg-amber-500/20 text-amber-300 border-amber-600/40',
      icon: '⏱️',
    },
    race: {
      label: 'IN-GAME',
      color: 'bg-emerald-500/20 text-emerald-300 border-emerald-600/40',
      icon: '🏁',
    },
    results: {
      label: 'FINISHED',
      color: 'bg-indigo-500/20 text-indigo-300 border-indigo-600/40',
      icon: '🏆',
    },
  };

  const currentStatus = statusConfig[status] || statusConfig.lobby;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(room?.code || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowHostMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <m.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-slate-900/70 backdrop-blur-md rounded-xl border border-slate-800 shadow-lg p-4 md:p-5"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left: Room Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-xl md:text-2xl font-bold text-white truncate flex items-center gap-2">
              {room?.roomName || 'Untitled Room'}
              {room?.isLocked && <Lock className="w-4 h-4 text-amber-500" />}
            </h1>
            
            {/* Status Badge */}
            <m.span
              key={status}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`text-[10px] px-2.5 py-1 rounded-full border font-semibold tracking-wider ${currentStatus.color}`}
            >
              {currentStatus.icon} {currentStatus.label}
            </m.span>
          </div>

          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-sm text-slate-400">
            {/* Room Code */}
            <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-2 py-1 border border-slate-700/50">
              <span className="text-xs uppercase tracking-wide">Code:</span>
              <span className="font-mono tracking-widest text-emerald-400 font-bold select-all">
                {room?.code || '—'}
              </span>
              <button
                onClick={copyCode}
                className="ml-1 p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                aria-label="Copy room code"
                title="Copy Code"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Clipboard className="w-3 h-3" />}
              </button>
            </div>

            {/* Host Name */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs uppercase tracking-wide">Host:</span>
              <span className="text-slate-200 font-medium">{host?.name || '—'}</span>
            </div>

            {/* Spectator Count */}
            {room?.spectators && room.spectators.length > 0 && (
              <div className="flex items-center gap-1.5 text-slate-300 bg-slate-800/30 px-2 py-1 rounded-full border border-slate-700/30">
                <Users className="w-3 h-3" />
                <span className="text-xs font-medium">{room.spectators.length}</span>
              </div>
            )}
            
            {/* Team Mode Badge */}
            {room?.teamMode && (
               <span className="px-2 py-0.5 text-[10px] rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold">
                🏆 Team Battle
              </span>
            )}

            {/* Modifiers and Custom Text Badge */}
            {((room?.modifiers && room.modifiers.length > 0) || room?.isCustomText) && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {room?.isCustomText && (
                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                    📝 Custom Text
                  </span>
                )}
                {room?.modifiers?.includes('no-backspace') && (
                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium">
                    🚫 No Backspace
                  </span>
                )}
                {room?.modifiers?.includes('blind') && (
                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                    👁️ Blind
                  </span>
                )}
                {room?.modifiers?.includes('zen') && (
                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 font-medium">
                    🧘 Zen
                  </span>
                )}
                {room?.modifiers?.includes('sudden-death') && (
                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 font-medium">
                    💀 Sudden Death
                  </span>
                )}
                {room?.modifiers?.includes('sprint') && (
                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 font-medium">
                    ⚡ Sprint
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-shrink-0 mt-2 lg:mt-0">
          {/* Host Controls Menu */}
          {isHost && status === 'lobby' && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowHostMenu(!showHostMenu)}
                className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors"
                aria-label="Host controls"
                title="Host Controls"
              >
                <Settings className="w-5 h-5" />
              </button>

              <AnimatePresence>
                {showHostMenu && (
                  <m.div
                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                    className="absolute right-0 top-full mt-2 z-30 w-48 rounded-lg border border-slate-700 bg-slate-900/95 backdrop-blur-md shadow-xl p-1"
                  >
                    {onLockRoom && (
                      <button
                        onClick={() => {
                          onLockRoom();
                          setShowHostMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded text-sm text-slate-200 hover:bg-slate-800 flex items-center gap-2 transition-colors"
                      >
                        {room?.isLocked ? (
                          <>
                            <Unlock className="w-4 h-4 text-emerald-400" />
                            Unlock Room
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4 text-amber-400" />
                            Lock Room
                          </>
                        )}
                      </button>
                    )}
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Start Game Button (Host only) */}
          {isHost && status === 'lobby' && (
            <button
              onClick={onStart}
              className="px-5 py-2.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-500 transition-colors flex items-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              <Rocket className="w-4 h-4" />
              Start Game
            </button>
          )}

          {/* Leave Button */}
          <button
            onClick={onLeave}
            className="px-4 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-rose-500/10 hover:border-rose-500/50 hover:text-rose-400 transition-colors flex items-center gap-2"
            title="Leave Room"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline font-medium">Leave</span>
          </button>
        </div>
      </div>
    </m.div>
  );
}
