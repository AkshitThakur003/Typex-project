// Paused overlay component for Practice page
import React from 'react';
import { motion } from 'framer-motion';

export default function PausedOverlay({ onResume }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onResume}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 text-center max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">⏸</div>
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Paused</h2>
        <p className="text-sm sm:text-base text-slate-400 mb-4 sm:mb-6">
          Your test is paused. Click resume or press Ctrl+P to continue.
        </p>
        <button
          onClick={onResume}
          className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base rounded-lg bg-emerald-600 text-black font-semibold hover:bg-emerald-500 transition w-full sm:w-auto"
        >
          ▶ Resume Test
        </button>
      </motion.div>
    </motion.div>
  );
}

