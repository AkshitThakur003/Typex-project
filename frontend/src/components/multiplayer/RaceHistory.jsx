import { motion as m } from 'framer-motion';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Clock, Trophy, Users, History, AlignLeft } from 'lucide-react';
import { Avatar } from '../common';
import { AVATAR_EMOJI } from '../../utils/avatars.js';

export default function RaceHistory() {
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRaces();
  }, []);

  const loadRaces = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/multiplayer/recent-races?limit=5');
      setRaces(data.races || []);
    } catch (err) {
      console.error('[Race History] Failed to load:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/70 backdrop-blur-md rounded-xl border border-slate-800 shadow-lg p-6 flex flex-col min-h-0 flex-1"
      >
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2 flex-shrink-0">
          <History className="w-5 h-5 text-slate-400" />
          Recent Races
        </h2>
        <div className="flex items-center justify-center py-12 flex-1">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      </m.div>
    );
  }

  if (races.length === 0) {
    return (
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/70 backdrop-blur-md rounded-xl border border-slate-800 shadow-lg p-6 flex flex-col min-h-0 flex-1"
      >
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2 flex-shrink-0">
          <History className="w-5 h-5 text-slate-400" />
          Recent Races
        </h2>
        <div className="text-center py-12 text-slate-400 text-sm bg-slate-800/30 rounded-lg border border-slate-800 border-dashed flex-1 flex items-center justify-center">
          No recent races yet. Be the first to race!
        </div>
      </m.div>
    );
  }

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.1 }}
      className="bg-slate-900/70 backdrop-blur-md rounded-xl border border-slate-800 shadow-lg p-6 flex flex-col min-h-0 flex-1"
    >
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2 flex-shrink-0">
        <History className="w-5 h-5 text-slate-400" />
        Recent Races
      </h2>
      <div className="space-y-3 flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar">
        {races.map((race, idx) => {
          const winner = race.players?.[0];
          const timeAgo = getTimeAgo(race.endedAt);
          
          return (
            <m.div
              key={race._id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group p-3.5 rounded-lg bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/80 hover:border-slate-600/80 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Left: Winner Info */}
                <div className="flex items-center gap-3 min-w-0">
                   <div className="relative flex-shrink-0">
                    <Avatar 
                      name={winner?.username || '?'} 
                      size={32} 
                      isMe={false}
                      imageUrl={winner?.avatarUrl}
                      emoji={winner?.avatarChoice ? AVATAR_EMOJI[winner.avatarChoice] : null}
                    />
                    <div className="absolute -bottom-1 -right-1 bg-amber-500 rounded-full p-0.5 ring-2 ring-slate-800">
                      <Trophy className="w-2 h-2 text-amber-950" />
                    </div>
                  </div>
                  
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white truncate">
                        {winner?.username || 'Unknown'}
                      </span>
                      <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        {winner?.wpm || 0} WPM
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                      <span className="capitalize">{race.difficulty || 'Normal'}</span>
                      <span className="w-0.5 h-0.5 bg-slate-600 rounded-full" />
                      <span>{race.timeLimit}s</span>
                    </div>
                  </div>
                </div>

                {/* Right: Stats */}
                <div className="flex items-center justify-between sm:justify-end gap-4 text-xs text-slate-500 border-t sm:border-t-0 border-slate-800/50 pt-2 sm:pt-0 mt-1 sm:mt-0">
                  <div className="flex items-center gap-1.5 bg-slate-800/50 px-2 py-1 rounded-md">
                    <Users className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-300 font-medium">{race.players?.length || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    <span>{timeAgo}</span>
                  </div>
                </div>
              </div>
            </m.div>
          );
        })}
      </div>
    </m.div>
  );
}

function getTimeAgo(dateString) {
  const now = new Date();
  const past = new Date(dateString);
  const seconds = Math.floor((now - past) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
