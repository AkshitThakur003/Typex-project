// Production-grade, scalable Header/NavBar for TypeX
// - Integrates Preferences (theme + fontStyle)
// - Auth-aware (works with optional AuthContext or via props)
// - Responsive with mobile drawer, accessible, animated with Framer Motion

import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion as m, AnimatePresence } from 'framer-motion';
import {
  FlameKindling,
  Menu,
  X,
  ChevronDown,
  Type as TypeIcon,
  Users,
  Home,
  Gamepad2,
  Trophy,
  Info,
  Settings,
  LogOut,
  User,
} from 'lucide-react';
import { usePreferences } from '../../settings/PreferencesContext.jsx';
import { api } from '../../lib/api';
import { AVATAR_OPTIONS } from '../../utils/avatars.js';

// Optional AuthContext support (if present in app)
let AuthContext;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  AuthContext = require('../auth/AuthContext')?.AuthContext;
} catch (_) {
  AuthContext = null;
}

function getNavLinks(isAuthed) {
  const links = [
    { key: 'home', label: 'Home', href: '/' },
    { key: 'practice', label: 'Practice', href: '/practice' },
    { key: 'multiplayer', label: 'Multiplayer', href: '/multiplayer' },
    { key: 'leaderboard', label: 'Leaderboard', href: '/leaderboard' },
    { key: 'about', label: 'About', href: '/about' },
  ];
  return links;
}

