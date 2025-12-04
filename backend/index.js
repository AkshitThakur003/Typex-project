require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./src/config/db');
const { registerGameSocket } = require('./src/sockets/game');
const createApp = require('./app');

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();

  console.log('[Config] NODE_ENV:', process.env.NODE_ENV || 'development');
  console.log('[Config] Starting server on port', PORT);

  const app = createApp();
  const server = http.createServer(app);
  
  const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  const allowedOrigins = new Set([CLIENT_ORIGIN]);
  if (process.env.ALLOWED_ORIGINS) {
    process.env.ALLOWED_ORIGINS.split(',').forEach(origin => {
      allowedOrigins.add(origin.trim());
    });
  }
  
  const io = new Server(server, {
    cors: {
      credentials: true,
      methods: ['GET', 'POST'],
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.has(origin)) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
      },
    },
  });

  registerGameSocket(io);

  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Export app for testing
module.exports = createApp;

// Start server if running directly (not in test mode)
if (require.main === module && process.env.NODE_ENV !== 'test') {
  start().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
