// ============================================
// AuthField Component - Reusable Input Field
// ============================================

import { motion } from 'framer-motion';

export default function AuthField({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  onClearError,
  ...props
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-200 mb-1.5">
        {label}
      </label>
      <motion.input
        type={type}
        value={value}
        onChange={(e) => {
          onChange(e);
          if (error && onClearError) {
            onClearError();
          }
        }}
        placeholder={placeholder}
        className={`w-full bg-white/10 border rounded-lg px-4 py-2.5 text-white placeholder-slate-300/60 focus:outline-none focus:ring-2 transition-all duration-200 ${
          error
            ? 'border-red-400/50 focus:ring-red-400/50 focus:border-red-400/50'
            : 'border-white/20 focus:ring-emerald-400/50 focus:border-emerald-400/50'
        }`}
        animate={error ? { x: [0, -4, 4, -4, 4, 0] } : {}}
        transition={{ duration: 0.3 }}
        {...props}
      />
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-red-300 mt-1.5"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

