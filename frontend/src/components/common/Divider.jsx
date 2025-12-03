// ============================================
// Divider Component - OAuth Separator
// ============================================

export default function Divider({ text = 'or continue with email' }) {
  return (
    <div className="relative py-4">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-slate-500/30"></div>
      </div>
      <div className="relative flex justify-center">
        <span className="bg-white/10 backdrop-blur-sm px-4 py-1 text-xs font-medium text-slate-200 rounded-full border border-slate-500/30">
          {text}
        </span>
      </div>
    </div>
  );
}

