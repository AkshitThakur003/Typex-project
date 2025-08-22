import { useState } from 'react';
import { AnimatePresence, motion as m } from 'framer-motion';
import { api, setAuth } from '../lib/api';
import { usePreferences } from '../settings/PreferencesContext.jsx';
import { toast } from 'react-hot-toast';

export default function LoginOverlay({ onSuccess, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode === 'register' ? 'register' : 'login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUserState, refreshUser } = usePreferences();

  async function handleLogin(e) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      afterAuth(data, `Welcome ${data.user.username}`);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/signup', { email, username, password });
      afterAuth(data, `Registered as ${data.user.username}`);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Register failed');
    } finally {
      setLoading(false);
    }
  }

  function afterAuth(data, toastMsg) {
    setAuth(data.token);
    localStorage.setItem('token', data.token);
    if (data?.user?.username) localStorage.setItem('username', data.user.username);
    setUserState({ id: data.user.id, username: data.user.username, email: data.user.email });
    refreshUser();
    toast.success(toastMsg);
    onSuccess?.();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <m.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.18 }} className="w-full max-w-md">
        <div className="bg-white/10 border border-white/20 text-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{mode === 'login' ? 'Login' : 'Create account'}</h2>
              <button
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="text-xs px-2 py-1 rounded bg-white/10 border border-white/20 hover:bg-white/15"
              >
                {mode === 'login' ? 'Register' : 'Login'}
              </button>
            </div>
            <AnimatePresence mode="wait" initial={false}>
              {mode === 'login' ? (
                <m.form
                  key="login"
                  onSubmit={handleLogin}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-3"
                >
                  <div>
                    <label className="block text-xs text-slate-200/80">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full mt-1 bg-white/10 border border-white/20 rounded px-3 py-2 text-white placeholder-slate-200/60"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-200/80">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full mt-1 bg-white/10 border border-white/20 rounded px-3 py-2 text-white"
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 rounded bg-emerald-400 text-black font-semibold hover:bg-emerald-300 disabled:opacity-60"
                    >
                      {loading ? 'Logging in…' : 'Login'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('register')}
                      className="text-sm text-slate-200 hover:text-white"
                    >
                      Create account
                    </button>
                  </div>
                </m.form>
              ) : (
                <m.form
                  key="register"
                  onSubmit={handleRegister}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-3"
                >
                  <div>
                    <label className="block text-xs text-slate-200/80">Username</label>
                    <input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full mt-1 bg-white/10 border border-white/20 rounded px-3 py-2 text-white"
                      placeholder="yourname"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-200/80">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full mt-1 bg-white/10 border border-white/20 rounded px-3 py-2 text-white"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-200/80">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full mt-1 bg-white/10 border border-white/20 rounded px-3 py-2 text-white"
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 rounded bg-emerald-400 text-black font-semibold hover:bg-emerald-300 disabled:opacity-60"
                    >
                      {loading ? 'Registering…' : 'Register'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="text-sm text-slate-200 hover:text-white"
                    >
                      Have an account? Login
                    </button>
                  </div>
                </m.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </m.div>
    </div>
  );
}
