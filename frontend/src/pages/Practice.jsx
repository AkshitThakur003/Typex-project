import React, { useState, useEffect, useRef, useMemo } from "react";
import { getRandomWords } from "../data/words";
import { getRandomQuote } from "../data/quotes.js";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { RotateCw } from "lucide-react";
import { usePreferences } from "../settings/PreferencesContext.jsx";
import { playKeySound, playErrorSound } from "../lib/keyboardSounds";

const MODES = {
  time: [15, 30, 60],
  words: [10, 25, 50],
};

const DIFFICULTIES = ['all', 'easy', 'medium', 'hard'];

const Practice = () => {
  const navigate = useNavigate();
  const { preferences } = usePreferences();

  const [mode, setMode] = useState("time");
  const [value, setValue] = useState(30);
  const [difficulty, setDifficulty] = useState("all");
  const [text, setText] = useState([]);
  const [currentWord, setCurrentWord] = useState(0);
  const [typed, setTyped] = useState([]);
  const [started, setStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [finishedData, setFinishedData] = useState(null);
  const [progress, setProgress] = useState([]); // [{ time, wpm }]
  const [liveWpm, setLiveWpm] = useState(0);
  const pausedTimeLeftRef = useRef(30);
  const progressRef = useRef([]);

  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const startedAtRef = useRef(null);
  const typedRef = useRef(typed);
  const containerRef = useRef(null);
  const caretRef = useRef(null);

  // Compute currentChar from typed state (no need for separate state)
  const currentChar = typed[currentWord]?.length || 0;
  
  // Use caret object for single source of truth
  const caret = useMemo(() => ({ word: currentWord, char: currentChar }), [currentWord, currentChar]);

  // Keep typedRef.current in sync with typed state
  useEffect(() => {
    typedRef.current = typed;
  }, [typed]);

  // Calculate visible words for 2-3 line view (show ~25-30 words around current word)
  const visibleWords = useMemo(() => {
    if (text.length === 0) return [];
    
    const wordsToShow = 30; // ~2.5-3 lines worth of words
    // Show more words ahead than behind for better typing flow
    const wordsBefore = Math.floor(wordsToShow * 0.25); // 25% before current
    const wordsAfter = Math.floor(wordsToShow * 0.75); // 75% after current
    
    const startIndex = Math.max(0, currentWord - wordsBefore);
    const endIndex = Math.min(text.length, currentWord + wordsAfter);
    
    return text.slice(startIndex, endIndex).map((word, idx) => ({
      word,
      originalIndex: startIndex + idx
    }));
  }, [text, currentWord]);

  // Note: Auto-scroll not needed for fixed 2-3 line view
  // The visibleWords useMemo automatically updates to show words around currentWord

  const generateWords = (count = 50) => {
    return getRandomWords(count, difficulty);
  };

  const generateQuote = () => {
    const quote = getRandomQuote();
    // Split quote into words for consistency with existing word-based logic
    return quote.split(/\s+/).filter(w => w.length > 0);
  };

  useEffect(() => {
    if (mode === "words") {
      const newText = generateWords(value);
      setText(newText);
      savedTextRef.current = [...newText];
      setTimeLeft(value); // Not used for words mode, but kept for consistency
    } else if (mode === "quote") {
      const newQuote = generateQuote();
      setText(newQuote);
      savedTextRef.current = [...newQuote];
      setTimeLeft(0); // No timer for quote mode
    } else {
      // time mode
      const newText = generateWords(50);
      setText(newText);
      savedTextRef.current = [...newText];
      setTimeLeft(value);
    }
    setTyped([]);
    typedRef.current = [];
    setCurrentWord(0);
    setStarted(false);
    setProgress([]);
    progressRef.current = [];
    startedAtRef.current = null;
    setLiveWpm(0);
    clearInterval(timerRef.current);
  }, [mode, value, difficulty]);

  // Calculate live WPM
  const calculateLiveWpm = () => {
    if (!started || !startedAtRef.current) return 0;
    const elapsedSec = Math.max(1, Math.floor((Date.now() - startedAtRef.current) / 1000));
    const correctChars = typedRef.current.reduce((acc, word, i) => {
      const target = text[i] || "";
      const wordStr = word || "";
      for (let j = 0; j < wordStr.length && j < target.length; j++) {
        if (wordStr[j] === target[j]) acc++;
      }
      return acc;
    }, 0);
    return elapsedSec > 0 ? Math.round((correctChars / 5) / (elapsedSec / 60)) : 0;
  };

  // Update live WPM periodically
  useEffect(() => {
    if (!started) {
      setLiveWpm(0);
      return;
    }
    const wpmInterval = setInterval(() => {
      setLiveWpm(calculateLiveWpm());
    }, 500);
    return () => clearInterval(wpmInterval);
  }, [started, typed, text]);

  useEffect(() => {
    if (started && !isPaused && mode === "time" && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            finishTest();
            return 0;
          }
          // Real-time WPM snapshot (time mode)
          const newTimeLeft = t - 1;
          const elapsed = value - newTimeLeft; // seconds elapsed
          const correctCharsNow = typedRef.current.reduce((acc, word, i) => {
            const target = text[i] || "";
            const wordStr = word || "";
            for (let j = 0; j < wordStr.length && j < target.length; j++) {
              if (wordStr[j] === target[j]) acc++;
            }
            return acc;
          }, 0);
          const wpmNow = elapsed > 0 ? Math.round((correctCharsNow / 5) / (elapsed / 60)) : 0;
          setLiveWpm(wpmNow);
          // append snapshot
          if (!progressRef.current.length || progressRef.current[progressRef.current.length - 1].time !== elapsed) {
            const next = [...progressRef.current, { time: elapsed, wpm: wpmNow }];
            progressRef.current = next;
            setProgress(next);
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [started, isPaused, mode, timeLeft, value, text]);

  const handleKeyDown = (e) => {
    // Keyboard shortcuts
    if (e.key === "Tab") {
      e.preventDefault();
      if (e.shiftKey) {
        // Shift+Tab: New test (new text)
        restart(false);
      } else {
        // Tab: Quick restart (same text)
        restart(true);
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      if (started) {
        restart(false);
      } else {
        navigate("/");
      }
      return;
    }

    // Pause/Resume with Ctrl+P (or Cmd+P on Mac)
    if ((e.key === "p" || e.key === "P") && (e.ctrlKey || e.metaKey) && started) {
      e.preventDefault();
      setIsPaused((prev) => {
        if (!prev) {
          // Pausing - save current time left
          pausedTimeLeftRef.current = timeLeft;
        }
        return !prev;
      });
      return;
    }

    // Prevent default to avoid input field showing characters
    e.preventDefault();
    
    // Don't allow typing when paused
    if (isPaused) return;
    
    if (!started) {
      setStarted(true);
      if (!startedAtRef.current) startedAtRef.current = Date.now();
    }

    if (e.key === "Backspace") {
      const currentWordStr = typed[currentWord] || "";
      const charCount = currentWordStr.length;
      
      // If at start of current word and not at first word, go back to previous word
      if (charCount === 0 && currentWord > 0) {
        setCurrentWord(currentWord - 1);
        // Don't delete the previous word's content, just move position
      } else if (charCount > 0) {
        // Delete character from current word
        setTyped((prev) => {
          const newTyped = [...prev];
          const currentWordStr = newTyped[currentWord] || "";
          newTyped[currentWord] = currentWordStr.slice(0, -1);
          typedRef.current = newTyped;
          return newTyped;
        });
      }
      // Clear input value
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      return;
    }

    if (e.key === " " || e.key === "Enter") {
      // Only move to next word if we're on the current word
      if (currentWord < text.length) {
        const nextWord = currentWord + 1;
        setCurrentWord(nextWord);
        // Snapshot on word completion (words mode and quote mode)
        if (mode === "words" || mode === "quote") {
          const elapsedSec = startedAtRef.current ? Math.max(1, Math.floor((Date.now() - startedAtRef.current) / 1000)) : 1;
          const correctCharsNow = typedRef.current.reduce((acc, word, i) => {
            const target = text[i] || "";
            const wordStr = word || "";
            for (let j = 0; j < wordStr.length && j < target.length; j++) {
              if (wordStr[j] === target[j]) acc++;
            }
            return acc;
          }, 0);
          const wpmNow = elapsedSec > 0 ? Math.round((correctCharsNow / 5) / (elapsedSec / 60)) : 0;
          setLiveWpm(wpmNow);
          if (!progressRef.current.length || progressRef.current[progressRef.current.length - 1].time !== elapsedSec) {
            const next = [...progressRef.current, { time: elapsedSec, wpm: wpmNow }];
            progressRef.current = next;
            setProgress(next);
          }
        }
        // Check if test should finish after moving to next word
        if (mode === "words" && nextWord >= value) {
          setTimeout(() => finishTest(), 0);
        }
        // Check if quote is complete
        if (mode === "quote" && nextWord >= text.length) {
          setTimeout(() => finishTest(), 0);
        }
      }
      return;
    }

    // Only handle printable characters (letters, numbers, punctuation)
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && e.key !== " ") {
      const newChar = e.key;
      
      // Play keyboard sound
      const targetWord = text[currentWord] || "";
      const currentTyped = typed[currentWord] || "";
      const isCorrect = targetWord[currentTyped.length] === newChar;
      if (preferences.keyboardSound && preferences.keyboardSound !== 'off') {
        if (isCorrect) {
          playKeySound(preferences.keyboardSound, preferences.soundVolume ?? 0.5);
        } else {
          playErrorSound(preferences.soundVolume ?? 0.5);
        }
      }
      
      setTyped((prev) => {
        const newTyped = [...prev];
        const currentWordStr = newTyped[currentWord] || "";
        newTyped[currentWord] = currentWordStr + newChar;
        typedRef.current = newTyped;
        
        // Check if test should finish (words mode) - use updated state
        if (mode === "words" && currentWord >= value - 1) {
          const typedWord = newTyped[currentWord] || "";
          const targetWord = text[currentWord] || "";
          if (typedWord.length >= targetWord.length) {
            setTimeout(() => finishTest(), 100);
          }
        }
        // Check if quote is complete (quote mode)
        if (mode === "quote" && currentWord >= text.length - 1) {
          const typedWord = newTyped[currentWord] || "";
          const targetWord = text[currentWord] || "";
          if (typedWord.length >= targetWord.length) {
            setTimeout(() => finishTest(), 100);
          }
        }
        
        return newTyped;
      });
      
      // Clear input value to prevent any display issues
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const finishTest = () => {
    if (finishedData) return; // Prevent multiple calls
    clearInterval(timerRef.current);
    // Use typedRef.current for accurate data at finish time (synced with useEffect)
    const typedAtFinish = typedRef.current.length > 0 ? typedRef.current : typed;
    const totalTyped = typedAtFinish.join(" ").length;
    const correctChars = typedAtFinish.reduce((acc, word, i) => {
      const target = text[i] || "";
      const wordStr = word || "";
      for (let j = 0; j < wordStr.length && j < target.length; j++) {
        if (wordStr[j] === target[j]) acc++;
      }
      return acc;
    }, 0);
    const wrongChars = totalTyped - correctChars;

    // Calculate elapsed time properly for all modes
    const elapsedSec = mode === 'time'
      ? value
      : (startedAtRef.current ? Math.max(1, Math.floor((Date.now() - startedAtRef.current) / 1000)) : 1);
    
    const elapsedMinutes = elapsedSec / 60;
    const wpm = elapsedMinutes > 0 
      ? Math.round((correctChars / 5) / elapsedMinutes)
      : 0;
    
    const accuracy = totalTyped > 0
      ? Math.round((correctChars / totalTyped) * 100)
      : 0;

    // Calculate words completed for XP
    const wordsCompleted = typedAtFinish.filter(w => w && w.trim().length > 0).length;

    // Ensure we push a final snapshot
    try {
      const finalElapsed = elapsedSec;
      const wpmNow = finalElapsed > 0 ? Math.round((correctChars / 5) / (finalElapsed / 60)) : 0;
      if (!progressRef.current.length || progressRef.current[progressRef.current.length - 1].time !== finalElapsed) {
        const next = [...progressRef.current, { time: finalElapsed, wpm: wpmNow }];
        progressRef.current = next;
        setProgress(next);
      }
    } catch (err) {
      console.error('[Practice] Error calculating final progress:', err);
    }

    setFinishedData({
      wpm,
      accuracy,
      correctChars,
      wrongChars,
      mode,
      value,
      wordsCompleted, // Include for accurate XP calculation
      elapsedSec, // Include elapsed time
      finishTime: Math.round(elapsedSec * 10) / 10, // Finish time in seconds with 1 decimal
      progress: progressRef.current.slice(),
      sessionId: `practice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Unique session ID to prevent duplicate XP awards
    });
  };

  // Navigate outside render cycle when finishedData is ready
  useEffect(() => {
    if (!finishedData) return;
    // Defer navigation to ensure all state updates are complete
    const id = setTimeout(() => {
      navigate('/results', { state: finishedData });
    }, 100);
    return () => clearTimeout(id);
  }, [finishedData, navigate]);

  const savedTextRef = useRef([]);

  const restart = (keepText = false) => {
    // Save current text before restarting
    if (text.length > 0) {
      savedTextRef.current = [...text];
    }

    // Regenerate text only if not keeping same text
    if (!keepText) {
      if (mode === "words") {
        setText(generateWords(value));
      } else if (mode === "quote") {
        setText(generateQuote());
      } else {
        setText(generateWords(50));
      }
    } else if (savedTextRef.current.length > 0) {
      // Restore saved text
      setText([...savedTextRef.current]);
    } else {
      // Fallback to generating new text if no saved text
      if (mode === "words") {
        setText(generateWords(value));
      } else if (mode === "quote") {
        setText(generateQuote());
      } else {
        setText(generateWords(50));
      }
    }

    setTyped([]);
    typedRef.current = [];
    setCurrentWord(0);
    setTimeLeft(value);
    setStarted(false);
    setIsPaused(false);
    clearInterval(timerRef.current);
    setFinishedData(null);
    setProgress([]);
    progressRef.current = [];
    startedAtRef.current = null;
    setLiveWpm(0);
    pausedTimeLeftRef.current = value;
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  };


  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Calculate words completed
  const wordsCompleted = useMemo(() => {
    return typed.filter(w => w && w.trim().length > 0).length;
  }, [typed]);

  // Calculate progress percentage
  const progressPercentage = useMemo(() => {
    if (mode === "words") {
      return Math.min(100, (wordsCompleted / value) * 100);
    } else if (mode === "quote") {
      // Quote mode: progress based on words completed
      return text.length > 0 ? Math.min(100, (wordsCompleted / text.length) * 100) : 0;
    } else {
      // time mode uses time-based progress
      return Math.min(100, ((value - timeLeft) / value) * 100);
    }
  }, [mode, value, wordsCompleted, timeLeft, text.length]);

  // Apply font style from preferences
  const fontClass = useMemo(() => {
    const fontStyle = preferences?.fontStyle || "monospace";
    switch (fontStyle) {
      case "sans": return "font-sans";
      case "typewriter": return "font-serif";
      default: return "font-mono";
    }
  }, [preferences?.fontStyle]);

  // Apply font size from preferences
  const fontSizeClass = useMemo(() => {
    const fontSize = preferences?.fontSize || "medium";
    switch (fontSize) {
      case "small": return "text-lg sm:text-xl";
      case "large": return "text-2xl sm:text-3xl";
      case "xl": return "text-3xl sm:text-4xl";
      default: return "text-xl sm:text-2xl"; // medium
    }
  }, [preferences?.fontSize]);

  // Apply caret style from preferences
  const caretStylePref = preferences?.caretStyle || "solid";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="min-h-screen flex flex-col items-center justify-center px-2 sm:px-4 bg-slate-950 text-white py-4 sm:py-8"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Hidden input for proper keyboard handling */}
      <input
        ref={inputRef}
        type="text"
        autoFocus
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        className="fixed opacity-0 w-px h-px -z-10"
        style={{ fontSize: '16px' }} // Prevent iOS zoom
        onKeyDown={handleKeyDown}
        onInput={(e) => {
          // Mobile support: handle input events for touch keyboards
          const inputValue = e.target.value;
          if (!inputValue) return;
          
          // Process each character from mobile input
          for (const char of inputValue) {
            if (char === ' ') {
              // Space - move to next word
              if (currentWord < text.length) {
                setCurrentWord(prev => prev + 1);
              }
            } else if (char.length === 1 && char !== '\n') {
              // Regular character
              if (!started) {
                setStarted(true);
                if (!startedAtRef.current) startedAtRef.current = Date.now();
              }
              setTyped((prev) => {
                const newTyped = [...prev];
                const currentWordStr = newTyped[currentWord] || "";
                newTyped[currentWord] = currentWordStr + char;
                typedRef.current = newTyped;
                return newTyped;
              });
            }
          }
          
          // Clear input after processing
          e.target.value = "";
        }}
        aria-label="Typing input"
      />
      
      {/* Mode selectors - Hidden when test starts */}
      {!started && (
        <div className="flex flex-wrap justify-center gap-3 sm:gap-6 mb-3 sm:mb-4 w-full max-w-5xl">
          <div className="flex flex-col items-center">
            <span className="text-xs uppercase text-slate-400">Time</span>
            <div className="flex gap-1.5 sm:gap-2 mt-1">
              {MODES.time.map((t) => (
                <button
                  key={t}
                  className={`px-3 sm:px-4 py-2 text-sm sm:text-base rounded transition touch-target min-h-[44px] min-w-[44px] ${
                    mode === "time" && value === t
                      ? "bg-emerald-600 text-black font-semibold"
                      : "bg-slate-800 hover:bg-slate-700"
                  }`}
                  onClick={() => {
                    setMode("time");
                    setValue(t);
                  }}
                  disabled={started}
                >
                  {t}s
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs uppercase text-slate-400">Words</span>
            <div className="flex gap-1.5 sm:gap-2 mt-1">
              {MODES.words.map((w) => (
                <button
                  key={w}
                  className={`px-3 sm:px-4 py-2 text-sm sm:text-base rounded transition touch-target min-h-[44px] min-w-[44px] ${
                    mode === "words" && value === w
                      ? "bg-emerald-600 text-black font-semibold"
                      : "bg-slate-800 hover:bg-slate-700"
                  }`}
                  onClick={() => {
                    setMode("words");
                    setValue(w);
                  }}
                  disabled={started}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs uppercase text-slate-400">Quote</span>
            <button
              className={`px-3 sm:px-4 py-2 text-sm sm:text-base rounded transition touch-target min-h-[44px] min-w-[44px] ${
                mode === "quote"
                  ? "bg-emerald-600 text-black font-semibold"
                  : "bg-slate-800 hover:bg-slate-700"
              }`}
              onClick={() => {
                setMode("quote");
                setValue(0); // No timer for quote mode
              }}
              disabled={started}
            >
              Quote
            </button>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs uppercase text-slate-400">Difficulty</span>
            <div className="flex gap-1.5 sm:gap-2 mt-1">
              {DIFFICULTIES.map((diff) => (
                <button
                  key={diff}
                  className={`px-3 sm:px-4 py-2 text-sm sm:text-base rounded transition touch-target min-h-[44px] capitalize ${
                    difficulty === diff
                      ? "bg-emerald-600 text-black font-semibold"
                      : "bg-slate-800 hover:bg-slate-700"
                  }`}
                  onClick={() => {
                    setDifficulty(diff);
                  }}
                  disabled={started}
                >
                  {diff === 'all' ? 'All' : diff}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stats Header - Enhanced when test starts */}
      <div className={`flex flex-wrap items-center justify-center gap-4 sm:gap-8 mb-4 sm:mb-6 w-full max-w-5xl ${started ? 'mt-4 sm:mt-6' : ''}`}>
        {/* Timer - Larger when started */}
        {mode === "time" && (
          <div className="flex flex-col items-center">
            <span className={`${started ? 'text-sm sm:text-base' : 'text-xs'} uppercase text-slate-400 mb-1`}>Time</span>
            <div className={`${started ? 'text-5xl sm:text-6xl md:text-7xl' : 'text-2xl sm:text-3xl md:text-4xl'} font-bold ${timeLeft <= 5 ? "text-red-500" : "text-orange-400"}`}>
              {timeLeft}s
            </div>
          </div>
        )}
        
        {/* Word Counter - Larger when started */}
        <div className="flex flex-col items-center">
          <span className={`${started ? 'text-sm sm:text-base' : 'text-xs'} uppercase text-slate-400 mb-1`}>Words</span>
          <div className={`${started ? 'text-4xl sm:text-5xl md:text-6xl' : 'text-lg sm:text-xl md:text-2xl'} font-semibold text-white`}>
            {mode === "words" ? (
              <span className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                <span>{wordsCompleted} / {value}</span>
                {!started && (
                  <span className="text-xs sm:text-sm text-slate-400 font-normal">
                    ({Math.round((wordsCompleted / value) * 100)}%)
                  </span>
                )}
              </span>
            ) : mode === "quote" ? (
              <span className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                <span>{wordsCompleted} / {text.length}</span>
                {!started && (
                  <span className="text-xs sm:text-sm text-slate-400 font-normal">
                    ({text.length > 0 ? Math.round((wordsCompleted / text.length) * 100) : 0}%)
                  </span>
                )}
              </span>
            ) : (
              wordsCompleted
            )}
          </div>
        </div>

        {/* Live WPM - Larger when started */}
        {started && !isPaused && (
          <div className="flex flex-col items-center">
            <span className="text-sm sm:text-base uppercase text-slate-400 mb-1">WPM</span>
            <div className="text-4xl sm:text-5xl md:text-6xl font-semibold text-emerald-400">
              {liveWpm}
            </div>
          </div>
        )}

        {/* Pause Button - Larger when started */}
        {started && (
          <button
            onClick={() => setIsPaused((prev) => {
              if (!prev) {
                pausedTimeLeftRef.current = timeLeft;
              }
              return !prev;
            })}
            className={`${started ? 'px-4 sm:px-6 py-2.5 sm:py-3 text-base sm:text-lg' : 'px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base'} rounded-lg bg-slate-800 hover:bg-slate-700 transition text-white font-semibold`}
            aria-label={isPaused ? "Resume" : "Pause"}
          >
            {isPaused ? "▶ Resume" : "⏸ Pause"}
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {started && !isPaused && (
        <div className="w-full max-w-5xl mb-3 sm:mb-4 h-1.5 sm:h-2 bg-slate-800 rounded-full overflow-hidden mx-2 sm:mx-0">
          <div
            className="h-full bg-emerald-500 transition-all duration-300 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      )}

      {/* Paused Overlay */}
      {isPaused && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setIsPaused(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 text-center max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">⏸</div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Paused</h2>
            <p className="text-sm sm:text-base text-slate-400 mb-4 sm:mb-6">Your test is paused. Click resume or press Ctrl+P to continue.</p>
            <button
              onClick={() => setIsPaused(false)}
              className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base rounded-lg bg-emerald-600 text-black font-semibold hover:bg-emerald-500 transition w-full sm:w-auto"
            >
              ▶ Resume Test
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* Typing area - 2-3 line focused view */}
      <div
        ref={containerRef}
        className={`w-full max-w-5xl ${fontSizeClass} leading-relaxed ${fontClass}
                   mx-2 sm:mx-0
                   flex flex-col justify-center
                   min-h-[140px] sm:min-h-[160px] max-h-[180px] sm:max-h-[200px]
                   overflow-hidden`}
      >
        <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center items-center">
          {visibleWords.map(({ word, originalIndex: wi }) => {
            const isActive = wi === currentWord;
            const isPast = wi < currentWord;
            const isFuture = wi > currentWord;
            
            return (
              <div key={wi} data-word-index={wi} className="flex gap-[2px]">
                {word.split("").map((char, ci) => {
                  const typedWord = typed[wi];
                  const typedChar = typedWord?.[ci];
                  const isCaret = caret.word === wi && caret.char === ci;
                  
                  // Determine color based on character comparison
                  let color = "text-slate-500"; // default faded (not typed yet)
                  
                  if (isPast && typedWord) {
                    // Past words: check if fully correct
                    const targetWord = text[wi] || "";
                    color = typedWord === targetWord ? "text-slate-400" : "text-red-400";
                  } else if (typedChar !== undefined) {
                    // Current word: compare characters
                    color = typedChar === char ? "text-white" : "text-red-500";
                  } else if (isActive) {
                    // Current word, not yet typed
                    color = "text-slate-500";
                  }
                  
                  return (
                    <span key={ci} className={`${color} relative`}>
                      {char}
                      {isCaret && (
                        <motion.span
                          ref={caretRef}
                          className="absolute left-0 -bottom-0.5 sm:-bottom-1 w-full h-[1.5px] sm:h-[2px] bg-emerald-500 pointer-events-none"
                          animate={
                            caretStylePref === "blink"
                              ? { opacity: [0, 1, 0] }
                              : caretStylePref === "highlight"
                              ? { opacity: 1, backgroundColor: ["#10b981", "#34d399", "#10b981"] }
                              : { opacity: [0, 1, 0] }
                          }
                          transition={
                            caretStylePref === "highlight"
                              ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                              : { duration: 1, repeat: Infinity }
                          }
                        />
                      )}
                    </span>
                  );
                })}
                {isActive && caret.char === word.length && (
                  <motion.span
                    ref={caretRef}
                    className="inline-block w-[1.5px] sm:w-[2px] h-5 sm:h-6 bg-emerald-500 align-middle"
                    animate={
                      caretStylePref === "blink"
                        ? { opacity: [0, 1, 0] }
                        : caretStylePref === "highlight"
                        ? { opacity: 1, backgroundColor: ["#10b981", "#34d399", "#10b981"] }
                        : { opacity: [0, 1, 0] }
                    }
                    transition={
                      caretStylePref === "highlight"
                        ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                        : { duration: 1, repeat: Infinity }
                    }
                  />
                )}
                <span className="text-transparent select-none"> </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Restart Button */}
      <div className="mt-4 sm:mt-6 flex justify-center">
        <button
          onClick={() => restart(false)}
          className="px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg bg-emerald-600 text-black font-semibold hover:bg-emerald-500 active:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 min-w-[140px] sm:min-w-[160px]"
          aria-label="Restart test"
          type="button"
        >
          <RotateCw className="w-4 h-5 sm:w-5 flex-shrink-0" aria-hidden="true" />
          <span>Restart</span>
        </button>
      </div>

      {/* Keyboard Shortcuts Hint - Hidden on mobile */}
      <div className="hidden md:block mt-3 sm:mt-4 px-2 text-[10px] sm:text-xs text-slate-500 text-center max-w-5xl">
        <p className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-slate-800 rounded text-[10px] sm:text-xs">Tab</kbd>
            <span className="hidden sm:inline">restart (same text)</span>
            <span className="sm:hidden">restart</span>
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-slate-800 rounded text-[10px] sm:text-xs">Shift+Tab</kbd>
            <span className="hidden sm:inline">new test</span>
            <span className="sm:hidden">new</span>
          </span>
          {started && (
            <>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-slate-800 rounded text-[10px] sm:text-xs">Ctrl+P</kbd>
                <span className="hidden sm:inline">pause/resume</span>
                <span className="sm:hidden">pause</span>
              </span>
            </>
          )}
          <span className="hidden sm:inline">•</span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-slate-800 rounded text-[10px] sm:text-xs">Esc</kbd>
            <span>{started ? "reset" : "go back"}</span>
          </span>
        </p>
      </div>
    </motion.div>
  );
};

export default Practice;
