import { useState } from 'react';
import { motion as m } from 'framer-motion';
import { Rocket } from 'lucide-react';

// Create Room Card: Select word count and create room. Shows Start when host and room is ready.
export default function CreateRoomForm({
  wordCount: initialWordCount = 25,
  onWordCountChange,
  onCreate,
  canStart = false,
  isHost = false,
  onStart,
}) {
  const [wordCount, setWordCount] = useState(initialWordCount);
  const [roomName, setRoomName] = useState('');

  const handleChange = (e) => {
    const val = Number(e.target.value);
    setWordCount(val);
    onWordCountChange?.(val);
  };

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-slate-900/70 backdrop-blur-md rounded-xl border border-slate-800 shadow-lg hover:shadow-emerald-600/10 hover:-translate-y-0.5 transition-all duration-200 p-5"
      aria-label="Create Room Card"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-white">Create Room</h2>
        <span className="text-xs text-slate-400">Choose settings</span>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col">
          <label htmlFor="roomName" className="text-xs text-slate-300 mb-1">Room name</label>
          <input
            id="roomName"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="e.g. Friday Night Sprint"
            className="w-full bg-slate-800/90 text-slate-100 border border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="wordCount" className="text-xs text-slate-300 mb-1">
            Word count
          </label>
          <select
            id="wordCount"
            aria-label="Select word count"
            value={wordCount}
            onChange={handleChange}
            className="w-full bg-slate-800/90 text-slate-100 border border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            {[10, 25, 50, 75, 100].map((n) => (
              <option key={n} value={n}>{n} words</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-3 mt-5">
        <m.button
          whileTap={{ scale: 0.98 }}
          onClick={() => onCreate?.({ wordCount, roomName })}
          className="relative px-4 py-2 rounded-lg bg-emerald-500 text-black font-semibold shadow-md shadow-emerald-500/20 hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900"
          aria-label="Create Room"
        >
          <span className="inline-flex items-center gap-2"><Rocket size={16} /> Create</span>
        </m.button>

        {isHost && (
          <m.button
            whileTap={{ scale: 0.98 }}
            onClick={onStart}
            disabled={!canStart}
            className="px-4 py-2 rounded-lg border border-slate-600 text-slate-100 hover:border-emerald-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900"
            aria-label="Start Game"
          >
            Start Game
          </m.button>
        )}
      </div>
    </m.div>
  );
}
