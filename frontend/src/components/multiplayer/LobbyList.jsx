import { motion as m, AnimatePresence } from 'framer-motion';

export default function LobbyList({ rooms = [], onJoin, refreshing }) {
  return (
    <div className="bg-slate-900/70 backdrop-blur-md rounded-xl shadow border border-slate-800 p-4 md:p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-300">Lobby</h2>
        {refreshing && <span className="text-xs text-slate-400">refreshing…</span>}
      </div>
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {rooms.length === 0 && (
            <m.div
              key="empty"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="text-sm text-slate-400"
            >
              No rooms yet. Create one to get started.
            </m.div>
          )}
          {rooms.map((r) => (
            <m.div
              key={r.code}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-center justify-between bg-slate-800/70 border border-slate-700/70 rounded px-3 py-2"
            >
              <div className="text-sm">
                <span className="font-medium text-slate-200">{r.name || `Room ${r.code}`}</span>
                <span className="text-slate-400 ml-2">{r.players}/{r.max || 8}</span>
              </div>
              <button
                onClick={() => onJoin?.(r.code)}
                className="px-3 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-500 rounded"
              >
                Join
              </button>
            </m.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
