import { useEffect, useMemo, useRef } from 'react';

export default function TypingText({ text = '', input = '' }) {
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
        <span key={i} className={baseClass + activeWordClass}>
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
  }, [text, input]);

  return (
    <div
      ref={containerRef}
      className="whitespace-pre-wrap font-mono text-base sm:text-lg md:text-xl leading-7 md:leading-8 max-h-[50vh] overflow-auto text-slate-300"
    >
      {nodes}
    </div>
  );
}
