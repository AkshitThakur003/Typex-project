// ============================================
// Achievements Page - All Achievements with Progress Tracking
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Award, Trophy, Target, TrendingUp, Users, Zap, CheckCircle2, Circle } from 'lucide-react';
import { api } from '../lib/api';
import { usePreferences } from '../settings/PreferencesContext.jsx';
import { toast } from 'react-hot-toast';

// All available achievements with their requirements
const ALL_ACHIEVEMENTS = [
  // Race count achievements
  { 
    id: 'first-race', 
    name: 'First Race', 
    description: 'Complete your first race', 
    icon: '🎯',
    category: 'Races',
    requirement: { type: 'totalRaces', value: 1 },
    color: 'from-blue-500/20 to-blue-600/10',
    borderColor: 'border-blue-500/30',
  },
  { 
    id: 'rookie', 
    name: 'Rookie', 
    description: 'Complete 10 races', 
    icon: '🏃',
    category: 'Races',
    requirement: { type: 'totalRaces', value: 10 },
    color: 'from-green-500/20 to-green-600/10',
    borderColor: 'border-green-500/30',
  },
  { 
    id: 'veteran', 
    name: 'Veteran', 
    description: 'Complete 50 races', 
    icon: '⭐',
    category: 'Races',
    requirement: { type: 'totalRaces', value: 50 },
    color: 'from-purple-500/20 to-purple-600/10',
    borderColor: 'border-purple-500/30',
  },
  { 
    id: 'champion', 
    name: 'Champion', 
    description: 'Complete 100 races', 
    icon: '👑',
    category: 'Races',
    requirement: { type: 'totalRaces', value: 100 },
    color: 'from-yellow-500/20 to-yellow-600/10',
    borderColor: 'border-yellow-500/30',
  },
  { 
    id: 'legend', 
    name: 'Legend', 
    description: 'Complete 500 races', 
    icon: '🌟',
    category: 'Races',
    requirement: { type: 'totalRaces', value: 500 },
    color: 'from-orange-500/20 to-orange-600/10',
    borderColor: 'border-orange-500/30',
  },
  
  // WPM achievements
  { 
    id: 'speedster', 
    name: 'Speedster', 
    description: 'Reach 30 WPM', 
    icon: '⚡',
    category: 'Speed',
    requirement: { type: 'bestWpm', value: 30 },
    color: 'from-emerald-500/20 to-emerald-600/10',
    borderColor: 'border-emerald-500/30',
  },
  { 
    id: 'fast-typer', 
    name: 'Fast Typer', 
    description: 'Reach 50 WPM', 
    icon: '🚀',
    category: 'Speed',
    requirement: { type: 'bestWpm', value: 50 },
    color: 'from-cyan-500/20 to-cyan-600/10',
    borderColor: 'border-cyan-500/30',
  },
  { 
    id: 'speed-demon', 
    name: 'Speed Demon', 
    description: 'Reach 70 WPM', 
    icon: '🔥',
    category: 'Speed',
    requirement: { type: 'bestWpm', value: 70 },
    color: 'from-red-500/20 to-red-600/10',
    borderColor: 'border-red-500/30',
  },
  { 
    id: 'typing-master', 
    name: 'Typing Master', 
    description: 'Reach 100 WPM', 
    icon: '💨',
    category: 'Speed',
    requirement: { type: 'bestWpm', value: 100 },
    color: 'from-violet-500/20 to-violet-600/10',
    borderColor: 'border-violet-500/30',
  },
  { 
    id: 'typing-god', 
    name: 'Typing God', 
    description: 'Reach 120 WPM', 
    icon: '⚡️',
    category: 'Speed',
    requirement: { type: 'bestWpm', value: 120 },
    color: 'from-pink-500/20 to-pink-600/10',
    borderColor: 'border-pink-500/30',
  },
  
  // Accuracy achievements
  { 
    id: 'accurate', 
    name: 'Accurate', 
    description: 'Achieve 95% accuracy', 
    icon: '🎯',
    category: 'Accuracy',
    requirement: { type: 'bestAccuracy', value: 95 },
    color: 'from-blue-500/20 to-blue-600/10',
    borderColor: 'border-blue-500/30',
  },
  { 
    id: 'precise', 
    name: 'Precise', 
    description: 'Achieve 98% accuracy', 
    icon: '✨',
    category: 'Accuracy',
    requirement: { type: 'bestAccuracy', value: 98 },
    color: 'from-indigo-500/20 to-indigo-600/10',
    borderColor: 'border-indigo-500/30',
  },
  { 
    id: 'perfect', 
    name: 'Perfect', 
    description: 'Achieve 100% accuracy', 
    icon: '💯',
    category: 'Accuracy',
    requirement: { type: 'bestAccuracy', value: 100 },
    color: 'from-emerald-500/20 to-emerald-600/10',
    borderColor: 'border-emerald-500/30',
  },
  
  // Win achievements
  { 
    id: 'first-win', 
    name: 'First Win', 
    description: 'Win your first multiplayer race', 
    icon: '🏆',
    category: 'Wins',
    requirement: { type: 'wins', value: 1 },
    color: 'from-yellow-500/20 to-yellow-600/10',
    borderColor: 'border-yellow-500/30',
  },
  { 
    id: 'winner', 
    name: 'Winner', 
    description: 'Win 10 multiplayer races', 
    icon: '🥇',
    category: 'Wins',
    requirement: { type: 'wins', value: 10 },
    color: 'from-amber-500/20 to-amber-600/10',
    borderColor: 'border-amber-500/30',
  },
  { 
    id: 'multiplayer-champion', 
    name: 'Multiplayer Champion', 
    description: 'Win 50 multiplayer races', 
    icon: '👑',
    category: 'Wins',
    requirement: { type: 'wins', value: 50 },
    color: 'from-orange-500/20 to-orange-600/10',
    borderColor: 'border-orange-500/30',
  },
  
  // Multiplayer achievements
  { 
    id: 'social', 
    name: 'Social', 
    description: 'Play 10 multiplayer races', 
    icon: '👥',
    category: 'Multiplayer',
    requirement: { type: 'multiplayerRaces', value: 10 },
    color: 'from-teal-500/20 to-teal-600/10',
    borderColor: 'border-teal-500/30',
  },
  { 
    id: 'team-player', 
    name: 'Team Player', 
    description: 'Play 50 multiplayer races', 
    icon: '🤝',
    category: 'Multiplayer',
    requirement: { type: 'multiplayerRaces', value: 50 },
    color: 'from-cyan-500/20 to-cyan-600/10',
    borderColor: 'border-cyan-500/30',
  },
];

