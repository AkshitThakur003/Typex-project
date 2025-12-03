import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { toast } from 'react-hot-toast';
import { motion as m } from 'framer-motion';
import { validateEmail } from '../utils/passwordValidator.js';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);

  function validateForm() {
    const newErrors = {};
    
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      newErrors.email = emailValidation.error;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function onSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/request-reset', { email });
      
      if (data.success && data.token) {
        // In production, token would be sent via email
        // For now, we'll show it and allow user to copy
        setToken(data.token);
        toast.success('Reset token generated! Copy the token below.');
      } else {
        // User doesn't exist, but we don't reveal that (security)
        toast.success('If an account exists with that email, a reset link would be sent.');
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.error || 'Failed to request password reset';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  function handleCopyToken() {
    if (token) {
      navigator.clipboard.writeText(`${window.location.origin}/reset-password?token=${token}`);
      toast.success('Reset link copied to clipboard!');
    }
  }

  return (
    <div className="relative min-h-[70vh] flex items-center justify-center p-4">
      <m.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="relative z-10 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-6 sm:p-7 space-y-3 shadow-2xl w-full max-w-md"
      >
        <h1 className="text-xl font-semibold">Forgot Password?</h1>
        <p className="text-sm text-slate-400">Enter your email to receive a password reset link</p>
        
        {!token ? (
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="text-xs text-slate-400">Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: null });
                }}
                className={`w-full bg-slate-800 border rounded px-3 py-2 ${
                  errors.email ? 'border-red-500' : 'border-slate-700'
                }`}
                placeholder="you@example.com"
              />
              {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
            </div>

            <div className="flex items-center justify-between gap-3">
              <button 
                type="submit" 
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <a href="/login" className="text-sm text-slate-300 hover:text-white">Back to Login</a>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            <div className="bg-slate-800 border border-slate-700 rounded p-3">
              <p className="text-xs text-slate-400 mb-2">Reset token generated (valid for 15 minutes):</p>
              <p className="text-xs font-mono text-emerald-400 break-all mb-3">{token}</p>
              <p className="text-xs text-slate-400 mb-3">
                Since email is not configured, copy this link:
              </p>
              <div className="bg-slate-900 rounded p-2 mb-3">
                <p className="text-xs font-mono text-slate-300 break-all">
                  {window.location.origin}/reset-password?token={token}
                </p>
              </div>
              <button
                onClick={handleCopyToken}
                className="w-full px-3 py-2 text-sm rounded bg-emerald-600 hover:bg-emerald-500"
              >
                Copy Reset Link
              </button>
            </div>
            <button
              onClick={() => navigate(`/reset-password?token=${token}`)}
              className="w-full px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500"
            >
              Go to Reset Password Page
            </button>
            <a href="/login" className="block text-center text-sm text-slate-300 hover:text-white">Back to Login</a>
          </div>
        )}
      </m.div>
    </div>
  );
}

