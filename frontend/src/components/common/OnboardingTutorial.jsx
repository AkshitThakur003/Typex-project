// ============================================
// Onboarding Tutorial for New Users
// ============================================

import { useState, useEffect } from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Keyboard, 
  Users, 
  Trophy, 
  Target,
  Zap,
  Check,
  Sparkles
} from 'lucide-react';

const TUTORIAL_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to TypeX! 🚀',
    description: 'Master your typing skills with real-time races and personalized practice sessions.',
    icon: Sparkles,
    color: 'from-orange-500 to-amber-500',
    tips: [
      'Practice solo to improve your speed',
      'Race against friends in multiplayer',
      'Track your progress on the leaderboard'
    ]
  },
  {
    id: 'practice',
    title: 'Practice Mode',
    description: 'Choose your preferred mode and start typing to improve your WPM and accuracy.',
    icon: Keyboard,
    color: 'from-emerald-500 to-teal-500',
    tips: [
      'Time Mode: Type as much as you can in 15, 30, or 60 seconds',
      'Words Mode: Complete 10, 25, or 50 words as fast as possible',
      'Quote Mode: Type inspiring quotes to practice real text'
    ]
  },
  {
    id: 'multiplayer',
    title: 'Multiplayer Racing',
    description: 'Create or join rooms to race against other typists in real-time.',
    icon: Users,
    color: 'from-blue-500 to-indigo-500',
    tips: [
      'Create a room and share the code with friends',
      'Join existing rooms with a room code',
      'Chat with other players while waiting'
    ]
  },
  {
    id: 'progress',
    title: 'Track Your Progress',
    description: 'Monitor your improvement with detailed statistics and achievements.',
    icon: Trophy,
    color: 'from-purple-500 to-pink-500',
    tips: [
      'View your best WPM and accuracy on your profile',
      'Earn XP and level up as you practice',
      'Unlock achievements for milestones'
    ]
  },
  {
    id: 'shortcuts',
    title: 'Keyboard Shortcuts',
    description: 'Use these shortcuts to navigate faster and improve your workflow.',
    icon: Zap,
    color: 'from-rose-500 to-red-500',
    tips: [
      'Press Tab to restart with same text',
      'Press Shift+Tab for new text',
      'Press ? anywhere for shortcuts help'
    ]
  }
];

function StepIndicator({ currentStep, totalSteps, onStepClick }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }).map((_, idx) => (
        <button
          key={idx}
          onClick={() => onStepClick(idx)}
          className={`w-2 h-2 rounded-full transition-all duration-300 ${
            idx === currentStep 
              ? 'w-8 bg-emerald-400' 
              : idx < currentStep 
                ? 'bg-emerald-400/50' 
                : 'bg-slate-600 hover:bg-slate-500'
          }`}
          aria-label={`Go to step ${idx + 1}`}
        />
      ))}
    </div>
  );
}

function TutorialStep({ step, isActive }) {
  const Icon = step.icon;
  
  return (
    <m.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: isActive ? 1 : 0, x: isActive ? 0 : 50 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
      className="text-center"
    >
      {/* Icon */}
      <div className={`inline-flex p-3 sm:p-4 rounded-2xl bg-gradient-to-br ${step.color} mb-4 sm:mb-6 shadow-lg`}>
        <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
      </div>
      
      {/* Title */}
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 sm:mb-3">
        {step.title}
      </h2>
      
      {/* Description */}
      <p className="text-sm sm:text-base text-slate-400 mb-4 sm:mb-6 max-w-md mx-auto">
        {step.description}
      </p>
      
      {/* Tips */}
      <div className="space-y-2 sm:space-y-3 text-left max-w-sm mx-auto">
        {step.tips.map((tip, idx) => (
          <m.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + idx * 0.1 }}
            className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
          >
            <div className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-500/20 flex items-center justify-center mt-0.5">
              <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-400" />
            </div>
            <span className="text-xs sm:text-sm text-slate-300">{tip}</span>
          </m.div>
        ))}
      </div>
    </m.div>
  );
}

export default function OnboardingTutorial({ isOpen, onClose, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = TUTORIAL_STEPS.length;
  
  const markAsCompleted = () => {
    localStorage.setItem('typex_onboarding_completed', 'true');
  };
  
  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };
  
  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleComplete = () => {
    // Mark tutorial as completed in localStorage
    markAsCompleted();
    onComplete?.();
    onClose();
  };
  
  const handleSkip = () => {
    // Mark as skipped but still completed
    markAsCompleted();
    localStorage.setItem('typex_onboarding_skipped', 'true');
    onClose();
  };
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'Escape') {
        handleSkip();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md"
          />
          
          {/* Modal */}
          <m.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
          >
            <div className="relative bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
              {/* Close button */}
              <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10">
                <button
                  onClick={handleSkip}
                  className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  aria-label="Skip tutorial"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Content */}
              <div className="p-4 pt-10 sm:p-8 sm:pt-12">
                <AnimatePresence mode="wait">
                  <TutorialStep 
                    key={currentStep}
                    step={TUTORIAL_STEPS[currentStep]} 
                    isActive={true}
                  />
                </AnimatePresence>
              </div>
              
              {/* Footer */}
              <div className="px-4 pb-4 pt-4 sm:px-8 sm:pb-8 border-t border-slate-800">
                {/* Step indicator */}
                <div className="mb-6">
                  <StepIndicator 
                    currentStep={currentStep} 
                    totalSteps={totalSteps}
                    onStepClick={setCurrentStep}
                  />
                </div>
                
                {/* Navigation buttons */}
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={handlePrev}
                    disabled={currentStep === 0}
                    className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg transition-all text-sm sm:text-base touch-target min-h-[44px] ${
                      currentStep === 0
                        ? 'text-slate-600 cursor-not-allowed'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Back</span>
                  </button>
                  
                  <button
                    onClick={handleSkip}
                    className="text-xs sm:text-sm text-slate-500 hover:text-slate-300 transition-colors touch-target min-h-[44px] px-2"
                  >
                    Skip
                  </button>
                  
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-medium shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 text-sm sm:text-base touch-target min-h-[44px]"
                  >
                    <span>{currentStep === totalSteps - 1 ? 'Start' : 'Next'}</span>
                    {currentStep === totalSteps - 1 ? (
                      <Sparkles className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </m.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Hook to manage onboarding state
export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  useEffect(() => {
    // Check if user has completed onboarding
    const completed = localStorage.getItem('typex_onboarding_completed');
    if (!completed) {
      // Show onboarding after a short delay for better UX
      const timer = setTimeout(() => setShowOnboarding(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);
  
  const resetOnboarding = () => {
    localStorage.removeItem('typex_onboarding_completed');
    localStorage.removeItem('typex_onboarding_skipped');
    setShowOnboarding(true);
  };
  
  return {
    showOnboarding,
    setShowOnboarding,
    closeOnboarding: () => setShowOnboarding(false),
    resetOnboarding,
  };
}

