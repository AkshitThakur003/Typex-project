// Stats header component for Practice page
import React from 'react';

export default function StatsHeader({ 
  mode, 
  value, 
  timeLeft, 
  wordsCompleted, 
  textLength, 
  liveWpm, 
  started, 
  isPaused, 
  onTogglePause 
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mb-3 sm:mb-4 w-full max-w-5xl">
      {/* Timer */}
      {mode === "time" && (
        <div className="flex flex-col items-center">
          <span className="text-xs uppercase text-slate-400">Time</span>
          <div className={`text-2xl sm:text-3xl md:text-4xl font-bold ${timeLeft <= 5 ? "text-red-500" : "text-orange-400"}`}>
            {timeLeft}s
          </div>
        </div>
      )}
      
      {/* Word Counter */}
      <div className="flex flex-col items-center">
        <span className="text-xs uppercase text-slate-400">Words</span>
        <div className="text-lg sm:text-xl md:text-2xl font-semibold text-white">
          {mode === "words" ? (
            <span className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
              <span>{wordsCompleted} / {value}</span>
              <span className="text-xs sm:text-sm text-slate-400 font-normal">
                ({Math.round((wordsCompleted / value) * 100)}%)
              </span>
            </span>
          ) : mode === "quote" ? (
            <span className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
              <span>{wordsCompleted} / {textLength}</span>
              <span className="text-xs sm:text-sm text-slate-400 font-normal">
                ({textLength > 0 ? Math.round((wordsCompleted / textLength) * 100) : 0}%)
              </span>
            </span>
          ) : (
            wordsCompleted
          )}
        </div>
      </div>

      {/* Live WPM */}
      {started && !isPaused && (
        <div className="flex flex-col items-center">
          <span className="text-xs uppercase text-slate-400">WPM</span>
          <div className="text-lg sm:text-xl md:text-2xl font-semibold text-emerald-400">
            {liveWpm}
          </div>
        </div>
      )}

      {/* Pause Button */}
      {started && (
        <button
          onClick={onTogglePause}
          className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base rounded-lg bg-slate-800 hover:bg-slate-700 transition text-white font-semibold"
          aria-label={isPaused ? "Resume" : "Pause"}
        >
          {isPaused ? "▶ Resume" : "⏸ Pause"}
        </button>
      )}
    </div>
  );
}

