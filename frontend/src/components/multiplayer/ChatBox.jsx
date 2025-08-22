import { useEffect, useRef, useState } from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';

export default function ChatBox({ messages = [], onSend, disabled, collapsedOnMobile = true }) {
  const [text, setText] = useState('');
  const [open, setOpen] = useState(!collapsedOnMobile);
  const endRef = useRef(null);

  const fmtTime = (ts) => {
    try {
      if (!ts) return '';
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend?.(text);
    setText('');
  };

  return (
    <div className="bg-slate-900/70 rounded-xl shadow border border-slate-800">
      <button
        className="w-full text-left p-3 text-sm font-semibold text-slate-300 border-b border-slate-800/80 xl:hidden"
        onClick={() => setOpen((v) => !v)}
      >
        Chat {open ? '▾' : '▸'}
      </button>
      <AnimatePresence initial={false}>
        {(open || !collapsedOnMobile) && (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
              {messages.map((mssg, idx) => (
                <m.div
                  key={idx}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className={"text-sm " + (mssg.system ? 'opacity-80' : '')}
                >
                  {!mssg.system && (
                    <>
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-700 text-[10px] mr-2">
                        {(mssg.name || 'A').slice(0,1).toUpperCase()}
                      </span>
                      <span className="text-slate-300 font-medium">{mssg.name || 'Anon'}</span>
                    </>
                  )}
                  {mssg.system && (
                    <span className="text-slate-400 italic">System</span>
                  )}
                  {mssg.ts && (
                    <span className="ml-2 text-[11px] text-slate-500" title={new Date(mssg.ts).toLocaleString()} aria-label={`Sent at ${fmtTime(mssg.ts)}`}>
                      {fmtTime(mssg.ts)}
                    </span>
                  )}
                  <span className="text-slate-400">: {mssg.text}</span>
                </m.div>
              ))}
              <div ref={endRef} />
            </div>
            <form onSubmit={submit} className="border-t border-slate-800/80 p-3 flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={disabled}
                placeholder={disabled ? 'Join a room to chat' : 'Type a message'}
                className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 outline-none focus:border-slate-500"
              />
              <button
                disabled={disabled}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded"
              >
                Send
              </button>
            </form>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
