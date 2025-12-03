// Restart button with dropdown for Practice page
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCw, ChevronDown } from 'lucide-react';

export default function RestartButton({ 
  showMenu, 
  onToggleMenu, 
  onRestartSameText, 
  onRestartNewText,
  menuRef 
}) {
  return (
    <div className="mt-4 sm:mt-6 relative" ref={menuRef}>
      <button
        onClick={() => {
          if (showMenu) {
            onRestartSameText();
          } else {
            onToggleMenu();
          }
        }}
        className="px-4 sm:px-6 py-2 text-sm sm:text-base rounded-lg bg-emerald-600 text-black font-semibold hover:bg-emerald-500 transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
        aria-label="Restart test"
      >
        <RotateCw className="w-4 h-5 sm:w-5" aria-hidden="true" />
        <span>Restart</span>
        <ChevronDown className={`w-3 h-4 sm:w-4 transition-transform ${showMenu ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 right-0 sm:right-auto left-0 sm:left-auto bg-slate-900 border border-slate-800 rounded-lg shadow-xl overflow-hidden z-10 min-w-[200px] sm:min-w-[240px]"
          >
            <button
              onClick={onRestartSameText}
              className="w-full px-3 sm:px-4 py-2 text-left text-xs sm:text-sm text-white hover:bg-slate-800 transition flex items-center gap-2"
            >
              <RotateCw className="w-3 h-4 sm:w-4 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-semibold text-xs sm:text-sm">Restart (Same Text)</div>
                <div className="text-xs text-slate-400">Tab</div>
              </div>
            </button>
            <button
              onClick={onRestartNewText}
              className="w-full px-3 sm:px-4 py-2 text-left text-xs sm:text-sm text-white hover:bg-slate-800 transition flex items-center gap-2 border-t border-slate-800"
            >
              <RotateCw className="w-3 h-4 sm:w-4 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-semibold text-xs sm:text-sm">New Test (New Text)</div>
                <div className="text-xs text-slate-400">Shift+Tab</div>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

