import { motion as m } from 'framer-motion';

export default function About() {
  return (
    <div className="max-w-5xl mx-auto p-6">
      <m.header initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold">About TypeX</h1>
  <p className="mt-2 text-slate-300 max-w-2xl">TypeX is a fast, modern typing app for solo practice and real‑time multiplayer races. It’s lightweight, responsive, and fun—and now includes live WPM tracking in practice, mode‑aware leaderboards, avatars, and fairness tools.</p>
      </m.header>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <m.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.02 }}
          whileHover={{ y: -6, scale: 1.02 }}
          whileTap={{ scale: 0.995 }}
          className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-4"
        >
          <h3 className="text-lg font-semibold">Key Features</h3>
          <ul className="mt-3 text-slate-300 space-y-2 text-sm">
            <li>• Real-time multiplayer races (Socket.io)</li>
            <li>• Practice modes: timed and fixed-word counts</li>
            <li>• Live WPM timeline in practice with detailed results</li>
            <li>• Avatars across chat, leaderboards, and results</li>
            <li>• Anti-cheat checks with gentle auto‑kick for fairness</li>
          </ul>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          whileHover={{ y: -6, scale: 1.02 }}
          whileTap={{ scale: 0.995 }}
          className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-4"
        >
          <h3 className="text-lg font-semibold">Tech Stack</h3>
          <div className="mt-3 text-slate-300 text-sm space-y-2">
            <div>React + Vite</div>
            <div>TailwindCSS</div>
            <div>Socket.io</div>
            <div>Recharts (practice & results)</div>
            <div>Express / MongoDB (backend)</div>
          </div>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -6, scale: 1.02 }}
          whileTap={{ scale: 0.995 }}
          className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-4"
        >
          <h3 className="text-lg font-semibold">Contribute</h3>
          <p className="mt-3 text-slate-300 text-sm">Found a bug or want a feature? Contributions, issues and PRs are welcome. See the repository for setup and contributing guidelines.</p>
          <div className="mt-3">
            <a href="https://github.com/your-repo" target="_blank" rel="noreferrer" className="inline-block px-3 py-2 rounded-lg bg-emerald-600 text-black text-sm font-medium">View on GitHub</a>
          </div>
        </m.div>
      </div>

      <m.section initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6">
        <h3 className="text-lg font-semibold">How it works</h3>
        <p className="mt-2 text-slate-300 text-sm">Start a practice session or create/join a multiplayer room. In practice, your WPM is tracked every second and shown on a timeline in the results. In multiplayer, progress and WPM are streamed for a live leaderboard and a results page with a winner card.</p>

        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          <div className="text-sm text-slate-300"><strong>Privacy</strong><br/>No raw keystroke content is stored. Practice results save locally or to your account; multiplayer results store final stats and timeline data.</div>
          <div className="text-sm text-slate-300"><strong>Leaderboards</strong><br/>Tabs for Practice and Multiplayer show top scores with avatars. Your best stats are shown contextually per mode.</div>
        </div>
      </m.section>
    </div>
  );
}
