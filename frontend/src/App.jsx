import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { usePreferences } from './settings/PreferencesContext.jsx';
import RootLayout from './layouts/RootLayout.jsx';
import { XpToastManager } from './components/xp';

// Eager load critical pages
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

// Lazy load other pages
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'));
const ResetPassword = lazy(() => import('./pages/ResetPassword.jsx'));
const OAuthCallback = lazy(() => import('./pages/OAuthCallback.jsx'));
const Multiplayer = lazy(() => import('./pages/Multiplayer.jsx'));
const Leaderboard = lazy(() => import('./pages/Leaderboard.jsx'));
const About = lazy(() => import('./pages/About.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const XpInfoPage = lazy(() => import('./pages/XpInfoPage.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));
const Practice = lazy(() => import('./pages/Practice.jsx'));
const PracticeHistory = lazy(() => import('./pages/PracticeHistory.jsx'));
const PersonalRaces = lazy(() => import('./pages/PersonalRaces.jsx'));
const FriendsPage = lazy(() => import('./pages/FriendsPage.jsx'));
const AchievementsPage = lazy(() => import('./pages/AchievementsPage.jsx'));
const Results = lazy(() => import('./pages/Results.jsx'));
const MultiplayerRace = lazy(() => import('./pages/MultiplayerRace.jsx'));
const MultiplayerResults = lazy(() => import('./pages/MultiplayerResults.jsx'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
    </div>
  );
}

export default function App() {
  const { user } = usePreferences();
  return (
    <>
      <XpToastManager />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<RootLayout />}> 
            <Route index element={<Home />} />
            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth/callback" element={<OAuthCallback />} />
            <Route path="/multiplayer" element={<Multiplayer />} />
            <Route path="/race/:roomCode" element={<MultiplayerRace />} />
            <Route path="/results/:roomCode" element={<MultiplayerResults />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="/practice-history" element={<PracticeHistory />} />
            <Route path="/personal-races" element={<PersonalRaces />} />
            <Route path="/friends" element={<FriendsPage />} />
            <Route path="/results" element={<Results />} />
            <Route path="/about" element={<About />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile/:username" element={<Profile />} />
            <Route path="/profile/:username/achievements" element={<AchievementsPage />} />
            <Route path="/xp-info" element={<XpInfoPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
