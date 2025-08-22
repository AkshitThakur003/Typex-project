import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const keys = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
const phrases = ["WELCOME TO TYPEX", "CHALLENGE FRIENDS", "BECOME A CHAMPION"];

export default function KeyboardMockup() {
  const [typed, setTyped] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < phrases[phraseIndex].length) {
      const timeout = setTimeout(() => {
        setTyped((prev) => prev + phrases[phraseIndex][currentIndex]);
        setCurrentIndex((i) => i + 1);
      }, 200);
      return () => clearTimeout(timeout);
    } else {
      const resetTimeout = setTimeout(() => {
        setTyped("");
        setCurrentIndex(0);
        setPhraseIndex((i) => (i + 1) % phrases.length);
      }, 1500);
      return () => clearTimeout(resetTimeout);
    }
  }, [currentIndex, phraseIndex]);

  return (
    <div className="flex flex-col items-center gap-6 sm:gap-8 md:gap-10 relative px-2 sm:px-4">
      {/* Glow Background */}
      <div className="absolute -top-10 w-[200px] h-[120px] xs:w-[280px] xs:h-[160px] sm:w-[400px] sm:h-[250px] md:w-[500px] md:h-[300px] bg-orange-500/30 blur-3xl rounded-full animate-pulse-slow"></div>

      {/* Display typed text */}
      <motion.h2
        key={typed}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xl xs:text-2xl sm:text-3xl md:text-5xl font-bold tracking-wide text-orange-400 relative z-10 text-center leading-snug"
      >
        {typed}
        <span className="animate-caret-blink">|</span>
      </motion.h2>

      {/* Keyboard */}
      <div className="flex flex-col gap-1.5 xs:gap-2 sm:gap-3 items-center relative z-10 scale-90 xs:scale-95 sm:scale-100">
        {keys.map((row, i) => (
          <div key={i} className="flex gap-0.5 xs:gap-1 sm:gap-2">
            {row.split("").map((letter, j) => {
              const currentChar = phrases[phraseIndex][currentIndex - 1];
              const isActive = currentChar && currentChar.toUpperCase() === letter;

              return (
                <motion.div
                  key={j}
                  className={`w-6 h-6 xs:w-8 xs:h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 
                  flex items-center justify-center rounded-md font-bold 
                  text-[10px] xs:text-xs sm:text-sm md:text-base 
                  shadow-lg shadow-black/40 ${
                    isActive
                      ? "bg-orange-500 text-white"
                      : "bg-slate-800 text-slate-200"
                  }`}
                  animate={isActive ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {letter}
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
