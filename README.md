# Arcade Hub

Arcade Hub is a React + Vite mini-game collection.

## Development

The active frontend uses Supabase for authentication, profiles, friends,
scores, and leaderboard data. A lightweight local Node backend still exists in
`server/`, but the React app currently talks to Supabase directly.

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Then start the frontend:

```bash
npm run dev
```

### Supabase Tables

The app expects these public tables:

- `users`: `id`, `username`, `xp`
- `friends`: `id`, `user_id`, `friend_id`
- `scores`: `id`, `user_id`, `game`, `score`

Enable Row Level Security and allow authenticated users to read profiles,
manage their own friendships, and insert/update their own scores.

## Multithreading

Tic-Tac-Toe uses a Web Worker for the AI move calculation:

- Pure minimax logic lives in `src/TicTacToe/tictactoeAi.js`.
- The worker lives in `src/workers/tictactoeWorker.js`.
- `src/TicTacToe/tictactoe.jsx` sends board snapshots to the worker and applies
  the returned AI move.
- If the worker fails, the game logs the problem and falls back to the same AI
  function on the main thread.

## Legacy Backend

The project includes a lightweight Node backend for cookie-based sessions.
It is useful as a reference or alternate local backend, but it is not the active
auth/data path used by the current React app.

### Run frontend + backend together

```bash
npm run dev:full
```

This starts:
- Vite frontend on `http://localhost:5173`
- Backend API on `http://localhost:4000`

### Run only backend

```bash
npm run server
```
