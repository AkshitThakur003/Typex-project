import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as m } from 'framer-motion';
import { ArrowLeft, Volume2, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '../lib/api';
import { usePreferences } from './PreferencesContext.jsx';
import { XpInfo } from '../components/xp';
import { SOUND_OPTIONS, playKeySound } from '../lib/keyboardSounds';

// Validate avatar URL (security: only allow https and common image domains)
function validateAvatarUrl(url) {
  if (!url) return { valid: true, error: null };
  
  try {
    const parsed = new URL(url);
    // Only allow HTTPS
    if (parsed.protocol !== 'https:') {
      return { valid: false, error: 'Only HTTPS URLs are allowed' };
    }
    // Check for common image extensions
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const hasValidExtension = validExtensions.some(ext => 
      parsed.pathname.toLowerCase().endsWith(ext)
    );
    // Allow known image hosting domains without extension check
    const trustedDomains = [
      'gravatar.com', 'githubusercontent.com', 'googleusercontent.com',
      'imgur.com', 'i.imgur.com', 'cloudinary.com', 'unsplash.com',
      'pbs.twimg.com', 'avatars.dicebear.com'
    ];
    const isTrustedDomain = trustedDomains.some(domain => 
      parsed.hostname.endsWith(domain)
    );
    
    if (!hasValidExtension && !isTrustedDomain) {
      return { valid: false, error: 'URL must be an image (jpg, png, gif, webp, svg) or from a trusted image host' };
    }
    
    return { valid: true, error: null };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

const AVATARS = [
  { key: 'emoji-rocket', label: '🚀 Rocket' },
  { key: 'emoji-lightning', label: '⚡ Lightning' },
  { key: 'emoji-keyboard', label: '⌨️ Keyboard' },
  { key: 'emoji-fire', label: '🔥 Fire' },
  { key: 'emoji-star', label: '⭐ Star' },
  { key: 'emoji-wave', label: '🌊 Wave' },
  { key: 'emoji-sparkles', label: '✨ Sparkles' },
  { key: 'emoji-owl', label: '🦉 Owl' },
];

const STATUSES = ['Available', 'Busy', 'Chill', 'In a race'];

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, preferences, setPreferences, refreshUser, logout } = usePreferences();
  const [username, setUsername] = useState(user?.username || '');
  const [avatarChoice, setAvatarChoice] = useState(user?.avatarChoice !== undefined ? user.avatarChoice : (preferences?.avatarChoice !== undefined ? preferences.avatarChoice : ''));
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl !== undefined ? user.avatarUrl : (preferences?.avatarUrl !== undefined ? preferences.avatarUrl : ''));
  const [avatarUrlError, setAvatarUrlError] = useState(null);
  const [status, setStatus] = useState(user?.status || preferences?.status || 'Available');
  const [localPrefs, setLocalPrefs] = useState({
    caretStyle: preferences.caretStyle || 'solid',
    fontStyle: preferences.fontStyle || 'monospace',
    fontSize: preferences.fontSize || 'medium',
    keyboardSound: preferences.keyboardSound || 'off',
    soundVolume: preferences.soundVolume ?? 0.5,
  });
  const [pw, setPw] = useState({ current: '', next: '' });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const pendingNavigationRef = useRef(null);
  const soundPreviewTimeoutRef = useRef(null);

  const avatarPreview = useMemo(() => AVATARS.find(a => a.key === avatarChoice)?.label || '🙂', [avatarChoice]);

  // Track unsaved changes
  const initialValues = useRef({
    username: user?.username || '',
    avatarChoice: user?.avatarChoice || preferences?.avatarChoice || '',
    avatarUrl: user?.avatarUrl || preferences?.avatarUrl || '',
    status: user?.status || preferences?.status || 'Available',
    localPrefs: {
      caretStyle: preferences.caretStyle || 'solid',
      fontStyle: preferences.fontStyle || 'monospace',
      fontSize: preferences.fontSize || 'medium',
      keyboardSound: preferences.keyboardSound || 'off',
      soundVolume: preferences.soundVolume ?? 0.5,
    }
  });

  useEffect(() => {
    const hasChanges = 
      username !== initialValues.current.username ||
      avatarChoice !== initialValues.current.avatarChoice ||
      avatarUrl !== initialValues.current.avatarUrl ||
      status !== initialValues.current.status ||
      JSON.stringify(localPrefs) !== JSON.stringify(initialValues.current.localPrefs);
    setHasUnsavedChanges(hasChanges);
  }, [username, avatarChoice, avatarUrl, status, localPrefs]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Debounced sound preview
  const playSoundPreview = useCallback((sound, volume) => {
    if (soundPreviewTimeoutRef.current) {
      clearTimeout(soundPreviewTimeoutRef.current);
    }
    soundPreviewTimeoutRef.current = setTimeout(() => {
      if (sound !== 'off') {
        playKeySound(sound, volume);
      }
    }, 150); // Debounce 150ms
  }, []);

  // Handle navigation with unsaved changes
  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedWarning(true);
      pendingNavigationRef.current = () => navigate(-1);
    } else {
      navigate(-1);
    }
  };

  const confirmLeave = () => {
    setShowUnsavedWarning(false);
    if (pendingNavigationRef.current) {
      pendingNavigationRef.current();
      pendingNavigationRef.current = null;
    }
  };

  // Validate avatar URL on change
  const handleAvatarUrlChange = (url) => {
    setAvatarUrl(url);
    const validation = validateAvatarUrl(url);
    setAvatarUrlError(validation.error);
  };

  async function saveProfile() {
    // Validate avatar URL before saving
    if (avatarUrl) {
      const validation = validateAvatarUrl(avatarUrl);
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }
    }
    
    try {
      await api.patch('/api/auth/profile', { username, avatarChoice, status, avatarUrl });
      if (username) localStorage.setItem('username', username);
      // Also persist avatar/status into preferences for app-wide use
      const merged = { ...preferences, avatarChoice, status, avatarUrl };
      await api.patch('/api/auth/preferences', merged);
      setPreferences(merged);
      await refreshUser();
      // Update initial values after save
      initialValues.current = { ...initialValues.current, username, avatarChoice, avatarUrl, status };
      setHasUnsavedChanges(false);
      toast.success('Profile saved successfully!');
    } catch (err) {
      console.error('[SettingsPage] Failed to save profile:', err);
      const errorMsg = err?.response?.data?.error || 'Failed to save profile';
      toast.error(errorMsg);
    }
  }

  async function savePreferences() {
    try {
      const merged = { ...preferences, ...localPrefs };
      await api.patch('/api/auth/preferences', merged);
      setPreferences(merged);
      // Update initial values after save
      initialValues.current = { ...initialValues.current, localPrefs: { ...localPrefs } };
      setHasUnsavedChanges(false);
      toast.success('Preferences saved successfully!');
    } catch (err) {
      console.error('[SettingsPage] Failed to save preferences:', err);
      const errorMsg = err?.response?.data?.error || 'Failed to save preferences';
      toast.error(errorMsg);
    }
  }

  async function changePassword() {
    if (!pw.current || !pw.next) {
      toast.error('Please enter both current and new password');
      return;
    }
    try {
      await api.post('/api/auth/change-password', { currentPassword: pw.current, newPassword: pw.next });
      setPw({ current: '', next: '' });
      toast.success('Password changed successfully!');
    } catch (err) {
      console.error('[SettingsPage] Failed to change password:', err);
      const errorMsg = err?.response?.data?.error || 'Failed to change password';
      toast.error(errorMsg);
    }
  }

  async function deleteAccount() {
    try {
      await api.delete('/api/auth/me');
      toast.success('Account deleted successfully');
      logout();
    } catch (err) {
      console.error('[SettingsPage] Failed to delete account:', err);
      const errorMsg = err?.response?.data?.error || 'Failed to delete account';
      toast.error(errorMsg);
      setConfirmOpen(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 md:space-y-8">
      {/* Unsaved Changes Warning Modal */}
      {showUnsavedWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowUnsavedWarning(false)} />
          <m.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative bg-slate-900 border border-slate-700 rounded-2xl p-6 w-[90%] max-w-md shadow-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-amber-500/20">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">Unsaved Changes</h3>
            </div>
            <p className="text-slate-300 mb-5">You have unsaved changes. Are you sure you want to leave?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowUnsavedWarning(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-white hover:bg-slate-700">
                Stay
              </button>
              <button onClick={confirmLeave} className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold hover:bg-amber-500/30 transition">
                Leave Anyway
              </button>
            </div>
          </m.div>
        </div>
      )}

      {/* Back Button */}
      <m.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={handleBack}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900/70 hover:bg-slate-800 border border-slate-800 text-slate-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
        {hasUnsavedChanges && (
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Unsaved changes" />
        )}
      </m.button>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Settings</h1>
        <XpInfo variant="modal" />
      </div>

      {/* Profile Card */}
      <section role="region" aria-label="Profile" className="bg-slate-900/70 backdrop-blur rounded-xl border border-slate-800 p-5 md:p-6 shadow hover:shadow-emerald-500/10 transition-shadow">
        <h2 className="text-lg font-semibold text-white mb-4">Profile</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-2" htmlFor="username">Username</label>
              <input id="username" aria-label="Username" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={username} onChange={e=>setUsername(e.target.value)} />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-2" htmlFor="status">Status</label>
              <select id="status" aria-label="Status" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={status} onChange={e=>setStatus(e.target.value)}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-2" htmlFor="avatar">Avatar (Emoji)</label>
              <select id="avatar" aria-label="Avatar" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={avatarChoice} onChange={e=>setAvatarChoice(e.target.value)}>
                <option value="">Select emoji</option>
                {AVATARS.map(a => <option key={a.key} value={a.key}>{a.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-2" htmlFor="avatarUrl">Avatar Image URL (optional)</label>
              <input 
                id="avatarUrl" 
                aria-label="Avatar URL" 
                placeholder="https://..." 
                className={`w-full bg-slate-800 border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 ${
                  avatarUrlError 
                    ? 'border-red-500/50 focus:ring-red-500/50' 
                    : 'border-slate-700 focus:ring-emerald-500'
                }`}
                value={avatarUrl} 
                onChange={e => handleAvatarUrlChange(e.target.value)} 
              />
              {avatarUrlError && (
                <p className="text-xs text-red-400 mt-1">{avatarUrlError}</p>
              )}
              <p className="text-xs text-slate-500 mt-1">Only HTTPS URLs from trusted image hosts are allowed</p>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div aria-label="Avatar preview" className="w-28 h-28 md:w-32 md:h-32 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-4xl md:text-5xl">
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="w-24 h-24 md:w-28 md:h-28 rounded-2xl object-cover" />
              ) : avatarChoice ? (
                <span>{avatarPreview.split(' ')[0]}</span>
              ) : (
                <span className="text-2xl md:text-3xl font-bold text-slate-300">{(username || 'U').slice(0, 1).toUpperCase()}</span>
              )}
            </div>
          </div>
        </div>
        <div className="mt-4">
          <button onClick={saveProfile} className="px-4 py-2 rounded-xl bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition shadow-md shadow-emerald-500/20">Save Profile</button>
        </div>
      </section>

      {/* Game Preferences Card */}
      <section role="region" aria-label="Game Preferences" className="bg-slate-900/70 backdrop-blur rounded-xl border border-slate-800 p-5 md:p-6 shadow hover:shadow-emerald-500/10 transition-shadow">
        <h2 className="text-lg font-semibold text-white mb-4">Game Preferences</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-2" htmlFor="caret">Caret Style</label>
            <select id="caret" aria-label="Caret Style" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={localPrefs.caretStyle} onChange={e=>setLocalPrefs({ ...localPrefs, caretStyle: e.target.value })}>
              <option value="solid">Solid</option>
              <option value="blink">Blink</option>
              <option value="highlight">Highlight</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-2" htmlFor="font">Font Style</label>
            <select id="font" aria-label="Font Style" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={localPrefs.fontStyle} onChange={e=>setLocalPrefs({ ...localPrefs, fontStyle: e.target.value })}>
              <option value="monospace">Monospace</option>
              <option value="sans">Sans</option>
              <option value="typewriter">Typewriter</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-2" htmlFor="fontSize">Font Size</label>
            <select id="fontSize" aria-label="Font Size" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={localPrefs.fontSize} onChange={e=>setLocalPrefs({ ...localPrefs, fontSize: e.target.value })}>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="xl">Extra Large</option>
            </select>
          </div>
        </div>

        {/* Sound Settings */}
        <div className="mt-6 pt-4 border-t border-slate-800">
          <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
            <Volume2 className="w-4 h-4" />
            Sound Settings
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-2" htmlFor="keyboardSound">Keyboard Sound</label>
              <select 
                id="keyboardSound" 
                aria-label="Keyboard Sound" 
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={localPrefs.keyboardSound} 
                onChange={e => {
                  const newSound = e.target.value;
                  setLocalPrefs({ ...localPrefs, keyboardSound: newSound });
                  // Play preview sound
                  if (newSound !== 'off') {
                    playKeySound(newSound, localPrefs.soundVolume);
                  }
                }}
              >
                {SOUND_OPTIONS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-2" htmlFor="soundVolume">Volume: {Math.round(localPrefs.soundVolume * 100)}%</label>
              <input 
                id="soundVolume"
                type="range" 
                min="0" 
                max="1" 
                step="0.1"
                value={localPrefs.soundVolume}
                onChange={e => {
                  const newVolume = parseFloat(e.target.value);
                  setLocalPrefs({ ...localPrefs, soundVolume: newVolume });
                  // Play debounced preview sound
                  playSoundPreview(localPrefs.keyboardSound, newVolume);
                }}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                disabled={localPrefs.keyboardSound === 'off'}
              />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <button onClick={savePreferences} className="px-4 py-2 rounded-xl bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition shadow-md shadow-emerald-500/20">Save Preferences</button>
        </div>
      </section>

      {/* Account Card */}
      <section role="region" aria-label="Account" className="bg-slate-900/70 backdrop-blur rounded-xl border border-slate-800 p-5 md:p-6 shadow hover:shadow-emerald-500/10 transition-shadow">
        <h2 className="text-lg font-semibold text-white mb-4">Account</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-2" htmlFor="currentPassword">Current Password</label>
            <input id="currentPassword" type="password" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500" value={pw.current} onChange={e=>setPw({ ...pw, current: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-2" htmlFor="newPassword">New Password</label>
            <input id="newPassword" type="password" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500" value={pw.next} onChange={e=>setPw({ ...pw, next: e.target.value })} />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button onClick={changePassword} className="px-4 py-2 rounded-xl bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition shadow-md shadow-emerald-500/20">Change Password</button>
          <button onClick={logout} className="px-4 py-2 rounded-xl bg-slate-800 text-white hover:bg-slate-700">Logout</button>
          <button onClick={()=>setConfirmOpen(true)} className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold hover:bg-emerald-500/30 hover:border-emerald-500/50 transition">Delete Account</button>
        </div>

        {/* Confirm Modal */}
        {confirmOpen && (
          <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={()=>setConfirmOpen(false)} />
            <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-6 w-[90%] max-w-md shadow-xl">
              <h3 className="text-xl font-semibold text-white">Delete account?</h3>
              <p className="text-slate-300 mt-2">This action is permanent. All your data will be removed.</p>
              <div className="mt-5 flex justify-end gap-3">
                <button onClick={()=>setConfirmOpen(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-white hover:bg-slate-700">Cancel</button>
                <button onClick={deleteAccount} className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold hover:bg-emerald-500/30 hover:border-emerald-500/50 transition">Confirm Delete</button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
