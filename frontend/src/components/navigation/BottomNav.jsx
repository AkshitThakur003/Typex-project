import { Link, useLocation } from 'react-router-dom';
import { Home, Gamepad2, Users, Trophy, Settings, User } from 'lucide-react';
import { motion as m } from 'framer-motion';
import { usePreferences } from '../../settings/PreferencesContext.jsx';

const navItems = [
  { key: 'home', label: 'Home', href: '/', icon: Home },
  { key: 'practice', label: 'Practice', href: '/practice', icon: Gamepad2 },
  { key: 'multiplayer', label: 'Multiplayer', href: '/multiplayer', icon: Users },
  { key: 'leaderboard', label: 'Leaderboard', href: '/leaderboard', icon: Trophy },
];

export default function BottomNav() {
  const location = useLocation();
  const { user } = usePreferences();
  const isAuthenticated = !!user;

  const activeKey = (() => {
    const path = location?.pathname || '/';
    if (path === '/' || path === '/home') return 'home';
    if (path.startsWith('/practice')) return 'practice';
    if (path.startsWith('/multiplayer')) return 'multiplayer';
    if (path.startsWith('/leaderboard')) return 'leaderboard';
    if (path.startsWith('/settings')) return 'settings';
    if (path.startsWith('/profile')) return 'profile';
    return null;
  })();

  // Don't show on certain pages
  const hideOnPages = ['/login', '/register', '/forgot-password', '/reset-password'];
  if (hideOnPages.some(page => location.pathname.startsWith(page))) {
    return null;
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden
                 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800
                 safe-area-bottom"
      role="navigation"
      aria-label="Bottom navigation"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeKey === item.key;
          
          return (
            <Link
              key={item.key}
              to={item.href}
              className="flex flex-col items-center justify-center gap-1 
                         min-w-[44px] min-h-[44px] px-3 py-2 rounded-lg
                         transition-colors touch-target
                         active:scale-95"
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <m.div
                animate={{ scale: isActive ? 1.1 : 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                />
              </m.div>
              <span
                className={`text-[10px] font-medium transition-colors ${
                  isActive ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
        
        {/* Settings or Profile link */}
        {isAuthenticated ? (
          <Link
            to="/settings"
            className={`flex flex-col items-center justify-center gap-1 
                       min-w-[44px] min-h-[44px] px-3 py-2 rounded-lg
                       transition-colors touch-target
                       active:scale-95 ${
                         activeKey === 'settings' || activeKey === 'profile'
                           ? 'text-emerald-400' 
                           : 'text-slate-400'
                       }`}
            aria-label="Settings"
            aria-current={activeKey === 'settings' ? 'page' : undefined}
          >
            <m.div
              animate={{ scale: activeKey === 'settings' || activeKey === 'profile' ? 1.1 : 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <Settings className="w-5 h-5" />
            </m.div>
            <span className="text-[10px] font-medium">Settings</span>
          </Link>
        ) : (
          <Link
            to="/login"
            className="flex flex-col items-center justify-center gap-1 
                       min-w-[44px] min-h-[44px] px-3 py-2 rounded-lg
                       transition-colors touch-target text-slate-400
                       active:scale-95"
            aria-label="Login"
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-medium">Login</span>
          </Link>
        )}
      </div>
    </nav>
  );
}

