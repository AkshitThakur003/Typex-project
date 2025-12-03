import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { usePreferences } from "../settings/PreferencesContext.jsx";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { 
  Calendar, TrendingUp, Filter, ArrowLeft, BarChart3, 
  Activity, Target, Award, Clock, Zap 
} from "lucide-react";
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

const PracticeHistory = () => {
  const navigate = useNavigate();
  const { user } = usePreferences();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("date");
  const [filterMode, setFilterMode] = useState("all");
  const [viewMode, setViewMode] = useState("cards"); // 'cards' | 'timeline' | 'charts' | 'heatmap'

  useEffect(() => {
    if (!user?.username) {
      toast.error("Please log in to view your practice history");
      navigate("/login");
      return;
    }

    fetchHistory();
  }, [user, sortBy]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/leaderboard/practice/${user.username}`, {
        params: {
          sortBy,
          limit: 100,
        },
      });
      setHistory(response.data.rows || []);
    } catch (e) {
      console.error("Failed to load practice history:", e);
      toast.error("Failed to load practice history");
    } finally {
      setLoading(false);
    }
  };

  // Filter history by mode
  const filteredHistory = filterMode === "all" 
    ? history 
    : history.filter(item => {
        // Map backend mode to frontend modes
        // Backend only stores 'practice', but we can filter by time/words based on other criteria if needed
        // For now, just show all since backend doesn't differentiate
        return true;
      });

  // Use shared formatTimeAgo from utils
  const formatDate = formatTimeAgo;

  // Prepare chart data
  const chartData = useMemo(() => {
    const sorted = [...filteredHistory].sort((a, b) => 
      new Date(a.createdAt) - new Date(b.createdAt)
    );
    return sorted.map((item, index) => ({
      date: new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: item.createdAt,
      wpm: item.wpm || 0,
      accuracy: item.accuracy || 0,
      index: index + 1,
    }));
  }, [filteredHistory]);

  // Prepare timeline data (grouped by date)
  const timelineData = useMemo(() => {
    const grouped = {};
    filteredHistory.forEach(item => {
      const date = new Date(item.createdAt).toDateString();
      if (!grouped[date]) {
        grouped[date] = {
          date,
          sessions: [],
          avgWpm: 0,
          avgAccuracy: 0,
          bestWpm: 0,
        };
      }
      grouped[date].sessions.push(item);
      grouped[date].avgWpm = Math.round(
        grouped[date].sessions.reduce((sum, s) => sum + (s.wpm || 0), 0) / grouped[date].sessions.length
      );
      grouped[date].avgAccuracy = Math.round(
        grouped[date].sessions.reduce((sum, s) => sum + (s.accuracy || 0), 0) / grouped[date].sessions.length
      );
      grouped[date].bestWpm = Math.max(grouped[date].bestWpm, item.wpm || 0);
    });
    return Object.values(grouped).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [filteredHistory]);

  // Heatmap data (activity by day of week and hour)
  const heatmapData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const data = {};
    
    filteredHistory.forEach(item => {
      const date = new Date(item.createdAt);
      const day = days[date.getDay()];
      const hour = date.getHours();
      const key = `${day}-${hour}`;
      data[key] = (data[key] || 0) + 1;
    });
    
    return { days, hours, data };
  }, [filteredHistory]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (filteredHistory.length === 0) return null;
    const wpms = filteredHistory.map(h => h.wpm || 0);
    const accuracies = filteredHistory.map(h => h.accuracy || 0);
    
    // Calculate improvement: Compare first practice (chronologically oldest) to most recent
    // Sort history chronologically by date (oldest first)
    const sortedByDate = [...filteredHistory].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateA - dateB;
    });
    
    let improvement = 0;
    if (sortedByDate.length >= 2) {
      const firstPracticeWpm = sortedByDate[0].wpm || 0;
      const lastPracticeWpm = sortedByDate[sortedByDate.length - 1].wpm || 0;
      improvement = lastPracticeWpm - firstPracticeWpm;
    } else if (sortedByDate.length === 1) {
      // Only one practice, no improvement to calculate
      improvement = 0;
    }
    
    return {
      total: filteredHistory.length,
      bestWpm: Math.max(...wpms),
      avgWpm: Math.round(wpms.reduce((a, b) => a + b, 0) / wpms.length),
      bestAccuracy: Math.max(...accuracies),
      avgAccuracy: Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length),
      improvement,
      streak: calculateStreak(filteredHistory),
    };
  }, [filteredHistory]);

  function calculateStreak(history) {
    // Calculate consecutive days with practice
    const sorted = [...history].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (const item of sorted) {
      const itemDate = new Date(item.createdAt);
      itemDate.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((currentDate - itemDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays === streak) {
        streak++;
        currentDate = new Date(itemDate);
      } else if (diffDays > streak) {
        break;
      }
    }
    return streak;
  }

  if (!user?.username) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-slate-950">
        <div className="text-center">
          <p className="mb-4 text-xl">Please log in to view your practice history.</p>
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
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Practice History</h1>
          <p className="text-slate-400">Track your progress with interactive visualizations</p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 sm:gap-4 mb-6">
          <div className="flex items-center gap-1 sm:gap-2 bg-slate-900/50 rounded-lg p-1 border border-slate-800 overflow-x-auto w-full sm:w-auto">
            <button
              onClick={() => setViewMode("cards")}
              className={`px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition whitespace-nowrap ${
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
              className={`px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition whitespace-nowrap ${
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
              className={`px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                viewMode === "charts"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-1 sm:mr-2" />
              Charts
            </button>
            <button
              onClick={() => setViewMode("heatmap")}
              className={`px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                viewMode === "heatmap"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Target className="w-4 h-4 inline mr-1 sm:mr-2" />
              Heatmap
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
              <select
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All</option>
                <option value="time">Time</option>
                <option value="words">Words</option>
                <option value="quote">Quote</option>
              </select>
            </div>
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
        </div>

        {/* Statistics Dashboard */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-4 mb-6 sm:mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-3 sm:p-4 border border-slate-800"
            >
              <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                <Target className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
                <span className="text-[10px] sm:text-xs text-slate-400">Total Tests</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-white">{stats.total}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
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
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-emerald-900/30 to-slate-800 rounded-xl p-3 sm:p-4 border border-emerald-800/30"
            >
              <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                <Award className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
                <span className="text-[10px] sm:text-xs text-slate-400">Avg WPM</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-emerald-400">{stats.avgWpm}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-blue-900/30 to-slate-800 rounded-xl p-3 sm:p-4 border border-blue-800/30"
            >
              <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                <span className="text-[10px] sm:text-xs text-slate-400">Best Accuracy</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-blue-400">{stats.bestAccuracy}%</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-purple-900/30 to-slate-800 rounded-xl p-3 sm:p-4 border border-purple-800/30"
            >
              <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
                <span className="text-[10px] sm:text-xs text-slate-400">Avg Accuracy</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-purple-400">{stats.avgAccuracy}%</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-amber-900/30 to-slate-800 rounded-xl p-3 sm:p-4 border border-amber-800/30"
            >
              <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400" />
                <span className="text-[10px] sm:text-xs text-slate-400">Streak</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-amber-400">{stats.streak} days</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className={`bg-gradient-to-br rounded-xl p-3 sm:p-4 border ${
                stats.improvement >= 0
                  ? "from-emerald-900/30 to-slate-800 border-emerald-800/30"
                  : "from-red-900/30 to-slate-800 border-red-800/30"
              }`}
            >
              <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                <BarChart3 className={`w-3 h-3 sm:w-4 sm:h-4 ${stats.improvement >= 0 ? "text-emerald-400" : "text-red-400"}`} />
                <span className="text-[10px] sm:text-xs text-slate-400">Improvement</span>
              </div>
              <p className={`text-lg sm:text-2xl font-bold ${stats.improvement >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {stats.improvement >= 0 ? "+" : ""}{stats.improvement} WPM
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
                <p className="mt-4 text-slate-400">Loading your practice history...</p>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-slate-800">
                <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-xl text-slate-300 mb-2">No practice history yet</p>
                <p className="text-slate-500">Start practicing to see your results here!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredHistory.map((item, index) => (
                  <motion.div
                    key={item._id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-slate-900/70 backdrop-blur rounded-xl border border-slate-800 p-6 hover:border-emerald-500/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-slate-400 uppercase mb-1">WPM</p>
                        <p className="text-2xl font-bold text-orange-400">{item.wpm || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 uppercase mb-1">Accuracy</p>
                        <p className="text-2xl font-bold text-emerald-400">{item.accuracy || 0}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 uppercase mb-1">Time</p>
                        <p className="text-2xl font-bold text-cyan-400">{item.finishTime ? `${item.finishTime}s` : '-'}</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Mode: {item.mode || "practice"}</span>
                        {item.createdAt && (
                          <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        )}
                      </div>
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
                      <p className="text-sm text-slate-400">{day.sessions.length} session{day.sessions.length !== 1 ? 's' : ''}</p>
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
                    {day.sessions.map((session, sIdx) => (
                      <div
                        key={sIdx}
                        className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 hover:border-emerald-500/50 transition"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">
                            {new Date(session.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-orange-400">{session.wpm} WPM</span>
                            <span className="text-sm text-emerald-400">{session.accuracy}%</span>
                          </div>
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
            {/* WPM Trend Chart */}
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

            {/* Accuracy Trend Chart */}
            <div className="bg-slate-900/70 rounded-xl border border-slate-800 p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Accuracy Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
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

            {/* Distribution Chart */}
            <div className="bg-slate-900/70 rounded-xl border border-slate-800 p-6">
              <h3 className="text-xl font-semibold text-white mb-4">WPM Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="index" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Bar dataKey="wpm" fill="#f97316" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.wpm >= stats.avgWpm ? "#f97316" : "#fb923c"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {viewMode === "heatmap" && (
          <div className="bg-slate-900/70 rounded-xl border border-slate-800 p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Activity Heatmap</h3>
            <p className="text-sm text-slate-400 mb-6">Your practice activity by day and time</p>
            <div className="overflow-x-auto">
              <div className="grid grid-cols-8 gap-2 min-w-max">
                <div></div>
                {heatmapData.hours.map(hour => (
                  <div key={hour} className="text-xs text-slate-400 text-center">
                    {hour}:00
                  </div>
                ))}
                {heatmapData.days.map(day => (
                  <React.Fragment key={day}>
                    <div className="text-xs text-slate-400 font-medium flex items-center">
                      {day}
                    </div>
                    {heatmapData.hours.map(hour => {
                      const key = `${day}-${hour}`;
                      const count = heatmapData.data[key] || 0;
                      const intensity = Math.min(count / 5, 1); // Normalize to 0-1
                      return (
                        <div
                          key={hour}
                          className="h-8 w-8 rounded border border-slate-800 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                          style={{
                            backgroundColor: count > 0
                              ? `rgba(16, 185, 129, ${0.3 + intensity * 0.7})`
                              : 'rgba(30, 41, 59, 0.5)',
                          }}
                          title={`${day} ${hour}:00 - ${count} session${count !== 1 ? 's' : ''}`}
                        >
                          {count > 0 && (
                            <span className="text-xs font-bold text-white">{count}</span>
                          )}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => navigate("/practice")}
            className="px-6 py-3 rounded-lg bg-emerald-600 text-black font-semibold hover:bg-emerald-500 transition flex items-center gap-2"
          >
            <TrendingUp className="w-5 h-5" />
            Start New Practice
          </button>
        </div>
      </div>
    </div>
  );
};

export default PracticeHistory;
