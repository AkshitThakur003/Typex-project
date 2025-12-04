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
    <div className="mt-4 sm:mt-6 relative flex justify-center" ref={menuRef}>
      <div className="relative inline-block">
        <button
          onClick={() => {
            if (showMenu) {
              onRestartSameText();
            } else {
              onToggleMenu();
            }
          }}
          className="px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg bg-emerald-600 text-black font-semibold hover:bg-emerald-500 active:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 w-full sm:w-auto min-w-[120px] sm:min-w-[140px]"
          aria-label="Restart test"
          aria-expanded={showMenu}
          aria-haspopup="true"
        >
          <RotateCw className="w-4 h-5 sm:w-5 flex-shrink-0" aria-hidden="true" />
          <span>Restart</span>
          <ChevronDown className={`w-3 h-4 sm:w-4 flex-shrink-0 transition-transform duration-200 ${showMenu ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full mt-2 left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 bg-slate-900 border border-slate-800 rounded-lg shadow-xl overflow-hidden z-50 w-[calc(100vw-2rem)] sm:w-auto min-w-[200px] sm:min-w-[240px] max-w-[280px]"
              role="menu"
              aria-orientation="vertical"
            >
              <button
                onClick={() => {
                  onRestartSameText();
                  onToggleMenu();
                }}
                className="w-full px-4 sm:px-5 py-3 sm:py-2.5 text-left text-sm sm:text-sm text-white hover:bg-slate-800 active:bg-slate-700 transition flex items-center gap-3 sm:gap-2.5 touch-manipulation"
                role="menuitem"
              >
                <RotateCw className="w-4 h-4 sm:w-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm sm:text-sm truncate">Restart (Same Text)</div>
                  <div className="text-xs text-slate-400 mt-0.5">Tab</div>
                </div>
              </button>
              <button
                onClick={() => {
                  onRestartNewText();
                  onToggleMenu();
                }}
                className="w-full px-4 sm:px-5 py-3 sm:py-2.5 text-left text-sm sm:text-sm text-white hover:bg-slate-800 active:bg-slate-700 transition flex items-center gap-3 sm:gap-2.5 border-t border-slate-800 touch-manipulation"
                role="menuitem"
              >
                <RotateCw className="w-4 h-4 sm:w-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm sm:text-sm truncate">New Test (New Text)</div>
                  <div className="text-xs text-slate-400 mt-0.5">Shift+Tab</div>
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

