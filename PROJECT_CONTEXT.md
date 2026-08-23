# Arcade Hub Project Context

Last reviewed: 2026-08-23

## What This Project Is

Arcade Hub is a React + Vite mini-game collection. The first screen is a dashboard of arcade games, with login/profile/friends features and scoring/leaderboard support.

The app currently contains two competing backend/auth approaches:

- A local Node HTTP backend in `server/index.js` with cookie sessions and JSON-file persistence.
- A Supabase-based auth/data layer in `src/context/AuthContext.jsx`, which is what the current React app is actually using.

That mismatch is the biggest architectural thing going on in the project.

## Tech Stack

- Frontend: React 19, Vite 7, React Router 7
- Auth/data dependency in frontend: `@supabase/supabase-js`
- Local backend: Node built-in `http`, file-backed JSON data
- Styling: plain CSS modules/files per page or game
- Build/lint scripts: `npm run build`, `npm run lint`

Main scripts from `package.json`:

- `npm run dev`: start Vite frontend
- `npm run server`: start local backend on `http://localhost:4000`
- `npm run dev:full`: start backend and frontend together
- `npm run build`: Vite production build
- `npm run lint`: ESLint

`vite.config.js` proxies `/api` requests to `http://localhost:4000`.

## App Entry Flow

- `src/main.jsx` mounts the app into `#root`.
- The app is wrapped with `BrowserRouter` and `AuthProvider`.
- `src/App.jsx` shows `LoadingScreen` for 1.6 seconds, then renders routes.
- `App.jsx` also logs a Supabase session check on mount.

Routes currently registered:

- `/`: dashboard
- `/login`: login/signup
- `/profile`: current user profile
- `/profile/:username`: friend profile
- `/friends`: friends page
- `/minesweeper`
- `/pacman`
- `/snake`
- `/brick-breaker`
- `/pong`
- `/tetris`
- `/tictactoe`
- `/shooter`

Flappy Bird and Scream Runner have been removed from the dashboard and route list.

## Auth And Data State

Current frontend auth lives in `src/context/AuthContext.jsx` and uses Supabase:

- `login(email, password)` calls `supabase.auth.signInWithPassword`
- `signup(email, password)` calls `supabase.auth.signUp`
- User profiles are stored/read from a Supabase `users` table
- Friend relationships are stored/read from a Supabase `friends` table
- Scores are stored/read from a Supabase `scores` table
- XP is updated on the Supabase `users` table

The login form labels the Supabase auth field as email. Several places derive display names with `user.email.split("@")[0]`.

The README now documents Supabase as the active auth/data path and describes
the local Node backend as legacy/reference code.

## Local Backend

`server/index.js` implements:

- `GET /api/health`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/users?search=`
- `GET /api/users/:username`
- `GET /api/leaderboard`
- `POST /api/scores`
- `POST /api/friends`
- `DELETE /api/friends`

It stores users in `server/data/users.json`, hashes passwords with PBKDF2, stores active sessions in memory, and sets an `HttpOnly` `arcade.sid` cookie.

Because sessions are in memory, all sessions disappear when the server restarts.

## Games

Games are implemented as separate folders under `src/`.

- Minesweeper: React grid game, reports Supabase score via `reportScore("minesweeper", points)`.
- Pac-Man: React grid game with pellets and simple ghost movement, reports Supabase score via `reportScore("pacman", points)`.
- Snake: React implementation with local high score in `localStorage`; no Supabase score reporting.
- Brick Breaker: Canvas game with levels, lives, and score; no shared score reporting currently visible.
- Pong: Canvas player-vs-AI game; no shared score reporting currently visible.
- Tetris: React board implementation; no shared score reporting currently visible.
- Tic-Tac-Toe: React game with AI minimax in a Web Worker and local match score; no shared score reporting currently visible.
- Shooter: Simple DOM/ref-based shooter; no shared score reporting currently visible.

Most games show `Navbar` and a short `GameBoot` loading screen before gameplay.

## Pages And Components

Important shared components:

- `Navbar`: navigation used by pages/games
- `LoadingScreen`: app-level startup screen
- `GameBoot`: per-game loading screen
- `AccountModal`: present but not reviewed in detail

Important pages:

- `Dashboard.jsx`: game grid and login/profile/friends actions
- `Login.jsx`: email/password login and signup form
- `Profile.jsx`: own profile, scores, leaderboard, friend profile view
- `Friends.jsx`: search users, add/remove friends, view friend profiles

## Assets

Public dashboard images currently present:

- `public/images/minesweeper.png`
- `public/images/pacman.png`
- `public/images/pingpong.png`
- `public/images/snake.png`
- `public/images/tetris.png`
- `public/images/tictactoe.png`

Dashboard uses image paths for some games and text thumbnails for others. It does not currently use `pingpong.png` for Pong.

Audio files:

- Snake uses `src/assets/eat.mp3` and `src/assets/gameover.mp3`.

## Known Issues And Drift

- Auth/data architecture still has two implementations in the repository, but README now identifies Supabase as the active frontend path and the Node backend as legacy/reference code.
- Auth import casing has been normalized to `context/AuthContext`.
- Login UI now labels the Supabase auth field as email.
- `Profile.jsx` now derives the current username from the auth email and uses safe fallbacks while profile data loads.
- Duplicate uppercase Tic-Tac-Toe component/style files were removed from Git tracking; the app uses lowercase `tictactoe.jsx`/`tictactoe.css`.
- `npm run lint` and `npm run build` pass with zero warnings.

## Suggested Next Steps

1. Make score reporting consistent across games.
2. Decide whether the local Node backend should be removed if Supabase remains the source of truth.
3. Add production Supabase setup details if deploying the app.
