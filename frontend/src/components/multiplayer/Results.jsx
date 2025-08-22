import { motion as m } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import Avatar from '../Avatar.jsx';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

export default function Results({ ended, onPlayAgain, onBackToLobby, wpmData }) {
  if (!ended) return null;
  const players = Array.isArray(ended?.results) ? ended.results.slice() : [];
  // Sort by placement
  const results = players.sort((a, b) => (b.wpm - a.wpm) || (b.accuracy - a.accuracy));
  const top3 = results.slice(0, 3);
  const others = results.slice(3);
  const winner = top3[0];
  const { width, height } = useWindowSize();

  // Build per-player series from either server wpmHistory or client-collected wpmData fallback
  const series = results.map((p) => ({
    playerId: p.id,
    name: p.name,
    wpmHistory: (p.wpmHistory && p.wpmHistory.length) ? p.wpmHistory : (wpmData?.[p.id] || []),
  }));
  // Color map aligned with podium
  const palette = ["#22d3ee", "#3b82f6", "#10b981", "#a78bfa", "#f472b6", "#94a3b8"]; // cyan, blue, green, violet, pink, slate
  const podiumColors = ["#f59e0b", "#94a3b8", "#b45309"]; // gold, silver-ish, bronze
  const colorMap = new Map();
  top3.forEach((p, i) => colorMap.set(p.id, podiumColors[i]));
  results.forEach((p, i) => {
    if (!colorMap.has(p.id)) colorMap.set(p.id, palette[(i - 3) % palette.length]);
  });
  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-6xl mx-auto p-6">
      {/* Celebration Header with confetti (single winner mention) */}
      {winner && (
        <m.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative text-center">
          <div className="flex items-center justify-center gap-3">
            <Avatar name={winner.name} size={44} isMe={false} />
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              🏆 Winner: <span className="text-amber-400">{winner.name}</span> <span className="text-slate-300">({winner.wpm} WPM • {winner.accuracy}%)</span>
            </h1>
          </div>
          <div className="fixed inset-0 -z-10 pointer-events-none">
            <Confetti width={width} height={height} recycle={false} numberOfPieces={winner ? 220 : 0} />
          </div>
        </m.div>
      )}

      {/* Podium + Leaderboard */}
      <div className="w-full max-w-4xl">
        {/* Podium */}
        <div className="grid grid-cols-3 gap-2 items-end mb-4">
          {top3.map((p, i) => (
            <m.div
              key={p.id}
              initial={{ scale: 0.9, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ delay: 0.05 * i }}
              className={[
                'rounded-lg text-center p-3 border',
                i === 0
                  ? 'bg-amber-900/30 border-amber-700/40'
                  : i === 1
                    ? 'bg-slate-700/40 border-slate-500/40'
                    : 'bg-orange-900/30 border-orange-700/40',
              ].join(' ')}
            >
              <div className="text-2xl">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</div>
              <div className="flex items-center justify-center gap-2 text-slate-200">
                <Avatar name={p.name} size={28} isMe={false} />
                <span className="truncate max-w-[8rem] sm:max-w-[12rem]">{p.name}</span>
              </div>
              <div className="text-xs text-slate-300">{p.wpm} WPM • {p.accuracy}%</div>
            </m.div>
          ))}
        </div>

        {/* Others list */}
        {others.length > 0 && (
          <m.ul
            initial="hidden"
            animate="visible"
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }}
            className="space-y-2"
          >
            {others.map((p, idx) => (
              <m.li
                key={p.id}
                variants={{ hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } }}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-800/70 border border-slate-700/80"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-slate-400 w-6 text-right">{idx + 4}.</span>
                  <Avatar name={p.name} size={24} isMe={false} />
                  <span className="text-white truncate max-w-[10rem] sm:max-w-[16rem]">{p.name}</span>
                </div>
                <div className="text-xs text-slate-300">{p.wpm} WPM • {p.accuracy}%</div>
              </m.li>
            ))}
          </m.ul>
        )}
      </div>

  {/* WPM Progress Chart */}
      <div className="w-full max-w-5xl bg-slate-900/70 border border-slate-800 rounded-xl p-4 shadow">
        <h3 className="text-lg font-semibold text-white mb-3">Live WPM Progress (All Players)</h3>
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart>
              <XAxis dataKey="time" type="number" domain={[0, 'auto']} tick={{ fill: '#cbd5e1' }} label={{ value: 'Time (s)', position: 'insideBottom', fill: '#cbd5e1' }} />
              <YAxis tick={{ fill: '#cbd5e1' }} label={{ value: 'WPM', angle: -90, position: 'insideLeft', fill: '#cbd5e1' }} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1f2937', color: '#fff' }} />
              <Legend wrapperStyle={{ color: '#cbd5e1' }} />
              {series.map((s, i) => (
                <Line
                  key={s.playerId}
                  type="monotone"
                  data={s.wpmHistory}
                  dataKey="wpm"
                  name={s.name}
                  stroke={colorMap.get(s.playerId) || palette[i % palette.length]}
                  strokeWidth={3}
                  dot={false}
                  isAnimationActive
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary: keep only reason here to avoid duplicate winner mention */}
      <div className="w-full max-w-3xl text-slate-300 text-center">
        <p>Reason: {ended?.reason || 'finished'}</p>
      </div>

    {/* Buttons */}
  <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={onPlayAgain}
      className="px-6 py-3 rounded-lg bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition shadow"
        >
          🔁 Play Again
        </button>
        <button
          onClick={onBackToLobby}
      className="px-6 py-3 rounded-lg bg-slate-700 text-white font-semibold hover:bg-slate-600 transition border border-slate-600"
        >
          🏠 Back to Lobby
        </button>
      </div>
    </div>
  );
}
