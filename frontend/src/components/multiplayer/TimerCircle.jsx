import { useEffect, useMemo, useState } from 'react';

export default function TimerCircle({ startedAt, endsAt }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);
  const total = Math.max(1, (endsAt - startedAt) / 1000);
  const left = Math.max(0, Math.ceil((endsAt - now) / 1000));
  const pct = Math.max(0, Math.min(100, (left / total) * 100));
  const color = pct > 50 ? 'text-emerald-400' : pct > 20 ? 'text-amber-400' : 'text-rose-400';
  const stroke = pct > 50 ? '#34d399' : pct > 20 ? '#f59e0b' : '#f87171';
  const dash = useMemo(() => {
    const r = 28; const circ = 2 * Math.PI * r;
    return `${(pct/100) * circ} ${circ}`;
  }, [pct]);
  return (
    <div className={`flex items-center justify-center ${color}`}>
      <svg width="70" height="70" viewBox="0 0 70 70" className="animate-pulse-slow">
        <circle cx="35" cy="35" r="28" stroke="#334155" strokeWidth="6" fill="none" />
        <circle cx="35" cy="35" r="28" stroke={stroke} strokeWidth="6" fill="none" strokeDasharray={dash} strokeLinecap="round" transform="rotate(-90 35 35)" />
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="12" className="fill-current">{left}s</text>
      </svg>
    </div>
  );
}
