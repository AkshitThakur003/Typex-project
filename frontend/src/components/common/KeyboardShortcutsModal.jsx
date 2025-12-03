// ============================================
// Keyboard Shortcuts Help Modal
// ============================================

import { useState, useEffect } from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';
import { Keyboard, X, Command } from 'lucide-react';

const SHORTCUTS = {
  global: [
    { keys: ['?'], description: 'Open keyboard shortcuts help' },
    { keys: ['Esc'], description: 'Close modal / Go back' },
  ],
  practice: [
    { keys: ['Tab'], description: 'Restart with same text' },
    { keys: ['Shift', 'Tab'], description: 'Start new test with new text' },
    { keys: ['Ctrl/⌘', 'P'], description: 'Pause/Resume test' },
    { keys: ['Backspace'], description: 'Delete last character' },
    { keys: ['Space'], description: 'Move to next word' },
  ],
  multiplayer: [
    { keys: ['Enter'], description: 'Send chat message' },
    { keys: ['Esc'], description: 'Leave room / Cancel' },
  ],
  navigation: [
    { keys: ['Ctrl/⌘', 'K'], description: 'Quick search (coming soon)' },
  ],
};

function KeyCombo({ keys }) {
  return (
    <div className="flex items-center gap-1">
      {keys.map((key, idx) => (
        <span key={idx} className="flex items-center">
          {idx > 0 && <span className="text-slate-500 mx-1">+</span>}
          <kbd className="px-2 py-1 text-xs font-mono bg-slate-800 border border-slate-700 rounded-md text-slate-200 shadow-sm min-w-[28px] text-center">
            {key === 'Ctrl/⌘' ? (
              <span className="flex items-center gap-0.5">
                <span className="hidden sm:inline">Ctrl</span>
                <span className="sm:hidden">⌘</span>
              </span>
            ) : key}
          </kbd>
        </span>
      ))}
    </div>
  );
}

function ShortcutSection({ title, shortcuts }) {
  return (
    <div className="mb-6 last:mb-0">
      <h3 className="text-sm font-semibold text-emerald-400 mb-3 uppercase tracking-wider">{title}</h3>
      <div className="space-y-2">
        {shortcuts.map((shortcut, idx) => (
          <div key={idx} className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors">
            <span className="text-sm text-slate-300">{shortcut.description}</span>
            <KeyCombo keys={shortcut.keys} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function KeyboardShortcutsModal({ isOpen, onClose }) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
          />
          
          {/* Modal */}
          <m.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
          >
            <div 
              className="bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] md:max-h-[85vh] overflow-hidden pointer-events-auto m-4 md:m-0"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Keyboard className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Keyboard Shortcuts</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Content */}
              <div className="p-4 md:p-5 overflow-y-auto max-h-[65vh] md:max-h-[60vh] custom-scrollbar">
                <ShortcutSection title="Global" shortcuts={SHORTCUTS.global} />
                <ShortcutSection title="Practice Mode" shortcuts={SHORTCUTS.practice} />
                <ShortcutSection title="Multiplayer" shortcuts={SHORTCUTS.multiplayer} />
                <ShortcutSection title="Navigation" shortcuts={SHORTCUTS.navigation} />
              </div>
              
              {/* Footer */}
              <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                <p className="text-xs text-slate-500 text-center">
                  Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 font-mono">?</kbd> anywhere to open this help
                </p>
              </div>
            </div>
          </m.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Hook to manage keyboard shortcuts modal state
export function useKeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      
      // Open on '?' key
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setIsOpen(true);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((v) => !v),
  };
}

