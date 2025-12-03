import { motion as m } from "framer-motion";
import TimerCircle from "./TimerCircle";
import PlayerList from "./PlayerList.jsx";
import TypingText from "./TypingText.jsx";
import { useEffect, useRef, useState } from "react";
import { Eye } from "lucide-react";

export default function Race({
  room,
  text,
  input,
  onInputChange,
  progress,
  startedAt,
  endsAt,
  isSpectator,
  isTyping,
  // Optional host controls
  isHost,
  onStart,
  onRestart,
  status,
}) {
  const [showBoard, setShowBoard] = useState(false);
  // Hidden input for inline typing (anti-cheat telemetry compatible)
  const hiddenInputRef = useRef(null);
  const [keystrokes, setKeystrokes] = useState([]);
  const [pasted, setPasted] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  
  // Extract modifiers from room
  const modifiers = room?.modifiers || [];
  const hasNoBackspace = modifiers.includes('no-backspace');
  const hasBlind = modifiers.includes('blind');
  const hasZen = modifiers.includes('zen');
  const hasSuddenDeath = modifiers.includes('sudden-death');
  
  // Debug blind mode detection
  useEffect(() => {
    console.log('[Race] Blind mode check:', {
      roomModifiers: room?.modifiers,
      modifiersArray: modifiers,
      hasBlind,
      passingToTypingText: hasBlind
    });
  }, [room?.modifiers, modifiers, hasBlind]);

  useEffect(() => {
    if (startedAt && text && !isSpectator) hiddenInputRef.current?.focus();
  }, [startedAt, text, isSpectator]);

  // Debug: Log when text or modifiers change
  useEffect(() => {
    console.log('[Race Component] Text updated:', { 
      textLength: text?.length, 
      textPreview: text?.substring(0, 50), 
      modifiers: room?.modifiers, 
      hasBlind,
      passingBlindModeToTypingText: hasBlind
    });
  }, [text, room?.modifiers, hasBlind]);

  const onKeyDown = (e) => {
    const ts = Date.now();
    setKeystrokes((prev) => (prev.length > 500 ? [...prev.slice(-500), ts] : [...prev, ts]));
    if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) setPasted(true);
    
    // No backspace modifier - prevent backspace
    if (hasNoBackspace && (e.key === 'Backspace' || e.key === 'Delete')) {
      e.preventDefault();
    }
  };
  const onPaste = () => setPasted(true);
  
  // Track mistakes for sudden death mode (client-side display only)
  // Backend handles actual elimination
  useEffect(() => {
    if (hasSuddenDeath && input && text) {
      let errorCount = 0;
      // Count mismatched characters
      for (let i = 0; i < input.length && i < text.length; i++) {
        if (input[i] !== text[i]) errorCount++;
      }
      // Count extra characters if input is longer than text
      if (input.length > text.length) {
        errorCount += (input.length - text.length);
      }
      setMistakes(errorCount);
    }
  }, [input, text, hasSuddenDeath]);
  return (
    <m.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="w-full max-w-7xl mx-auto flex flex-col gap-6 px-6 md:px-12"
    >
      {/* Timer at top-center with optional host controls */}
      <div className="flex flex-col items-center gap-2">
        {endsAt && !hasZen && <TimerCircle endsAt={endsAt} startedAt={startedAt} />}
        {hasZen && (
          <div className="text-slate-400 text-sm">🧘 Zen Mode - Take your time</div>
        )}
        {isHost && (onStart || onRestart) && (
          <div className="flex items-center gap-2">
            {onStart && (
              <button
                onClick={onStart}
                className="px-3 py-1.5 rounded bg-emerald-600 text-black text-sm font-semibold hover:bg-emerald-500"
              >
                Start
              </button>
            )}
            {onRestart && (
              <button
                onClick={onRestart}
                className="px-3 py-1.5 rounded bg-slate-800 text-slate-100 border border-slate-600 text-sm hover:border-slate-500"
              >
                Restart
              </button>
            )}
          </div>
        )}
      </div>

      {/* Spectator Mode Banner - Moved above progress bar to prevent overlap */}
      {isSpectator && (
        <m.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl mx-auto mb-4"
        >
          <div className="relative bg-gradient-to-r from-orange-900/40 via-amber-900/30 to-emerald-900/40 backdrop-blur-md rounded-xl border border-orange-500/30 shadow-lg shadow-orange-500/10 p-3 sm:p-4 md:p-5 overflow-hidden">
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(251,146,60,0.3),transparent_50%)] animate-pulse" />
            </div>
            
            <div className="relative flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 md:gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-lg animate-pulse" />
                  <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-orange-500/80 to-amber-600/80 flex items-center justify-center border-2 border-orange-400/50 shadow-lg">
                    <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
                  </div>
                </div>
                <div className="flex flex-col">
                  <h3 className="text-sm sm:text-base md:text-lg font-bold text-white flex flex-wrap items-center gap-1.5 sm:gap-2">
                    Spectator Mode
                    <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs rounded-full bg-orange-500/30 text-orange-300 border border-orange-400/40 font-medium">
                      VIEW ONLY
                    </span>
                  </h3>
                  <p className="text-[10px] sm:text-xs md:text-sm text-slate-300">
                    Watch the race in real-time • No typing required
                  </p>
                </div>
              </div>
              
              <div className="hidden sm:block w-px h-6 sm:h-8 bg-slate-700/50" />
              
              <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs md:text-sm text-slate-400">
                <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Live Race</span>
                </div>
                {room?.players && (
                  <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <span className="text-orange-400 font-semibold">{room.players.length}</span>
                    <span>Players</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </m.div>
      )}

      {/* Slim Progress Bar with shimmer just below timer (full width) */}
      <div className="relative h-2 sm:h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
        <m.div
          className="h-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
        <div className="absolute inset-0 -translate-x-full animate-shine bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.45),transparent)] pointer-events-none" />
      </div>
      {/* Track + Live Leaderboard (65/35 split) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 order-1">
          {/* Inline typing UI */}
          <m.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative bg-slate-900/70 backdrop-blur-md rounded-xl shadow border p-3 sm:p-4 md:p-6 landscape-compact ${
              isSpectator 
                ? 'border-orange-500/30 cursor-default' 
                : 'border-slate-800 cursor-text'
            }`}
            onClick={() => !isSpectator && hiddenInputRef.current?.focus()}
            role="textbox"
            aria-label={isSpectator ? "Spectating race - view only" : "Typing area"}
          >
            {/* Spectator overlay indicator - moved to bottom to avoid text overlap */}
            {isSpectator && (
              <div className="absolute bottom-3 right-3 z-10">
                <div className="px-2.5 py-1 rounded-full bg-orange-500/20 border border-orange-400/40 backdrop-blur-sm shadow-md">
                  <span className="text-xs font-medium text-orange-300 flex items-center gap-1.5">
                    <Eye className="w-3 h-3" />
                    <span>Spectating</span>
                  </span>
                </div>
              </div>
            )}
            {/* Modifier badges */}
            {modifiers.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4 justify-center">
                {hasNoBackspace && (
                  <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                    🚫 No Backspace
                  </span>
                )}
                {hasBlind && (
                  <span className="px-2 py-1 text-xs rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    👁️ Blind Mode
                  </span>
                )}
                {hasSuddenDeath && (
                  <span className="px-2 py-1 text-xs rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    💀 Sudden Death {mistakes > 0 ? `(${mistakes}/${room?.suddenDeathLimit || 1})` : `(0/${room?.suddenDeathLimit || 1})`}
                  </span>
                )}
                {modifiers.includes('sprint') && (
                  <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                    ⚡ Sprint Mode
                  </span>
                )}
              </div>
            )}
            {/* Spectator overlay - subtle visual indicator */}
            {isSpectator && (
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-emerald-500/5 pointer-events-none rounded-xl z-0" />
            )}
            
            <div className={`max-w-4xl mx-auto px-2 sm:px-4 relative z-10 ${isSpectator ? 'opacity-90' : ''}`}>
              <TypingText text={text} input={input} blindMode={hasBlind} />
            </div>

            {/* Hidden input to capture keystrokes and preserve anti-cheat telemetry */}
            <input
              ref={hiddenInputRef}
              type="text"
              inputMode="text"
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              value={input}
              onChange={(e) => {
                // No backspace modifier - prevent any input reduction
                if (hasNoBackspace && e.target.value.length < input.length) {
                  return; // Don't allow input to shrink
                }
                onInputChange?.(e.target.value, {
                  keystrokeTimestamps: keystrokes,
                  pasteEvents: pasted,
                });
              }}
              onKeyDown={onKeyDown}
              onPaste={onPaste}
              disabled={isSpectator}
              className="absolute -left-[9999px] w-px h-px opacity-0"
              aria-label="Typing input for race"
              tabIndex={isSpectator ? -1 : 0}
            />
          </m.div>
        </div>
        <div className="lg:col-span-4 order-2 w-full">
          <div className="lg:hidden mb-2">
            <button
              onClick={() => setShowBoard((v) => !v)}
              aria-expanded={showBoard}
              className="px-3 py-2 text-sm rounded bg-slate-800 text-white border border-slate-700"
            >
              {showBoard ? 'Hide Leaderboard' : 'Show Leaderboard'}
            </button>
          </div>
          <div className={"w-full " + (showBoard ? '' : 'hidden lg:block')}>
            <PlayerList title="Live Leaderboard" players={room?.players || []} leaderboard isResultsView={false} />
          </div>
        </div>
      </div>

      {/* Spectator Count for Players */}
      {!isSpectator && room?.spectators && room?.spectators.length > 0 && (
        <m.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex justify-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/60 border border-slate-700/50 backdrop-blur-sm">
            <div className="relative">
              <span className="text-lg">👁️</span>
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
            </div>
            <span className="text-xs sm:text-sm text-slate-300 font-medium">
              <span className="text-orange-400 font-bold">{room.spectators.length}</span> {room.spectators.length === 1 ? 'spectator' : 'spectators'} watching
            </span>
          </div>
        </m.div>
      )}

  {/* Countdown handled in RaceTrack */}
    </m.div>
  );
}
