# Election Management & E-Voting System

A web-based e-voting platform for purok (community) elections, built on the MERN stack.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4, shadcn/ui, Recharts |
| Backend | Node.js, Express |
| Database | MongoDB, Mongoose |
| Auth | Passport.js (local strategy), express-session, connect-mongo |
| Uploads | Multer (local storage) |

## Roles

- **Admin** — manage elections, positions, candidates, and users; view results
- **Voter** — log in with voter ID, cast ballots, view voting history

## Quick Start

```bash
# Backend (port 5000)
cd server && npm install && npm run dev

# Frontend (port 5173)
cd client && npm install && npm run dev
```

## Environment Variables

Create `server/.env`:

```env
MONGO_URI=mongodb://localhost:27017/voting_system
SESSION_SECRET=your_secret_here
CLIENT_URL=http://localhost:5173
NODE_ENV=development
PORT=5000
```

## Seed

```bash
cd server && npm run seed
```

Loads 74 registered community members (voter IDs `CCF-001` – `CCF-074`) and a default admin account.

## Project Structure

```
/server
  config/       DB connection, Passport setup
  middleware/   auth guards (requireAuth, requireAdmin, requireVoter)
  models/       User, Election, Position, Candidate, Vote
  routes/
    admin/      elections, positions, candidates, users (admin only)
    auth.js     login, logout, register, session
    elections.js, positions.js, candidates.js
    votes.js, results.js
  seed.js
  server.js

/client/src
  pages/
    admin/      ElectionsPage, ElectionDetail, ElectionForm, Results, Users
    voter/      ElectionsPage, Ballot, VotingHistory, Profile
    auth/       Login, AdminLogin
  components/   candidates, elections, voting, results, layout, ui
  context/      AuthContext
  lib/          axios instance, toast helpers
```

## API Routes

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Current session |
| GET | `/api/elections` | List active elections (voter) |
| POST | `/api/votes` | Cast a vote |
| GET | `/api/elections/:id/results` | Election results |
| GET | `/api/admin/elections` | Manage elections (admin) |
| GET | `/api/admin/users` | Manage users (admin) |
| POST | `/api/admin/users/import` | Bulk import voters from CSV (admin) |
| GET | `/api/admin/candidates` | Manage candidates (admin) |

## Bulk Voter Import (CSV)

Admins can import multiple voter accounts at once from the **Manage Voters** page (Add mode → Import CSV).

### CSV Format

The file must be UTF-8 encoded with a header row containing exactly these three columns (case-insensitive):

```
fullName,voterId,password
```

| Column | Required | Rules |
|---|---|---|
| `fullName` | Yes | Voter's full name |
| `voterId` | Yes | Unique community ID (e.g. `CCF-001`) |
| `password` | Yes | Minimum 8 characters |

### Example

```csv
fullName,voterId,password
Juan dela Cruz,CCF-075,password123
Maria Santos,CCF-076,securepass
Pedro Reyes,CCF-077,mypassword
```

### Import Behavior

- Rows with a **duplicate `voterId`** are silently **skipped** (existing account is preserved).
- Rows that fail validation (missing fields, password too short) are **rejected** and listed with the row number and reason.
- A summary is shown after upload: voters created, rows skipped, and any validation errors.
- Maximum file size: **1 MB**.

## Key Design Decisions

- Voters are pre-seeded by admin — there is no self-registration
- Login credential is `voterId` (e.g. `CCF-001`), not email; admins use a separate login page
- Duplicate vote prevention via compound DB index `{ electionId, positionId, voterId }`
- Election lifecycle: `upcoming → active → closed` (no backward transitions)
- Sessions stored in MongoDB via connect-mongo (7-day cookie)
- Production: server serves the React build statically
