import { motion as m } from 'framer-motion';
import { useEffect, useState } from 'react';

/**
 * XpBar Component - Shows XP progress and level
 * Used in profile pages and player cards
 */
export default function XpBar({ 
  xp = 0, 
  xpToNext = 100, 
  level = 1, 
  totalXp = 0,
  showLevel = true,
  showTotal = false,
  size = 'md', // 'sm' | 'md' | 'lg'
  className = '',
}) {
  const [displayXp, setDisplayXp] = useState(xp);
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    // Smooth animation for XP changes
    setDisplayXp(xp);
    const progress = xpToNext > 0 ? Math.min(100, Math.max(0, (xp / xpToNext) * 100)) : 0;
    setDisplayProgress(progress);
  }, [xp, xpToNext]);

  const sizeClasses = {
    sm: {
      height: 'h-1.5',
      text: 'text-xs',
      levelText: 'text-[10px]',
      padding: 'px-2 py-1',
    },
    md: {
      height: 'h-2',
      text: 'text-sm',
      levelText: 'text-xs',
      padding: 'px-3 py-1.5',
    },
    lg: {
      height: 'h-2.5',
      text: 'text-base',
      levelText: 'text-sm',
      padding: 'px-4 py-2',
    },
  };

  const styles = sizeClasses[size] || sizeClasses.md;
  const progress = xpToNext > 0 ? Math.min(100, Math.max(0, (displayXp / xpToNext) * 100)) : 0;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {/* Level Badge + Progress Bar */}
      <div className="flex items-center gap-2">
        {showLevel && (
          <div className={`flex-shrink-0 ${styles.levelText} font-bold text-emerald-400`}>
            LVL {level}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className={`${styles.height} bg-slate-700/50 rounded-full overflow-hidden`}>
            <m.div
              className={`${styles.height} bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full`}
              initial={{ width: 0 }}
              animate={{ width: `${displayProgress}%` }}
              transition={{ type: 'spring', stiffness: 200, damping: 25, duration: 0.5 }}
            />
          </div>
        </div>
        {showTotal && (
          <div className={`flex-shrink-0 ${styles.text} text-slate-400 font-mono`}>
            {totalXp.toLocaleString()} XP
          </div>
        )}
      </div>

      {/* XP Text (optional, for detailed views) */}
      {size === 'lg' && (
        <div className={`${styles.text} text-slate-400 text-center`}>
          {displayXp} / {xpToNext} XP
        </div>
      )}
    </div>
  );
}

