# TypeX — MERN Multiplayer Typing Game

Real‑time multiplayer typing races with a modern UI. Built with React + Vite + Tailwind on the frontend and Express + MongoDB + Socket.io on the backend. JWT‑based auth, global leaderboard, practice mode, and smooth animations.

## Why this project stands out 
- Real‑time systems: Socket.io powers lobbies, races, and live leaderboards.
- Modern UX: Glassmorphism, responsive layouts, and Framer Motion micro‑interactions.
- Typed experience: Inline typing engine and clean results UI.
- Production‑ready patterns: Auth with JWT, API layering, and environment‑based config.
- Maintainable code: Modular components, clear separation of concerns, and sensible defaults.

## Feature highlights
- Multiplayer rooms: Create/join, lobby chat, synchronized start, live progress, and results podium.
- Practice mode: Time/word modes with WPM and accuracy tracking.
- Leaderboard: Global rankings pulled from the backend.
- Authentication: Register/login with JWT; basic profile with avatar options.
- Responsive: Mobile‑first, safe on small screens and large displays.

## Tech stack
- Frontend: React 18, Vite, Tailwind CSS, Framer Motion, Socket.io‑client, Recharts
- Backend: Node.js, Express, MongoDB/Mongoose, Socket.io, JWT

---

## Getting started

### Prerequisites
- Node.js 18+ and npm 9+
- MongoDB (local instance or cloud URI)

### 1) Configure environment
Copy and edit env files (Windows PowerShell):

```powershell
# From the repo root
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

Backend `backend/.env` (required):
- `MONGODB_URI` — your MongoDB connection string
- `JWT_SECRET` — any strong secret

Frontend `frontend/.env` (optional):
- `VITE_API_URL` — e.g. `http://localhost:5000`

### 2) Install dependencies
```powershell
cd frontend; npm install; cd ..\backend; npm install
```

### 3) Run locally (two terminals)
```powershell
# Terminal 1
cd backend
npm run dev
```

```powershell
# Terminal 2
cd frontend
npm run dev
```

- Backend: http://localhost:5000
- Frontend: http://localhost:5173

> Tip: The frontend is preconfigured to proxy API and Socket.io requests to the backend during development.

---

## Project structure
```
backend/
	src/
		config/       # DB connection
		middleware/   # auth middleware
		models/       # Mongoose models (User, GameResult)
		routes/       # REST routes (auth, leaderboard)
		sockets/      # Socket.io event handlers (game)
	index.js        # Express app + Socket.io server

frontend/
	src/
		components/   # Reusable UI + multiplayer components
		pages/        # Route-level pages (Practice, Multiplayer, etc.)
		settings/     # Preferences context
		lib/          # API client
	index.html
	vite.config.js
```

---

## How it works (high level)
- Clients connect to Socket.io and join a room.
- Server orchestrates race state (lobby → countdown → in‑race → results) and broadcasts updates.
- Clients compute WPM/accuracy locally while the server aggregates results for the leaderboard.
- REST APIs handle auth and persistent data (users, results, leaderboard).

---

## Scripts
Frontend (in `frontend/`):
- `npm run dev` — start Vite dev server
- `npm run build` — production build
- `npm run preview` — preview production build

Backend (in `backend/`):
- `npm run dev` — start API + Socket.io server in watch mode

---

## Notes and trade‑offs
- This app favors a smooth typing UX with lightweight animations over exhaustive telemetry.
- Room chat is scoped to the lobby/room for clarity during races.
- Large JS bundles can be reduced further with route‑level code‑splitting when needed.

## Next steps (nice to have)
- OAuth providers (GitHub/Google) in addition to email/password.
- Friend system and private rooms.
- Advanced anti‑cheat and richer analytics.

---

## License
MIT — use it freely for learning or as a starting point.
