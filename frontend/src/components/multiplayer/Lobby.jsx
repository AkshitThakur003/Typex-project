import { motion as m } from "framer-motion";
import CreateRoomForm from "./CreateRoomForm.jsx";

// Props contract: onCreate({ wordCount, roomName }), onJoin(code), onSpectate()
export default function Lobby({ onJoin, onCreate, code, setCode, onSpectate, canStart, isHost, onStart }) {
  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      {/* Lobby Title */}
      <m.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="text-center mb-6"
      >
        <h1 className="text-3xl sm:text-4xl font-bold text-white">Multiplayer Lobby</h1>
        <p className="text-slate-400 mt-2">Create a room or join one to start racing.</p>
      </m.div>

      {/* Two-card responsive layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Create Room Card */}
        <CreateRoomForm
          onCreate={({ wordCount, roomName }) => onCreate?.({ wordCount, roomName })}
          canStart={canStart}
          isHost={isHost}
          onStart={onStart}
        />

        {/* Join/Spectate Card */}
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="bg-slate-900/70 backdrop-blur-md rounded-xl border border-slate-800 shadow-lg hover:shadow-emerald-600/10 hover:-translate-y-0.5 transition-all duration-200 p-5"
          aria-label="Join Room Card"
        >
          <div className="mb-4">
            <h2 className="text-base font-semibold text-white">Join Room</h2>
            <p className="text-xs text-slate-400">Enter a code to join or spectate</p>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col">
              <label htmlFor="roomCode" className="text-xs text-slate-300 mb-1">Room Code</label>
              <input
                id="roomCode"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                className="px-3 py-2 rounded-lg bg-slate-800/90 text-white border border-slate-700 tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-5">
            <m.button
              whileTap={{ scale: 0.98 }}
              onClick={() => onJoin?.(code)}
              className="px-4 py-2 rounded-lg bg-emerald-500 text-black font-semibold shadow-md shadow-emerald-500/20 hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              aria-label="Join Room"
            >
              Join Room
            </m.button>
            <m.button
              whileTap={{ scale: 0.98 }}
              onClick={() => onSpectate?.(code)}
              className="px-4 py-2 rounded-lg border border-slate-600 text-slate-100 hover:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              aria-label="Spectate"
            >
              Spectate
            </m.button>
          </div>
        </m.div>
      </div>
    </div>
  );
}
