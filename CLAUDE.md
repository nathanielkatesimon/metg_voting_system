# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Purok (community/neighborhood) Election Management & E-Voting System** — MERN stack, single developer, 7-day build.
This is a local community voting system, not a school or student election platform. All terminology and UI copy must reflect that context.
Full architecture review and 72-task backlog are in `project-plan.md`. Read it before starting any implementation work.

## Monorepo Layout

```
/server      Node.js / Express backend
/client      React / Vite frontend
```

Both directories exist (created in Tasks 1–2 and Task 6).

## Commands

Once the project is scaffolded, standard commands will be:

```bash
# Backend
cd server && npm run dev        # nodemon server.js
cd server && npm start          # node server.js (production)
cd server && npm run seed       # seed demo data (Task 65)

# Frontend
cd client && npm run dev        # Vite dev server (port 5173)
cd client && npm run build      # production build to client/dist
cd client && npm run preview    # preview production build locally

# From repo root (once root package.json is added)
npm run dev                     # start both concurrently
```

No test runner is included in the spec. Manual test checklists are Tasks 68–71.

## Architecture

### Backend (`/server`)

- **Entry point:** `server/server.js` — loads env, connects DB, registers all middleware and routers, starts the server.
- **Config:** `server/config/db.js` (Mongoose connection), `server/config/passport.js` (LocalStrategy + serialize/deserialize).
- **Middleware:** `server/middleware/auth.js` exports three composable guards — `requireAuth`, `requireAdmin`, `requireVoter`. Apply at router level, never inside individual handlers. `server/middleware/upload.js` is the Multer config for candidate images. `server/middleware/errorHandler.js` is the global error handler (strips stack traces in production).
- **Routes:** Split into public (`server/routes/`) and admin-only (`server/routes/admin/`). Admin routes are mounted under `/api/admin` and all use `requireAdmin`.
- **Models:** `User`, `Election`, `Position`, `Candidate`, `Vote` in `server/models/`.

### Frontend (`/client`)

- **Entry:** `client/src/main.jsx` → `App.jsx` → React Router route tree.
- **Auth flow:** `AuthContext` (`client/src/context/AuthContext.jsx`) calls `GET /api/auth/me` on mount to rehydrate session. All protected pages are wrapped in `PrivateRoute` or `AdminRoute` (`client/src/components/routing/`). Both guards wait for `isLoading` before redirecting to prevent flash.
- **API calls:** All requests go through the shared Axios instance at `client/src/lib/axios.js` (`baseURL: '/api'`, `withCredentials: true`). A 401 interceptor redirects to `/login` — but only when the current path is NOT in the public-path list (`/login`, `/register`). Without this guard, the `getMe()` probe on mount creates an infinite reload loop on the login page. Service modules in `client/src/services/` wrap Axios calls per domain.
- **Layouts:** `AdminLayout` (sidebar) and `VoterLayout` (top navbar) wrap their respective route trees. Both import `Navbar` from `client/src/components/layout/`.
- **UI:** shadcn/ui components live in `client/src/components/ui/`. Recharts is used only in the results dashboard (`client/src/components/results/`).

### Data flow — Voting

1. Voter hits `GET /api/elections/:id/my-votes` on ballot page load → receives array of already-voted positionIds.
2. Per-position `BallotPosition` disables itself if positionId is in that array.
3. On confirm, `POST /api/votes` runs three server-side checks: election is `active`, positionId belongs to electionId, candidateId belongs to positionId.
4. The `Vote` model has a compound unique index `{ electionId, positionId, voterId }` as the final guard against race conditions. `E11000` is caught and returned as `409`.

### Key schema decisions

- `Users.voterId` — the human-readable external ID issued to each community voter (e.g. `VTR-2024-001`). Required, unique. Also the Passport `usernameField` — login uses `voterId` + password, not email. There is **no email field** on the User model.
- `Elections.deletedAt` — soft delete. All election queries filter `{ deletedAt: null }`.
- `Candidates.electionId` — denormalized from positionId for query convenience. Must be set from `position.electionId` at creation time.
- `Elections.status` — enum `['upcoming', 'active', 'closed']`. Transitions are one-way only (`upcoming → active → closed`). No backward transitions are allowed; the close route enforces this.

### Image storage

Multer writes to `server/uploads/candidates/` with randomized filenames. Express serves the directory as static at `/uploads`. Only the relative path (e.g. `/uploads/candidates/abc123.jpg`) is stored in `Candidate.imagePath`. On candidate delete, `fs.unlink` removes the file. This path format is intentionally Cloudinary-swappable later.

### Session

`express-session` backed by `connect-mongo` (same MongoDB connection). Cookie is `httpOnly: true`, `sameSite: 'lax'`, `secure` only in production.

## Implementation Guide

Tasks are numbered 1–72 across 10 phases in `project-plan.md`. Each task lists:
- Objective, Dependencies, Files Created, Files Modified, Acceptance Criteria.

To implement: `Implement Task #N` or `Implement Tasks #N–M`.

Critical path: `1 → 2 → 4 → 9 → 10 → 11 → 12 → 24 → 25 → 26 → 38 → 69`

Recommended day-by-day order:

| Day | Tasks |
|---|---|
| 1 | 1–8 (scaffold) |
| 2 | 9–17 (auth) |
| 3 | 23–33 (elections + positions) |
| 4 | 34–40 (candidates + images) |
| 5 | 41–47 (voting) |
| 6 | 48–62 (results, export, layouts) |
| 7 | 63–72, 18–22 (polish, profile, hardening, testing) |
