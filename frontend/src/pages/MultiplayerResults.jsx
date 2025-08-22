import { useLocation, useParams } from 'react-router-dom';
import Results from '../components/multiplayer/Results.jsx';

export default function MultiplayerResults() {
  const { roomCode } = useParams();
  const { state } = useLocation();
  return (
    <Results
      ended={state}
      onPlayAgain={() => window.location.href = '/multiplayer'}
      onBackToLobby={() => window.location.href = '/multiplayer'}
    />
  );
}
