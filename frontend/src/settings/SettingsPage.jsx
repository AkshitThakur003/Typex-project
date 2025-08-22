import { useMemo, useState } from 'react';
import { api } from '../lib/api';
import { usePreferences } from './PreferencesContext.jsx';

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
  const { user, preferences, setPreferences, refreshUser, logout } = usePreferences();
  const [username, setUsername] = useState(user?.username || '');
  const [avatarChoice, setAvatarChoice] = useState(user?.avatarChoice || preferences.avatarChoice || 'emoji-rocket');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || preferences.avatarUrl || '');
  const [status, setStatus] = useState(user?.status || preferences.status || 'Available');
  const [localPrefs, setLocalPrefs] = useState({
    caretStyle: preferences.caretStyle || 'solid',
    fontStyle: preferences.fontStyle || 'monospace',
  });
  const [pw, setPw] = useState({ current: '', next: '' });
  const [twoFA, setTwoFA] = useState(!!user?.twoFA);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const avatarPreview = useMemo(() => AVATARS.find(a => a.key === avatarChoice)?.label || '🙂', [avatarChoice]);

  async function saveProfile() {
  await api.patch('/api/auth/profile', { username, avatarChoice, status, avatarUrl });
    if (username) localStorage.setItem('username', username);
    // Also persist avatar/status into preferences for app-wide use
  const merged = { ...preferences, avatarChoice, status, avatarUrl };
    await api.patch('/api/auth/preferences', merged);
    setPreferences(merged);
    await refreshUser();
  }

  async function savePreferences() {
    const merged = { ...preferences, ...localPrefs };
    await api.patch('/api/auth/preferences', merged);
    setPreferences(merged);
  }

  async function changePassword() {
    await api.post('/api/auth/change-password', { currentPassword: pw.current, newPassword: pw.next });
    setPw({ current: '', next: '' });
  }

  async function deleteAccount() {
    await api.delete('/api/auth/me');
    logout();
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 md:space-y-8">
      <h1 className="text-2xl md:text-3xl font-bold text-white">Settings</h1>

      {/* Profile Card */}
      <section role="region" aria-label="Profile" className="bg-slate-900/70 backdrop-blur rounded-xl border border-slate-800 p-5 md:p-6 shadow hover:shadow-emerald-500/10 transition-shadow">
        <h2 className="text-lg font-semibold text-white mb-4">Profile</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-3">
            <label className="block text-xs text-slate-400" htmlFor="username">Username</label>
            <input id="username" aria-label="Username" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={username} onChange={e=>setUsername(e.target.value)} />

            <label className="block text-xs text-slate-400 mt-3" htmlFor="status">Status</label>
            <select id="status" aria-label="Status" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={status} onChange={e=>setStatus(e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <label className="block text-xs text-slate-400 mt-3" htmlFor="avatar">Avatar (Emoji)</label>
            <select id="avatar" aria-label="Avatar" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={avatarChoice} onChange={e=>setAvatarChoice(e.target.value)}>
              {AVATARS.map(a => <option key={a.key} value={a.key}>{a.label}</option>)}
            </select>
            <label className="block text-xs text-slate-400 mt-3" htmlFor="avatarUrl">Avatar Image URL (optional)</label>
            <input id="avatarUrl" aria-label="Avatar URL" placeholder="https://..." className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={avatarUrl} onChange={e=>setAvatarUrl(e.target.value)} />
          </div>
          <div className="flex items-center justify-center">
            <div aria-label="Avatar preview" className="w-28 h-28 md:w-32 md:h-32 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-4xl md:text-5xl">
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="w-24 h-24 md:w-28 md:h-28 rounded-2xl object-cover" />
              ) : (
                <span>{avatarPreview.split(' ')[0]}</span>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400" htmlFor="caret">Caret Style</label>
            <select id="caret" aria-label="Caret Style" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={localPrefs.caretStyle} onChange={e=>setLocalPrefs({ ...localPrefs, caretStyle: e.target.value })}>
              <option value="solid">Solid</option>
              <option value="blink">Blink</option>
              <option value="highlight">Highlight</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400" htmlFor="font">Font Style</label>
            <select id="font" aria-label="Font Style" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={localPrefs.fontStyle} onChange={e=>setLocalPrefs({ ...localPrefs, fontStyle: e.target.value })}>
              <option value="monospace">Monospace</option>
              <option value="sans">Sans</option>
              <option value="typewriter">Typewriter</option>
            </select>
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
            <label className="block text-xs text-slate-400" htmlFor="currentPassword">Current Password</label>
            <input id="currentPassword" type="password" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2" value={pw.current} onChange={e=>setPw({ ...pw, current: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-slate-400" htmlFor="newPassword">New Password</label>
            <input id="newPassword" type="password" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2" value={pw.next} onChange={e=>setPw({ ...pw, next: e.target.value })} />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button onClick={async()=>{ await api.post('/api/auth/change-password', { currentPassword: pw.current, newPassword: pw.next }); setPw({current:'', next:''}); }} className="px-4 py-2 rounded-xl bg-slate-700 text-white hover:bg-slate-600">Change Password</button>
          <label className="inline-flex items-center gap-2 text-slate-300">
            <input aria-label="Enable two-factor authentication" type="checkbox" className="accent-emerald-500" checked={twoFA} onChange={e=>setTwoFA(e.target.checked)} />
            Enable 2FA (coming soon)
          </label>
          <button onClick={logout} className="px-4 py-2 rounded-xl bg-slate-800 text-white hover:bg-slate-700">Logout</button>
          <button onClick={()=>setConfirmOpen(true)} className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 text-white hover:from-rose-500 hover:to-rose-400">Delete Account</button>
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
                <button onClick={deleteAccount} className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 text-white hover:from-rose-500 hover:to-rose-400">Confirm Delete</button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
