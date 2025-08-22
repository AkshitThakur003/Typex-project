import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { motion } from 'framer-motion';
import { usePreferences } from '../settings/PreferencesContext.jsx';

export default function GlobalLeaderboard() {
  const { user, preferences } = usePreferences();
  const [tab, setTab] = useState('practice'); // 'practice' | 'multiplayer'
  const [rows, setRows] = useState([]);
  const [mine, setMine] = useState(null);
  const username = typeof localStorage !== 'undefined' ? localStorage.getItem('username') : '';

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const endpoint = tab === 'practice' ? '/api/leaderboard/practice' : '/api/leaderboard/multiplayer';
        const [{ data: g }, mineRes] = await Promise.all([
          api.get(endpoint),
          username ? api.get(`/api/leaderboard/user/${encodeURIComponent(username)}?mode=${tab}`) : Promise.resolve({ data: null }),
        ]);
        if (!ignore) {
          setRows(g?.rows || []);
          setMine(mineRes?.data || null);
        }
      } catch (e) {
        // ignore errors to avoid UX jank
      }
    }
    load();
    const id = setInterval(load, 5000);
    return () => { ignore = true; clearInterval(id); };
  }, [tab, username]);

  return (
    <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4 space-y-3">
      {/* Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setTab('practice')}
          className={(tab === 'practice'
            ? 'bg-emerald-600 text-black'
            : 'bg-slate-800 text-slate-200 hover:bg-slate-700') + ' px-3 py-1.5 rounded border border-slate-700 text-sm font-medium transition'}
          aria-pressed={tab === 'practice'}
        >
          Practice
        </button>
        <button
          onClick={() => setTab('multiplayer')}
          className={(tab === 'multiplayer'
            ? 'bg-emerald-600 text-black'
            : 'bg-slate-800 text-slate-200 hover:bg-slate-700') + ' px-3 py-1.5 rounded border border-slate-700 text-sm font-medium transition'}
          aria-pressed={tab === 'multiplayer'}
        >
          Multiplayer
        </button>
        <div className="ml-auto text-xs text-slate-400">{tab === 'practice' ? 'Practice Leaderboard' : 'Multiplayer Leaderboard'}</div>
      </div>

      {/* Leaderboard list */}
      <motion.div initial="hidden" animate="show" variants={{ hidden:{}, show:{ transition:{ staggerChildren: 0.05 } } }} className="space-y-2">
        {rows.map((r,i)=> (
          <motion.div key={`${tab}-${r.username}-${i}`} variants={{ hidden:{ opacity:0, y:6 }, show:{ opacity:1, y:0 } }} className="flex items-center justify-between bg-slate-800 rounded px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm">#{i+1}</span>
              {/* Avatar logic consistent with preferences */}
              {user && r.username === user.username ? (
                preferences?.avatarUrl ? (
                  <img src={preferences.avatarUrl} alt="avatar" className="w-6 h-6 md:w-8 md:h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-slate-700/70 flex items-center justify-center text-xs md:text-sm">
                    <span>{preferences?.avatarEmoji || (r.username || 'U').slice(0,1).toUpperCase()}</span>
                  </div>
                )
              ) : (
                <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-slate-700/70 flex items-center justify-center text-xs md:text-sm">
                  {(r.username || 'U').slice(0,1).toUpperCase()}
                </div>
              )}
              <span className="truncate max-w-[10rem] sm:max-w-[14rem]">{r.username}</span>
            </div>
            <div className="text-xs text-slate-300 whitespace-nowrap">{r.wpm} wpm • {r.accuracy}%</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Your best - contextual */}
      {mine && (
        <div className="text-xs text-slate-400">Your best ({tab}): {Math.round(mine.bestWpm || 0)} wpm • {Math.round(mine.bestAccuracy || 0)}% • Games: {mine.games || 0}</div>
      )}
    </div>
  );
}
