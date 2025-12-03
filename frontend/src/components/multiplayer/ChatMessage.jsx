import { motion as m } from 'framer-motion';
import { Avatar } from '../common';
import { formatTime } from '../../utils/formatters.js';

/**
 * ChatMessage component - Individual chat message with animations
 * Right-aligns own messages, left-aligns others
 */
export default function ChatMessage({ message, isOwn = false, index = 0 }) {

  const isSystem = message.system || message.name === 'System';

  if (isSystem) {
    return (
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className="flex justify-center my-2"
      >
        <div className="px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50 text-xs text-slate-400 text-center">
          {message.text}
        </div>
      </m.div>
    );
  }

  return (
    <m.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`flex items-start gap-2.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar - only show for others, or on left for own messages */}
      {!isOwn && (
        <div className="flex-shrink-0">
          <Avatar name={message.name || 'User'} size={36} />
        </div>
      )}

      {/* Message bubble */}
      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[75%] sm:max-w-[65%]`}>
        {/* Username and timestamp */}
        <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-xs font-semibold text-slate-300">{message.name || 'Anonymous'}</span>
          {message.ts && (
            <span className="text-[10px] text-slate-500">{formatTime(message.ts)}</span>
          )}
        </div>

        {/* Message text */}
        <div
          className={`rounded-2xl px-4 py-2.5 ${
            isOwn
              ? 'bg-emerald-500/20 border border-emerald-500/30 text-slate-100 rounded-br-sm'
              : 'bg-slate-800/80 border border-slate-700/60 text-slate-200 rounded-bl-sm'
          }`}
        >
          <p className="text-sm break-words whitespace-pre-wrap leading-relaxed">{message.text}</p>
        </div>
      </div>

      {/* Avatar - show on right for own messages */}
      {isOwn && (
        <div className="flex-shrink-0">
          <Avatar name={message.name || 'User'} size={36} isMe={true} />
        </div>
      )}
    </m.div>
  );
}

