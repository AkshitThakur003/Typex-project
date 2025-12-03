// Keyboard shortcuts hint component for Practice page
import React from 'react';

export default function KeyboardHints({ started }) {
  return (
    <div className="mt-3 sm:mt-4 px-2 text-[10px] sm:text-xs text-slate-500 text-center max-w-5xl">
      <p className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-slate-800 rounded text-[10px] sm:text-xs">Tab</kbd>
          <span className="hidden sm:inline">restart (same text)</span>
          <span className="sm:hidden">restart</span>
        </span>
        <span className="hidden sm:inline">•</span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-slate-800 rounded text-[10px] sm:text-xs">Shift+Tab</kbd>
          <span className="hidden sm:inline">new test</span>
          <span className="sm:hidden">new</span>
        </span>
        {started && (
          <>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-slate-800 rounded text-[10px] sm:text-xs">Ctrl+P</kbd>
              <span className="hidden sm:inline">pause/resume</span>
              <span className="sm:hidden">pause</span>
            </span>
          </>
        )}
        <span className="hidden sm:inline">•</span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-slate-800 rounded text-[10px] sm:text-xs">Esc</kbd>
          <span>{started ? "reset" : "go back"}</span>
        </span>
      </p>
    </div>
  );
}

