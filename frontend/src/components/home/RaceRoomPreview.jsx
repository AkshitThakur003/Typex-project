import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { Avatar } from '../common';

const mockPlayers = [
  { id: 1, name: 'Priya', baseWpm: 62, progress: 0, accuracy: 96.5, emoji: '👩', speedMultiplier: 1.0, wpm: 62 },
  { id: 2, name: 'Arjun', baseWpm: 78, progress: 0, accuracy: 98.2, emoji: '👨', speedMultiplier: 1.0, wpm: 78 },
  { id: 3, name: 'Kavya', baseWpm: 88, progress: 0, accuracy: 97.8, emoji: '👧', speedMultiplier: 1.0, wpm: 88 },
  { id: 4, name: 'Rohan', baseWpm: 71, progress: 0, accuracy: 95.9, emoji: '👦', speedMultiplier: 1.0, wpm: 71 },
];

export default function RaceRoomPreview() {
  const [players, setPlayers] = useState(mockPlayers);
  const [raceStarted, setRaceStarted] = useState(false);
  const [raceFinished, setRaceFinished] = useState(false);
  const containerRef = useRef(null);
  const raceTimeRef = useRef(0);
  const resetTimeoutRef = useRef(null);
  const isFinishedRef = useRef(false);

  useEffect(() => {
    // Start race animation after a delay
    const startTimeout = setTimeout(() => {
      setRaceStarted(true);
      raceTimeRef.current = Date.now();
      isFinishedRef.current = false;
    }, 1200);

    // Animate players racing with realistic behavior
    const interval = setInterval(() => {
      if (raceStarted && !isFinishedRef.current) {
        const elapsed = (Date.now() - raceTimeRef.current) / 1000; // seconds
        
        setPlayers(prev => {
          const updated = prev.map((player, index) => {
            // Realistic progress calculation based on WPM
            // Progress should correlate with time and WPM
            const wordsPerSecond = (player.baseWpm || 60) / 60;
            const wordsTyped = (elapsed * wordsPerSecond * (player.speedMultiplier || 1.0));
            const totalWords = 50; // Assume 50 word race
            const calculatedProgress = (wordsTyped / totalWords) * 100;
            const newProgress = isNaN(calculatedProgress) 
              ? (player.progress || 0) 
              : Math.min(100, Math.max(0, calculatedProgress));
            
            // Realistic WPM variation - fluctuates but stays near base
            const wpmVariation = (Math.random() - 0.5) * 12; // ±6 WPM variation
            // Occasional speed bursts or slowdowns
            const speedEvent = Math.random();
            let speedAdjustment = 1.0;
            if (speedEvent < 0.05) {
              // Occasional slowdown (typing difficult word)
              speedAdjustment = 0.7;
            } else if (speedEvent > 0.95) {
              // Occasional speed burst
              speedAdjustment = 1.25;
            }
            
            const calculatedWpm = Math.round((player.baseWpm + wpmVariation) * speedAdjustment);
            const currentWpm = isNaN(calculatedWpm) 
              ? player.baseWpm 
              : Math.max(35, Math.min(110, calculatedWpm));
            
            // Update speed multiplier gradually (realistic fatigue/speed changes)
            const newSpeedMultiplier = Math.max(0.85, Math.min(1.15, 
              player.speedMultiplier + (Math.random() - 0.5) * 0.02
            ));
            
            // Realistic accuracy - fluctuates slightly, decreases slightly over time
            const accuracyDrift = elapsed * 0.01; // Slight decrease over time
            const accuracyVariation = (Math.random() - 0.5) * 1.5;
            const calculatedAccuracy = (player.accuracy || 96) - accuracyDrift + accuracyVariation;
            const newAccuracy = isNaN(calculatedAccuracy) 
              ? (player.accuracy || 96) 
              : Math.max(94, Math.min(99.5, calculatedAccuracy));

            return {
              ...player,
              progress: newProgress,
              wpm: currentWpm,
              accuracy: newAccuracy,
              speedMultiplier: newSpeedMultiplier
            };
          });
          
          // Check if any player has finished (reached 100%)
          const hasFinished = updated.some(p => p.progress >= 100);
          if (hasFinished && !isFinishedRef.current) {
            isFinishedRef.current = true;
            setRaceFinished(true);
            
            // Reset after showing results for 2.5 seconds
            if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
            resetTimeoutRef.current = setTimeout(() => {
              // Reset everything
              isFinishedRef.current = false;
              setRaceFinished(false);
              setPlayers(mockPlayers.map(p => ({
                ...p,
                progress: 0,
                wpm: p.baseWpm,
                accuracy: p.baseWpm < 65 ? 95.5 + Math.random() : p.baseWpm < 80 ? 97.2 + Math.random() : 97.8 + Math.random(),
                speedMultiplier: 1.0
              })));
              raceTimeRef.current = Date.now();
            }, 2500);
          }
          
          return updated;
        });
      }
    }, 150); // Update every 150ms for more realistic feel

    return () => {
      clearTimeout(startTimeout);
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
      clearInterval(interval);
    };
  }, [raceStarted]);

  // Animate progress bars with GSAP
  useEffect(() => {
    if (raceStarted && containerRef.current) {
      players.forEach((player, index) => {
        const progressBar = containerRef.current?.querySelector(`[data-player-id="${player.id}"] .progress-bar`);
        if (progressBar) {
          gsap.to(progressBar, {
            width: `${player.progress}%`,
            duration: 0.2,
            ease: 'power2.out'
          });
        }
      });
    }
  }, [players, raceStarted]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 shadow-2xl p-6 md:p-8 hover:shadow-emerald-500/10 transition-all duration-500"
        ref={containerRef}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Live Race</h3>
            <p className="text-sm text-slate-400">4 players racing</p>
          </div>
          {raceStarted && !raceFinished && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full"
            >
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                In Progress
              </span>
            </motion.div>
          )}
          {raceFinished && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full"
            >
              <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-amber-400 rounded-full" />
                Race Finished
              </span>
            </motion.div>
          )}
        </div>

        {/* Players List */}
        <div className="space-y-3">
          {players
            .map((player, index) => ({ ...player, originalIndex: index }))
            .sort((a, b) => b.progress - a.progress) // Sort by progress
            .map((player, displayIndex) => {
              const isLeading = displayIndex === 0 && player.progress > 5;
              return (
                <motion.div
                  key={player.id}
                  data-player-id={player.id}
                  initial={{ opacity: 0, x: -30, scale: 0.95 }}
                  whileInView={{ opacity: 1, x: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: player.originalIndex * 0.1, duration: 0.5, ease: "easeOut" }}
                  className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 hover:border-slate-600 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar name={player.name} size={40} emoji={player.emoji} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-white truncate">{player.name}</span>
                          {isLeading && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full font-bold flex-shrink-0"
                            >
                              🏆 Leading
                            </motion.span>
                          )}
                        </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 flex-wrap">
                      <span className="font-mono text-emerald-400 font-semibold">
                        {player.wpm || player.baseWpm || 0} WPM
                      </span>
                      <span className="w-px h-3 bg-slate-700 hidden sm:block" />
                      <span className="hidden sm:inline">
                        {((player.accuracy || 0)).toFixed(0)}% accuracy
                      </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-bold text-white">
                        {(player.progress || 0).toFixed(0)}%
                      </div>
                      <div className="text-xs text-slate-400">Progress</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 bg-slate-700/30 rounded-full overflow-hidden">
                    <motion.div
                      className="progress-bar h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                      initial={{ width: '0%' }}
                      style={{ width: `${player.progress}%` }}
                    />
                  </div>
                </motion.div>
              );
            })}
        </div>

        {/* Race Stats Footer */}
        {raceStarted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 pt-6 border-t border-slate-700/50 flex flex-wrap items-center justify-between gap-4 text-sm"
          >
            <div className="flex items-center gap-4">
              <div>
                <div className="text-slate-400">Average WPM</div>
                <div className="text-xl font-bold text-emerald-400">
                  {Math.round(players.reduce((sum, p) => sum + (p.wpm || p.baseWpm || 0), 0) / players.length) || 0}
                </div>
              </div>
              <div>
                <div className="text-slate-400">Fastest</div>
                <div className="text-xl font-bold text-white">
                  {Math.max(...players.map(p => p.wpm || p.baseWpm || 0), 0) || 0} WPM
                </div>
              </div>
            </div>
            <div className="text-slate-500 text-xs">
              Real-time multiplayer racing
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

