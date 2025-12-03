// Typing area component for Practice page
import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';

const TypingArea = forwardRef(function TypingArea({ 
  text, 
  typed, 
  currentWord, 
  caret, 
  fontSizeClass, 
  fontClass, 
  caretStylePref,
  caretRef 
}, containerRef) {
  return (
    <div
      ref={containerRef}
      className={`w-full max-w-5xl ${fontSizeClass} leading-relaxed ${fontClass} flex flex-wrap gap-1.5 sm:gap-2 
                 md:p-0 md:bg-transparent md:rounded-none 
                 bg-slate-900 p-3 sm:p-4 rounded-lg
                 max-h-[40vh] sm:max-h-[50vh] overflow-auto mx-2 sm:mx-0`}
    >
      {text.map((word, wi) => {
        const isActive = wi === currentWord;
        const isPast = wi < currentWord;
        
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
          </div>
        );
      })}
    </div>
  );
});

export default TypingArea;

