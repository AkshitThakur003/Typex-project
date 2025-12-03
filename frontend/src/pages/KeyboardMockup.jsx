import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { gsap } from "gsap";

const keys = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
const phrases = ["WELCOME TO TYPEX", "CHALLENGE FRIENDS", "BECOME A CHAMPION"];

export default function KeyboardMockup() {
  const [typed, setTyped] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const glowRef = useRef(null);
  const keyboardRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    // Animate glow with GSAP
    if (glowRef.current) {
      gsap.to(glowRef.current, {
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.5, 0.3],
        duration: 3,
        repeat: -1,
        ease: "sine.inOut"
      });
    }

    // Animate keyboard entrance
    if (keyboardRef.current) {
      const keyElements = keyboardRef.current.querySelectorAll('.key');
      gsap.fromTo(keyElements, 
        { 
          opacity: 0, 
          y: 20,
          scale: 0.8
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.4,
          stagger: 0.02,
          ease: "back.out(1.7)"
        }
      );
    }
  }, []);

  useEffect(() => {
    if (currentIndex < phrases[phraseIndex].length) {
      const timeout = setTimeout(() => {
        setTyped((prev) => prev + phrases[phraseIndex][currentIndex]);
        setCurrentIndex((i) => i + 1);
      }, 180 + Math.random() * 40); // More realistic typing speed variation
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

  // Animate text typing with GSAP
  useEffect(() => {
    if (textRef.current && typed.length > 0) {
      gsap.fromTo(textRef.current,
        { opacity: 0, y: 5 },
        { opacity: 1, y: 0, duration: 0.2, ease: "power2.out" }
      );
    }
  }, [typed]);

  // Animate active key with GSAP
  useEffect(() => {
    const currentChar = phrases[phraseIndex][currentIndex - 1];
    if (currentChar && keyboardRef.current) {
      const activeKey = keyboardRef.current.querySelector(`[data-key="${currentChar.toUpperCase()}"]`);
      if (activeKey) {
        // Reset previous active keys
        const allKeys = keyboardRef.current.querySelectorAll('.key');
        allKeys.forEach(key => {
          if (key !== activeKey) {
            gsap.to(key, {
              scale: 1,
              backgroundColor: "#1e293b",
              duration: 0.2
            });
          }
        });

        // Animate active key
        gsap.to(activeKey, {
          scale: 1.25,
          backgroundColor: "#f97316",
          boxShadow: "0 0 20px rgba(249, 115, 22, 0.6)",
          duration: 0.15,
          yoyo: true,
          repeat: 1,
          ease: "power2.out",
          onComplete: () => {
            gsap.to(activeKey, {
              scale: 1,
              backgroundColor: "#1e293b",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.4)",
              duration: 0.2
            });
          }
        });
      }
    }
  }, [currentIndex, phraseIndex]);

  return (
    <div className="flex flex-col items-center gap-6 sm:gap-8 md:gap-10 relative px-2 sm:px-4">
      {/* Enhanced Glow Background with GSAP */}
      <div 
        ref={glowRef}
        className="absolute -top-10 w-[200px] h-[120px] xs:w-[280px] xs:h-[160px] sm:w-[400px] sm:h-[250px] md:w-[500px] md:h-[300px] bg-orange-500/30 blur-3xl rounded-full"
      />

      {/* Display typed text with GSAP animation */}
      <motion.h2
        ref={textRef}
        key={typed}
        className="text-xl xs:text-2xl sm:text-3xl md:text-5xl font-bold tracking-wide text-orange-400 relative z-10 text-center leading-snug"
      >
        {typed}
        <span className="animate-caret-blink">|</span>
      </motion.h2>

      {/* Keyboard with GSAP animations */}
      <div 
        ref={keyboardRef}
        className="flex flex-col gap-1.5 xs:gap-2 sm:gap-3 items-center relative z-10 scale-90 xs:scale-95 sm:scale-100"
      >
        {keys.map((row, i) => (
          <div key={i} className="flex gap-0.5 xs:gap-1 sm:gap-2">
            {row.split("").map((letter, j) => {
              const currentChar = phrases[phraseIndex][currentIndex - 1];
              const isActive = currentChar && currentChar.toUpperCase() === letter;

              return (
                <div
                  key={j}
                  data-key={letter}
                  className={`key w-6 h-6 xs:w-8 xs:h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 
                  flex items-center justify-center rounded-md font-bold 
                  text-[10px] xs:text-xs sm:text-sm md:text-base 
                  shadow-lg shadow-black/40 transition-colors ${
                    isActive
                      ? "bg-orange-500 text-white"
                      : "bg-slate-800 text-slate-200"
                  }`}
                >
                  {letter}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
