import { motion as m } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Target, Award, TrendingUp, Zap, Trophy, Users, Calculator, Info, Sparkles } from 'lucide-react';

export default function XpInfoPage() {
  const navigate = useNavigate();

  const xpRules = [
    {
      icon: <Target className="w-5 h-5" />,
      title: 'Correct Words',
      value: '2 XP per word',
      description: 'Earn 2 XP for each correctly typed word',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
    },
    {
      icon: <Award className="w-5 h-5" />,
      title: 'Completion Bonus',
      value: '1 XP',
      description: 'Bonus for completing any test',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: 'Accuracy Bonus',
      value: '5 XP',
      description: 'Awarded when accuracy ≥ 95%',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: 'WPM Bonus',
      value: 'floor(WPM / 10)',
      description: 'Faster typing = more XP (e.g., 50 WPM = 5 XP)',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
    },
    {
      icon: <Trophy className="w-5 h-5" />,
      title: 'Win Bonus',
      value: '20 XP',
      description: 'First place in multiplayer races',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: 'Second Place',
      value: '10 XP',
      description: 'Second place in multiplayer races',
      color: 'text-slate-400',
      bgColor: 'bg-slate-500/10',
      borderColor: 'border-slate-500/30',
    },
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: 'Streak Bonus',
      value: '3 XP',
      description: 'Bonus for maintaining a typing streak',
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/10',
      borderColor: 'border-pink-500/30',
    },
  ];

  const levelInfo = [
    { level: 1, xpNeeded: 100, totalXp: 0 },
    { level: 2, xpNeeded: 135, totalXp: 100 },
    { level: 3, xpNeeded: 170, totalXp: 235 },
    { level: 4, xpNeeded: 205, totalXp: 405 },
    { level: 5, xpNeeded: 240, totalXp: 610 },
  ];

  const examples = [
    {
      title: 'Practice Mode Example',
      scenario: '50 WPM, 95% accuracy, 50 words',
      breakdown: [
        { label: 'Word XP', value: '50 words × 95% × 2 = 95 XP' },
        { label: 'Completion', value: '1 XP' },
        { label: 'Accuracy Bonus', value: '5 XP (≥ 95%)' },
        { label: 'WPM Bonus', value: 'floor(50/10) = 5 XP' },
        { label: 'Streak Bonus', value: '3 XP' },
      ],
      total: 109,
    },
    {
      title: 'Multiplayer Win Example',
      scenario: '60 WPM, 98% accuracy, rank 1',
      breakdown: [
        { label: 'Word XP', value: '60 words × 98% × 2 = 117 XP' },
        { label: 'Completion', value: '1 XP' },
        { label: 'Accuracy Bonus', value: '5 XP' },
        { label: 'WPM Bonus', value: 'floor(60/10) = 6 XP' },
        { label: 'Win Bonus', value: '20 XP' },
        { label: 'Streak Bonus', value: '3 XP' },
      ],
      total: 152,
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 100,
      },
    },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <m.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-4 mb-6"
        >
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg bg-slate-900/70 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl md:text-4xl font-bold text-white">How XP Works</h1>
        </m.div>

        {/* Introduction Section */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <Info className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-3">Earn XP by Typing!</h2>
              <p className="text-slate-300 leading-relaxed">
                Complete typing tests and multiplayer races to earn Experience Points (XP). 
                Level up by accumulating XP and unlock achievements! The more you practice, 
                the faster you'll progress.
              </p>
            </div>
          </div>
        </m.div>

        {/* How You Earn XP Section */}
        <m.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          <m.div
            variants={itemVariants}
            className="flex items-center gap-3"
          >
            <Calculator className="w-6 h-6 text-emerald-400" />
            <h2 className="text-2xl font-bold text-white">How You Earn XP</h2>
          </m.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {xpRules.map((rule, idx) => (
              <m.div
                key={idx}
                variants={itemVariants}
                className={`${rule.bgColor} ${rule.borderColor} rounded-xl border p-4 hover:scale-105 transition-transform duration-200`}
              >
                <div className="flex items-start gap-3">
                  <div className={`${rule.color} flex-shrink-0 mt-0.5`}>
                    {rule.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <h3 className="text-sm font-semibold text-white truncate">{rule.title}</h3>
                      <span className={`${rule.color} font-bold text-sm whitespace-nowrap flex-shrink-0`}>
                        {rule.value}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 break-words">{rule.description}</p>
                  </div>
                </div>
              </m.div>
            ))}
          </div>
        </m.div>

        {/* XP Calculation Formula Section */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl"
        >
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <Calculator className="w-6 h-6 text-emerald-400" />
            XP Calculation Formula
          </h2>
          <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4 mb-4">
            <p className="text-sm text-slate-300 mb-2 font-mono">
              Total XP = Word XP + Completion + Accuracy Bonus + WPM Bonus + Win Bonus + Streak Bonus
            </p>
            <div className="space-y-2 text-xs text-slate-400 mt-4">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">•</span>
                <span>Word XP = (Words Typed × Accuracy %) × 2</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">•</span>
                <span>WPM Bonus = floor(WPM / 10)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">•</span>
                <span>Accuracy Bonus = 5 XP (if accuracy ≥ 95%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">•</span>
                <span>Win Bonus = 20 XP (multiplayer 1st place only)</span>
              </div>
            </div>
          </div>
        </m.div>

        {/* Examples Section */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Trophy className="w-6 h-6 text-amber-400" />
            Examples
          </h2>
          <div className="space-y-4">
            {examples.map((example, idx) => (
              <m.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
                className="bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-xl p-6 shadow-lg"
              >
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-white mb-1">{example.title}</h3>
                  <p className="text-sm text-slate-400">{example.scenario}</p>
                </div>
                <div className="space-y-2 mb-4">
                  {example.breakdown.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-slate-800/50 last:border-0">
                      <span className="text-slate-300">{item.label}:</span>
                      <span className="text-emerald-400 font-mono font-semibold">{item.value}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t border-slate-700 flex items-center justify-between">
                  <span className="text-base font-semibold text-white">Total XP:</span>
                  <span className="text-emerald-400 font-bold text-xl">+{example.total} XP</span>
                </div>
              </m.div>
            ))}
          </div>
        </m.div>

        {/* Level Progression Section */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl"
        >
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
            Level Progression
          </h2>
          <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4 mb-4">
            <p className="text-sm text-slate-300 mb-4">
              XP required for next level = <span className="text-emerald-400 font-mono font-semibold">100 + (level - 1) × 35</span>
            </p>
            <div className="space-y-3">
              {levelInfo.map((info, idx) => (
                <m.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + idx * 0.1 }}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="w-10 text-center font-bold text-emerald-400">Lv.{info.level}</span>
                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <m.div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ delay: 0.8 + idx * 0.1, duration: 0.5 }}
                      />
                    </div>
                  </div>
                  <span className="text-slate-300 font-mono text-xs ml-4 whitespace-nowrap">
                    {info.xpNeeded} XP needed
                  </span>
                </m.div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-4 italic">
              * Each level requires more XP than the previous one
            </p>
          </div>
        </m.div>

        {/* What Affects XP Section */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 md:p-8"
        >
          <h2 className="text-xl font-bold text-emerald-400 mb-4 flex items-center gap-3">
            <Info className="w-5 h-5" />
            What Affects XP?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white">Positive Factors:</h3>
              <ul className="text-sm text-slate-300 space-y-2 list-disc list-inside">
                <li>Higher typing speed (WPM)</li>
                <li>Better accuracy (95%+ for bonus)</li>
                <li>Completing more tests</li>
                <li>Winning multiplayer races</li>
                <li>Maintaining typing streaks</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white">Tips to Maximize XP:</h3>
              <ul className="text-sm text-slate-300 space-y-2 list-disc list-inside">
                <li>Focus on accuracy first, speed will follow</li>
                <li>Complete daily practice sessions</li>
                <li>Participate in multiplayer races</li>
                <li>Maintain consistent typing streaks</li>
                <li>Challenge yourself with harder texts</li>
              </ul>
            </div>
          </div>
        </m.div>

        {/* Tips Section */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl"
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            💡 Tips to Earn More XP
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">Type Accurately</h4>
                <p className="text-xs text-slate-400">95%+ accuracy gives you a bonus!</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">Type Faster</h4>
                <p className="text-xs text-slate-400">Higher WPM means more XP</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">Win Races</h4>
                <p className="text-xs text-slate-400">First place gets 20 XP bonus</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">Complete Tests</h4>
                <p className="text-xs text-slate-400">Every test gives completion XP</p>
              </div>
            </div>
          </div>
        </m.div>
      </div>
    </div>
  );
}

