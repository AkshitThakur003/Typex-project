import React, { useState, useEffect, useRef } from "react";
import words from "../data/words";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { RotateCw } from "lucide-react";

const MODES = {
  time: [15, 30, 60],
  words: [10, 25, 50],
};

const Practice = () => {
  const navigate = useNavigate();

  const [mode, setMode] = useState("time");
  const [value, setValue] = useState(30);
  const [text, setText] = useState([]);
  const [currentWord, setCurrentWord] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);
  const [typed, setTyped] = useState([]);
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [caret, setCaret] = useState({ word: 0, char: 0 });
  const [finishedData, setFinishedData] = useState(null);
  const [progress, setProgress] = useState([]); // [{ time, wpm }]
  const progressRef = useRef([]);

  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const startedAtRef = useRef(null);
  const typedRef = useRef(typed);

  const generateWords = (count = 50) => {
    return Array.from({ length: count }, () => 
      words[Math.floor(Math.random() * words.length)]
    );
  };

  useEffect(() => {
    if (mode === "words") {
      setText(generateWords(value));
    } else {
      setText(generateWords(50));
    }
    setTyped([]);
  typedRef.current = [];
    setCurrentWord(0);
    setCurrentChar(0);
    setCaret({ word: 0, char: 0 });
    setTimeLeft(value);
    setStarted(false);
  setProgress([]);
  progressRef.current = [];
  startedAtRef.current = null;
    clearInterval(timerRef.current);
  }, [mode, value]);

  useEffect(() => {
    if (started && mode === "time" && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            finishTest();
          }
          // Real-time WPM snapshot (time mode)
          const newTimeLeft = t - 1;
          const elapsed = value - newTimeLeft; // seconds elapsed
          const correctCharsNow = typedRef.current.reduce((acc, word, i) => {
            const target = text[i] || "";
            for (let j = 0; j < (word || "").length; j++) {
              if (word[j] === target[j]) acc++;
            }
            return acc;
          }, 0);
          const wpmNow = elapsed > 0 ? Math.round((correctCharsNow / 5) / (elapsed / 60)) : 0;
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
    return () => clearInterval(timerRef.current);
  }, [started, mode]);

  const handleKeyDown = (e) => {
    if (!started) {
      setStarted(true);
      if (!startedAtRef.current) startedAtRef.current = Date.now();
    }

    if (e.key === "Backspace") {
      if (currentChar > 0) {
        setCurrentChar(currentChar - 1);
        setCaret({ word: currentWord, char: currentChar - 1 });
        setTyped((prev) => {
          const newTyped = [...prev];
          newTyped[currentWord] = (newTyped[currentWord] || "").slice(0, -1);
          typedRef.current = newTyped;
          return newTyped;
        });
      }
      return;
    }

    if (e.key === " " || e.key === "Enter") {
      setCurrentWord(currentWord + 1);
      setCurrentChar(0);
      setCaret({ word: currentWord + 1, char: 0 });
      // Snapshot on word completion (words mode)
      if (mode === "words") {
        const elapsedSec = startedAtRef.current ? Math.max(1, Math.floor((Date.now() - startedAtRef.current) / 1000)) : 1;
        const correctCharsNow = typedRef.current.reduce((acc, word, i) => {
          const target = text[i] || "";
          for (let j = 0; j < (word || "").length; j++) {
            if (word[j] === target[j]) acc++;
          }
          return acc;
        }, 0);
        const wpmNow = Math.round((correctCharsNow / 5) / (elapsedSec / 60));
        if (!progressRef.current.length || progressRef.current[progressRef.current.length - 1].time !== elapsedSec) {
          const next = [...progressRef.current, { time: elapsedSec, wpm: wpmNow }];
          progressRef.current = next;
          setProgress(next);
        }
      }
      return;
    }

  if (e.key.length === 1) {
      setTyped((prev) => {
        const newTyped = [...prev];
    newTyped[currentWord] = (newTyped[currentWord] || "") + e.key;
    typedRef.current = newTyped;
        return newTyped;
      });
      setCurrentChar(currentChar + 1);
      setCaret({ word: currentWord, char: currentChar + 1 });
    }

    if (mode === "words" && currentWord >= value - 1) {
      finishTest();
    }
  };

  const finishTest = () => {
    clearInterval(timerRef.current);
    const totalTyped = typed.join(" ").length;
    const correctChars = typed.reduce((acc, word, i) => {
      const target = text[i] || "";
      for (let j = 0; j < word.length; j++) {
        if (word[j] === target[j]) acc++;
      }
      return acc;
    }, 0);
    const wrongChars = totalTyped - correctChars;

    const wpm = Math.round(
      (correctChars / 5) / (mode === "time" ? value / 60 : timeLeft / 60)
    );
    const accuracy = totalTyped > 0
      ? Math.round((correctChars / totalTyped) * 100)
      : 0;

    // Ensure we push a final snapshot
    try {
      const finalElapsed = mode === 'time'
        ? value
        : (startedAtRef.current ? Math.max(1, Math.floor((Date.now() - startedAtRef.current) / 1000)) : 1);
      const wpmNow = finalElapsed > 0 ? Math.round((correctChars / 5) / (finalElapsed / 60)) : 0;
      if (!progressRef.current.length || progressRef.current[progressRef.current.length - 1].time !== finalElapsed) {
        const next = [...progressRef.current, { time: finalElapsed, wpm: wpmNow }];
        progressRef.current = next;
        setProgress(next);
      }
    } catch {}

    setFinishedData({
      wpm,
      accuracy,
      correctChars,
      wrongChars,
      mode,
      value,
  progress: progressRef.current.slice(),
    });
  };

  // Navigate outside render cycle when finishedData is ready
  useEffect(() => {
    if (!finishedData) return;
    // Defer to end of call stack to avoid React warning
    const id = setTimeout(() => {
      navigate('/results', { state: finishedData });
    }, 0);
    return () => clearTimeout(id);
  }, [finishedData, navigate]);

  const restart = () => {
    if (mode === "words") {
      setText(generateWords(value));
    } else {
      setText(generateWords(50));
    }
    setTyped([]);
    setCurrentWord(0);
    setCurrentChar(0);
    setCaret({ word: 0, char: 0 });
    setTimeLeft(value);
    setStarted(false);
    clearInterval(timerRef.current);
  setFinishedData(null);
  setProgress([]);
  progressRef.current = [];
  startedAtRef.current = null;
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 bg-slate-950 text-white"
      onClick={() => inputRef.current.focus()}
      tabIndex={0}
      ref={inputRef}
      onKeyDown={handleKeyDown}
    >
      {/* Mode selectors */}
      <div className="flex gap-6 mb-6">
        <div className="flex flex-col items-center">
          <span className="text-xs uppercase">Time</span>
          <div className="flex gap-2 mt-1">
            {MODES.time.map((t) => (
              <button
                key={t}
                className={`px-3 py-1 rounded ${
                  mode === "time" && value === t
                    ? "bg-emerald-600 text-black"
                    : "bg-slate-800"
                }`}
                onClick={() => {
                  setMode("time");
                  setValue(t);
                }}
              >
                {t}s
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xs uppercase">Words</span>
          <div className="flex gap-2 mt-1">
            {MODES.words.map((w) => (
              <button
                key={w}
                className={`px-3 py-1 rounded ${
                  mode === "words" && value === w
                    ? "bg-emerald-600 text-black"
                    : "bg-slate-800"
                }`}
                onClick={() => {
                  setMode("words");
                  setValue(w);
                }}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timer */}
      {mode === "time" && (
        <div className="mb-4 text-lg">{timeLeft}s</div>
      )}

      {/* Typing area */}
      <div
        className="w-full max-w-5xl text-2xl leading-relaxed font-mono flex flex-wrap gap-2 
                   md:p-0 md:bg-transparent md:rounded-none 
                   bg-slate-900 p-4 rounded-lg"
      >
        {text.map((word, wi) => {
          const isActive = wi === currentWord;
          return (
            <div key={wi} className="flex gap-[2px]">
              {word.split("").map((char, ci) => {
                const typedChar = typed[wi]?.[ci];
                const isCaret =
                  caret.word === wi && caret.char === ci;
                let color = "text-slate-500"; // default faded
                if (typedChar) {
                  color =
                    typedChar === char
                      ? "text-white"
                      : "text-red-500";
                }
                return (
                  <span key={ci} className={`${color} relative`}>
                    {char}
                    {isCaret && (
                      <motion.span
                        className="absolute left-0 -bottom-1 w-full h-[2px] bg-emerald-500"
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                    )}
                  </span>
                );
              })}
              {isActive && caret.char === word.length && (
                <motion.span
                  className="w-[2px] h-6 bg-emerald-500"
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Restart */}
      <button
        onClick={restart}
        className="mt-8 px-4 py-2 rounded-lg bg-emerald-600 text-black font-semibold hover:bg-emerald-500 transition flex items-center justify-center"
        aria-label="Restart test"
      >
        <RotateCw className="w-5 h-5" aria-hidden="true" />
        <span className="sr-only">Restart</span>
      </button>
    </div>
  );
};

export default Practice;
