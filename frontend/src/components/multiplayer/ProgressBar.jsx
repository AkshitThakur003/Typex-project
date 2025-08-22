import { motion } from 'framer-motion';

export default function ProgressBar({ value=0 }) {
  return (
    <div className="h-2 bg-slate-700 rounded overflow-hidden relative">
      <motion.div
        className="h-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      />
      <div className="absolute inset-0 -translate-x-full animate-shine bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.5),transparent)]" />
    </div>
  );
}
