import { useEffect, useState, useMemo, useCallback } from 'react';
import { api } from '../lib/api';
import { motion } from 'framer-motion';
import { usePreferences } from '../settings/PreferencesContext.jsx';
import { Avatar, SkeletonLeaderboardRow, SkeletonStatCard } from './common';
import { Trophy, TrendingUp, Award, Zap, BarChart3, Clock, Search, Calendar, X } from 'lucide-react';
import { AVATAR_EMOJI } from '../utils/avatars.js';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

// Time period options
const TIME_PERIODS = [
  { key: 'all', label: 'All Time' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
];

export default function GlobalLeaderboard() {
  const { user, preferences } = usePreferences();
  const [tab, setTab] = useState('practice'); // 'practice' | 'multiplayer'
  const [rows, setRows] = useState([]);
  const [mine, setMine] = useState(null);
  const [showChart, setShowChart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [timePeriod, setTimePeriod] = useState('all');
  const username = user?.username || (typeof localStorage !== 'undefined' ? localStorage.getItem('username') : '');

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        setLoading(true);
        const endpoint = tab === 'practice' ? '/api/leaderboard/practice' : '/api/leaderboard/multiplayer';
        // Add time period filter to endpoint
        const timeParam = timePeriod !== 'all' ? `?period=${timePeriod}` : '';
        console.log('[GlobalLeaderboard] Loading:', { endpoint, username, tab, timePeriod });
        const [{ data: g }, mineRes] = await Promise.all([
          api.get(`${endpoint}${timeParam}`),
          username ? api.get(`/api/leaderboard/user/${encodeURIComponent(username)}?mode=${tab}`) : Promise.resolve({ data: null }),
        ]);
        if (!ignore) {
          console.log('[GlobalLeaderboard] Loaded:', { rows: g?.rows?.length || 0, mine: mineRes?.data });
          setRows(g?.rows || []);
          setMine(mineRes?.data || null);
        }
      } catch (e) {
        console.error('[GlobalLeaderboard] Error loading:', e);
        // ignore errors to avoid UX jank
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    // Poll every 30 seconds instead of 5 to avoid rate limiting
    const id = setInterval(load, 30000);
    
    // Listen for leaderboard update events
    const handleUpdate = () => {
      console.log('[GlobalLeaderboard] Received update event, refreshing...');
      load();
    };
    window.addEventListener('leaderboard-updated', handleUpdate);
    
    return () => { 
      ignore = true; 
      clearInterval(id);
      window.removeEventListener('leaderboard-updated', handleUpdate);
    };
  }, [tab, username, timePeriod]);

  // Filter rows by search query
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const query = searchQuery.toLowerCase().trim();
    return rows.filter(r => r.username?.toLowerCase().includes(query));
  }, [rows, searchQuery]);

  // Prepare chart data for top 10
  const chartData = useMemo(() => {
    return filteredRows.slice(0, 10).map((r, i) => ({
      name: r.username?.substring(0, 8) || 'User',
      wpm: r.wpm || 0,
      accuracy: r.accuracy || 0,
      rank: i + 1,
    }));
  }, [filteredRows]);

  // Get top 3 for special styling (only when not searching)
  const showPodium = !searchQuery.trim();
  const top3 = showPodium ? filteredRows.slice(0, 3) : [];
  const others = showPodium ? filteredRows.slice(3) : filteredRows;

  // Medal colors
  const medalColors = {
    1: { bg: 'from-amber-900/40 to-slate-800', border: 'border-amber-600/50', text: 'text-amber-400', icon: '🥇' },
    2: { bg: 'from-slate-700/40 to-slate-800', border: 'border-slate-500/50', text: 'text-slate-300', icon: '🥈' },
    3: { bg: 'from-orange-900/30 to-slate-800', border: 'border-orange-700/50', text: 'text-orange-400', icon: '🥉' },
  };

  return (
    <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4 space-y-4">
      {/* Header with Controls */}
      <div className="space-y-3">
        {/* Tab and Chart Toggle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab('practice')}
              className={(tab === 'practice'
                ? 'bg-emerald-600 text-black'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700') + ' px-3 sm:px-4 py-2 rounded border border-slate-700 text-xs sm:text-sm font-medium transition touch-target min-h-[44px]'}
              aria-pressed={tab === 'practice'}
            >
              Practice
            </button>
            <button
              onClick={() => setTab('multiplayer')}
              className={(tab === 'multiplayer'
                ? 'bg-emerald-600 text-black'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700') + ' px-3 sm:px-4 py-2 rounded border border-slate-700 text-xs sm:text-sm font-medium transition touch-target min-h-[44px]'}
              aria-pressed={tab === 'multiplayer'}
            >
              Multiplayer
            </button>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowChart(!showChart)}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm transition touch-target min-h-[44px]"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">{showChart ? 'Hide' : 'Show'}</span> Chart
            </button>
          </div>
        </div>

        {/* Time Period Filter & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Time Period Filter */}
          <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1">
            <Calendar className="w-4 h-4 text-slate-400 ml-2" />
            {TIME_PERIODS.map(period => (
              <button
                key={period.key}
                onClick={() => setTimePeriod(period.key)}
                className={`px-2 sm:px-3 py-2 rounded text-xs font-medium transition touch-target min-h-[44px] ${
                  timePeriod === period.key
                    ? 'bg-emerald-600 text-black'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Search Results Info */}
        {searchQuery && (
          <div className="text-xs text-slate-400">
            Found {filteredRows.length} player{filteredRows.length !== 1 ? 's' : ''} matching "{searchQuery}"
          </div>
        )}
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <SkeletonStatCard key={i} />
            ))}
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonLeaderboardRow key={i} />
          ))}
        </div>
      )}

      {/* Chart View */}
      {!loading && showChart && chartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-slate-800/50 rounded-lg p-4 border border-slate-700"
        >
          <h3 className="text-sm font-semibold text-white mb-4">Top 10 Performance</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                dataKey="name" 
                stroke="#94a3b8" 
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: "#1e293b", 
                  border: "1px solid #334155", 
                  borderRadius: "8px",
                  color: "#fff"
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Legend />
              <Bar dataKey="wpm" fill="#f97316" radius={[8, 8, 0, 0]} name="WPM">
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index < 3 ? (index === 0 ? "#f59e0b" : index === 1 ? "#94a3b8" : "#b45309") : "#f97316"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Top 3 Podium */}
      {!loading && top3.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
          {top3.map((r, i) => {
            const rank = i + 1;
            const colors = medalColors[rank];
            return (
              <motion.div
                key={`top-${rank}-${r.username}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`bg-gradient-to-br ${colors.bg} rounded-xl p-2 sm:p-4 border ${colors.border} ${
                  rank === 1 ? 'ring-2 ring-amber-500/30' : ''
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="text-lg sm:text-2xl mb-1 sm:mb-2">{colors.icon}</div>
                  <Avatar 
                    name={r.username || 'User'} 
                    size={32} 
                    imageUrl={r.avatarUrl || r.oauthAvatar}
                    emoji={r.avatarChoice ? AVATAR_EMOJI[r.avatarChoice] : null}
                    isMe={user && r.username === user.username}
                  />
                  <div className="mt-1 sm:mt-2">
                    <p className={`text-xs sm:text-sm font-bold ${colors.text} truncate max-w-[60px] sm:max-w-[100px]`}>
                      {r.username}
                    </p>
                    <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">
                      {r.wpm} WPM
                    </p>
                    <p className="text-[10px] sm:text-xs text-slate-500">
                      {r.accuracy}%
                    </p>
                    {r.finishTime && (
                      <p className="text-[10px] sm:text-xs text-slate-500">
                        {r.finishTime}s
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Leaderboard list */}
      {!loading && (
      <motion.div 
        initial="hidden" 
        animate="show" 
        variants={{ hidden:{}, show:{ transition:{ staggerChildren: 0.03 } } }} 
        className="space-y-2"
      >
        {others.map((r, i) => {
          const rank = i + 4;
          const isMe = user && r.username === user.username;
          return (
            <motion.div 
              key={`${tab}-${r.username}-${rank}`} 
              variants={{ hidden:{ opacity:0, y:6 }, show:{ opacity:1, y:0 } }}
              className={`flex items-center justify-between bg-slate-800 rounded-lg px-2 sm:px-3 py-2 sm:py-2.5 transition-all ${
                isMe ? 'ring-2 ring-emerald-500/50 bg-emerald-900/20' : 'hover:bg-slate-750'
              }`}
            >
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="flex items-center gap-1 sm:gap-2 min-w-[2rem] sm:min-w-[3rem]">
                  <span className={`text-xs sm:text-sm font-mono ${rank <= 10 ? 'text-slate-300' : 'text-slate-500'}`}>
                    #{rank}
                  </span>
                  {rank <= 10 && (
                    <Trophy className="w-3 h-3 text-amber-500 hidden sm:block" />
                  )}
                </div>
                <Avatar 
                  name={r.username || 'User'} 
                  size={28} 
                  imageUrl={r.avatarUrl || r.oauthAvatar}
                  emoji={r.avatarChoice ? AVATAR_EMOJI[r.avatarChoice] : null}
                  isMe={isMe}
                />
                <span className={`truncate max-w-[6rem] sm:max-w-[14rem] text-xs sm:text-sm ${isMe ? 'font-semibold text-emerald-400' : 'text-slate-200'}`}>
                  {r.username}
                  {isMe && <span className="ml-1 sm:ml-2 text-[10px] sm:text-xs">(You)</span>}
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-slate-300 whitespace-nowrap">
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <Zap className="w-3 h-3 text-orange-400" />
                  <span className="font-semibold text-orange-400">{r.wpm}</span>
                  <span className="text-slate-500 hidden sm:inline">wpm</span>
                </div>
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <Award className="w-3 h-3 text-emerald-400" />
                  <span className="font-semibold text-emerald-400">{r.accuracy}%</span>
                </div>
                {r.finishTime && (
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    <span className="font-semibold text-cyan-400">{r.finishTime}s</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
      )}

      {/* Your best - enhanced */}
      {username && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gradient-to-r from-emerald-900/30 to-slate-800 rounded-lg p-4 border border-emerald-800/30"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-semibold text-white">Your Best ({tab})</span>
            </div>
            {mine ? (
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Zap className="w-4 h-4 text-orange-400" />
                  <span className="font-bold text-orange-400">{Math.round(mine.bestWpm || 0)}</span>
                  <span className="text-slate-400">WPM</span>
                </div>
                <div className="flex items-center gap-1">
                  <Award className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-emerald-400">{Math.round(mine.bestAccuracy || 0)}%</span>
                  <span className="text-slate-400">Accuracy</span>
                </div>
                <div className="text-slate-400">
                  <span className="font-semibold">{mine.games || 0}</span> games
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-400">0 WPM • 0% • 0 games</div>
            )}
          </div>
          {mine && rows.length > 0 && (() => {
            const userRank = rows.findIndex(r => r.username === username);
            return userRank >= 0 ? (
              <div className="mt-3 pt-3 border-t border-slate-700">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>Your rank: </span>
                  <span className="font-semibold text-emerald-400">
                    #{userRank + 1}
                  </span>
                  <span className="text-slate-500">out of {rows.length}</span>
                </div>
              </div>
            ) : null;
          })()}
        </motion.div>
      )}
      {!username && (
        <div className="text-xs text-slate-400 text-center py-2 bg-slate-800/50 rounded-lg">
          Login to see your stats and rank
        </div>
      )}
    </div>
  );
}
