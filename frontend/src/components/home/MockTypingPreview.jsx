import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';

const sampleText = "The quick brown fox jumps over the lazy dog. Typing fast is fun when you practice every day.";
const words = sampleText.split(' ');

export default function MockTypingPreview() {
  const [typedWords, setTypedWords] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [progress, setProgress] = useState(0);
  const containerRef = useRef(null);
  const wpmRef = useRef(null);
  const progressRef = useRef(null);
  const startedAtRef = useRef(null);

  useEffect(() => {
    // Reset animation
    setTypedWords([]);
    setCurrentWordIndex(0);
    setCurrentCharIndex(0);
    setWpm(0);
    setAccuracy(100);
    setProgress(0);
    startedAtRef.current = Date.now();

    let wordTimeout;
    let charTimeout;
    let wordIdx = 0;
    let charIdx = 0;
    const typed = [];
    let mistakes = 0;
    let totalChars = 0;
    let correctChars = 0;
    let mistakePositions = new Set(); // Track where mistakes occurred

    const typeNextChar = () => {
      if (wordIdx >= words.length) {
        // Restart after a pause
        setTimeout(() => {
          wordIdx = 0;
          charIdx = 0;
          typed.length = 0;
          mistakes = 0;
          totalChars = 0;
          correctChars = 0;
          mistakePositions.clear();
          setTypedWords([]);
          setCurrentWordIndex(0);
          setCurrentCharIndex(0);
          setProgress(0);
          setAccuracy(100);
          startedAtRef.current = Date.now();
          typeNextChar();
        }, 2500);
        return;
      }

      const word = words[wordIdx];
      if (charIdx < word.length) {
        const targetChar = word[charIdx];
        let typedChar = targetChar;
        
        // Simulate realistic mistakes (5-8% error rate)
        const makeMistake = Math.random() < 0.06 && charIdx > 0 && !mistakePositions.has(`${wordIdx}-${charIdx}`);
        if (makeMistake) {
          // Type wrong character
          const wrongChars = 'abcdefghijklmnopqrstuvwxyz';
          typedChar = wrongChars[Math.floor(Math.random() * wrongChars.length)];
          mistakes++;
          mistakePositions.add(`${wordIdx}-${charIdx}`);
          
          // Correct it after a short delay (realistic backspace behavior)
          setTimeout(() => {
            typed[wordIdx] = (typed[wordIdx] || '').slice(0, -1) + targetChar;
            setTypedWords([...typed]);
            mistakePositions.delete(`${wordIdx}-${charIdx}`);
            mistakes = Math.max(0, mistakes - 1);
          }, 200 + Math.random() * 300);
        } else {
          correctChars++;
        }
        
        typed[wordIdx] = (typed[wordIdx] || '') + typedChar;
        totalChars++;
        setTypedWords([...typed]);
        setCurrentWordIndex(wordIdx);
        setCurrentCharIndex(charIdx + 1);
        
        // Update progress
        const totalTextChars = sampleText.length;
        const typedTextChars = typed.join(' ').length;
        const newProgress = Math.min(100, (typedTextChars / totalTextChars) * 100);
        setProgress(newProgress);

        // Update WPM with realistic progression (starts slower, speeds up)
        const elapsed = (Date.now() - startedAtRef.current) / 1000 / 60; // minutes
        const baseWpm = 55; // Base typing speed
        const speedBoost = Math.min(1.3, 1 + (elapsed * 0.5)); // Gradually speed up
        const wpmVariation = baseWpm * speedBoost + (Math.random() - 0.5) * 8; // Add variation
        const newWpm = Math.max(45, Math.min(85, Math.round(wpmVariation)));
        setWpm(newWpm);

        // Calculate accuracy realistically
        const accuracyValue = totalChars > 0 
          ? Math.max(92, Math.min(100, ((correctChars - mistakes) / totalChars) * 100))
          : 100;
        setAccuracy(accuracyValue);

        charIdx++;
        // Variable typing speed - faster on common letters, slower on punctuation
        const baseDelay = targetChar.match(/[a-z]/) ? 60 : 120;
        const variation = Math.random() * 40;
        charTimeout = setTimeout(typeNextChar, baseDelay + variation);
      } else {
        // Move to next word
        typed[wordIdx] = word; // Ensure word is complete
        setTypedWords([...typed]);
        setCurrentWordIndex(wordIdx + 1);
        setCurrentCharIndex(0);
        wordIdx++;
        charIdx = 0;
        // Longer pause between words (realistic thinking time)
        wordTimeout = setTimeout(typeNextChar, 180 + Math.random() * 120);
      }
    };

    // Start typing after a short delay
    const startTimeout = setTimeout(() => {
      typeNextChar();
    }, 800);

    return () => {
      clearTimeout(startTimeout);
      clearTimeout(wordTimeout);
      clearTimeout(charTimeout);
    };
  }, []);

  // Animate WPM counter
  useEffect(() => {
    if (!wpmRef.current) return;
    
    const element = wpmRef.current;
    const startValue = parseInt(element.innerText) || 0;
    
    const animation = gsap.to(
      { value: startValue },
      {
        value: wpm,
        duration: 0.3,
        ease: 'power2.out',
        onUpdate: function() {
          if (element) {
            element.innerText = Math.round(this.targets()[0].value);
          }
        }
      }
    );

    return () => {
      animation.kill();
    };
  }, [wpm]);

  // Animate progress bar
  useEffect(() => {
    if (progressRef.current) {
      gsap.to(progressRef.current, {
        width: `${progress}%`,
        duration: 0.3,
        ease: 'power2.out'
      });
    }
  }, [progress]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 shadow-2xl p-6 md:p-8 hover:shadow-emerald-500/10 transition-all duration-500"
      >
        {/* Stats Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-6">
            <div>
              <div className="text-xs uppercase text-slate-400 mb-1">WPM</div>
              <div className="text-3xl font-bold text-emerald-400">
                <span ref={wpmRef}>0</span>
              </div>
            </div>
            <div>
              <div className="text-xs uppercase text-slate-400 mb-1">Accuracy</div>
              <div className="text-2xl font-semibold text-white">{accuracy.toFixed(0)}%</div>
            </div>
          </div>
          <div className="text-sm text-slate-400">
            Practice Mode
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-6">
          <div
            ref={progressRef}
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
            style={{ width: '0%' }}
          />
        </div>

        {/* Typing Text */}
        <div
          ref={containerRef}
          className="font-mono text-lg md:text-xl leading-relaxed text-slate-300 min-h-[120px]"
        >
          {words.map((word, wordIdx) => {
            const isActive = wordIdx === currentWordIndex;
            const isPast = wordIdx < currentWordIndex;
            const typedWord = typedWords[wordIdx] || '';
            const isComplete = typedWord === word;

            return (
              <span key={wordIdx} className="inline-block mr-2 mb-2">
                {word.split('').map((char, charIdx) => {
                  const typedChar = typedWord[charIdx];
                  const isTyped = typedChar !== undefined;
                  const isCorrect = typedChar === char;
                  const isCurrent = isActive && charIdx === currentCharIndex;

                  let className = 'text-slate-500';
                  if (isPast && isComplete) {
                    className = 'text-slate-400';
                  } else if (isPast && !isComplete) {
                    className = 'text-red-400';
                  } else if (isTyped && isCorrect) {
                    className = 'text-white';
                  } else if (isTyped && !isCorrect) {
                    className = 'text-red-500';
                  } else if (isActive) {
                    className = 'text-slate-500';
                  }

                  return (
                    <span
                      key={charIdx}
                      className={`${className} ${isCurrent ? 'bg-emerald-500/20' : ''}`}
                    >
                      {char}
                    </span>
                  );
                })}
                {isActive && currentCharIndex === word.length && (
                  <span className="inline-block w-[2px] h-5 bg-emerald-400 ml-0.5 animate-pulse" />
                )}
              </span>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

