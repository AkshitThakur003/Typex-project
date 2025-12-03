import { motion as m, AnimatePresence } from 'framer-motion';
import { X, Check, User, Users, Zap, Clock } from 'lucide-react';
import { useState } from 'react';

export default function Invites({ invites, onAccept, onDecline }) {
  if (!invites || invites.length === 0) return null;

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-6xl mx-auto mb-6"
    >
      <div className="bg-slate-900/70 backdrop-blur-md rounded-xl border border-slate-800 shadow-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800/80 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 to-blue-500/10">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Room Invites</h2>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
              {invites.length}
            </span>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <AnimatePresence>
            {invites.map((invite, idx) => (
              <m.div
                key={invite.id || idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 hover:bg-slate-800/70 hover:border-slate-600/70 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Invite Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-semibold text-white">
                        {invite.hostName}
                      </span>
                      <span className="text-xs text-slate-400">invited you to</span>
                    </div>
                    
                    <div className="ml-6">
                      <h3 className="text-base font-bold text-emerald-400 mb-1">
                        {invite.roomName || 'Untitled Room'}
                      </h3>
                      
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900/50 text-emerald-400 border border-emerald-500/30">
                          {invite.roomCode}
                        </span>
                        
                        {invite.teamMode && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            🏆 Team Battle
                          </span>
                        )}
                        
                        {invite.modifiers && invite.modifiers.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap">
                            {invite.modifiers.includes('no-backspace') && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                🚫
                              </span>
                            )}
                            {invite.modifiers.includes('blind') && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                👁️
                              </span>
                            )}
                            {invite.modifiers.includes('zen') && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/30">
                                🧘
                              </span>
                            )}
                            {invite.modifiers.includes('sudden-death') && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-orange-500/20 text-orange-300 border border-orange-500/30">
                                💀
                              </span>
                            )}
                            {invite.modifiers.includes('sprint') && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                                ⚡
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <m.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onAccept?.(invite)}
                      className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition-colors flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                    >
                      <Check className="w-4 h-4" />
                      Accept
                    </m.button>
                    <m.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onDecline?.(invite)}
                      className="px-3 py-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white transition-colors"
                      aria-label="Decline invite"
                    >
                      <X className="w-4 h-4" />
                    </m.button>
                  </div>
                </div>
              </m.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </m.div>
  );
}

