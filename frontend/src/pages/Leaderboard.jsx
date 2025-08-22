import GlobalLeaderboard from '../components/GlobalLeaderboard';
import { motion as m } from 'framer-motion';

export default function Leaderboard() {
  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">
      <m.h1 initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-semibold">Leaderboard</m.h1>
      <GlobalLeaderboard />
    </div>
  );
}
