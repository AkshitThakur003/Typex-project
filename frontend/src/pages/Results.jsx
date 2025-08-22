import React, { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { usePreferences } from "../settings/PreferencesContext.jsx";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = usePreferences();
  const postedRef = useRef(false);

  if (!location.state) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-slate-950">
        <div className="text-center">
          <p className="mb-4 text-xl">No results found. Start a test first.</p>
          <button
            onClick={() => navigate("/practice")}
            className="px-6 py-2 rounded-lg bg-orange-500 text-black font-semibold hover:bg-orange-400 transition"
          >
            Go to Practice
          </button>
        </div>
      </div>
    );
  }

  const { wpm, accuracy, mode, value } = location.state;

  // Save practice result to backend leaderboard (once)
  useEffect(() => {
    if (postedRef.current) return;
    const isPractice = (mode || 'practice') === 'practice';
    if (!isPractice) return; // only save practice here; multiplayer saves server-side
    if (!user?.username) return; // require login to save
    postedRef.current = true;
    (async () => {
      try {
        await api.post('/api/leaderboard', {
          username: user.username,
          wpm,
          accuracy,
          mode: 'practice',
        });
      } catch (e) {
        // silent fail to avoid UX issues
      }
    })();
  }, [user, wpm, accuracy, mode]);

  // Use real progression data from practice session
  const chartData = Array.isArray(location.state?.progress) ? location.state.progress : [];
  const durationSec = chartData.length ? chartData[chartData.length - 1].time : (mode === 'time' ? value : 0);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-slate-950 text-white">
      {/* Stats summary: minimal cards */}
      <div className="w-full max-w-4xl mb-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-4 bg-slate-900 rounded-lg text-center">
          <p className="text-lg font-semibold text-orange-400">WPM</p>
          <p className="text-3xl font-bold">{wpm}</p>
        </div>
        <div className="p-4 bg-slate-900 rounded-lg text-center">
          <p className="text-lg font-semibold text-orange-400">Accuracy</p>
          <p className="text-3xl font-bold">{accuracy}%</p>
        </div>
        <div className="p-4 bg-slate-900 rounded-lg text-center">
          <p className="text-lg font-semibold text-orange-400">Duration</p>
          <p className="text-3xl font-bold">{durationSec}s</p>
        </div>
      </div>

      {/* Line chart */}
      <div className="w-full max-w-4xl h-80 bg-slate-900 p-6 rounded-lg">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <XAxis dataKey="time" stroke="#cbd5e1" label={{ value: 'Time (s)', position: 'insideBottom', fill: '#cbd5e1' }} />
            <YAxis stroke="#cbd5e1" label={{ value: 'WPM', angle: -90, position: 'insideLeft', fill: '#cbd5e1' }} />
            <Tooltip
              formatter={(val, name, props) => [`${val} WPM`, name]}
              labelFormatter={(label) => `At ${label}s`}
              contentStyle={{ backgroundColor: "#1e293b", borderRadius: "8px" }}
              labelStyle={{ color: "#fff" }}
            />
            <Line
              type="monotone"
              dataKey="wpm"
              stroke="#f97316"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Actions */}
      <div className="mt-10 flex gap-6">
        <button
          onClick={() => navigate("/practice")}
          className="px-6 py-2 rounded-lg bg-orange-500 text-black font-semibold hover:bg-orange-400 transition"
        >
          Restart Practice
        </button>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2 rounded-lg bg-slate-800 font-semibold hover:bg-slate-700 transition"
        >
          Go Home
        </button>
      </div>
    </div>
  );
};

export default Results;
