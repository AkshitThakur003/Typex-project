// Mode selector component for Practice page
import React from 'react';

const MODES = {
  time: [15, 30, 60],
  words: [10, 25, 50],
};

export default function ModeSelector({ mode, value, onModeChange, onValueChange, disabled }) {
  return (
    <div className="flex flex-wrap justify-center gap-3 sm:gap-6 mb-3 sm:mb-4 w-full max-w-5xl">
      {/* Time Mode */}
      <div className="flex flex-col items-center">
        <span className="text-xs uppercase text-slate-400">Time</span>
        <div className="flex gap-1.5 sm:gap-2 mt-1">
          {MODES.time.map((t) => (
            <button
              key={t}
              className={`px-2 sm:px-3 py-1 text-sm sm:text-base rounded transition ${
                mode === "time" && value === t
                  ? "bg-emerald-600 text-black font-semibold"
                  : "bg-slate-800 hover:bg-slate-700"
              }`}
              onClick={() => {
                onModeChange("time");
                onValueChange(t);
              }}
              disabled={disabled}
            >
              {t}s
            </button>
          ))}
        </div>
      </div>

      {/* Words Mode */}
      <div className="flex flex-col items-center">
        <span className="text-xs uppercase text-slate-400">Words</span>
        <div className="flex gap-1.5 sm:gap-2 mt-1">
          {MODES.words.map((w) => (
            <button
              key={w}
              className={`px-2 sm:px-3 py-1 text-sm sm:text-base rounded transition ${
                mode === "words" && value === w
                  ? "bg-emerald-600 text-black font-semibold"
                  : "bg-slate-800 hover:bg-slate-700"
              }`}
              onClick={() => {
                onModeChange("words");
                onValueChange(w);
              }}
              disabled={disabled}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {/* Quote Mode */}
      <div className="flex flex-col items-center">
        <span className="text-xs uppercase text-slate-400">Quote</span>
        <button
          className={`px-2 sm:px-3 py-1 text-sm sm:text-base rounded transition ${
            mode === "quote"
              ? "bg-emerald-600 text-black font-semibold"
              : "bg-slate-800 hover:bg-slate-700"
          }`}
          onClick={() => {
            onModeChange("quote");
            onValueChange(0);
          }}
          disabled={disabled}
        >
          Quote
        </button>
      </div>
    </div>
  );
}

export { MODES };

