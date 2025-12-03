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
    const token = localStorage.getItem('token');
    if (token) {
      setAuth(token);
      refreshUser();
    }
  }, []);

  // -- end init

  async function refreshUser() {
    try {
      const { data } = await api.get('/api/auth/me');
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
      console.error('[PreferencesContext] Failed to refresh user:', err?.message || err);
    }
  }

  function logout() {
    setAuth(null);
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setUser(null);
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
