import { motion as m, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

/**
 * TypingIndicator component - Shows "User is typing..." with animations
 * Supports multiple users typing
 */
export default function TypingIndicator({ typingUsers = [] }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typingUsers.length > 0) {
      setVisible(true);
      // Auto-hide after 3 seconds of no updates
      const timer = setTimeout(() => {
        setVisible(false);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [typingUsers]);

  if (!visible || typingUsers.length === 0) return null;

  const displayText = typingUsers.length === 1
    ? `${typingUsers[0]} is typing...`
    : typingUsers.length === 2
    ? `${typingUsers[0]} and ${typingUsers[1]} are typing...`
    : `${typingUsers[0]} and ${typingUsers.length - 1} others are typing...`;

  return (
    <AnimatePresence>
      {visible && (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="px-4 py-2 text-xs text-slate-400 italic flex items-center gap-2"
        >
          <div className="flex gap-1">
            <m.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: 0 }}
              className="w-1.5 h-1.5 rounded-full bg-emerald-400"
            />
            <m.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: 0.2 }}
              className="w-1.5 h-1.5 rounded-full bg-emerald-400"
            />
            <m.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: 0.4 }}
              className="w-1.5 h-1.5 rounded-full bg-emerald-400"
            />
          </div>
          <span>{displayText}</span>
        </m.div>
      )}
    </AnimatePresence>
  );
}

