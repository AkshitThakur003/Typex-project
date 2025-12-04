import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePreferences } from '../settings/PreferencesContext.jsx';
import { api } from '../lib/api';
import { toast } from 'react-hot-toast';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUserState, refreshUser } = usePreferences();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const username = searchParams.get('username');
    const error = searchParams.get('error');

    if (error) {
      toast.error('OAuth authentication failed. Please try again.');
      navigate('/login', { replace: true });
      return;
    }

    // Tokens are now in httpOnly cookies, so we just need to verify auth and get user info
    // Fetch user profile to verify authentication worked
    api.get('/api/auth/me')
      .then(({ data }) => {
        // Store username for display
        if (data.username) localStorage.setItem('username', data.username);
        
        // Update user state
        setUserState({ id: data._id, username: data.username, email: data.email });
        
        // Fetch full user profile
        refreshUser();
        
        toast.success(`Welcome, ${data.username}!`);
        navigate('/multiplayer', { replace: true });
      })
      .catch((err) => {
        console.error('[OAuth Callback] Failed to fetch user:', err);
        toast.error('Authentication failed. Please try again.');
        navigate('/login', { replace: true });
      });
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

