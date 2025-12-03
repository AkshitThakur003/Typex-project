import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePreferences } from '../settings/PreferencesContext.jsx';
import { setAuth } from '../lib/api';
import { toast } from 'react-hot-toast';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUserState, refreshUser } = usePreferences();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const token = searchParams.get('token');
    const username = searchParams.get('username');
    const error = searchParams.get('error');

    if (error) {
      toast.error('OAuth authentication failed. Please try again.');
      navigate('/login', { replace: true });
      return;
    }

    if (token && username) {
      // Store token and username
      setAuth(token);
      localStorage.setItem('token', token);
      localStorage.setItem('username', username);
      
      // Update user state
      setUserState({ username, token });
      
      // Fetch full user profile
      refreshUser();
      
      toast.success(`Welcome, ${username}!`);
      navigate('/multiplayer', { replace: true });
    } else {
      toast.error('Authentication failed. Missing token.');
      navigate('/login', { replace: true });
    }
  }, [searchParams, navigate, setUserState, refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
        <p className="mt-4 text-slate-300">Completing authentication...</p>
      </div>
    </div>
  );
}

