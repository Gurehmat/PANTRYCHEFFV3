# AGENTS.md

## Cursor Cloud specific instructions

### Overview

PantryChef is a React + Vite SPA for AI-powered recipe management. The backend is fully hosted on **Supabase** (PostgreSQL, Auth, Edge Functions) — there is no local backend to run.

### Running the app

- **Dev server**: `npm run dev` — starts Vite on `http://localhost:5173/PANTRYCHEFFV3/`
- Note the `/PANTRYCHEFFV3/` base path (set in `vite.config.js` for GitHub Pages). All routes are served under this prefix, including the hash-based router (e.g. `/#/pantry`, `/#/recipes`).
- **Build**: `npm run build`
- **Lint**: `npm run lint` — runs ESLint. The codebase has pre-existing lint errors (19 errors, 5 warnings as of initial setup) in utility scripts and some components.

### Environment variables

The app requires a `.env` file at the repo root with:
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anonymous/public API key
- `VITE_GEMINI_API_KEY` — Google Gemini API key (used for AI features)

These are already configured in the repository `.env` file. AI features (recipe generation, substitutions, fridge scanning) require valid Gemini and Supabase Edge Function credentials.

### Key architectural notes

- Routing uses `HashRouter` — all client-side routes are after `#` (e.g. `/#/auth`, `/#/pantry`).
- State management via Zustand stores in `src/store/`.
- Supabase Edge Functions (Deno/TypeScript) live in `supabase/functions/` but are deployed to the hosted Supabase instance, not run locally.
- No Docker, no local database, no test suite — the project has no automated tests.
