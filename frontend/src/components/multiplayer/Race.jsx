import { motion as m } from "framer-motion";
import TimerCircle from "./TimerCircle";
import PlayerList from "./PlayerList.jsx";
import TypingText from "./TypingText.jsx";
import { useEffect, useRef, useState } from "react";

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

  useEffect(() => {
    if (startedAt && text && !isSpectator) hiddenInputRef.current?.focus();
  }, [startedAt, text, isSpectator]);

  const onKeyDown = (e) => {
    const ts = Date.now();
    setKeystrokes((prev) => (prev.length > 500 ? [...prev.slice(-500), ts] : [...prev, ts]));
    if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) setPasted(true);
  };
  const onPaste = () => setPasted(true);
  return (
    <m.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="w-full max-w-7xl mx-auto flex flex-col gap-6 px-6 md:px-12"
    >
      {/* Timer at top-center with optional host controls */}
      <div className="flex flex-col items-center gap-2">
        {endsAt && <TimerCircle endsAt={endsAt} startedAt={startedAt} />}
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
            className="relative bg-slate-900/70 backdrop-blur-md rounded-xl shadow border border-slate-800 p-4 md:p-6"
            onClick={() => hiddenInputRef.current?.focus()}
            role="textbox"
            aria-label="Typing area"
          >
            <div className="max-w-4xl mx-auto px-2 sm:px-4">
              <TypingText text={text} input={input} />
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
              onChange={(e) =>
                onInputChange?.(e.target.value, {
                  keystrokeTimestamps: keystrokes,
                  pasteEvents: pasted,
                })
              }
              onKeyDown={onKeyDown}
              onPaste={onPaste}
              disabled={isSpectator}
              className="absolute -left-[9999px] w-px h-px opacity-0"
              aria-hidden="true"
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

      {/* Spectator Note */}
      {isSpectator && (
        <p className="text-slate-400 text-sm italic text-center">
          👀 You’re spectating this race
        </p>
      )}

  {/* Countdown handled in RaceTrack */}
    </m.div>
  );
}
