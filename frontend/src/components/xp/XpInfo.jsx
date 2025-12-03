import { motion as m, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Info, X, ArrowLeft, TrendingUp, Award, Target, Zap, Trophy, Users } from 'lucide-react';

/**
 * XpInfo Component - Shows users how XP is distributed and calculated
 * Can be used as a modal, collapsible section, or inline info
 */
export default function XpInfo({ variant = 'modal' }) {
  const [isOpen, setIsOpen] = useState(false);

  const xpRules = [
    {
      icon: <Target className="w-5 h-5" />,
      title: 'Correct Words',
      value: '2 XP per word',
      description: 'Earn 2 XP for each correctly typed word',
      color: 'text-emerald-400',
    },
    {
      icon: <Award className="w-5 h-5" />,
      title: 'Completion Bonus',
      value: '1 XP',
      description: 'Bonus for completing any test',
      color: 'text-blue-400',
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: 'Accuracy Bonus',
      value: '5 XP',
      description: 'Awarded when accuracy ≥ 95%',
      color: 'text-purple-400',
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: 'WPM Bonus',
      value: 'floor(WPM / 10)',
      description: 'Faster typing = more XP (e.g., 50 WPM = 5 XP)',
      color: 'text-yellow-400',
    },
    {
      icon: <Trophy className="w-5 h-5" />,
      title: 'Win Bonus',
      value: '20 XP',
      description: 'First place in multiplayer races',
      color: 'text-amber-400',
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: 'Second Place',
      value: '10 XP',
      description: 'Second place in multiplayer races',
      color: 'text-slate-400',
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
      ],
      total: 106,
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
      ],
      total: 149,
    },
  ];

  if (variant === 'icon') {
    return (
      <Link
        to="/xp-info"
        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition-colors"
        aria-label="How XP works"
        title="How XP works"
      >
        <Info className="w-4 h-4" />
      </Link>
    );
  }

  if (variant === 'modal') {
    return (
      <Link to="/xp-info" className="text-emerald-400 hover:text-emerald-300 text-sm font-medium">
        How XP works
      </Link>
    );
  }

  // Default: don't render anything (should use 'icon' or 'modal' variant)
  return null;
}

function XpInfoModal({ isOpen, onClose, trigger }) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {trigger}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Full-screen backdrop */}
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
            />
            
            {/* Modal container - centered with top padding */}
            <m.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-0 z-[210] flex justify-center items-start py-10 px-4 overflow-y-auto"
              onClick={(e) => {
                // Close modal if clicking on backdrop (container)
                if (e.target === e.currentTarget) {
                  onClose();
                }
              }}
            >
              {/* Modal content - stops propagation */}
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl max-w-5xl w-full max-h-[calc(100vh-5rem)] overflow-y-auto scrollbar-hide my-auto"
              >
                {/* Sticky header */}
                <div className="sticky top-0 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between z-10">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={onClose}
                      className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                      aria-label="Back"
                      title="Back"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-2xl font-bold text-white">How XP Works</h2>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    aria-label="Close"
                    title="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Scrollable content */}
                <div className="p-6 w-full">
                  <XpInfoContent />
                </div>
              </div>
            </m.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function XpInfoContent() {
  const xpRules = [
    {
      icon: <Target className="w-5 h-5" />,
      title: 'Correct Words',
      value: '2 XP per word',
      description: 'Earn 2 XP for each correctly typed word',
      color: 'text-emerald-400',
    },
    {
      icon: <Award className="w-5 h-5" />,
      title: 'Completion Bonus',
      value: '1 XP',
      description: 'Bonus for completing any test',
      color: 'text-blue-400',
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: 'Accuracy Bonus',
      value: '5 XP',
      description: 'Awarded when accuracy ≥ 95%',
      color: 'text-purple-400',
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: 'WPM Bonus',
      value: 'floor(WPM / 10)',
      description: 'Faster typing = more XP (e.g., 50 WPM = 5 XP)',
      color: 'text-yellow-400',
    },
    {
      icon: <Trophy className="w-5 h-5" />,
      title: 'Win Bonus',
      value: '20 XP',
      description: 'First place in multiplayer races',
      color: 'text-amber-400',
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: 'Second Place',
      value: '10 XP',
      description: 'Second place in multiplayer races',
      color: 'text-slate-400',
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
      ],
      total: 106,
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
      ],
      total: 149,
    },
  ];

  return (
    <div className="w-full space-y-8">
      {/* Introduction */}
      <div>
        <h3 className="text-xl font-bold text-white mb-2">Earn XP by Typing!</h3>
        <p className="text-slate-400">
          Complete typing tests and multiplayer races to earn Experience Points (XP). 
          Level up by accumulating XP and unlock achievements!
        </p>
      </div>

      {/* XP Rules Grid */}
      <div className="w-full">
        <h3 className="text-lg font-semibold text-white mb-4">How You Earn XP</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
          {xpRules.map((rule, idx) => (
            <m.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-slate-800/50 rounded-lg border border-slate-700 p-4 w-full min-w-0"
            >
              <div className="flex items-start gap-3 w-full">
                <div className={`${rule.color} flex-shrink-0 mt-0.5`}>
                  {rule.icon}
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <h4 className="text-sm font-semibold text-white truncate">{rule.title}</h4>
                    <span className="text-emerald-400 font-bold text-sm whitespace-nowrap flex-shrink-0">{rule.value}</span>
                  </div>
                  <p className="text-xs text-slate-400 break-words">{rule.description}</p>
                </div>
              </div>
            </m.div>
          ))}
        </div>
      </div>

      {/* Examples */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Examples</h3>
        <div className="space-y-4">
          {examples.map((example, idx) => (
            <m.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.2 }}
              className="bg-slate-800/50 rounded-lg border border-slate-700 p-4"
            >
              <div className="mb-3">
                <h4 className="text-sm font-semibold text-white">{example.title}</h4>
                <p className="text-xs text-slate-400">{example.scenario}</p>
              </div>
              <div className="space-y-2 mb-3">
                {example.breakdown.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">{item.label}:</span>
                    <span className="text-emerald-400 font-mono">{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-slate-700 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Total XP:</span>
                <span className="text-emerald-400 font-bold text-lg">+{example.total} XP</span>
              </div>
            </m.div>
          ))}
        </div>
      </div>

      {/* Level Progression */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Level Progression</h3>
        <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4">
          <p className="text-sm text-slate-400 mb-4">
            XP required for next level = <span className="text-emerald-400 font-mono">100 + (level - 1) × 35</span>
          </p>
          <div className="space-y-2">
            {levelInfo.map((info, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className="w-8 text-center font-bold text-emerald-400">Lv.{info.level}</span>
                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
                <span className="text-slate-300 font-mono text-xs ml-4">
                  {info.xpNeeded} XP needed
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-4">
            * Each level requires more XP than the previous one
          </p>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-emerald-400 mb-2">💡 Tips to Earn More XP</h4>
        <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
          <li>Type accurately - 95%+ accuracy gives you a bonus!</li>
          <li>Type faster - Higher WPM means more XP</li>
          <li>Win multiplayer races - First place gets 20 XP bonus</li>
          <li>Complete more tests - Every test gives completion XP</li>
        </ul>
      </div>
    </div>
  );
}

