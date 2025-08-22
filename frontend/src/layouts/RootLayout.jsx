import { Outlet, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { Toaster } from 'react-hot-toast';
import { usePreferences } from '../settings/PreferencesContext.jsx';

export default function RootLayout() {
  const { preferences } = usePreferences();

  const themeClass = preferences.theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100';
  const fontClass = preferences.fontStyle === 'sans' ? 'font-sans' : preferences.fontStyle === 'typewriter' ? 'font-["Special_Elite",monospace]' : 'font-mono';

  return (
    <div className={`min-h-screen ${themeClass} ${fontClass}`}>
      <Toaster position="top-right" />
  <Header />
      <Outlet />
    </div>
  );
}
