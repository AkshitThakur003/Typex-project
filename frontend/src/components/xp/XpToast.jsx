import { motion as m, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Sparkles, TrendingUp } from 'lucide-react';

/**
 * XpToast Component - Animated toast notification for XP gains
 * Shows temporary "+X XP • reason" messages
 */
export default function XpToast({ xpGained, reason, levelUp = false, newLevel = null, onClose }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onClose?.(), 300); // Wait for exit animation
    }, levelUp ? 4000 : 3000); // Show longer for level-ups

    return () => clearTimeout(timer);
  }, [levelUp, onClose]);

  if (!visible) return null;

  return (
    <AnimatePresence>
      {visible && (
        <m.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed top-20 right-4 z-50 pointer-events-none"
        >
          <div className="bg-slate-900/95 backdrop-blur-md border border-emerald-500/30 rounded-lg shadow-xl px-4 py-3 flex items-center gap-3 min-w-[200px]">
            {/* Icon */}
            {levelUp ? (
              <m.div
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5 }}
                className="text-amber-400"
              >
                <Sparkles className="w-5 h-5" />
              </m.div>
            ) : (
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            )}

            {/* Content */}
            <div className="flex-1">
              {levelUp ? (
                <div>
                  <div className="text-emerald-300 font-bold text-sm">
                    LEVEL UP! Level {newLevel}
                  </div>
                  <div className="text-slate-400 text-xs">
                    +{xpGained} XP • {reason}
                  </div>
                </div>
              ) : (
                <div className="text-emerald-300 font-semibold text-sm">
                  +{xpGained} XP
                  {reason && <span className="text-slate-400"> • {reason}</span>}
                </div>
              )}
            </div>

            {/* XP Badge */}
            <div className="px-2 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
              <span className="text-emerald-300 text-xs font-bold">+{xpGained}</span>
            </div>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}

/**
 * XpToastManager - Manages multiple XP toasts
 */
export function XpToastManager() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleXpGain = (event) => {
      const { xpGained, levelsGained, breakdown } = event.detail;
      
      // Determine reason from breakdown
      let reason = 'Game completed';
      if (breakdown?.winBonus > 0) reason = 'Victory!';
      else if (breakdown?.pos2Bonus > 0) reason = 'Second place';
      else if (breakdown?.accuracyBonus > 0) reason = 'High accuracy';
      else if (breakdown?.wpmBonus > 0) reason = 'Fast typing';

      const toast = {
        id: Date.now() + Math.random(),
        xpGained,
        reason,
        levelUp: levelsGained > 0,
        newLevel: event.detail.newLevel,
      };

      setToasts((prev) => [...prev, toast]);
    };

    window.addEventListener('xp:gain', handleXpGain);
    return () => window.removeEventListener('xp:gain', handleXpGain);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed top-20 right-4 z-50 pointer-events-none">
      <div className="flex flex-col gap-2">
        {toasts.map((toast, index) => (
          <m.div
            key={toast.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ delay: index * 0.1 }}
            style={{ pointerEvents: 'none' }}
          >
            <XpToast
              xpGained={toast.xpGained}
              reason={toast.reason}
              levelUp={toast.levelUp}
              newLevel={toast.newLevel}
              onClose={() => removeToast(toast.id)}
            />
          </m.div>
        ))}
      </div>
    </div>
  );
}

