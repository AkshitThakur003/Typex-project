import { motion as m } from 'framer-motion';
import { useState } from 'react';
import { Avatar } from '../common';
import { XpBar } from '../xp';
import { Crown, MoreVertical, UserX, UserCheck, Shield, Users, Eye } from 'lucide-react';
import { usePreferences } from '../../settings/PreferencesContext.jsx';

/**
 * PlayerCard component - Enhanced player card with XP badges, host controls
 */
export default function PlayerCard({ 
  player, 
  isHost = false, 
  isMe = false, 
  showProgress = false,
  onKick = null,
  onPromote = null,
  onSetTeam = null,
  teamMode = false,
  index = 0 
}) {
  const { user } = usePreferences();
  const [showMenu, setShowMenu] = useState(false);

  // Use real XP data from player object if available, otherwise calculate from WPM
  const level = player.level || Math.min(50, Math.max(1, Math.floor((player.wpm || 0) / 20) + 1));
  const xp = player.xp || 0;
  const xpToNext = player.xpToNext || 100;
  const isPlayerHost = player.role === 'host';
  const isSpectator = player.role === 'spectator';
  const progressPercent = Math.min(100, Math.max(0, player.progress || 0));

  const handleKick = () => {
    if (onKick && window.confirm(`Kick ${player.name} from the room?`)) {
      onKick(player.id);
      setShowMenu(false);
    }
  };

  const handlePromote = () => {
    if (onPromote && window.confirm(`Transfer host role to ${player.name}?`)) {
      onPromote(player.id);
      setShowMenu(false);
    }
  };

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`relative group rounded-lg border transition-all ${
        isMe
          ? 'bg-emerald-500/5 border-emerald-500/30 ring-1 ring-emerald-500/20'
          : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/60 hover:border-slate-600/80'
      }`}
    >
      <div className="p-3">
        <div className="flex items-start justify-between gap-3">
          {/* Left: Avatar + Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="relative flex-shrink-0">
              <Avatar name={player.name || 'Player'} size={36} isMe={isMe} />
              {isPlayerHost && (
                <div className="absolute -top-1.5 -right-1.5 bg-amber-500 rounded-full p-0.5 ring-2 ring-slate-900 z-10">
                  <Crown className="w-2.5 h-2.5 text-amber-950" />
                </div>
              )}
              {isSpectator && (
                <div className="absolute -top-1.5 -right-1.5 bg-orange-500 rounded-full p-0.5 ring-2 ring-slate-900 z-10">
                  <Eye className="w-2.5 h-2.5 text-orange-950" />
                </div>
              )}
              {teamMode && player.team && !isSpectator && (
                <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 z-10 ${
                  player.team === 'red' ? 'bg-red-500' : 'bg-blue-500'
                }`} title={`${player.team === 'red' ? 'Red' : 'Blue'} Team`} />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium truncate ${isMe ? 'text-white' : 'text-slate-200'}`}>
                  {player.name || 'Player'}
                </span>
                {/* Spectator Badge */}
                {isSpectator && (
                  <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center gap-0.5">
                    <Eye className="w-2.5 h-2.5" />
                    <span>Spectator</span>
                  </span>
                )}
                {/* Level Badge */}
                {!isSpectator && (
                  <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Lv.{level}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                 <span className="font-mono text-slate-300">
                  {player.wpm || 0} WPM
                </span>
                <span className="w-px h-3 bg-slate-700" />
                <span>
                  {typeof player.accuracy === 'number' ? `${player.accuracy}%` : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Host Controls Menu */}
          {isHost && !isPlayerHost && !isMe && (
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                aria-label="Player options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMenu && (
                <>
                  {/* Backdrop to close menu */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  
                  {/* Menu */}
                  <m.div
                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="absolute right-0 top-full mt-1 z-20 w-44 rounded-lg border border-slate-700 bg-slate-900/95 backdrop-blur-md shadow-xl p-1 overflow-hidden"
                  >
                    {/* Team Assignment (Team Mode Only) */}
                    {teamMode && onSetTeam && (
                      <>
                        <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                          Assign Team
                        </div>
                        <div className="grid grid-cols-2 gap-1 px-1 mb-1">
                          <button
                            onClick={() => {
                              onSetTeam(player.id, 'red');
                              setShowMenu(false);
                            }}
                            className={`px-2 py-1.5 rounded text-xs font-medium text-center transition-colors ${
                                player.team === 'red' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-slate-800 text-slate-400 hover:bg-red-500/10 hover:text-red-300'
                            }`}
                          >
                            Red
                          </button>
                          <button
                            onClick={() => {
                              onSetTeam(player.id, 'blue');
                              setShowMenu(false);
                            }}
                            className={`px-2 py-1.5 rounded text-xs font-medium text-center transition-colors ${
                                player.team === 'blue' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-slate-800 text-slate-400 hover:bg-blue-500/10 hover:text-blue-300'
                            }`}
                          >
                            Blue
                          </button>
                        </div>
                        {player.team && (
                           <button
                            onClick={() => {
                              onSetTeam(player.id, null);
                              setShowMenu(false);
                            }}
                            className="w-full text-left px-3 py-1.5 rounded text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-300 transition-colors mb-1"
                          >
                            Clear Team
                          </button>
                        )}
                        <div className="my-1 h-px bg-slate-700/50" />
                      </>
                    )}
                    
                    <button
                      onClick={handlePromote}
                      className="w-full text-left px-3 py-2 rounded text-sm text-slate-300 hover:bg-slate-800 flex items-center gap-2 transition-colors"
                    >
                      <Shield className="w-3.5 h-3.5 text-emerald-400" />
                      Promote Host
                    </button>
                    <button
                      onClick={handleKick}
                      className="w-full text-left px-3 py-2 rounded text-sm text-rose-300 hover:bg-slate-800 flex items-center gap-2 transition-colors"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      Kick Player
                    </button>
                  </m.div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Progress Bar (for live races) */}
        {showProgress && (
          <div className="mt-3">
            <div className="h-1.5 bg-slate-700/30 rounded-full overflow-hidden">
              <m.div
                className={`h-full ${teamMode && player.team === 'red' ? 'bg-red-500' : teamMode && player.team === 'blue' ? 'bg-blue-500' : 'bg-gradient-to-r from-emerald-500 to-teal-400'}`}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
              />
            </div>
          </div>
        )}
      </div>
    </m.div>
  );
}
