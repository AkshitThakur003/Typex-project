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
} from 'lucide-react';
import { usePreferences } from '../settings/PreferencesContext.jsx';
import { api } from '../lib/api';

// Optional AuthContext support (if present in app)
let AuthContext;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  AuthContext = require('../auth/AuthContext')?.AuthContext;
} catch (_) {
  AuthContext = null;
}

function getNavLinks(isAuthed) {
  return [
    { key: 'practice', label: 'Practice', href: '/practice' },
  { key: 'multiplayer', label: 'Multiplayer', href: '/multiplayer' },
    { key: 'leaderboard', label: 'Leaderboard', href: '/leaderboard' },
    { key: 'about', label: 'About', href: '/about' },
  ];
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

  // Map avatarChoice -> emoji glyph (same options as Settings)
  const AVATAR_EMOJI = {
    'emoji-rocket': '🚀 Rocket',
    'emoji-lightning': '⚡ Lightning',
    'emoji-keyboard': '⌨️ Keyboard',
    'emoji-fire': '🔥 Fire',
    'emoji-star': '⭐ Star',
    'emoji-wave': '🌊 Wave',
    'emoji-sparkles': '✨ Sparkles',
    'emoji-owl': '🦉 Owl',
  };

  const activeKey = useMemo(() => {
    if (activeKeyProp) return activeKeyProp;
    const path = location?.pathname || '/';
    if (path.startsWith('/leader')) return 'leaderboard';
  if (path.startsWith('/about')) return 'about';
    if (path.startsWith('/multiplayer')) return 'multiplayer';
    if (path.startsWith('/practice')) return 'practice';
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
    try { await api.patch('/api/auth/preferences', { fontStyle: next }); } catch {}
    localStorage.setItem('fontStyle', next);
  }

  const linkUnderline = {
    layoutId: 'active-underline',
    className: 'absolute left-0 right-0 -bottom-1 h-0.5 bg-emerald-400',
  };

  const NavLinks = ({ onItem }) => (
  <ul className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 text-sm">
      {getNavLinks(isAuthenticated).map((l) => (
    <li key={l.key} className="relative group">
          <Link
            to={l.href}
            onClick={() => onItem?.(l)}
      className="text-slate-300 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
          >
            <span className="inline-block py-1">{l.label}</span>
      {/* Hover underline */}
      <span className="absolute left-0 right-0 -bottom-1 h-0.5 bg-slate-500 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-200" />
      {/* Active underline */}
      {activeKey === l.key && <m.div {...linkUnderline} />}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <header
      className="sticky top-0 z-50 bg-slate-950/70 backdrop-blur-md border-b border-slate-800 shadow-lg"
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
                  {/* Avatar */}
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded bg-slate-800">
                    {user?.avatarUrl ? (
                      // legacy image avatar support
                      <img src={user.avatarUrl} alt="avatar" className="w-7 h-7 rounded object-cover" />
                    ) : (
                      (() => {
                        const key = (preferences?.avatarChoice || user?.avatarChoice);
                        const label = key ? AVATAR_EMOJI[key] : null;
                        const emoji = label ? label.split(' ')[0] : null;
                        if (emoji) return <span aria-label={label} title={label}>{emoji}</span>;
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
                      <Link to="/settings" role="menuitem" tabIndex={0} className="block px-3 py-2 rounded text-sm text-slate-200 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">Profile</Link>
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
        className="p-2 rounded bg-slate-900/50 border border-slate-800 text-slate-200 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              whileTap={{ scale: 0.96 }}
            >
              <m.span initial={false} animate={{ rotate: mobileOpen ? 180 : 0 }} transition={{ duration: 0.15, ease: 'easeOut' }}>
                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
              </m.span>
            </m.button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
<AnimatePresence>
  {mobileOpen && (
    <m.div
      key="drawer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 md:hidden"
      aria-modal="true"
      role="dialog"
    >
      {/* Overlay */}
      <m.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={() => setMobileOpen(false)}
        aria-label="Close menu"
      />

      {/* Drawer */}
      <m.aside
        id="mobile-drawer"
        initial={{ y: "-100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "-100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        className="absolute left-0 top-0 w-full max-h-[90vh] h-auto 
                   bg-slate-950/90 backdrop-blur-xl 
                   border-b border-slate-800 
                   rounded-b-2xl shadow-2xl 
                   p-5 flex flex-col gap-5 overflow-y-auto"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-semibold text-lg">
            <FlameKindling className="text-orange-400" />
            TypeX
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded bg-slate-900/50 border border-slate-800 
                       text-slate-200 hover:bg-slate-800 
                       focus:outline-none focus-visible:ring-2 
                       focus-visible:ring-emerald-500"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav>
          <NavLinks onItem={() => setMobileOpen(false)} />
        </nav>

        {/* Font Cycle Button */}
        <div className="mt-2">
          <button
            onClick={cycleFont}
            className="px-4 py-2 rounded bg-slate-900/60 border border-slate-700 
                       text-slate-200 hover:bg-slate-800 
                       focus:outline-none focus-visible:ring-2 
                       focus-visible:ring-emerald-500 w-full"
            aria-label="Cycle font"
          >
            <TypeIcon size={18} />
          </button>
        </div>

        {/* Auth Buttons */}
        <div className="mt-auto">
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                to="/settings"
                onClick={() => setMobileOpen(false)}
                className="flex-1 px-4 py-2 rounded 
                           bg-slate-800 hover:bg-slate-700 
                           border border-slate-700 
                           text-sm text-center text-slate-200"
              >
                Profile
              </Link>
              <button
                onClick={() => {
                  logout?.();
                  setMobileOpen(false);
                }}
                className="flex-1 px-4 py-2 rounded 
                           bg-rose-700 hover:bg-rose-600 
                           text-sm text-white"
              >
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </m.aside>
    </m.div>
  )}
</AnimatePresence>

    </header>
  );
}
