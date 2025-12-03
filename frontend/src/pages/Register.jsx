import { useMemo, useState } from 'react';
import { api, setAuth, API_BASE } from '../lib/api';
import { toast } from 'react-hot-toast';
import { motion as m } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePreferences } from '../settings/PreferencesContext.jsx';
import { validatePassword, validateUsername, validateEmail } from '../utils/passwordValidator.js';
import { Check, X } from 'lucide-react';

// Password strength calculator
function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: '' };
  
  let score = 0;
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  
  score = Object.values(checks).filter(Boolean).length;
  
  if (score <= 1) return { score, label: 'Very Weak', color: 'bg-red-500', checks };
  if (score === 2) return { score, label: 'Weak', color: 'bg-orange-500', checks };
  if (score === 3) return { score, label: 'Fair', color: 'bg-yellow-500', checks };
  if (score === 4) return { score, label: 'Good', color: 'bg-lime-500', checks };
  return { score, label: 'Strong', color: 'bg-emerald-500', checks };
}

export default function Register() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const location = useLocation();
  const { setUserState, refreshUser } = usePreferences();
  const redirectTo = useMemo(() => new URLSearchParams(location.search).get('redirect') || '', [location.search]);

  function validateForm() {
    const newErrors = {};
    
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      newErrors.email = emailValidation.error;
    }

    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      newErrors.username = usernameValidation.error;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      newErrors.password = passwordValidation.error;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function onSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

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
      const errorMessage = err?.response?.data?.error || 'Register failed';
      toast.error(errorMessage);
      // Set field-specific errors if provided
      if (err?.response?.data?.field) {
        setErrors({ [err.response.data.field]: errorMessage });
      }
    }
  }

  const apiBase = API_BASE;

  return (
    <div className="relative min-h-screen flex items-center justify-center py-12 px-4">
      {redirectTo && <div className="fixed inset-0 bg-black/60 backdrop-blur-md" aria-hidden="true" />}
      <m.form onSubmit={onSubmit} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 sm:p-10 space-y-6 shadow-2xl shadow-black/20 w-full max-w-md my-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-slate-100">Create account</h1>
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
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Username</label>
            <input 
              value={username} 
              onChange={(e) => {
                setUsername(e.target.value);
                if (errors.username) setErrors({ ...errors, username: null });
              }}
              className={`w-full bg-slate-800/50 border rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all duration-200 ${
                errors.username 
                  ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50' 
                  : 'border-slate-600/50 focus:ring-emerald-500/50 focus:border-emerald-500/50'
              }`}
              placeholder="3-20 characters, letters, numbers, underscores"
            />
            {errors.username && <p className="text-xs text-red-400 mt-1.5">{errors.username}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: null });
              }}
              className={`w-full bg-slate-800/50 border rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all duration-200 ${
                errors.email 
                  ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50' 
                  : 'border-slate-600/50 focus:ring-emerald-500/50 focus:border-emerald-500/50'
              }`}
              placeholder="you@example.com"
            />
            {errors.email && <p className="text-xs text-red-400 mt-1.5">{errors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: null });
              }}
              className={`w-full bg-slate-800/50 border rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all duration-200 ${
                errors.password 
                  ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50' 
                  : 'border-slate-600/50 focus:ring-emerald-500/50 focus:border-emerald-500/50'
              }`}
              placeholder="Min 8 chars: uppercase, lowercase, number, special char"
            />
            {errors.password && <p className="text-xs text-red-400 mt-1.5">{errors.password}</p>}
            
            {/* Password Strength Indicator */}
            {password && (
              <m.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 space-y-2"
              >
                {/* Strength Bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <m.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(getPasswordStrength(password).score / 5) * 100}%` }}
                      className={`h-full ${getPasswordStrength(password).color} transition-all duration-300`}
                    />
                  </div>
                  <span className={`text-xs font-medium ${
                    getPasswordStrength(password).score <= 2 ? 'text-red-400' :
                    getPasswordStrength(password).score === 3 ? 'text-yellow-400' :
                    'text-emerald-400'
                  }`}>
                    {getPasswordStrength(password).label}
                  </span>
                </div>
                
                {/* Requirements Checklist */}
                <div className="grid grid-cols-2 gap-1 text-xs">
                  {[
                    { key: 'length', label: '8+ characters' },
                    { key: 'uppercase', label: 'Uppercase letter' },
                    { key: 'lowercase', label: 'Lowercase letter' },
                    { key: 'number', label: 'Number' },
                    { key: 'special', label: 'Special character' },
                  ].map(({ key, label }) => {
                    const met = getPasswordStrength(password).checks?.[key];
                    return (
                      <div key={key} className={`flex items-center gap-1 ${met ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {met ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        <span>{label}</span>
                      </div>
                    );
                  })}
                </div>
              </m.div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 pt-2">
          <button 
            type="submit" 
            className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-medium shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            Register
          </button>
          <a 
            href={`/login${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`} 
            className="text-sm text-slate-300 hover:text-emerald-400 transition-colors"
          >
            Have an account? Login
          </a>
        </div>
      </m.form>
    </div>
  );
}