export default function AchievementsPage() {
  const navigate = useNavigate();
  const { username } = useParams();
  const { user: currentUser } = usePreferences();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const isOwnProfile = !username || currentUser?.username === username;
  const targetUsername = username || currentUser?.username;

  useEffect(() => {
    if (!targetUsername) {
      toast.error('Please log in to view achievements');
      navigate('/login');
      return;
    }
    loadProfile();
  }, [targetUsername]);

  async function loadProfile() {
    try {
      setLoading(true);
      const { data } = await api.get(`/api/profile/${targetUsername}`);
      setProfile(data);
    } catch (err) {
      console.error('[Achievements] Load error:', err);
      toast.error('Failed to load achievements');
    } finally {
      setLoading(false);
    }
  }

  // Calculate progress for each achievement
  function getAchievementProgress(achievement) {
    if (!profile?.statistics) return { current: 0, target: achievement.requirement.value, progress: 0, earned: false };

    const stats = profile.statistics;
    const { type, value } = achievement.requirement;
    
    let current = 0;
    switch (type) {
      case 'totalRaces':
        current = stats.totalRaces || 0;
        break;
      case 'bestWpm':
        current = stats.bestWpm || 0;
        break;
      case 'bestAccuracy':
        current = stats.bestAccuracy || 0;
        break;
      case 'wins':
        current = stats.wins || 0;
        break;
      case 'multiplayerRaces':
        current = stats.multiplayerRaces || 0;
        break;
      default:
        current = 0;
    }

    const earned = current >= value;
    const progress = Math.min(100, (current / value) * 100);

    return { current, target: value, progress, earned };
  }

  // Get earned achievements
  const earnedAchievements = profile?.achievements || [];
  const earnedIds = new Set(earnedAchievements.map(a => a.id));

  // Group achievements by category
  const categories = ['All', ...new Set(ALL_ACHIEVEMENTS.map(a => a.category))];
  const filteredAchievements = selectedCategory === 'All' 
    ? ALL_ACHIEVEMENTS 
    : ALL_ACHIEVEMENTS.filter(a => a.category === selectedCategory);

  // Calculate stats
  const totalAchievements = ALL_ACHIEVEMENTS.length;
  const earnedCount = earnedIds.size;
  const progressPercentage = Math.round((earnedCount / totalAchievements) * 100);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
          <p className="text-slate-400">Loading achievements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-900/70 hover:bg-slate-800 border border-slate-800 text-slate-200 transition-all hover:scale-110 hover:border-emerald-500/50 group"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 group-hover:text-emerald-400 group-hover:-translate-x-1 transition-all" />
            </button>
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-5xl font-bold text-white mb-2 bg-gradient-to-r from-white via-emerald-100 to-slate-300 bg-clip-text text-transparent"
              >
                Achievements
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="text-slate-400 text-lg"
              >
                {isOwnProfile ? 'Your' : `${targetUsername}'s`} achievement progress
              </motion.p>
            </div>
          </div>
        </motion.div>

        {/* Overall Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
          className="bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:border-emerald-500/30 transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                transition={{ duration: 0.5 }}
                className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 group-hover:border-emerald-400/50 transition-colors"
              >
                <Trophy className="w-8 h-8 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
              </motion.div>
              <div>
                <h2 className="text-2xl font-bold text-white group-hover:text-emerald-100 transition-colors">Overall Progress</h2>
                <p className="text-slate-400 group-hover:text-slate-300 transition-colors">
                  {earnedCount} of {totalAchievements} achievements unlocked
                </p>
              </div>
            </div>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-right"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.5 }}
                className="text-4xl font-bold text-emerald-400"
              >
                {progressPercentage}%
              </motion.div>
              <div className="text-sm text-slate-400">Complete</div>
            </motion.div>
          </div>
          <div className="relative h-4 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600 rounded-full shadow-lg shadow-emerald-500/50"
            >
              <motion.div
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:200%_100%]"
              />
            </motion.div>
          </div>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-2"
        >
          {categories.map((category, idx) => (
            <motion.button
              key={category}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + idx * 0.05 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-300 border border-slate-700/50 hover:border-slate-600/50'
              }`}
            >
              {category}
            </motion.button>
          ))}
        </motion.div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.map((achievement, idx) => {
            const { current, target, progress, earned } = getAchievementProgress(achievement);
            const remaining = Math.max(0, target - current);

            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  delay: 0.1 + idx * 0.05,
                  type: "spring",
                  stiffness: 100,
                  damping: 15
                }}
                whileHover={{ 
                  y: -8,
                  scale: 1.02,
                  transition: { duration: 0.2 }
                }}
                className={`relative bg-gradient-to-br ${achievement.color} border-2 ${achievement.borderColor} rounded-xl p-5 shadow-lg hover:shadow-2xl transition-all cursor-pointer group ${
                  earned 
                    ? 'ring-2 ring-emerald-500/50 hover:ring-emerald-400/70' 
                    : 'hover:border-opacity-60'
                }`}
              >
                {/* Earned Badge */}
                {earned && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 200,
                      damping: 15,
                      delay: 0.3 + idx * 0.05
                    }}
                    whileHover={{ rotate: 360, scale: 1.2 }}
                    className="absolute top-3 right-3 z-10"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/50">
                      <CheckCircle2 className="w-5 h-5 text-black" />
                    </div>
                  </motion.div>
                )}

                {/* Achievement Icon */}
                <div className="mb-4">
                  <motion.div
                    animate={earned ? {
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    } : {}}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3
                    }}
                    whileHover={{ 
                      scale: 1.15,
                      rotate: earned ? [0, -10, 10, -10, 0] : 0,
                      transition: { duration: 0.3 }
                    }}
                    className={`text-5xl mb-2 inline-block ${earned ? '' : 'grayscale opacity-60 group-hover:opacity-80 group-hover:grayscale-0 transition-all'}`}
                  >
                    {achievement.icon}
                  </motion.div>
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-emerald-100 transition-colors">
                    {achievement.name}
                  </h3>
                  <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                    {achievement.description}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 + idx * 0.05 }}
                      className="text-slate-300 font-medium"
                    >
                      {current} / {target}
                    </motion.span>
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + idx * 0.05 }}
                      className={`font-semibold ${earned ? 'text-emerald-400' : 'text-slate-400'}`}
                    >
                      {earned ? (
                        <motion.span
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                        >
                          Earned! ✨
                        </motion.span>
                      ) : (
                        `${remaining} remaining`
                      )}
                    </motion.span>
                  </div>
                  <div className="relative h-3 bg-slate-800/50 rounded-full overflow-hidden shadow-inner">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ 
                        duration: 1,
                        delay: 0.2 + idx * 0.05,
                        ease: "easeOut"
                      }}
                      className={`absolute inset-y-0 left-0 rounded-full ${
                        earned 
                          ? 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/50' 
                          : 'bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600'
                      }`}
                    >
                      {earned && (
                        <motion.div
                          animate={{
                            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent bg-[length:200%_100%]"
                        />
                      )}
                    </motion.div>
                    {!earned && progress > 0 && (
                      <motion.div
                        animate={{
                          x: ["-100%", "100%"],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent w-1/3"
                      />
                    )}
                  </div>
                </div>

                {/* Category Badge */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 + idx * 0.05 }}
                  className="mt-3 pt-3 border-t border-slate-700/50 group-hover:border-slate-600/50 transition-colors"
                >
                  <span className="text-xs text-slate-500 uppercase tracking-wide group-hover:text-slate-400 transition-colors">
                    {achievement.category}
                  </span>
                </motion.div>

                {/* Hover Glow Effect */}
                {earned && (
                  <motion.div
                    className="absolute inset-0 rounded-xl bg-emerald-500/0 group-hover:bg-emerald-500/5 pointer-events-none transition-colors"
                    initial={false}
                  />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredAchievements.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <motion.div
              animate={{
                y: [0, -10, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Award className="w-24 h-24 text-slate-600 mx-auto mb-4" />
            </motion.div>
            <h3 className="text-xl font-semibold text-slate-300 mb-2">No achievements in this category</h3>
            <p className="text-slate-500">Select a different category to view achievements</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

