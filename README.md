# TypeX — MERN Multiplayer Typing Game

A lightning-fast typing challenge platform with real-time multiplayer races, practice modes, and social features. Built with React + Vite + Tailwind on the frontend and Express + MongoDB + Socket.io on the backend.

## 🚀 Live Demo

- **Frontend**: [https://typex-project.vercel.app](https://typex-project.vercel.app)
- **Backend**: [https://typex-backend.onrender.com](https://typex-backend.onrender.com)

## ✨ Key Features

### 🎮 Core Gameplay
- **Real-time Multiplayer Races**: Create or join rooms, race with players worldwide using Socket.io for instant synchronization
- **Practice Modes**: Flexible practice with timed sessions and fixed-word counts
- **Live WPM Tracking**: Watch your words per minute update in real-time with detailed analytics
- **Anti-cheat System**: Fair play guaranteed with intelligent detection and validation

### 👥 Social Features
- **Friend System**: Send/accept friend requests, see friend online status, and manage your friend list
- **Private Rooms**: Create password-protected rooms for friends-only races
- **User Profiles**: View detailed statistics, achievements, and race history
- **Global Leaderboards**: Compete for top spots with mode-aware rankings

### 🏆 Progression & Rewards
- **XP & Level System**: Earn experience points from races and practice sessions
- **Achievement System**: Unlock achievements for milestones like first race, speed records, and consistency
- **Personal Statistics**: Track your best WPM, accuracy, win rate, and improvement over time
- **Race History**: View detailed history of your multiplayer races and practice sessions

### 🔐 Authentication & Security
- **Multiple Auth Methods**: Email/password registration and Google OAuth login
- **Password Reset**: Secure password recovery via email
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Protection against abuse and spam

### 🎨 User Experience
- **Modern UI**: Glassmorphism design with smooth Framer Motion animations
- **Responsive Design**: Mobile-first approach, works seamlessly on all devices
- **Customizable Settings**: Themes, sounds, animations, and typing preferences
- **Avatar System**: Express yourself with avatars across chat, leaderboards, and results
- **Keyboard Shortcuts**: Quick navigation and actions

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS 4** - Utility-first styling
- **Framer Motion** - Animation library
- **Socket.io Client** - Real-time communication
- **React Router** - Client-side routing
- **Recharts** - Data visualization
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime environment
- **Express 5** - Web framework
- **MongoDB + Mongoose** - Database and ODM
- **Socket.io** - Real-time WebSocket server
- **JWT** - Authentication tokens
- **Passport.js** - OAuth authentication
- **Bcrypt** - Password hashing
- **Express Rate Limit** - API protection

## 📦 Getting Started

### Prerequisites
- Node.js 18+ and npm 9+
- MongoDB (local instance or MongoDB Atlas)

### 1. Clone the Repository
```bash
git clone https://github.com/AkshitThakur003/Typex-project.git
cd Typex-project
```

### 2. Configure Environment Variables

**Backend** (`backend/.env`):
```env
MONGODB_URI=mongodb://localhost:27017/typex
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
NODE_ENV=development
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173

# Optional: Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:5000
```

### 3. Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 4. Run Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend runs on: http://localhost:5000

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs on: http://localhost:5173

> 💡 The frontend is preconfigured to proxy API and Socket.io requests to the backend during development.

## 📁 Project Structure

```
Typex-project/
├── backend/
│   ├── src/
│   │   ├── config/          # Database, Passport configuration
│   │   ├── controllers/     # Business logic controllers
│   │   ├── middleware/      # Auth, rate limiting
│   │   ├── models/          # Mongoose models (User, GameResult, Friend, etc.)
│   │   ├── routes/          # REST API routes
│   │   ├── services/        # Service layer (XP service, etc.)
│   │   ├── sockets/         # Socket.io handlers
│   │   └── utils/           # Utilities (XP calculator, validators)
│   ├── load-tests/          # Performance testing
│   ├── scripts/             # Migration scripts
│   └── index.js             # Express app + Socket.io server
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── auth/        # Authentication components
│   │   │   ├── common/      # Common UI elements
│   │   │   ├── multiplayer/ # Multiplayer-specific components
│   │   │   ├── practice/    # Practice mode components
│   │   │   └── xp/          # XP system components
│   │   ├── pages/           # Route-level pages
│   │   ├── hooks/           # Custom React hooks
│   │   ├── layouts/         # Layout components
│   │   ├── lib/             # API client, utilities
│   │   ├── settings/        # Preferences context
│   │   └── utils/           # Helper functions
│   ├── public/              # Static assets
│   └── vite.config.js       # Vite configuration
│
└── render.yaml              # Render deployment config
```

## 🎯 Available Scripts

### Frontend
- `npm run dev` - Start Vite dev server
- `npm run build` - Production build
- `npm run preview` - Preview production build
- `npm test` - Run tests
- `npm run lint` - Run ESLint

### Backend
- `npm run dev` - Start server with nodemon (watch mode)
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run test:coverage` - Run tests with coverage
- `npm run test:load` - Run load tests

## 🔧 Key Features Explained

### Real-time Multiplayer
- Socket.io powers synchronized race starts, live progress updates, and instant results
- Room-based architecture supports multiple concurrent races
- Lobby chat and player management

### XP & Leveling System
- Earn XP from practice sessions and multiplayer races
- Level up to unlock achievements and track progress
- XP calculation based on WPM, accuracy, and race performance

### Friend System
- Send and accept friend requests
- See friend online status
- Create private rooms for friends
- View friend profiles and statistics

### Practice Modes
- **Time Mode**: Type for a set duration (15s, 30s, 60s, 120s)
- **Words Mode**: Type a fixed number of words (10, 25, 50, 100)
- Track WPM, accuracy, and improvement over time
- Practice history with detailed analytics

## 🚀 Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variable: `VITE_API_URL=https://your-backend-url.com`
3. Deploy automatically on push to main branch

### Backend (Render)
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set build command: `cd backend && npm install`
4. Set start command: `cd backend && npm start`
5. Configure environment variables in Render dashboard

## 📝 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - OAuth callback
- `GET /api/auth/me` - Get current user
- `POST /api/auth/request-reset` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Multiplayer
- `GET /api/multiplayer/rooms` - Get available rooms
- `POST /api/multiplayer/create-room` - Create new room

### Leaderboard
- `GET /api/leaderboard` - Get global leaderboard
- `GET /api/leaderboard/:mode` - Get mode-specific leaderboard

### Friends
- `GET /api/friends` - Get friend list
- `POST /api/friends/request` - Send friend request
- `POST /api/friends/accept/:id` - Accept friend request
- `DELETE /api/friends/:id` - Remove friend

### Profile & XP
- `GET /api/profile/:username` - Get user profile
- `GET /api/profile/xp/me` - Get current user XP
- `POST /api/profile/xp/add-xp` - Add XP from game result

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for learning or as a starting point for your own projects.

---

**Built with ❤️ by Akshit Thakur**
