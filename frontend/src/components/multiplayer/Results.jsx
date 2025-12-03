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
import { Avatar } from '../common';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { RotateCcw, Home, Zap } from 'lucide-react';

export default function Results({ ended, onPlayAgain, onBackToLobby, onQuickRematch, wpmData, isHost }) {
  if (!ended) return null;
  const players = Array.isArray(ended?.results) ? ended.results.slice() : [];
  // Sort by placement
  const results = players.sort((a, b) => (b.wpm - a.wpm) || (b.accuracy - a.accuracy));
  const top3 = results.slice(0, 3);
  const others = results.slice(3);
  const winner = top3[0];
  const { width, height } = useWindowSize();
  
  const teamMode = ended?.teamMode || false;
  const teamResults = ended?.teamResults;
  const winningTeam = ended?.winningTeam;

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
      {/* Celebration Header with confetti */}
      {teamMode && teamResults && winningTeam && winningTeam !== 'tie' ? (
        <m.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            🏆 {winningTeam === 'red' ? <span className="text-red-400">Red Team</span> : <span className="text-blue-400">Blue Team</span>} Wins!
          </h1>
          <p className="text-slate-300 font-medium">
            <span className="text-emerald-400">{winningTeam === 'red' ? teamResults.red.avgWpm : teamResults.blue.avgWpm} WPM</span> Average • {winningTeam === 'red' ? teamResults.red.avgAccuracy : teamResults.blue.avgAccuracy}% Accuracy
          </p>
          <div className="fixed inset-0 -z-10 pointer-events-none">
            <Confetti width={width} height={height} recycle={false} numberOfPieces={250} colors={winningTeam === 'red' ? ['#ef4444', '#f87171'] : ['#3b82f6', '#60a5fa']} />
          </div>
        </m.div>
      ) : teamMode && winningTeam === 'tie' ? (
        <m.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            🤝 It's a Tie!
          </h1>
          <p className="text-slate-300">Both teams performed equally well!</p>
        </m.div>
      ) : winner && (
        <m.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative text-center">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <Avatar name={winner.name} size={64} isMe={false} />
              <div className="absolute -top-3 -right-3 text-4xl">👑</div>
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">
                Winner: <span className="text-amber-400">{winner.name}</span>
              </h1>
              <p className="text-lg text-slate-300">
                <span className="font-mono font-bold text-emerald-400">{winner.wpm} WPM</span> • {winner.accuracy}% Accuracy
              </p>
            </div>
          </div>
          <div className="fixed inset-0 -z-10 pointer-events-none">
            <Confetti width={width} height={height} recycle={false} numberOfPieces={250} />
          </div>
        </m.div>
      )}

      {/* Team Results (Team Mode Only) */}
      {teamMode && teamResults && (
        <div className="w-full max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Red Team Card */}
            <m.div
              initial={{ scale: 0.9, opacity: 0, x: -20 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              className={`rounded-xl p-6 border transition-all relative overflow-hidden ${
                winningTeam === 'red' 
                  ? 'bg-gradient-to-br from-red-900/40 to-slate-900 border-red-500/50 shadow-lg shadow-red-900/20' 
                  : 'bg-slate-900/60 border-slate-800 grayscale opacity-80'
              }`}
            >
              {winningTeam === 'red' && <div className="absolute top-0 right-0 p-2 text-2xl">🏆</div>}
              <div className="text-center relative z-10">
                <h3 className="text-xl font-bold text-red-400 mb-4 uppercase tracking-wider">Red Team</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-slate-900/50 rounded-lg p-3 border border-red-500/20">
                    <div className="text-2xl font-bold text-white">{teamResults.red.avgWpm}</div>
                    <div className="text-xs text-red-300 uppercase font-bold">Avg WPM</div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3 border border-red-500/20">
                    <div className="text-2xl font-bold text-white">{teamResults.red.avgAccuracy}%</div>
                    <div className="text-xs text-red-300 uppercase font-bold">Avg Acc</div>
                  </div>
                </div>
                <div className="text-xs text-slate-400">{teamResults.red.players} Players</div>
              </div>
            </m.div>

            {/* Blue Team Card */}
            <m.div
              initial={{ scale: 0.9, opacity: 0, x: 20 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className={`rounded-xl p-6 border transition-all relative overflow-hidden ${
                winningTeam === 'blue' 
                  ? 'bg-gradient-to-br from-blue-900/40 to-slate-900 border-blue-500/50 shadow-lg shadow-blue-900/20' 
                  : 'bg-slate-900/60 border-slate-800 grayscale opacity-80'
              }`}
            >
              {winningTeam === 'blue' && <div className="absolute top-0 right-0 p-2 text-2xl">🏆</div>}
              <div className="text-center relative z-10">
                <h3 className="text-xl font-bold text-blue-400 mb-4 uppercase tracking-wider">Blue Team</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-slate-900/50 rounded-lg p-3 border border-blue-500/20">
                    <div className="text-2xl font-bold text-white">{teamResults.blue.avgWpm}</div>
                    <div className="text-xs text-blue-300 uppercase font-bold">Avg WPM</div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3 border border-blue-500/20">
                    <div className="text-2xl font-bold text-white">{teamResults.blue.avgAccuracy}%</div>
                    <div className="text-xs text-blue-300 uppercase font-bold">Avg Acc</div>
                  </div>
                </div>
                <div className="text-xs text-slate-400">{teamResults.blue.players} Players</div>
              </div>
            </m.div>
          </div>
        </div>
      )}

      {/* Podium + Leaderboard */}
      <div className="w-full max-w-4xl space-y-6">
        {/* Podium - Only show if we have top 3 */}
        {top3.length > 0 && (
          <div className="grid grid-cols-3 gap-4 items-end">
            {/* 2nd Place */}
            {top3[1] && (
              <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-slate-800/60 border border-slate-700 rounded-t-xl p-4 flex flex-col items-center text-center h-32 justify-end relative overflow-hidden"
              >
                <div className="absolute inset-x-0 bottom-0 h-1 bg-slate-400" />
                <div className="mb-2">
                  <Avatar name={top3[1].name} size={40} isMe={false} />
                </div>
                <div className="font-bold text-slate-200 truncate w-full text-sm">{top3[1].name}</div>
                <div className="text-xs text-slate-400 mt-1">{top3[1].wpm} WPM</div>
                <div className="absolute top-2 text-xl">🥈</div>
              </m.div>
            )}

            {/* 1st Place */}
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-900/20 border border-amber-600/30 rounded-t-xl p-4 flex flex-col items-center text-center h-40 justify-end relative overflow-hidden shadow-lg shadow-amber-900/10 z-10"
            >
              <div className="absolute inset-x-0 bottom-0 h-1 bg-amber-500" />
              <div className="mb-2 ring-4 ring-amber-500/20 rounded-full">
                <Avatar name={top3[0].name} size={56} isMe={false} />
              </div>
              <div className="font-bold text-white truncate w-full">{top3[0].name}</div>
              <div className="text-sm text-amber-400 font-mono mt-1">{top3[0].wpm} WPM</div>
              <div className="absolute top-2 text-2xl">🥇</div>
            </m.div>

            {/* 3rd Place */}
            {top3[2] && (
              <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-orange-900/10 border border-orange-800/30 rounded-t-xl p-4 flex flex-col items-center text-center h-28 justify-end relative overflow-hidden"
              >
                <div className="absolute inset-x-0 bottom-0 h-1 bg-orange-700" />
                <div className="mb-2">
                  <Avatar name={top3[2].name} size={40} isMe={false} />
                </div>
                <div className="font-bold text-slate-200 truncate w-full text-sm">{top3[2].name}</div>
                <div className="text-xs text-slate-400 mt-1">{top3[2].wpm} WPM</div>
                <div className="absolute top-2 text-xl">🥉</div>
              </m.div>
            )}
          </div>
        )}

        {/* Leaderboard List */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800 bg-slate-900/80">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-5">Player</div>
            <div className="col-span-3 text-right">Speed</div>
            <div className="col-span-3 text-right">Accuracy</div>
          </div>
          <div className="divide-y divide-slate-800/50">
            {results.map((p, idx) => (
              <m.div
                key={p.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="grid grid-cols-12 gap-4 p-3 items-center hover:bg-slate-800/30 transition-colors"
              >
                <div className="col-span-1 text-center font-mono text-slate-500">{idx + 1}</div>
                <div className="col-span-5 flex items-center gap-3 overflow-hidden">
                  <Avatar name={p.name} size={28} isMe={false} />
                  <div className="truncate min-w-0 flex flex-col">
                    <span className="text-sm font-medium text-slate-200 truncate">{p.name}</span>
                    {teamMode && p.team && (
                      <span className={`text-[10px] font-bold uppercase ${p.team === 'red' ? 'text-red-400' : 'text-blue-400'}`}>
                        {p.team} Team
                      </span>
                    )}
                  </div>
                </div>
                <div className="col-span-3 text-right font-mono text-emerald-400 font-medium">{p.wpm} WPM</div>
                <div className="col-span-3 text-right text-slate-400">{p.accuracy}%</div>
              </m.div>
            ))}
          </div>
        </div>
      </div>

      {/* WPM Progress Chart */}
      <div className="w-full max-w-5xl bg-slate-900/70 border border-slate-800 rounded-xl p-6 shadow-lg">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Live Progress</h3>
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart>
              <XAxis dataKey="time" type="number" domain={[0, 'auto']} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: '#334155' }} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: '#334155' }} tickLine={false} />
              <Tooltip 
                contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '0.5rem', color: '#fff', fontSize: '12px' }}
                itemStyle={{ padding: 0 }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
              {series.map((s, i) => (
                <Line
                  key={s.playerId}
                  type="monotone"
                  data={s.wpmHistory}
                  dataKey="wpm"
                  name={s.name}
                  stroke={colorMap.get(s.playerId) || palette[i % palette.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                  isAnimationActive
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap gap-4 justify-center pt-4 border-t border-slate-800 w-full">
        {/* Quick Rematch - Host only */}
        {isHost && onQuickRematch && (
          <m.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onQuickRematch}
            className="px-6 py-3 rounded-lg bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition-all flex items-center gap-2"
          >
            <Zap className="w-4 h-4" /> Quick Rematch
          </m.button>
        )}
        <m.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onPlayAgain}
          className="px-6 py-3 rounded-lg bg-slate-700 text-white font-semibold hover:bg-slate-600 transition-all border border-slate-600 flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" /> New Room
        </m.button>
        <m.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onBackToLobby}
          className="px-6 py-3 rounded-lg bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 hover:text-white transition-all border border-slate-700 flex items-center gap-2"
        >
          <Home className="w-4 h-4" /> Lobby
        </m.button>
      </div>
    </div>
  );
}
