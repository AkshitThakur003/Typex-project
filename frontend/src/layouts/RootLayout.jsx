import { Outlet, useNavigate } from 'react-router-dom';
import { Header, BottomNav } from '../components/navigation';
import { Toaster } from 'react-hot-toast';
import { usePreferences } from '../settings/PreferencesContext.jsx';
import { 
  KeyboardShortcutsModal, 
  useKeyboardShortcuts,
  OnboardingTutorial,
  useOnboarding 
} from '../components/common';

export default function RootLayout() {
  const { preferences } = usePreferences();
  const keyboardShortcuts = useKeyboardShortcuts();
  const onboarding = useOnboarding();

  const themeClass = preferences.theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100';
  const fontClass = preferences.fontStyle === 'sans' ? 'font-sans' : preferences.fontStyle === 'typewriter' ? 'font-["Special_Elite",monospace]' : 'font-mono';

  return (
    <div className={`min-h-screen ${themeClass} ${fontClass}`}>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgb(15 23 42 / 0.95)',
            color: '#e2e8f0',
            border: '1px solid rgb(16 185 129 / 0.3)',
            backdropFilter: 'blur(12px)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#0f172a',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#0f172a',
            },
          },
        }}
      />
      
      {/* Keyboard Shortcuts Modal - Press ? to open */}
      <KeyboardShortcutsModal 
        isOpen={keyboardShortcuts.isOpen} 
        onClose={keyboardShortcuts.close} 
      />
      
      {/* Onboarding Tutorial for New Users */}
      <OnboardingTutorial 
        isOpen={onboarding.showOnboarding}
        onClose={onboarding.closeOnboarding}
        onComplete={onboarding.closeOnboarding}
      />
      
      <Header />
      <main className="pb-16 md:pb-0">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
