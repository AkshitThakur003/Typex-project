import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { usePreferences } from "../settings/PreferencesContext.jsx";
import { toast } from "react-hot-toast";
import { XpBar, XpInfo } from "../components/xp";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, Share2, BarChart2 } from "lucide-react";

// Helper to get previous results from localStorage (more persistent than sessionStorage)
function getPreviousResults() {
  try {
    const stored = localStorage.getItem('typex_previous_results');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function savePreviousResult(result) {
  try {
    const results = getPreviousResults();
    // Keep only last 10 results
    results.unshift(result);
    if (results.length > 10) results.pop();
    localStorage.setItem('typex_previous_results', JSON.stringify(results));
  } catch (e) {
    console.error('[Results] Failed to save previous result:', e);
  }
}

// Get the most recent previous result for comparison
function getLastResult() {
  const results = getPreviousResults();
  return results.length > 1 ? results[1] : null; // [0] is current, [1] is previous
}

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = usePreferences();
  const postedRef = useRef(false);
  const xpPostedRef = useRef(false);
  const [xpData, setXpData] = useState(null);

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

  const { wpm, accuracy, mode, value, correctChars, wordsCompleted, elapsedSec, finishTime, sessionId } = location.state;
  
  // Ensure wpm and accuracy are numbers
  const wpmNum = typeof wpm === 'number' ? wpm : Number(wpm) || 0;
  const accuracyNum = typeof accuracy === 'number' ? accuracy : Number(accuracy) || 0;

  // Check if result was already saved to leaderboard (using localStorage for persistence)
  const wasResultSaved = useMemo(() => {
    if (!sessionId) return false;
    return localStorage.getItem(`result_saved_${sessionId}`) === 'true';
  }, [sessionId]);

  // Check if XP was already awarded for this session (using localStorage for persistence)
  const wasXpAwarded = useMemo(() => {
    if (!sessionId) return false;
    return localStorage.getItem(`xp_awarded_${sessionId}`) === 'true';
  }, [sessionId]);

  // Comparison with previous result
  const previousResult = useMemo(() => getLastResult(), []);
  const wpmDiff = previousResult ? wpmNum - previousResult.wpm : null;
  const accuracyDiff = previousResult ? accuracyNum - previousResult.accuracy : null;

  // Save current result for future comparison
  useEffect(() => {
    if (sessionId && wpmNum > 0) {
      savePreviousResult({ wpm: wpmNum, accuracy: accuracyNum, mode, timestamp: Date.now() });
    }
  }, [sessionId, wpmNum, accuracyNum, mode]);

  // Share functionality
  const handleShare = async () => {
    const shareText = `🏎️ TypeX Results!\n\n⚡ WPM: ${wpmNum}\n🎯 Accuracy: ${accuracyNum}%\n⏱️ Duration: ${durationSec}s\n\nTry to beat my score at TypeX!`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My TypeX Results',
          text: shareText,
          url: window.location.origin,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          // Fallback to clipboard
          copyToClipboard(shareText);
        }
      }
    } else {
      copyToClipboard(shareText);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Results copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy');
    });
  };

  // Restore XP data from localStorage if it was already awarded
  useEffect(() => {
    if (wasXpAwarded && sessionId) {
      const savedXpData = localStorage.getItem(`xp_data_${sessionId}`);
      if (savedXpData) {
        try {
          const parsedData = JSON.parse(savedXpData);
          setXpData(parsedData);
          console.log('[Results] Restored XP data from localStorage');
        } catch (e) {
          console.error('[Results] Failed to parse saved XP data:', e);
        }
      }
    }
  }, [wasXpAwarded, sessionId]);

  // Save practice result to backend leaderboard (once)
  useEffect(() => {
    // Check both ref AND sessionStorage to prevent duplicate saves
    if (postedRef.current || wasResultSaved) {
      console.log('[Results] Result already saved to leaderboard for this session, skipping');
      return;
    }
    // Mode from Practice.jsx is 'time', 'words', or 'quote', all are practice mode
    // Multiplayer results are saved server-side, so if we're here, it's practice
    const isPractice = mode === 'time' || mode === 'words' || mode === 'quote';
    if (!isPractice) {
      console.log('[Results] Not saving: not a practice mode (mode:', mode, ')');
      return; // only save practice here; multiplayer saves server-side
    }
    if (!user?.username) {
      console.log('[Results] Not saving: user not logged in');
      return; // require login to save
    }
    
    // Validate data
    if (isNaN(wpmNum) || isNaN(accuracyNum) || wpmNum < 0 || accuracyNum < 0 || accuracyNum > 100) {
      console.error('[Results] Invalid data:', { wpm: wpmNum, accuracy: accuracyNum });
      return;
    }
    
    postedRef.current = true;
    
    // Mark result as saved in localStorage BEFORE making the API call
    if (sessionId) {
      localStorage.setItem(`result_saved_${sessionId}`, 'true');
    }
    
    (async () => {
      try {
        console.log('[Results] Saving practice result:', { username: user.username, wpm: wpmNum, accuracy: accuracyNum, finishTime, mode: 'practice' });
        const response = await api.post('/api/leaderboard', {
          username: user.username,
          wpm: wpmNum,
          accuracy: accuracyNum,
          finishTime: finishTime || null,
          mode: 'practice',
        });
        console.log('[Results] Successfully saved:', response.data);
        toast.success('Result saved to leaderboard!');
        
        // Trigger a custom event to refresh leaderboard/profile
        window.dispatchEvent(new CustomEvent('leaderboard-updated'));
        
        // Award XP for practice mode
        // Check both ref AND sessionStorage to prevent duplicate awards
        if (xpPostedRef.current || wasXpAwarded) {
          console.log('[Results] XP already awarded for this session, skipping');
          return;
        }
        
        xpPostedRef.current = true;
        
        // Mark XP as awarded in localStorage BEFORE making the API call
        if (sessionId) {
          localStorage.setItem(`xp_awarded_${sessionId}`, 'true');
        }
        
        try {
          console.log('[Results] Awarding XP for practice result');
          
          // Calculate words typed - prefer wordsCompleted from Practice.jsx if available
          let words = null;
          if (wordsCompleted && typeof wordsCompleted === 'number' && wordsCompleted > 0) {
            // Use actual words completed from Practice.jsx
            words = wordsCompleted;
          } else if (correctChars && typeof correctChars === 'number') {
            // Estimate words: correctChars / 5 (average word length)
            words = Math.floor(correctChars / 5);
          } else if (mode === 'words' && value) {
            // For words mode: use the target word count as fallback
            words = value;
          } else if (wpmNum > 0 && mode === 'time' && (elapsedSec || value)) {
            // For time mode: words ≈ WPM * (time in minutes)
            const timeMinutes = elapsedSec ? elapsedSec / 60 : value / 60;
            words = Math.floor(wpmNum * timeMinutes);
          }
          
          console.log('[Results] XP calculation params:', { 
            mode: 'practice', 
            wpm: wpmNum, 
            accuracy: accuracyNum, 
            words,
            wordsCompleted,
            correctChars,
            elapsedSec
          });
          
          const xpResponse = await api.post('/api/profile/xp/add-xp', {
            mode: 'practice',
            wpm: wpmNum,
            accuracy: accuracyNum,
            words: words, // Include words for better XP calculation
          });
          console.log('[Results] XP awarded:', xpResponse.data);
          setXpData(xpResponse.data);
          
          // Save XP data to localStorage so we can restore it if user navigates back
          if (sessionId) {
            localStorage.setItem(`xp_data_${sessionId}`, JSON.stringify(xpResponse.data));
          }
          
          // Dispatch custom event for XP toast
          window.dispatchEvent(new CustomEvent('xp:gain', { detail: xpResponse.data }));
        } catch (xpErr) {
          // If XP award fails, remove the localStorage flag so user can retry
          if (sessionId) {
            localStorage.removeItem(`xp_awarded_${sessionId}`);
            localStorage.removeItem(`xp_data_${sessionId}`);
          }
          xpPostedRef.current = false;
          
          console.error('[Results] Failed to award XP:', xpErr);
          console.error('[Results] XP Error details:', {
            message: xpErr?.message,
            response: xpErr?.response?.data,
            status: xpErr?.response?.status,
          });
          // Show error toast for XP failures so user knows
          if (xpErr?.response?.data?.error) {
            toast.error(`XP Error: ${xpErr.response.data.error}`);
          }
        }
      } catch (e) {
        // If save fails, remove the localStorage flag so user can retry
        if (sessionId) {
          localStorage.removeItem(`result_saved_${sessionId}`);
        }
        postedRef.current = false;
        
        console.error('[Results] Failed to save practice result:', e);
        console.error('[Results] Error details:', {
          message: e?.message,
          response: e?.response?.data,
          status: e?.response?.status,
          config: e?.config,
        });
        // Show error to user
        if (e?.response?.data?.error) {
          console.error('[Results] Server error:', e.response.data.error);
          toast.error(`Failed to save: ${e.response.data.error}`);
        } else {
          toast.error('Failed to save result. Please check console for details.');
        }
      }
    })();
  }, [user, wpmNum, accuracyNum, mode, correctChars, wordsCompleted, elapsedSec, value, sessionId, wasXpAwarded, wasResultSaved]);

  // Use real progression data from practice session
  const chartData = Array.isArray(location.state?.progress) ? location.state.progress : [];
  // Use elapsedSec from state if available, otherwise fall back to chart data or mode-specific defaults
  const durationSec = elapsedSec || (chartData.length ? chartData[chartData.length - 1].time : (mode === 'time' ? value : 0));
  
  // Debug logging
  useEffect(() => {
    console.log('[Results] Received progress data:', {
      hasProgress: !!location.state?.progress,
      progressLength: chartData.length,
      chartData: chartData.slice(0, 5), // First 5 data points
      mode,
      value,
    });
  }, [chartData.length, mode, value]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-slate-950 text-white">
      {/* XP Bar (if XP data available) */}
      {xpData && (
        <div className="w-full max-w-4xl mb-6">
          <div className="bg-slate-900/70 backdrop-blur-md rounded-xl border border-slate-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-300">XP Gained</span>
                <XpInfo variant="icon" />
              </div>
              <span className="text-emerald-400 font-bold">+{xpData.xpGained} XP</span>
            </div>
            <XpBar
              xp={xpData.xp}
              xpToNext={xpData.xpToNext}
              level={xpData.newLevel}
              size="md"
            />
            {xpData.levelsGained > 0 && (
              <div className="mt-2 text-center text-amber-400 font-semibold">
                🎉 Level Up! Reached Level {xpData.newLevel}
              </div>
            )}
            
            {/* XP Breakdown */}
            {xpData.breakdown && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="text-xs text-slate-400 mb-2">XP Breakdown:</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  {xpData.breakdown.wordXp > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-300">Words:</span>
                      <span className="text-emerald-400">+{xpData.breakdown.wordXp}</span>
                    </div>
                  )}
                  {xpData.breakdown.completion > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-300">Completion:</span>
                      <span className="text-emerald-400">+{xpData.breakdown.completion}</span>
                    </div>
                  )}
                  {xpData.breakdown.accuracyBonus > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-300">Accuracy:</span>
                      <span className="text-emerald-400">+{xpData.breakdown.accuracyBonus}</span>
                    </div>
                  )}
                  {xpData.breakdown.wpmBonus > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-300">WPM:</span>
                      <span className="text-emerald-400">+{xpData.breakdown.wpmBonus}</span>
                    </div>
                  )}
                  {xpData.breakdown.winBonus > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-300">Win:</span>
                      <span className="text-amber-400">+{xpData.breakdown.winBonus}</span>
                    </div>
                  )}
                  {xpData.breakdown.pos2Bonus > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-300">2nd Place:</span>
                      <span className="text-slate-400">+{xpData.breakdown.pos2Bonus}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Stats summary with comparison */}
      <div className="w-full max-w-4xl mb-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-4 bg-slate-900 rounded-lg text-center relative">
          <p className="text-lg font-semibold text-orange-400">WPM</p>
          <p className="text-3xl font-bold">{wpmNum}</p>
          {wpmDiff !== null && wpmDiff !== 0 && (
            <div className={`absolute top-2 right-2 flex items-center gap-1 text-xs font-medium ${wpmDiff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {wpmDiff > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {wpmDiff > 0 ? '+' : ''}{wpmDiff}
            </div>
          )}
          {wpmDiff === 0 && (
            <div className="absolute top-2 right-2 flex items-center gap-1 text-xs font-medium text-slate-400">
              <Minus className="w-3 h-3" /> Same
            </div>
          )}
        </div>
        <div className="p-4 bg-slate-900 rounded-lg text-center relative">
          <p className="text-lg font-semibold text-orange-400">Accuracy</p>
          <p className="text-3xl font-bold">{accuracyNum}%</p>
          {accuracyDiff !== null && accuracyDiff !== 0 && (
            <div className={`absolute top-2 right-2 flex items-center gap-1 text-xs font-medium ${accuracyDiff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {accuracyDiff > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {accuracyDiff > 0 ? '+' : ''}{accuracyDiff.toFixed(1)}%
            </div>
          )}
        </div>
        <div className="p-4 bg-slate-900 rounded-lg text-center">
          <p className="text-lg font-semibold text-orange-400">Duration</p>
          <p className="text-3xl font-bold">{durationSec}s</p>
        </div>
      </div>

      {/* Previous result comparison banner */}
      {previousResult && (
        <div className="w-full max-w-4xl mb-6 p-3 bg-slate-800/50 rounded-lg border border-slate-700 flex items-center justify-between">
          <span className="text-sm text-slate-400">
            Compared to your last result: {previousResult.wpm} WPM, {previousResult.accuracy}% accuracy
          </span>
          {wpmDiff !== null && (
            <span className={`text-sm font-medium ${wpmDiff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {wpmDiff >= 0 ? '📈 Improving!' : '📉 Keep practicing!'}
            </span>
          )}
        </div>
      )}

      {/* Line chart with empty state */}
      <div className="w-full max-w-4xl h-80 bg-slate-900 p-6 rounded-lg">
        {chartData.length > 0 ? (
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
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <BarChart2 className="w-12 h-12 mb-3 opacity-50" />
            <p>No progress data available for this session</p>
            <p className="text-sm text-slate-500 mt-1">WPM progression is tracked during timed sessions</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-10 flex flex-wrap gap-4 justify-center">
        <button
          onClick={() => navigate("/practice")}
          className="px-6 py-2 rounded-lg bg-orange-500 text-black font-semibold hover:bg-orange-400 transition"
        >
          Restart Practice
        </button>
        <button
          onClick={handleShare}
          className="px-6 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold hover:bg-emerald-500/30 transition flex items-center gap-2"
        >
          <Share2 className="w-4 h-4" />
          Share Results
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
