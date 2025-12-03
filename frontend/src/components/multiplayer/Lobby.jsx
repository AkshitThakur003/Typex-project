import { motion as m } from "framer-motion";
import { LogIn, Eye } from "lucide-react";
import CreateRoomForm from "./CreateRoomForm.jsx";
import RaceHistory from "./RaceHistory.jsx";

// Props contract: onCreate({ wordCount, roomName, modifiers, customText, teamMode, difficulty }), onJoin(code), onSpectate()
export default function Lobby({ onJoin, onCreate, code, setCode, onSpectate, canStart, isHost, onStart }) {
  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6">
      {/* Lobby Title */}
      <m.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="text-center mb-6 sm:mb-8"
      >
        <h1 className="text-3xl sm:text-4xl font-bold text-white">Multiplayer Lobby</h1>
        <p className="text-slate-400 mt-2 text-sm sm:text-base">Create a room or join one to start racing.</p>
      </m.div>

      {/* Two-column responsive layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 lg:gap-6 items-start">
        {/* Left Column: Create Room Card */}
        <CreateRoomForm
          onCreate={(options) => onCreate?.(options)}
          canStart={canStart}
          isHost={isHost}
          onStart={onStart}
        />

        {/* Right Column: Join Room + Recent Races */}
        <div className="flex flex-col gap-4 sm:gap-5 lg:gap-6 max-h-[600px] min-h-0 overflow-hidden">
          {/* Join/Spectate Card */}
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.05 }}
            className="bg-slate-900/70 backdrop-blur-md rounded-xl border border-slate-800 shadow-lg hover:shadow-emerald-600/10 hover:-translate-y-0.5 transition-all duration-200 p-6 flex-shrink-0"
            aria-label="Join Room Card"
          >
            <div className="mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <LogIn className="w-5 h-5 text-emerald-400" />
                Join Room
              </h2>
              <p className="text-xs text-slate-400 mt-1">Enter a code to join or spectate</p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col">
                <label htmlFor="roomCode" className="text-xs font-medium text-slate-300 mb-1.5">Room Code</label>
                <input
                  id="roomCode"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 text-white border border-slate-700 tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <m.button
                whileTap={{ scale: 0.98 }}
                onClick={() => onJoin?.(code)}
                className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-500 text-slate-900 font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 hover:shadow-emerald-500/30 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all flex items-center justify-center gap-2"
                aria-label="Join Room"
              >
                <LogIn size={18} strokeWidth={2.5} />
                Join Room
              </m.button>
              <m.button
                whileTap={{ scale: 0.98 }}
                onClick={() => onSpectate?.(code)}
                className="px-4 py-2.5 rounded-lg border border-slate-600 text-slate-200 font-semibold hover:border-emerald-500/50 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all flex items-center justify-center gap-2"
                aria-label="Spectate"
              >
                <Eye size={18} strokeWidth={2.5} />
                Spectate
              </m.button>
            </div>
          </m.div>

          {/* Recent Races - Scrollable */}
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <RaceHistory />
          </div>
        </div>
      </div>
    </div>
  );
}
