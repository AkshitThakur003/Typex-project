import { Routes, Route, Navigate } from 'react-router-dom';
import { usePreferences } from './settings/PreferencesContext.jsx';
import RootLayout from './layouts/RootLayout.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Multiplayer from './pages/Multiplayer.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import About from './pages/About.jsx';
import Settings from './pages/Settings.jsx';
import NotFound from './pages/NotFound.jsx';
import Practice from './pages/Practice.jsx';
import Results from './pages/Results.jsx';
import MultiplayerRace from './pages/MultiplayerRace.jsx';
import MultiplayerResults from './pages/MultiplayerResults.jsx';

export default function App() {
  const { user } = usePreferences();
  return (
    <Routes>
      <Route element={<RootLayout />}> 
        <Route index element={<Home />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
  <Route path="/multiplayer" element={<Multiplayer />} />
  <Route path="/race/:roomCode" element={<MultiplayerRace />} />
  <Route path="/results/:roomCode" element={<MultiplayerResults />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
  <Route path="/practice" element={<Practice />} />
  <Route path="/results" element={<Results />} />
        <Route path="/about" element={<About />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
