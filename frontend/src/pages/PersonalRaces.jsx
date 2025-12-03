import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { usePreferences } from "../settings/PreferencesContext.jsx";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { 
  Calendar, TrendingUp, Filter, ArrowLeft, Trophy, 
  Users, Award, Zap, Target, BarChart3, Activity, Clock
} from "lucide-react";
import { Avatar } from "../components/common";
import { AVATAR_EMOJI } from "../utils/avatars.js";
import { formatTimeAgo } from "../utils/formatters.js";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

const PersonalRaces = () => {
  const navigate = useNavigate();
  const { user } = usePreferences();
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("date");
  const [viewMode, setViewMode] = useState("cards"); // 'cards' | 'timeline' | 'charts'

  useEffect(() => {
    if (!user?.username) {
      toast.error("Please log in to view your race history");
      navigate("/login");
      return;
    }

    fetchRaces();
  }, [user, sortBy]);

  const fetchRaces = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/leaderboard/multiplayer/${user.username}`, {
        params: {
          sortBy,
          limit: 100,
        },
      });
      setRaces(response.data.rows || []);
    } catch (e) {
      console.error("Failed to load race history:", e);
      toast.error("Failed to load race history");
    } finally {
      setLoading(false);
    }
  };

  // Use shared formatTimeAgo from utils
  const formatDate = formatTimeAgo;

  // Prepare chart data
  const chartData = useMemo(() => {
    const sorted = [...races].sort((a, b) => 
      new Date(a.endedAt || a.startedAt) - new Date(b.endedAt || b.startedAt)
    );
    return sorted.map((race, index) => ({
      date: race.endedAt 
        ? new Date(race.endedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : `Race ${index + 1}`,
      fullDate: race.endedAt || race.startedAt,
      wpm: race.wpm || 0,
      accuracy: race.accuracy || 0,
      rank: race.rank || 1,
      totalPlayers: race.totalPlayers || 1,
      index: index + 1,
    }));
  }, [races]);

  // Prepare timeline data (grouped by date)
  const timelineData = useMemo(() => {
    const grouped = {};
    races.forEach(race => {
      const date = race.endedAt ? new Date(race.endedAt).toDateString() : 'Unknown';
      if (!grouped[date]) {
        grouped[date] = {
          date,
          races: [],
          avgWpm: 0,
          avgAccuracy: 0,
          bestWpm: 0,
          wins: 0,
        };
      }
      grouped[date].races.push(race);
      if (race.isWinner) grouped[date].wins++;
      grouped[date].avgWpm = Math.round(
        grouped[date].races.reduce((sum, r) => sum + (r.wpm || 0), 0) / grouped[date].races.length
      );
      grouped[date].avgAccuracy = Math.round(
        grouped[date].races.reduce((sum, r) => sum + (r.accuracy || 0), 0) / grouped[date].races.length
      );
      grouped[date].bestWpm = Math.max(grouped[date].bestWpm, race.wpm || 0);
    });
    return Object.values(grouped).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [races]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (races.length === 0) return null;
    const wpms = races.map(r => r.wpm || 0);
    const accuracies = races.map(r => r.accuracy || 0);
    const wins = races.filter(r => r.isWinner).length;
    
    // Calculate improvement: Compare first race (chronologically oldest) to most recent race
    // Sort races chronologically by date (oldest first)
    const sortedByDate = [...races].sort((a, b) => {
      const dateA = new Date(a.endedAt || a.startedAt || 0);
      const dateB = new Date(b.endedAt || b.startedAt || 0);
      return dateA - dateB;
    });
    
    let improvement = 0;
    if (sortedByDate.length >= 2) {
      const firstRaceWpm = sortedByDate[0].wpm || 0;
      const lastRaceWpm = sortedByDate[sortedByDate.length - 1].wpm || 0;
      improvement = lastRaceWpm - firstRaceWpm;
    } else if (sortedByDate.length === 1) {
      // Only one race, no improvement to calculate
      improvement = 0;
    }
    
    return {
      total: races.length,
      wins,
      winRate: Math.round((wins / races.length) * 100),
      bestWpm: Math.max(...wpms),
      avgWpm: Math.round(wpms.reduce((a, b) => a + b, 0) / wpms.length),
      bestAccuracy: Math.max(...accuracies),
      avgAccuracy: Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length),
      avgRank: Math.round(races.reduce((sum, r) => sum + (r.rank || 1), 0) / races.length),
      improvement,
    };
  }, [races]);

  if (!user?.username) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-slate-950">
        <div className="text-center">
          <p className="mb-4 text-xl">Please log in to view your race history.</p>
          <button
            onClick={() => navigate("/login")}
            className="px-6 py-2 rounded-lg bg-orange-500 text-black font-semibold hover:bg-orange-400 transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900/70 hover:bg-slate-800 border border-slate-800 text-slate-200 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Multiplayer History</h1>
          <p className="text-slate-400">Track your multiplayer race performance and progress</p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 sm:gap-4 mb-6">
          <div className="flex items-center gap-1 sm:gap-2 bg-slate-900/50 rounded-lg p-1 border border-slate-800 w-full sm:w-auto">
            <button
              onClick={() => setViewMode("cards")}
              className={`px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition flex-1 sm:flex-none ${
                viewMode === "cards"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-1 sm:mr-2" />
              Cards
            </button>
            <button
              onClick={() => setViewMode("timeline")}
              className={`px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition flex-1 sm:flex-none ${
                viewMode === "timeline"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Activity className="w-4 h-4 inline mr-1 sm:mr-2" />
              Timeline
            </button>
            <button
              onClick={() => setViewMode("charts")}
              className={`px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition flex-1 sm:flex-none ${
                viewMode === "charts"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-1 sm:mr-2" />
              Charts
            </button>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="date">Newest First</option>
              <option value="wpm">Best WPM First</option>
            </select>
          </div>
        </div>

        {/* Statistics Dashboard */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-4 mb-6 sm:mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-3 sm:p-4 border border-slate-800"
            >
              <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
                <span className="text-[10px] sm:text-xs text-slate-400">Total Races</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-white">{stats.total}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-amber-900/30 to-slate-800 rounded-xl p-3 sm:p-4 border border-amber-800/30"
            >
              <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400" />
                <span className="text-[10px] sm:text-xs text-slate-400">Wins</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-amber-400">{stats.wins}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-emerald-900/30 to-slate-800 rounded-xl p-3 sm:p-4 border border-emerald-800/30"
            >
              <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                <Target className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
                <span className="text-[10px] sm:text-xs text-slate-400">Win Rate</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-emerald-400">{stats.winRate}%</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-orange-900/30 to-slate-800 rounded-xl p-3 sm:p-4 border border-orange-800/30"
            >
              <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-orange-400" />
                <span className="text-[10px] sm:text-xs text-slate-400">Best WPM</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-orange-400">{stats.bestWpm}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-blue-900/30 to-slate-800 rounded-xl p-3 sm:p-4 border border-blue-800/30"
            >
              <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                <Award className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                <span className="text-[10px] sm:text-xs text-slate-400">Avg WPM</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-blue-400">{stats.avgWpm}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-purple-900/30 to-slate-800 rounded-xl p-3 sm:p-4 border border-purple-800/30"
            >
              <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
                <span className="text-[10px] sm:text-xs text-slate-400">Best Acc</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-purple-400">{stats.bestAccuracy}%</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gradient-to-br from-cyan-900/30 to-slate-800 rounded-xl p-3 sm:p-4 border border-cyan-800/30"
            >
              <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400" />
                <span className="text-[10px] sm:text-xs text-slate-400">Avg Rank</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-cyan-400">#{stats.avgRank}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className={`bg-gradient-to-br rounded-xl p-3 sm:p-4 border ${
                stats.improvement >= 0
                  ? "from-emerald-900/30 to-slate-800 border-emerald-800/30"
                  : "from-red-900/30 to-slate-800 border-red-800/30"
              }`}
            >
              <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                <BarChart3 className={`w-3 h-3 sm:w-4 sm:h-4 ${stats.improvement >= 0 ? "text-emerald-400" : "text-red-400"}`} />
                <span className="text-[10px] sm:text-xs text-slate-400">Improve</span>
              </div>
              <p className={`text-lg sm:text-2xl font-bold ${stats.improvement >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {stats.improvement >= 0 ? "+" : ""}{stats.improvement}
              </p>
            </motion.div>
          </div>
        )}

        {/* View Content */}
        {viewMode === "cards" && (
          <>
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
                <p className="mt-4 text-slate-400">Loading your race history...</p>
              </div>
            ) : races.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-slate-800">
                <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-xl text-slate-300 mb-2">No race history yet</p>
                <p className="text-slate-500">Join multiplayer races to see your results here!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {races.map((race, index) => (
                  <motion.div
                    key={race.roomCode || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`bg-slate-900/70 backdrop-blur rounded-xl border p-6 hover:border-emerald-500/50 transition-colors ${
                      race.isWinner ? 'border-amber-500/50 ring-2 ring-amber-500/20' : 'border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(race.endedAt || race.startedAt)}</span>
                      </div>
                      {race.isWinner && (
                        <Trophy className="w-5 h-5 text-amber-400" />
                      )}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-slate-400 uppercase mb-1">WPM</p>
                        <p className="text-2xl font-bold text-orange-400">{race.wpm || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 uppercase mb-1">Accuracy</p>
                        <p className="text-2xl font-bold text-emerald-400">{race.accuracy || 0}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 uppercase mb-1">Time</p>
                        <p className="text-2xl font-bold text-cyan-400">
                          {race.finishTime ? `${race.finishTime}s` : '-'}
                          {race.timeLimit && <span className="text-sm text-slate-500">/{race.timeLimit}s</span>}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-slate-500">Rank</span>
                        <span className={`font-bold ${race.rank === 1 ? 'text-amber-400' : race.rank <= 3 ? 'text-slate-300' : 'text-slate-500'}`}>
                          #{race.rank || 1} / {race.totalPlayers || 1}
                        </span>
                      </div>
                      {race.players && race.players.length > 0 && (
                        <div className="mt-3 flex items-center gap-2">
                          <Users className="w-3 h-3 text-slate-500" />
                          <div className="flex -space-x-2">
                            {race.players.slice(0, 5).map((player, pIdx) => (
                              <Avatar
                                key={pIdx}
                                name={player.username || 'User'}
                                size={24}
                                imageUrl={player.avatarUrl || player.oauthAvatar}
                                emoji={player.avatarChoice ? AVATAR_EMOJI[player.avatarChoice] : null}
                                isMe={player.username === user.username}
                              />
                            ))}
                            {race.players.length > 5 && (
                              <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-400">
                                +{race.players.length - 5}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {viewMode === "timeline" && (
          <div className="space-y-6">
            {timelineData.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-slate-800">
                <Activity className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-xl text-slate-300 mb-2">No timeline data</p>
              </div>
            ) : (
              timelineData.map((day, idx) => (
                <motion.div
                  key={day.date}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-slate-900/70 rounded-xl border border-slate-800 p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{day.date}</h3>
                      <p className="text-sm text-slate-400">{day.races.length} race{day.races.length !== 1 ? 's' : ''} • {day.wins} win{day.wins !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-slate-400">Best: </span>
                        <span className="text-orange-400 font-bold">{day.bestWpm} WPM</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Avg: </span>
                        <span className="text-emerald-400 font-bold">{day.avgWpm} WPM</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {day.races.map((race, rIdx) => (
                      <div
                        key={rIdx}
                        className={`bg-slate-800/50 rounded-lg p-3 border transition ${
                          race.isWinner ? 'border-amber-500/50' : 'border-slate-700 hover:border-emerald-500/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-400">
                            {race.endedAt ? new Date(race.endedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                          </span>
                          {race.isWinner && <Trophy className="w-4 h-4 text-amber-400" />}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-orange-400">{race.wpm} WPM</span>
                            <span className="text-sm text-emerald-400">{race.accuracy}%</span>
                            {race.finishTime && (
                              <span className="text-sm text-cyan-400">{race.finishTime}s</span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500">#{race.rank}/{race.totalPlayers}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {viewMode === "charts" && chartData.length > 0 && (
          <div className="space-y-6">
            {/* WPM Progress Chart */}
            <div className="bg-slate-900/70 rounded-xl border border-slate-800 p-6">
              <h3 className="text-xl font-semibold text-white mb-4">WPM Progress Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="wpmGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="wpm"
                    stroke="#f97316"
                    strokeWidth={2}
                    fill="url(#wpmGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Rank Chart */}
            <div className="bg-slate-900/70 rounded-xl border border-slate-800 p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Rank Over Time (Lower is Better)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" reversed domain={[1, 'auto']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rank"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#10b981" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Combined Chart */}
            <div className="bg-slate-900/70 rounded-xl border border-slate-800 p-6">
              <h3 className="text-xl font-semibold text-white mb-4">WPM vs Accuracy</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis yAxisId="left" stroke="#f97316" />
                  <YAxis yAxisId="right" orientation="right" stroke="#10b981" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="wpm"
                    stroke="#f97316"
                    strokeWidth={2}
                    name="WPM"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="accuracy"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Accuracy %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => navigate("/multiplayer")}
            className="px-6 py-3 rounded-lg bg-emerald-600 text-black font-semibold hover:bg-emerald-500 transition flex items-center gap-2"
          >
            <Users className="w-5 h-5" />
            Multiplayer Race
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonalRaces;

