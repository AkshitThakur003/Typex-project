import { motion as m, AnimatePresence } from 'framer-motion';
import { usePreferences } from '../../settings/PreferencesContext.jsx';
import PlayerCard from './PlayerCard.jsx';

export default function PlayerList({ 
  title = 'Players', 
  players = [], 
  leaderboard = false, 
  isResultsView = false,
  isHost = false,
  onKickPlayer = null,
  onPromoteHost = null,
}) {
  const { user } = usePreferences();
  
  const sorted = leaderboard
    ? [...players].sort((a, b) => {
        // results view: final order by wpm (desc), then accuracy
        // live view: sort by live wpm
        return (b.wpm - a.wpm) || (isResultsView ? (b.accuracy - a.accuracy) : 0);
      })
    : [...players].sort((a, b) => (a.role === 'host' ? -1 : b.role === 'host' ? 1 : 0));
  
  return (
    <div className="bg-slate-900/70 backdrop-blur-md rounded-xl shadow border border-slate-800 p-4 md:p-5">
      <h2 className="text-sm font-semibold text-slate-300 mb-3">{title}</h2>
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {sorted.map((p, i) => (
            <PlayerCard
              key={p.id}
              player={p}
              isHost={isHost}
              isMe={Boolean(user && p.name === user.username)}
              showProgress={leaderboard && !isResultsView}
              onKick={onKickPlayer}
              onPromote={onPromoteHost}
              index={i}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function PlayerRow({ p, i, leaderboard, isResultsView, isMe }) {
  const [displayWpm, setDisplayWpm] = useState(p.wpm || 0);
  // Debounce WPM updates slightly for smoother UI
  useEffect(() => {
    const id = setTimeout(() => setDisplayWpm(p.wpm || 0), 180);
    return () => clearTimeout(id);
  }, [p.wpm]);

  // Compute live progress percent (typedCharacters/totalCharacters*100) with fallbacks
  const progressPercent = (() => {
    const typed = typeof p.typedCharacters === 'number' ? p.typedCharacters : null;
    const total = typeof p.totalCharacters === 'number' ? p.totalCharacters : null;
    if (typed !== null && total && total > 0) {
      return Math.round(Math.min(100, Math.max(0, (typed / total) * 100)));
    }
    if (typeof p.progress === 'number') {
      return Math.round(Math.min(100, Math.max(0, p.progress)));
    }
    return 0;
  })();

  return (
    <m.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      className={[
        'space-y-1 rounded px-3 py-2 border',
        leaderboard && isResultsView
          ? (i === 0
              ? 'bg-amber-900/30 border-amber-700/40'
              : i === 1
                ? 'bg-slate-700/40 border-slate-500/40'
                : i === 2
                  ? 'bg-orange-900/30 border-orange-700/40'
                  : 'bg-slate-800/80 border-slate-700/80')
          : 'bg-slate-800/80 border-slate-700/80',
        isMe ? 'ring-1 ring-cyan-400/40' : ''
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar name={p.name} size={32} isMe={isMe} />
          <div className="text-sm flex items-center gap-2 min-w-0">
            {leaderboard && isResultsView && (
              <span className="mr-1">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : ''}</span>
            )}
            <span className="truncate max-w-[10rem] sm:max-w-[14rem]">{p.name}</span>
            {/* Live race view: hide badges; Results view: keep minimal, no extra badges per spec */}
          </div>
        </div>
        <div className="text-right text-xs text-slate-300 whitespace-nowrap">
          <span className="font-mono">{displayWpm} WPM</span>
          <span className="opacity-70"> • {typeof p.accuracy === 'number' ? p.accuracy : '—'}%</span>
        </div>
      </div>
      {leaderboard && !isResultsView && (
        <div className="mt-1">
          <div className="h-2 bg-slate-700 rounded overflow-hidden">
            <m.div
              className="h-full bg-orange-400"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ type: 'spring', stiffness: 160, damping: 22 }}
            />
          </div>
        </div>
      )}
    </m.div>
  );
}
