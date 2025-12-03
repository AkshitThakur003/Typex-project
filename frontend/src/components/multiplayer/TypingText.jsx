import { useEffect, useMemo, useRef } from 'react';

export default function TypingText({ text = '', input = '', blindMode = false }) {
  const containerRef = useRef(null);
  const caretRef = useRef(null);

  // Auto-scroll to keep caret centered-ish vertically
  useEffect(() => {
    const c = containerRef.current;
    const k = caretRef.current;
    if (!c || !k) return;
    const offset = k.offsetTop - c.clientHeight * 0.45;
    c.scrollTo({ top: Math.max(0, offset), behavior: 'smooth' });
  }, [input]);

  const nodes = useMemo(() => {
    const arr = [];
    // Determine active word boundaries around current caret position
    const idx = input.length;
    const isWs = (c) => c === ' ' || c === '\n' || c === '\t' || c === '\r';
    let wStart = idx;
    while (wStart > 0 && !isWs(text[wStart - 1])) wStart--;
    let wEnd = idx;
    while (wEnd < text.length && !isWs(text[wEnd])) wEnd++;


    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const typed = input[i];
      const correct = typed != null && typed === ch;
      const wrong = typed != null && typed !== ch;
      const baseClass = correct
        ? 'text-white'
        : wrong
          ? 'text-red-500 underline decoration-red-500'
          : 'text-slate-500';
      const activeWordClass = i >= wStart && i < wEnd ? ' bg-slate-700/30 rounded-sm' : '';
      
      arr.push(
        <span 
          key={i} 
          className={baseClass + activeWordClass}
        >
          {ch}
        </span>
      );
    }
    // Caret at current index, inline with text
    const caretSpan = (
      <span key="caret" ref={caretRef} className="inline-block align-baseline">
        <span className="inline-block align-baseline border-r-2 border-orange-400 animate-pulse h-[1.1em] translate-y-[2px]" />
      </span>
    );
    arr.splice(idx, 0, caretSpan);
    return arr;
  }, [text, input, blindMode]);

  // Calculate opacity for blind mode - fade entire text as you progress
  const progress = text.length > 0 ? (input.length / text.length) * 100 : 0;
  // Very aggressive fade: exponential curve for more dramatic effect
  // At 0%: 1.0 (fully visible)
  // At 25%: ~0.6 (40% fade)
  // At 50%: ~0.3 (70% fade)  
  // At 75%: ~0.15 (85% fade)
  // At 100%: 0.05 (95% fade - almost invisible)
  let blindOpacity = 1;
  if (blindMode && input.length > 0) {
    // Use exponential decay for more dramatic fade
    const normalizedProgress = progress / 100; // 0 to 1
    // Exponential curve: e^(-2.5 * progress) gives dramatic fade
    blindOpacity = Math.max(0.05, Math.exp(-2.5 * normalizedProgress));
  } else if (blindMode) {
    // At start (0% progress), still fully visible
    blindOpacity = 1;
  }

  // Debug logging with expanded values
  useEffect(() => {
    if (blindMode) {
      const logData = { 
        blindMode,
        progress: progress.toFixed(1) + '%', 
        opacity: blindOpacity.toFixed(3), 
        inputLen: input.length, 
        textLen: text.length,
        calculatedOpacity: blindOpacity
      };
      console.log('[TypingText] Blind mode ACTIVE:', logData);
      
      // Verify style is actually applied to DOM
      if (containerRef.current) {
        setTimeout(() => {
          const computedStyle = window.getComputedStyle(containerRef.current);
          console.log('[TypingText] DOM Opacity Check:', {
            inlineStyle: containerRef.current.style.opacity,
            computedOpacity: computedStyle.opacity,
            expectedOpacity: blindOpacity.toFixed(3),
            parentOpacity: computedStyle.parentElement ? window.getComputedStyle(containerRef.current.parentElement).opacity : 'N/A'
          });
        }, 100);
      }
    }
  }, [blindMode, input.length, text.length, progress, blindOpacity]);

  // Force opacity with important flag using CSS custom property
  // Use a more dramatic transition for better visibility
  const containerStyle = blindMode 
    ? { 
        opacity: blindOpacity,
        '--blind-opacity': blindOpacity,
        transition: 'opacity 0.1s linear', // Faster, linear transition for immediate feedback
        filter: `brightness(${0.5 + blindOpacity * 0.5})`, // Also reduce brightness for more dramatic effect
      } 
    : {};

  return (
    <div
      ref={containerRef}
      className={`whitespace-pre-wrap font-mono text-base sm:text-lg md:text-xl leading-7 md:leading-8 max-h-[50vh] overflow-auto text-slate-300 ${blindMode ? 'blind-mode-active' : ''}`}
      style={containerStyle}
      data-blind-mode={blindMode}
      data-blind-opacity={blindOpacity}
    >
      {nodes}
    </div>
  );
}
