import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { toast } from 'react-hot-toast';
import { motion as m } from 'framer-motion';
import { validatePassword } from '../utils/passwordValidator.js';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error('Invalid reset link. Please request a new password reset.');
      navigate('/login');
    }
  }, [token, navigate]);

  function validateForm() {
    const newErrors = {};
    
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      newErrors.newPassword = passwordValidation.error;
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function onSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!token) {
      toast.error('Invalid reset token');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/auth/reset-password', { token, newPassword });
      toast.success('Password reset successfully! You can now login with your new password.');
      navigate('/login', { replace: true });
    } catch (err) {
      const errorMessage = err?.response?.data?.error || 'Failed to reset password';
      toast.error(errorMessage);
      if (errorMessage.includes('expired') || errorMessage.includes('Invalid')) {
        // Redirect to login if token is invalid/expired
        setTimeout(() => navigate('/login'), 2000);
      }
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="relative min-h-[70vh] flex items-center justify-center p-4">
      <m.form 
        onSubmit={onSubmit} 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="relative z-10 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-6 sm:p-7 space-y-3 shadow-2xl w-full max-w-md"
      >
        <h1 className="text-xl font-semibold">Reset Password</h1>
        <p className="text-sm text-slate-400">Enter your new password below</p>
        
        <div>
          <label className="text-xs text-slate-400">New Password</label>
          <input 
            type="password" 
            value={newPassword} 
            onChange={(e) => {
              setNewPassword(e.target.value);
              if (errors.newPassword) setErrors({ ...errors, newPassword: null });
            }}
            className={`w-full bg-slate-800 border rounded px-3 py-2 ${
              errors.newPassword ? 'border-red-500' : 'border-slate-700'
            }`}
            placeholder="Min 8 chars: uppercase, lowercase, number, special char"
          />
          {errors.newPassword && <p className="text-xs text-red-400 mt-1">{errors.newPassword}</p>}
        </div>

        <div>
          <label className="text-xs text-slate-400">Confirm Password</label>
          <input 
            type="password" 
            value={confirmPassword} 
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: null });
            }}
            className={`w-full bg-slate-800 border rounded px-3 py-2 ${
              errors.confirmPassword ? 'border-red-500' : 'border-slate-700'
            }`}
            placeholder="Re-enter your new password"
          />
          {errors.confirmPassword && <p className="text-xs text-red-400 mt-1">{errors.confirmPassword}</p>}
        </div>

        <div className="flex items-center justify-between gap-3">
          <button 
            type="submit" 
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
          <a href="/login" className="text-sm text-slate-300 hover:text-white">Back to Login</a>
        </div>
      </m.form>
    </div>
  );
}

