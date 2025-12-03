// ============================================
// User Profile & Statistics Page
// ============================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion as m, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import { usePreferences } from '../settings/PreferencesContext.jsx';
import { toast } from 'react-hot-toast';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  Trophy,
  Target,
  TrendingUp,
  Award,
  Clock,
  Users,
  Zap,
  BarChart3,
  User,
  Calendar,
  History,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  BarChart2,
} from 'lucide-react';
import { XpBar, XpInfo } from '../components/xp';
import { AVATAR_EMOJI } from '../utils/avatars.js';
import { 
  SkeletonProfileHeader, 
  SkeletonStatCard, 
  SkeletonChart,
  SkeletonCard 
} from '../components/common';

// Simple in-memory cache for profiles
const profileCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedProfile(username) {
  const cached = profileCache.get(username);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCachedProfile(username, data) {
  profileCache.set(username, { data, timestamp: Date.now() });
}

// Pagination constants
const RACES_PER_PAGE = 5;

export default function Profile() {
  const { username } = useParams();
  const { user: currentUser } = usePreferences();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [racesPage, setRacesPage] = useState(1);
  const loadingRef = useRef(false);

  const isOwnProfile = currentUser?.username === username;

  // Load profile with caching
  const loadProfile = useCallback(async (forceRefresh = false) => {
    if (loadingRef.current) return;
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = getCachedProfile(username);
      if (cached) {
        console.log('[Profile] Using cached data for:', username);
        setProfile(cached);
        setLoading(false);
        return;
      }
    }
    
    loadingRef.current = true;
    try {
      setLoading(true);
      setError(null);
      console.log('[Profile] Loading profile for:', username);
      const { data } = await api.get(`/api/profile/${username}`);
      console.log('[Profile] Loaded profile data:', data);
      setProfile(data);
      setCachedProfile(username, data);
    } catch (err) {
      console.error('[Profile] Load error:', err);
      const errorMsg = err?.response?.data?.error || 'Failed to load profile';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [username]);

  useEffect(() => {
    setRacesPage(1); // Reset pagination on username change
    loadProfile();
  }, [username, loadProfile]);

  // Refresh profile data when component becomes visible (e.g., after returning from practice)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && profile) {
        loadProfile(true); // Force refresh on visibility change
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [profile, loadProfile]);
  
  // Listen for leaderboard update events to refresh profile
  useEffect(() => {
    const handleUpdate = () => {
      console.log('[Profile] Received update event, refreshing profile...');
      if (profile) {
        loadProfile(true); // Force refresh on update event
      }
    };
    window.addEventListener('leaderboard-updated', handleUpdate);
    return () => window.removeEventListener('leaderboard-updated', handleUpdate);
  }, [profile, loadProfile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white py-4 sm:py-8 px-3 sm:px-4">
        <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
          {/* Profile Header Skeleton */}
          <SkeletonProfileHeader />
          
          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonStatCard key={i} />
            ))}
          </div>
          
          {/* Additional Stats Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
            {[1, 2, 3].map((i) => (
              <SkeletonStatCard key={i} />
            ))}
          </div>
          
          {/* Chart Skeleton */}
          <SkeletonChart height={256} />
          
          {/* Achievements Skeleton */}
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center text-slate-300">
          <p className="text-xl mb-4">{error || 'Profile not found'}</p>
          <Link
            to="/"
            className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-medium transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const { user, statistics, trends, recentRaces, achievements } = profile;

  // Format trends data for charts (handle empty data gracefully)
  const wpmTrendData = (trends || []).map(t => ({
    date: t._id,
    wpm: Math.round(t.avgWpm || 0),
    accuracy: Math.round(t.avgAccuracy || 0),
  }));

  // Pagination for recent races
  const totalRacesPages = Math.ceil((recentRaces?.length || 0) / RACES_PER_PAGE);
  const paginatedRaces = (recentRaces || []).slice(
    (racesPage - 1) * RACES_PER_PAGE,
    racesPage * RACES_PER_PAGE
  );

  // Get avatar display
  function getAvatar() {
    // Priority: avatarUrl > avatarChoice emoji > initials (OAuth users use initials)
    if (user.avatarUrl) {
      return <img src={user.avatarUrl} alt={user.username} className="w-20 h-20 rounded-full object-cover border-2 border-emerald-400" />;
    }
    if (user.avatarChoice) {
      const emoji = AVATAR_EMOJI[user.avatarChoice] || '👤';
      return (
        <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-emerald-400 flex items-center justify-center text-4xl">
          {emoji}
        </div>
      );
    }
    // Fallback to initials (OAuth users always show initials)
    const initials = (user.username || 'U').slice(0, 1).toUpperCase();
    return (
      <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-emerald-400 flex items-center justify-center text-2xl font-bold text-slate-300">
        {initials}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white py-4 sm:py-8 px-3 sm:px-4">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        {/* Back Button - Only show when viewing other profiles */}
        {!isOwnProfile && (
          <m.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-4"
          >
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-900/70 hover:bg-slate-800 border border-slate-800 text-slate-200 transition-all hover:scale-110 hover:border-emerald-500/50 group"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 group-hover:text-emerald-400 group-hover:-translate-x-1 transition-all" />
            </button>
          </m.div>
        )}

        {/* Header */}
        <m.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl"
        >
              {/* XP Bar */}
              {profile?.user?.xp !== undefined && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-300">Experience</span>
                      <XpInfo variant="icon" />
                    </div>
                    <span className="text-slate-400 text-sm">Total: {profile.user.totalXp?.toLocaleString() || 0} XP</span>
                  </div>
                  <XpBar
                    xp={profile.user.xp || 0}
                    xpToNext={profile.user.xpToNext || 100}
                    level={profile.user.level || 1}
                    totalXp={profile.user.totalXp || 0}
                    size="lg"
                    showTotal={true}
                  />
                </div>
              )}
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {getAvatar()}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl font-bold text-white mb-2">{user.username}</h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-slate-400 text-sm">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
                {isOwnProfile && (
                  <>
                    <Link
                      to="/settings"
                      className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors text-xs"
                    >
                      Edit Profile
                    </Link>
                    <button
                      onClick={() => navigate('/practice-history')}
                      className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors text-xs flex items-center gap-1"
                    >
                      <History className="w-3 h-3" />
                      Practice History
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </m.div>

        {/* Statistics Grid */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4"
        >
          <StatCard
            icon={<Trophy className="w-5 h-5" />}
            label="Best WPM"
            value={statistics.bestWpm}
            color="text-yellow-400"
          />
          <StatCard
            icon={<Target className="w-5 h-5" />}
            label="Best Accuracy"
            value={`${statistics.bestAccuracy}%`}
            color="text-emerald-400"
          />
          <StatCard
            icon={<BarChart3 className="w-5 h-5" />}
            label="Avg WPM"
            value={statistics.avgWpm}
            color="text-blue-400"
          />
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label="Total Races"
            value={statistics.totalRaces}
            color="text-purple-400"
          />
        </m.div>

        {/* Additional Stats */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4"
        >
          <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Users className="w-4 h-4" />
              <span className="text-sm">Multiplayer</span>
            </div>
            <div className="text-2xl font-bold text-white">{statistics.multiplayerRaces}</div>
            <div className="text-xs text-slate-500 mt-1">races played</div>
          </div>
          <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Zap className="w-4 h-4" />
              <span className="text-sm">Practice</span>
            </div>
            <div className="text-2xl font-bold text-white">{statistics.practiceRaces}</div>
            <div className="text-xs text-slate-500 mt-1">races played</div>
          </div>
          <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Award className="w-4 h-4" />
              <span className="text-sm">Win Rate</span>
            </div>
            <div className="text-2xl font-bold text-white">{statistics.winRate}%</div>
            <div className="text-xs text-slate-500 mt-1">{statistics.wins} wins</div>
          </div>
        </m.div>

        {/* Charts */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl"
        >
          <h2 className="text-base sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
            Performance Trends (Last 30 Days)
          </h2>
          {wpmTrendData.length > 0 ? (
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={wpmTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis
                    dataKey="date"
                    stroke="#cbd5e1"
                    tick={{ fill: '#cbd5e1', fontSize: 12 }}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#cbd5e1"
                    tick={{ fill: '#cbd5e1', fontSize: 12 }}
                    label={{ value: 'WPM', angle: -90, position: 'insideLeft', fill: '#cbd5e1' }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#cbd5e1"
                    tick={{ fill: '#cbd5e1', fontSize: 12 }}
                    domain={[0, 100]}
                    label={{ value: 'Accuracy %', angle: 90, position: 'insideRight', fill: '#cbd5e1' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#cbd5e1' }}
                  />
                  <Legend wrapperStyle={{ color: '#cbd5e1' }} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="wpm"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    name="WPM"
                    dot={{ r: 3 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="accuracy"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Accuracy %"
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            /* Empty state for charts */
            <div className="h-48 sm:h-64 flex flex-col items-center justify-center text-slate-400">
              <BarChart2 className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-center">No performance data yet</p>
              <p className="text-sm text-slate-500 mt-1">Complete some races to see your trends!</p>
              <Link
                to="/practice"
                className="mt-4 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors text-sm font-medium"
              >
                Start Practicing
              </Link>
            </div>
          )}
        </m.div>

        {/* Achievements */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-400" />
              Achievements
            </h2>
            <Link
              to={`/profile/${username}/achievements`}
              className="px-4 py-2 text-sm rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all hover:scale-105 font-medium flex items-center gap-2"
            >
              <Award className="w-4 h-4" />
              View All
            </Link>
          </div>
          {achievements.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {achievements.slice(0, 8).map((achievement, idx) => (
                <m.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + idx * 0.05 }}
                  className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <div className="text-4xl mb-2">{achievement.icon}</div>
                  <div className="text-sm font-semibold text-white">{achievement.name}</div>
                  <div className="text-xs text-slate-400 mt-1">{achievement.description}</div>
                </m.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No achievements yet. Start practicing to earn your first achievement!</p>
            </div>
          )}
          {achievements.length > 8 && (
            <div className="mt-4 text-center">
              <Link
                to={`/profile/${username}/achievements`}
                className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                View all {achievements.length} achievements →
              </Link>
            </div>
          )}
        </m.div>

        {/* Recent Races with Pagination */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl"
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            Recent Races
          </h2>
          {recentRaces && recentRaces.length > 0 ? (
            <>
              <div className="space-y-2">
                {paginatedRaces.map((race, idx) => (
                  <m.div
                    key={`${race.createdAt}-${idx}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">
                        {race.mode === 'multiplayer' ? '👥' : '⌨️'}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">
                          {race.mode === 'multiplayer' ? 'Multiplayer' : 'Practice'}
                        </div>
                        <div className="text-xs text-slate-400">
                          {new Date(race.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="text-slate-400 text-xs">WPM</div>
                        <div className="text-white font-semibold">{race.wpm}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-slate-400 text-xs">Accuracy</div>
                        <div className="text-white font-semibold">{race.accuracy}%</div>
                      </div>
                    </div>
                  </m.div>
                ))}
              </div>
              
              {/* Pagination Controls */}
              {totalRacesPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-slate-700">
                  <button
                    onClick={() => setRacesPage(p => Math.max(1, p - 1))}
                    disabled={racesPage === 1}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-slate-400">
                    Page {racesPage} of {totalRacesPages}
                  </span>
                  <button
                    onClick={() => setRacesPage(p => Math.min(totalRacesPages, p + 1))}
                    disabled={racesPage === totalRacesPages}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Empty state for races */
            <div className="py-8 text-center text-slate-400">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No races yet</p>
              <p className="text-sm text-slate-500 mt-1">Start practicing to see your race history!</p>
              <Link
                to="/practice"
                className="inline-block mt-4 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors text-sm font-medium"
              >
                Start Practicing
              </Link>
            </div>
          )}
        </m.div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-xl p-4 hover:bg-slate-900 transition-colors">
      <div className={`flex items-center gap-2 ${color} mb-2`}>
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

