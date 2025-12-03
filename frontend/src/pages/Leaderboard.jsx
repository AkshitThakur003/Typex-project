import GlobalLeaderboard from '../components/GlobalLeaderboard.jsx';
import { motion as m } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { usePreferences } from '../settings/PreferencesContext.jsx';
import { Users, TrendingUp, RefreshCw } from 'lucide-react';
import { usePullToRefresh } from '../hooks/usePullToRefresh.js';
import { useSwipeBack } from '../hooks/useSwipeGesture.js';

export default function Leaderboard() {
  const { user } = usePreferences();
  const navigate = useNavigate();
  
  const handleRefresh = async () => {
    // Trigger leaderboard refresh
    window.dispatchEvent(new Event('leaderboard-updated'));
  };

  const { pullDistance, isPulling, isRefreshing, progress } = usePullToRefresh(handleRefresh);
  const { onTouchStart, onTouchMove, onTouchEnd } = useSwipeBack(() => navigate('/'));
  
  return (
    <div 
      className="max-w-5xl mx-auto p-3 sm:p-4 space-y-4"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Pull to refresh indicator */}
      {isPulling && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center safe-area-top">
          <m.div
            animate={{ 
              opacity: isPulling ? 1 : 0,
              y: pullDistance > 0 ? Math.min(pullDistance / 2, 50) : 0
            }}
            className="bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 px-4 py-3 rounded-b-xl shadow-lg"
          >
            <div className="flex items-center gap-2 text-slate-300">
              <RefreshCw 
                className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`}
                style={{ transform: `rotate(${progress * 3.6}deg)` }}
              />
              <span className="text-sm">
                {isRefreshing ? 'Refreshing...' : pullDistance > 80 ? 'Release to refresh' : 'Pull to refresh'}
              </span>
            </div>
          </m.div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <m.h1 initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-xl sm:text-2xl font-semibold">Leaderboard</m.h1>
        {user?.username && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Link
              to="/practice-history"
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium transition touch-target min-h-[44px]"
            >
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Practice History</span>
              <span className="sm:hidden">History</span>
            </Link>
            <Link
              to="/personal-races"
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium transition touch-target min-h-[44px]"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Multiplayer History</span>
              <span className="sm:hidden">Races</span>
            </Link>
          </div>
        )}
      </div>
      <GlobalLeaderboard />
    </div>
  );
}
