// ============================================
// Friends Page - Standalone Friends Management
// ============================================

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Users as UsersIcon } from 'lucide-react';
import Friends from '../components/Friends.jsx';

export default function FriendsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-white py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900/70 hover:bg-slate-800 border border-slate-800 text-slate-200 transition-all hover:scale-105 mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30">
              <UsersIcon className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Friends
              </h1>
              <p className="text-slate-400 text-lg">Connect with friends and challenge them to typing races</p>
            </div>
          </div>
        </motion.div>

        {/* Friends Component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex justify-center"
        >
          <div className="w-full">
            <Friends />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

