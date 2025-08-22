import { useEffect, useRef, useState } from 'react';
import TypingText from './TypingText.jsx';

export default function RaceTrack({
  text,
  input,
  onInputChange,
  progress,
  startedAt,
  endsAt,
  disabled,
  isTyping,
}) {
  // hidden input to capture keystrokes while typing inline over the text
  const hiddenInputRef = useRef(null);
  const [keystrokes, setKeystrokes] = useState([]);
  const [pasted, setPasted] = useState(false);

  useEffect(() => {
    if (startedAt && text && !disabled) hiddenInputRef.current?.focus();
  }, [startedAt, text, disabled]);

  // Handlers to collect anti-cheat telemetry
  const onKeyDown = (e) => {
    const ts = Date.now();
    // limit array size to reasonable recent history
    setKeystrokes((prev) => (prev.length > 500 ? [...prev.slice(-500), ts] : [...prev, ts]));
    if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) {
      setPasted(true);
    }
  };
  const onPaste = () => setPasted(true);

  return (
    <div
      className="relative bg-slate-900/70 backdrop-blur-md rounded-xl shadow border border-slate-800 p-4 md:p-6"
      onClick={() => hiddenInputRef.current?.focus()}
      role="textbox"
      aria-label="Typing area"
    >
      {/* Inline typing overlay */}
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
        disabled={disabled}
        className="absolute -left-[9999px] w-px h-px opacity-0"
        aria-hidden="true"
        tabIndex={disabled ? -1 : 0}
      />
    </div>
  );
}
