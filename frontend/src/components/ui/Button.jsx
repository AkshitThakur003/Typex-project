import { useRef } from 'react';
import { motion as m } from 'framer-motion';

export default function Button({ children, className = '', glow = 'emerald', onClick, ...props }) {
  const rippleRef = useRef(null);
  function handleClick(e) {
    const el = rippleRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      const circle = document.createElement('span');
      circle.className = 'absolute rounded-full opacity-40 pointer-events-none';
      circle.style.width = circle.style.height = `${size}px`;
      circle.style.left = `${x}px`;
      circle.style.top = `${y}px`;
      circle.style.background = 'currentColor';
      circle.style.transition = 'transform 450ms ease, opacity 700ms ease';
      circle.style.transform = 'scale(0)';
      requestAnimationFrame(() => {
        circle.style.transform = 'scale(1)';
        circle.style.opacity = '0';
      });
      el.appendChild(circle);
      setTimeout(() => circle.remove(), 700);
    }
    onClick?.(e);
  }

  const glowClass = glow === 'orange'
    ? 'shadow-[0_0_20px_rgba(251,146,60,0.55)]'
    : glow === 'yellow'
      ? 'shadow-[0_0_20px_rgba(250,204,21,0.55)]'
      : 'shadow-[0_0_20px_rgba(16,185,129,0.55)]';

  return (
    <m.button
      {...props}
      onClick={handleClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      className={`relative overflow-hidden inline-flex items-center justify-center rounded-lg px-4 py-2 font-semibold transition ${glowClass} ${className}`}
    >
      <span ref={rippleRef} className="absolute inset-0" />
      <span className="relative z-10">{children}</span>
    </m.button>
  );
}
