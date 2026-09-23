# Arcade Hub

Arcade Hub is a React + Vite mini-game collection.

## Development

The active app uses the local Node backend in `server/` for authentication,
profiles, friends, scores, and leaderboard data. User data is stored in
`server/data/users.json`.

Start the frontend and backend together:

```bash
npm run dev:full
```

This starts:
- Vite frontend on `http://localhost:5173`
- Backend API on `http://localhost:4000`

Run only the frontend:

```bash
npm run dev
```

Run only the backend:

```bash
npm run server
```

## Multithreading

Several games use Web Workers to move calculation-heavy game logic off the main
browser thread:

- Tic-Tac-Toe uses `src/workers/tictactoeWorker.js` for AI minimax move
  selection.
- Pac-Man uses `src/workers/pacmanWorker.js` for ghost movement calculation.
- Tetris uses `src/workers/tetrisWorker.js` for movement, rotation, drop, lock,
  and line-clear commands.
- Shooter uses `src/workers/shooterWorker.js` for per-frame movement, spawning,
  and collision calculations.

Each game keeps React responsible for rendering and state updates. If worker
messaging fails, the game logs the problem and falls back to local logic where
needed.

## Local JSON Backend

The backend uses cookie-based sessions and stores users in
`server/data/users.json`. Passwords are hashed with PBKDF2 before being stored.
