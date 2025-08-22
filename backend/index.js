require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const connectDB = require('./src/config/db');

const authRoutes = require('./src/routes/auth');
const { registerGameSocket } = require('./src/sockets/game');
const leaderboardRoutes = require('./src/routes/leaderboard');
const authMiddleware = require('./src/middleware/auth');

const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const allowedOrigins = new Set([
  CLIENT_ORIGIN,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

async function start() {
  await connectDB();

  const app = express();
  app.use(cors({
    credentials: true,
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin)) return callback(null, true);
      return callback(null, false);
    },
  }));
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/leaderboard', leaderboardRoutes);

  // Example protected route
  app.get('/api/protected', authMiddleware, (req, res) => {
    res.json({ ok: true, user: req.user });
  });
  
    // Optional: endpoint to save a practice score
    const Leaderboard = require('./src/models/Leaderboard');
    app.post('/api/leaderboard', express.json(), async (req, res) => {
      try {
        const { username, wpm, accuracy, mode } = req.body || {};
        if (!username || typeof wpm !== 'number' || typeof accuracy !== 'number' || !mode) {
          return res.status(400).json({ error: 'username, wpm, accuracy and mode are required' });
        }
        if (!['practice', 'multiplayer'].includes(mode)) {
          return res.status(400).json({ error: 'Invalid mode' });
        }
        const doc = await Leaderboard.create({ username, wpm, accuracy, mode });
        res.json({ ok: true, id: doc._id });
      } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to save score' });
      }
    });

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      credentials: true,
      methods: ['GET', 'POST'],
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.has(origin)) return callback(null, true);
        return callback(null, false);
      },
    },
  });

  registerGameSocket(io);

  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