export default function Header({
  // Optional props to allow using without AuthContext
  isAuthenticated: isAuthedProp,
  user: userProp,
  onLogin,
  onRegister,
  onLogout,
  activeKey: activeKeyProp,
}) {
  const { preferences, setPreferences, user: prefUser, logout: prefLogout } = usePreferences();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();

  // Resolve auth from context if available, otherwise props
  const authCtx = AuthContext ? useContext(AuthContext) : null;
  const isAuthenticated = authCtx?.isAuthenticated ?? isAuthedProp ?? !!prefUser ?? false;
  const user = authCtx?.user ?? userProp ?? prefUser ?? null;
  const logout = authCtx?.logout ?? onLogout ?? prefLogout ?? (() => {});
  const login = authCtx?.login ?? onLogin ?? null;
  const register = onRegister ?? null;

  // Use shared avatar options (with labels)

    const activeKey = useMemo(() => {
    if (activeKeyProp) return activeKeyProp;
    const path = location?.pathname || '/';
    if (path === '/' || path === '/home') return 'home';
    if (path.startsWith('/leader')) return 'leaderboard';
    if (path.startsWith('/about')) return 'about';
    if (path.startsWith('/multiplayer')) return 'multiplayer';
    if (path === '/practice') return 'practice';
    return undefined;
  }, [activeKeyProp, location?.pathname]);

  // Close dropdown on outside click or Esc
  useEffect(() => {
    function onDoc(e) {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target)) setMenuOpen(false);
    }
    function onEsc(e) { if (e.key === 'Escape') { setMenuOpen(false); setMobileOpen(false); } }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  // Theme toggle with optimistic server persist
  // Cycle font: monospace → sans → typewriter
  async function cycleFont() {
    const order = ['monospace', 'sans', 'typewriter'];
    const idx = order.indexOf(preferences.fontStyle);
    const next = order[(idx + 1) % order.length];
    setPreferences({ ...preferences, fontStyle: next });
    try { 
      await api.patch('/api/auth/preferences', { fontStyle: next }); 
    } catch (err) {
      console.warn('[Header] Failed to save font preference to server:', err?.message || err);
    }
    localStorage.setItem('fontStyle', next);
  }

  const linkUnderline = {
    className: 'absolute left-0 right-0 -bottom-1 h-0.5 bg-emerald-400',
  };

  // Icon mapping for nav links
  const getNavIcon = (key) => {
    const iconMap = {
      'practice': Gamepad2,
      'multiplayer': Users,
      'leaderboard': Trophy,
      'about': Info,
      'home': Home,
    };
    return iconMap[key] || null;
  };

  const NavLinks = ({ onItem, isMobile = false }) => {
    const links = getNavLinks(isAuthenticated);
    
    if (!links || links.length === 0) {
      return null;
    }
    
    return (
      <ul className={`flex ${isMobile ? 'flex-col gap-2' : 'flex-col md:flex-row md:items-center gap-2 md:gap-6'} text-sm`}>
        {links.map((l, idx) => {
          const Icon = getNavIcon(l.key);
          if (!l || !l.href || !l.label) {
            return null;
          }
          return (
            <li
              key={l.key || idx}
              className={`relative ${isMobile ? 'w-full' : 'group'}`}
              style={isMobile ? { minHeight: '48px' } : {}}
            >
              <Link
                to={l.href}
                onClick={() => onItem?.(l)}
                className={`${
                  isMobile 
                    ? 'flex items-center gap-3 px-4 py-3.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600/50 text-slate-200 hover:text-white transition-all active:scale-95 w-full font-medium shadow-sm hover:shadow-md min-h-[48px]' 
                    : 'text-slate-300 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded'
                }`}
              >
                {isMobile && Icon && (
                  <Icon className="w-5 h-5 flex-shrink-0 text-slate-200" />
                )}
                <span className={`${isMobile ? 'flex-1 font-medium text-slate-200' : 'inline-block py-1'}`}>
                  {l.label}
                </span>
                {!isMobile && (
                  <>
                    {/* Hover underline */}
                    <span className="absolute left-0 right-0 -bottom-1 h-0.5 bg-slate-500 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-200" />
                    {/* Active underline */}
                    {activeKey === l.key && <m.div {...linkUnderline} />}
                  </>
                )}
                {isMobile && activeKey === l.key && (
                  <m.div
                    layoutId="mobile-active-indicator"
                    className="absolute right-4 w-2 h-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50"
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <header
      className="sticky top-0 z-[60] bg-slate-950/70 backdrop-blur-md border-b border-slate-800 shadow-lg safe-area-top"
      role="banner"
    >
      <div className="max-w-6xl mx-auto px-3 sm:px-4">
        <div className="h-14 flex items-center justify-between gap-3" role="navigation" aria-label="Main">
          {/* Left: Logo */}
          <Link to="/" className="flex items-center gap-2 font-semibold text-white select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded">
            <m.span initial={{ rotate: -10, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 12 }}>
              <FlameKindling className="text-orange-400" />
            </m.span>
            <m.span initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="tracking-wide">TypeX</m.span>
          </Link>

          {/* Center: Links (hidden on mobile) */}
          <nav className="hidden md:block">
            <NavLinks />
          </nav>

      {/* Right: Controls (minimal) */}
    <div className="hidden md:flex items-center gap-2">
            <button
              onClick={cycleFont}
              aria-label="Cycle font"
        className="p-2 rounded bg-slate-900/50 border border-slate-800 text-slate-200 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <TypeIcon size={18} />
            </button>
      {isAuthenticated && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded bg-slate-900/50 border border-slate-800 text-slate-200 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  title={(preferences?.status || user?.status) ? `Status: ${preferences?.status || user?.status}` : undefined}
                >
                  {/* Avatar - Priority: avatarUrl > avatarChoice emoji > initials (OAuth users use initials) */}
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded bg-slate-800">
                    {(preferences?.avatarUrl || user?.avatarUrl) ? (
                      <img src={preferences?.avatarUrl || user.avatarUrl} alt="avatar" className="w-7 h-7 rounded object-cover" />
                    ) : (
                      (() => {
                        const key = (preferences?.avatarChoice || user?.avatarChoice);
                        const label = key ? AVATAR_OPTIONS[key] : null;
                        const emoji = label ? label.split(' ')[0] : null;
                        if (emoji) return <span aria-label={label} title={label}>{emoji}</span>;
                        // OAuth users always show initials (first letter of username)
                        return <span className="text-xs font-bold">{(user?.username || user?.name || 'U').slice(0, 1).toUpperCase()}</span>;
                      })()
                    )}
                  </span>
                  <span className="text-sm">{user?.username || user?.name || 'User'}</span>
                  <ChevronDown size={16} />
                </button>
                <AnimatePresence>
                  {menuOpen && (
                    <m.div
                      key="dropdown"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.12 }}
                      role="menu"
                      className="absolute right-0 mt-2 w-44 rounded-lg border border-slate-800 bg-slate-900/95 backdrop-blur p-1 shadow-xl"
                    >
                      <Link 
                        to="/friends"
                        onClick={() => setMenuOpen(false)} 
                        role="menuitem" 
                        className="block px-3 py-2 rounded text-sm text-slate-200 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 flex items-center gap-2"
                      >
                        <Users className="w-4 h-4" />
                        Friends
                      </Link>
                      {user?.username && (
                        <Link 
                          to={`/profile/${user.username}`} 
                          onClick={() => setMenuOpen(false)}
                          role="menuitem" 
                          tabIndex={0} 
                          className="block px-3 py-2 rounded text-sm text-slate-200 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                        >
                          My Profile
                        </Link>
                      )}
                      <Link to="/settings" role="menuitem" tabIndex={0} className="block px-3 py-2 rounded text-sm text-slate-200 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">Settings</Link>
                      <button onClick={() => { setMenuOpen(false); logout?.(); }} role="menuitem" className="w-full text-left px-3 py-2 rounded text-sm text-rose-300 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">Logout</button>
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Mobile: Hamburger */}
      <div className="md:hidden">
            <m.button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-controls="mobile-drawer"
              aria-expanded={mobileOpen}
        className="relative p-2.5 rounded-lg bg-slate-900/50 border border-slate-800 text-slate-200 hover:bg-slate-800 hover:border-emerald-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-all"
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
            >
              <m.span 
                initial={false} 
                animate={{ rotate: mobileOpen ? 90 : 0 }} 
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="block"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </m.span>
            </m.button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
<AnimatePresence>
  {mobileOpen && (
    <>
      {/* Overlay */}
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 md:hidden bg-black/80 backdrop-blur-sm"
        onClick={() => setMobileOpen(false)}
        aria-label="Close menu"
      />

      {/* Drawer */}
      <m.aside
        id="mobile-drawer"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed right-0 top-0 h-screen w-[85vw] max-w-sm z-[60] md:hidden
                   bg-slate-950 backdrop-blur-xl 
                   border-l border-slate-800 
                   shadow-2xl 
                   flex flex-col"
        style={{ height: '100vh', maxHeight: '100vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/50 flex-shrink-0">
          <div className="flex items-center gap-2 text-white font-semibold text-lg">
            <m.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <FlameKindling className="text-orange-400" />
            </m.div>
            <span>TypeX</span>
          </div>
          <m.button
            onClick={() => setMobileOpen(false)}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700 border border-slate-700 
                       text-slate-200 transition-all"
            aria-label="Close"
          >
            <X size={20} />
          </m.button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide" style={{ minHeight: 0 }}>
          <div className="p-4">
            {/* Navigation Links */}
            <nav className="space-y-2 mb-4">
              <div className="px-2 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Navigation
              </div>
              <NavLinks onItem={() => setMobileOpen(false)} isMobile={true} />
            </nav>

            {/* Divider */}
            {isAuthenticated && (
              <div className="my-4 border-t border-slate-800" />
            )}

            {/* User Section */}
            {isAuthenticated && (
              <div className="space-y-2">
                <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Account
                </div>
                <Link
                  to="/friends"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600/50 text-slate-200 hover:text-white transition-all active:scale-95"
                >
                  <Users className="w-5 h-5" />
                  <span className="flex-1 font-medium">Friends</span>
                </Link>
                {user?.username && (
                  <Link
                    to={`/profile/${user.username}`}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600/50 text-slate-200 hover:text-white transition-all active:scale-95"
                  >
                    <User className="w-5 h-5" />
                    <span className="flex-1 font-medium">My Profile</span>
                  </Link>
                )}
                <Link
                  to="/settings"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600/50 text-slate-200 hover:text-white transition-all active:scale-95"
                >
                  <Settings className="w-5 h-5" />
                  <span className="flex-1 font-medium">Settings</span>
                </Link>
              </div>
            )}

            {/* Divider */}
            {isAuthenticated && (
              <div className="my-4 border-t border-slate-800" />
            )}

            {/* Font Cycle Button */}
            <button
              onClick={cycleFont}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600/50 text-slate-200 hover:text-white transition-all active:scale-95"
              aria-label="Cycle font"
            >
              <TypeIcon className="w-5 h-5" />
              <span className="flex-1 font-medium text-left">Font Style</span>
              <span className="text-xs text-slate-400 capitalize">{preferences.fontStyle}</span>
            </button>

            {/* Logout Button */}
            {isAuthenticated && (
              <button
                onClick={() => {
                  logout?.();
                  setMobileOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 hover:border-rose-500/50 text-rose-400 hover:text-rose-300 transition-all active:scale-95 mt-2"
              >
                <LogOut className="w-5 h-5" />
                <span className="flex-1 font-medium text-left">Logout</span>
              </button>
            )}
          </div>
        </div>
      </m.aside>
    </>
  )}
</AnimatePresence>

    </header>
  );
}
