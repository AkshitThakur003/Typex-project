import { useState, useEffect } from 'react';
import { AnimatePresence, motion as m } from 'framer-motion';
import { api, setAuth, API_BASE } from '../../lib/api';
import { usePreferences } from '../../settings/PreferencesContext.jsx';
import { toast } from 'react-hot-toast';
import { validatePassword, validateUsername, validateEmail } from '../../utils/passwordValidator.js';
import AuthField from './AuthField';
import { Divider } from '../common';

export default function LoginOverlay({ onSuccess, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode === 'register' ? 'register' : 'login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { setUserState, refreshUser } = usePreferences();

  // ESC key handler to close modal
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onSuccess?.();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onSuccess]);

  function validateForm() {
    const newErrors = {};
    
    if (mode === 'register') {
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
    } else {
      if (!email) {
        newErrors.email = 'Email is required';
      }
      if (!password) {
        newErrors.password = 'Password is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleLogin(e) {
    e.preventDefault();
    if (loading) return;
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      afterAuth(data, `Welcome ${data.user.username}`);
    } catch (err) {
      const errorMessage = err?.response?.data?.error || 'Login failed';
      toast.error(errorMessage);
      if (err?.response?.data?.field) {
        setErrors({ [err.response.data.field]: errorMessage });
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (loading) return;
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/signup', { email, username, password });
      afterAuth(data, `Registered as ${data.user.username}`);
    } catch (err) {
      const errorMessage = err?.response?.data?.error || 'Register failed';
      toast.error(errorMessage);
      if (err?.response?.data?.field) {
        setErrors({ [err.response.data.field]: errorMessage });
      }
    } finally {
      setLoading(false);
    }
  }

  function afterAuth(data, toastMsg) {
    // Tokens are now in httpOnly cookies, no need to store in localStorage
    if (data?.user?.username) localStorage.setItem('username', data.user.username);
    setUserState({ id: data.user.id, username: data.user.username, email: data.user.email });
    refreshUser();
    toast.success(toastMsg);
    onSuccess?.();
  }

  function switchMode(newMode) {
    setMode(newMode);
    setErrors({});
    setEmail('');
    setPassword('');
    setUsername('');
  }

  // OAuth Section - Reusable Component
  function OAuthSection() {
    const apiBase = API_BASE;
    return (
      <>
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
        <Divider />
      </>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4 pt-20 sm:pt-24"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onSuccess?.();
        }
      }}
    >
      <m.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="w-full max-w-md max-h-[calc(90vh-5rem)] overflow-y-auto scrollbar-hide"
      >
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-6 sm:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-100">
                {mode === 'login' ? 'Welcome back' : 'Create account'}
              </h2>
              <button
                type="button"
                onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                className="text-xs px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 hover:bg-white/15 transition-colors"
              >
                {mode === 'login' ? 'Register' : 'Login'}
              </button>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {mode === 'login' ? (
                <m.div
                  key="login"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  <OAuthSection />
                  
                  <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-4">
                      <AuthField
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        error={errors.email}
                        onClearError={() => setErrors({ ...errors, email: null })}
                      />
                      <AuthField
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        error={errors.password}
                        onClearError={() => setErrors({ ...errors, password: null })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 text-black font-medium shadow-lg shadow-emerald-400/20 hover:shadow-emerald-400/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <m.span
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              className="inline-block w-4 h-4 border-2 border-black/30 border-t-black rounded-full"
                            />
                            Logging in…
                          </span>
                        ) : (
                          'Login'
                        )}
                      </button>
                      <div className="flex flex-col items-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => switchMode('register')}
                          className="text-sm text-slate-200 hover:text-emerald-400 transition-colors"
                        >
                          Create account
                        </button>
                        <a 
                          href="/forgot-password" 
                          className="text-xs text-slate-400 hover:text-slate-300 transition-colors"
                        >
                          Forgot Password?
                        </a>
                      </div>
                    </div>
                  </form>
                </m.div>
              ) : (
                <m.div
                  key="register"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  <OAuthSection />
                  
                  <form onSubmit={handleRegister} className="space-y-5">
                    <div className="space-y-4">
                      <AuthField
                        label="Username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="3-20 chars, letters, numbers, underscores"
                        error={errors.username}
                        onClearError={() => setErrors({ ...errors, username: null })}
                      />
                      <AuthField
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        error={errors.email}
                        onClearError={() => setErrors({ ...errors, email: null })}
                      />
                      <AuthField
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min 8 chars: uppercase, lowercase, number, special"
                        error={errors.password}
                        onClearError={() => setErrors({ ...errors, password: null })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 text-black font-medium shadow-lg shadow-emerald-400/20 hover:shadow-emerald-400/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <m.span
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              className="inline-block w-4 h-4 border-2 border-black/30 border-t-black rounded-full"
                            />
                            Registering…
                          </span>
                        ) : (
                          'Register'
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => switchMode('login')}
                        className="text-sm text-slate-200 hover:text-emerald-400 transition-colors"
                      >
                        Have an account? Login
                      </button>
                    </div>
                  </form>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </m.div>
    </div>
  );
}
