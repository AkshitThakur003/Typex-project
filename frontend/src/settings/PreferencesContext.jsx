import { createContext, useContext, useEffect, useState } from 'react';
import { api, setAuth } from '../lib/api';

// New, simplified preferences schema
const AVATAR_MAP = {
  'emoji-rocket': '🚀',
  'emoji-lightning': '⚡',
  'emoji-keyboard': '⌨️',
  'emoji-fire': '🔥',
  'emoji-star': '⭐',
  'emoji-wave': '🌊',
  'emoji-sparkles': '✨',
  'emoji-owl': '🦉',
};

export const defaultPrefs = {
  caretStyle: 'solid', // 'solid' | 'blink' | 'highlight'
  fontStyle: 'monospace', // 'monospace' | 'sans' | 'typewriter'
  fontSize: 'medium', // 'small' | 'medium' | 'large' | 'xl'
  theme: 'dark',
  // Sound preferences
  keyboardSound: 'off', // 'off' | 'mechanical' | 'membrane' | 'typewriter' | 'soft' | 'clicky'
  soundVolume: 0.5, // 0 to 1
  // Profile-related preferences propagated app-wide
  avatarChoice: 'emoji-rocket',
  avatarEmoji: AVATAR_MAP['emoji-rocket'] || '🙂',
  avatarUrl: '',
  status: 'Available',
};

const PreferencesContext = createContext({
  user: null,
  isAuthenticated: false,
  preferences: defaultPrefs,
  setPreferences: () => {},
  refreshUser: async () => {},
  logout: () => {},
  setUserState: () => {},
});

export function PreferencesProvider({ children }) {
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState(defaultPrefs);

  useEffect(() => {
    // With cookie-based auth, we can't check for tokens in localStorage
    // Just try to refresh user - if cookies exist, it will work
    refreshUser();
  }, []);

  // -- end init

  async function refreshUser() {
    try {
      // Use validateStatus to prevent 401 from being treated as an error
      // This prevents axios from logging it to console
      const response = await api.get('/api/auth/me', {
        validateStatus: (status) => {
          // Treat 401 as a valid response (user not logged in is expected)
          // This prevents axios from logging it as an error
          return status === 200 || status === 401;
        }
      });
      
      // If 401, user is not authenticated - this is expected
      if (response.status === 401) {
        setUser(null);
        return;
      }
      
      // User is authenticated
      const data = response.data;
      setUser(data);
      // Merge server prefs over defaults; tolerate older schema
      if (data?.preferences) {
        const serverPrefs = data.preferences || {};
        const merged = {
          ...defaultPrefs,
          ...serverPrefs,
          // Backfill avatar/status from top-level profile if provided
          avatarChoice: serverPrefs.avatarChoice !== undefined ? serverPrefs.avatarChoice : (data.avatarChoice !== undefined ? data.avatarChoice : defaultPrefs.avatarChoice),
          avatarUrl: serverPrefs.avatarUrl !== undefined ? serverPrefs.avatarUrl : (data.avatarUrl !== undefined ? data.avatarUrl : defaultPrefs.avatarUrl),
          status: serverPrefs.status || data.status || defaultPrefs.status,
        };
        // Derive display emoji from choice if URL not provided and choice exists
        merged.avatarEmoji = merged.avatarChoice ? (AVATAR_MAP[merged.avatarChoice] || defaultPrefs.avatarEmoji) : defaultPrefs.avatarEmoji;
        setPreferences(merged);
      }
    } catch (err) {
      // Only log unexpected errors (not 401s, which are handled above)
      if (err?.response?.status !== 401) {
        console.error('[PreferencesContext] Failed to refresh user:', err?.message || err);
      }
      setUser(null);
    }
  }

  async function logout() {
    try {
      // Call logout endpoint to clear cookies on server
      await api.post('/api/auth/logout');
    } catch (err) {
      // Even if logout fails, clear local state
      console.error('[Logout] Error:', err);
    } finally {
      // Clear local state
      setAuth(null);
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      setUser(null);
    }
  }

  return (
  <PreferencesContext.Provider value={{ user, isAuthenticated: !!user, preferences, setPreferences, refreshUser, logout, setUserState: setUser }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export const usePreferences = () => useContext(PreferencesContext);

// Optional helper for external components to derive a fallback emoji
export function useAvatarDefaults() {
  const { preferences } = usePreferences();
  return {
    defaultEmoji: preferences?.avatarEmoji || defaultPrefs.avatarEmoji,
  };
}
