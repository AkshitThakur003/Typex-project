import { useEffect, useState } from 'react';
import { api, setAuth } from '../lib/api';
import { toast } from 'react-hot-toast';
import { motion as m } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { usePreferences } from '../settings/PreferencesContext.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { setUserState, refreshUser } = usePreferences();
  

  async function onSubmit(e) {
    e.preventDefault();
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      setAuth(data.token);
      localStorage.setItem('token', data.token);
      if (data?.user?.username) localStorage.setItem('username', data.user.username);
      toast.success(`Logged in as ${data.user.username}`);
  // Update user immediately for header sync
  setUserState({ id: data.user.id, username: data.user.username, email: data.user.email });
  // Fetch full profile and prefs in background
  refreshUser();
  // Navigate to Multiplayer by default
  navigate('/multiplayer', { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Login failed');
    }
  }

  return (
    <div className="relative min-h-[70vh] flex items-center justify-center p-4">
      <m.form onSubmit={onSubmit} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-6 sm:p-7 space-y-3 shadow-2xl w-full max-w-md">
        <h1 className="text-xl font-semibold">Login</h1>
        <div>
          <label className="text-xs text-slate-400">Email</label>
          <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2" />
        </div>
        <div>
          <label className="text-xs text-slate-400">Password</label>
          <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2" />
        </div>
        <div className="flex items-center justify-between gap-3">
          <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500">Login</button>
          <a href="/register" className="text-sm text-slate-300 hover:text-white">Create account</a>
        </div>
      </m.form>
    </div>
  );
}
