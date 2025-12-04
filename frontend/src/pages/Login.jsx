import { useEffect, useState } from 'react';
import { api, setAuth, API_BASE } from '../lib/api';
import { toast } from 'react-hot-toast';
import { motion as m } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { usePreferences } from '../settings/PreferencesContext.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => {
    // Check if user previously selected "Remember me"
    return localStorage.getItem('typex_remember_me') === 'true';
  });
  const navigate = useNavigate();
  const { setUserState, refreshUser } = usePreferences();
  
  // Load saved email if "Remember me" was checked
  useEffect(() => {
    if (rememberMe) {
      const savedEmail = localStorage.getItem('typex_saved_email');
      if (savedEmail) setEmail(savedEmail);
    }
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      // Tokens are now in httpOnly cookies, no need to store in localStorage
      // Only store username for display purposes
      if (data?.user?.username) localStorage.setItem('username', data.user.username);
      
      // Handle "Remember me" preference (for email only)
      if (rememberMe) {
        localStorage.setItem('typex_remember_me', 'true');
        localStorage.setItem('typex_saved_email', email);
      } else {
        localStorage.removeItem('typex_remember_me');
        localStorage.removeItem('typex_saved_email');
      }
      
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

  const apiBase = API_BASE;

  return (
    <div className="relative min-h-screen flex items-center justify-center py-12 px-4">
      <m.form onSubmit={onSubmit} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 sm:p-10 space-y-6 shadow-2xl shadow-black/20 w-full max-w-md my-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-slate-100">Welcome back</h1>
        </div>
        
        {/* OAuth Buttons */}
        <div className="pb-4">
          <a
            href={`${apiBase}/api/auth/google`}
            className="group flex items-center justify-center gap-3 w-full px-5 py-3.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 border border-slate-600/50 hover:border-slate-500/70 transition-all duration-200 backdrop-blur-sm shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="font-medium text-slate-100">Continue with Google</span>
          </a>
        </div>

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-500/30"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-slate-900/80 backdrop-blur-sm px-4 py-1 text-xs font-medium text-slate-300 rounded-full border border-slate-500/30">or continue with email</span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e)=>setEmail(e.target.value)} 
              className="w-full bg-slate-800/50 border border-slate-600/50 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200" 
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e)=>setPassword(e.target.value)} 
              className="w-full bg-slate-800/50 border border-slate-600/50 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200" 
              placeholder="Enter your password"
            />
          </div>
          
          {/* Remember Me Checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500/50 focus:ring-offset-0 cursor-pointer"
            />
            <label htmlFor="rememberMe" className="text-sm text-slate-400 cursor-pointer select-none">
              Remember me
            </label>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 pt-2">
          <button 
            type="submit" 
            className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-medium shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            Login
          </button>
          <div className="flex flex-col items-end gap-1.5">
            <a href="/register" className="text-sm text-slate-300 hover:text-emerald-400 transition-colors">Create account</a>
            <a href="/forgot-password" className="text-xs text-slate-400 hover:text-slate-300 transition-colors">Forgot Password?</a>
          </div>
        </div>
      </m.form>
    </div>
  );
}
