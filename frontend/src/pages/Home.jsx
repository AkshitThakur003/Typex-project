import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Keyboard } from "lucide-react";
import KeyboardMockup from "./KeyboardMockup";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white flex flex-col">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center flex-1 text-center px-6 pt-20">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-7xl font-extrabold bg-gradient-to-r from-orange-400 to-yellow-300 text-transparent bg-clip-text"
        >
          TypeX
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4 text-lg md:text-2xl text-slate-300 max-w-2xl"
        >
          The Ultimate Multiplayer Typing Arena – Test your skills, challenge
          friends, and climb the leaderboard.
        </motion.p>

        {/* Keyboard Typing Mockup */}
        <div className="mt-16">
          <KeyboardMockup />
        </div>

      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-slate-950">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="text-2xl font-bold text-orange-400">⚡ Real-time</h3>
            <p className="text-slate-400 mt-2">
              Race against players worldwide with instant socket-powered sync.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-2xl font-bold text-orange-400">🎮 Competitive</h3>
            <p className="text-slate-400 mt-2">
              Track WPM, accuracy, and climb the global leaderboard.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="text-2xl font-bold text-orange-400">🔒 Secure</h3>
            <p className="text-slate-400 mt-2">
              Protected with JWT authentication and fair match systems.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 text-center text-slate-500 text-sm border-t border-slate-800">
        <p>© {new Date().getFullYear()} TypeX. All rights reserved.</p>
        <div className="flex justify-center gap-6 mt-2">
          <a href="#" className="hover:text-orange-400 transition">About</a>
          <a href="#" className="hover:text-orange-400 transition">GitHub</a>
          <a href="#" className="hover:text-orange-400 transition">Contact</a>
        </div>
      </footer>
    </div>
  );
}
