import { useMemo, useState } from 'react';
import { api, setAuth } from '../lib/api';
import { toast } from 'react-hot-toast';
import { motion as m } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePreferences } from '../settings/PreferencesContext.jsx';

export default function Register() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { setUserState, refreshUser } = usePreferences();
  const redirectTo = useMemo(() => new URLSearchParams(location.search).get('redirect') || '', [location.search]);

  async function onSubmit(e) {
    e.preventDefault();
    try {
      const { data } = await api.post('/api/auth/signup', { email, username, password });
      setAuth(data.token);
      localStorage.setItem('token', data.token);
      if (data?.user?.username) localStorage.setItem('username', data.user.username);
      toast.success(`Registered as ${data.user.username}`);
      // Update user immediately and fetch profile
      setUserState({ id: data.user.id, username: data.user.username, email: data.user.email });
      refreshUser();
      // Navigate to intended destination
      navigate(redirectTo || '/multiplayer', { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Register failed');
    }
  }

  return (
    <div className="relative min-h-[70vh] flex items-center justify-center p-4">
      {redirectTo && <div className="fixed inset-0 bg-black/60 backdrop-blur-md" aria-hidden="true" />}
      <m.form onSubmit={onSubmit} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-6 sm:p-7 space-y-3 shadow-2xl w-full max-w-md">
        <h1 className="text-xl font-semibold">Create account</h1>
        <div>
          <label className="text-xs text-slate-400">Username</label>
          <input value={username} onChange={(e)=>setUsername(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2" />
        </div>
        <div>
          <label className="text-xs text-slate-400">Email</label>
          <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2" />
        </div>
        <div>
          <label className="text-xs text-slate-400">Password</label>
          <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2" />
        </div>
        <div className="flex items-center justify-between gap-3">
          <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500">Register</button>
          <a href={`/login${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`} className="text-sm text-slate-300 hover:text-white">Have an account? Login</a>
        </div>
      </m.form>
    </div>
  );
}
