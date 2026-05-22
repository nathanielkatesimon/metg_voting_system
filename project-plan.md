# Election Management & E-Voting System — Technical Planning Document

**Date:** 2026-05-22
**Stack:** MERN (MongoDB · Express · React · Node.js)
**Timeline:** 7 days · Single Developer

---

## Table of Contents

1. [Architecture Review](#part-1--architecture-review)
2. [Implementation Backlog](#part-2--implementation-backlog)
3. [Dependency Graph](#part-3--dependency-graph)
4. [Feature Prioritization](#part-4--feature-prioritization)

---

## Part 1 — Architecture Review

---

### 1.1 Database Design

**Strengths**
- Schema is flat and query-friendly — no deeply nested documents.
- Votes collection records `timestamp`, giving an implicit audit trail.
- `status` field on Elections makes lifecycle queries simple.
- `createdBy` on Elections allows future ownership filtering.

**Weaknesses**

| Issue | Risk |
|---|---|
| No compound unique index defined on `Votes(electionId, positionId, voterId)` | Duplicate votes possible if application-layer guard fails |
| `electionId` on `Candidates` is denormalized from `positionId → Position.electionId` | Inconsistency if a position is ever moved (unlikely but fragile) |
| `voterId` in `Users` is ambiguous — conflicts with MongoDB `_id` | Confusing references across collections |
| No soft delete — removing a Candidate or Election orphans existing Votes | Referential integrity broken |
| No ordering field on `Positions` | Display order undefined |
| No Mongoose-level enum enforcement on `Elections.status` | Invalid status strings can be persisted |

**Recommended Improvements**
- Add compound unique index `{ electionId: 1, positionId: 1, voterId: 1 }` on `Votes` at the schema level.
- Remove `electionId` from `Candidates` OR make it a derived/computed field — choose one and be consistent. For query simplicity, keep it but enforce it is always set from `position.electionId` during creation.
- Rename `voterId` in `Users` to `studentId` or `nationalId` (the actual external identifier) and keep MongoDB `_id` as the system reference everywhere. Add a unique sparse index on it.
- Add a `deletedAt` field to `Elections` and `Candidates` for soft deletes.
- Add `order` (Number) to `Positions`.
- Add Mongoose `enum` validator on `Elections.status: ['upcoming', 'active', 'closed']`.

---

### 1.2 Entity Relationships

**Strengths**
- Relationships are unambiguous and easy to join via `populate()`.
- The Vote document links all five relevant entities in one record — clean for aggregation.

**Weaknesses**
- No explicit foreign key validation at the DB layer (Mongoose refs are advisory only).
- Cascade delete is not addressed — deleting an Election should cascade to its Positions, Candidates, and Votes.

**Recommended Improvements**
- Implement cascade delete in the Election delete route: delete in order `Votes → Candidates → Positions → Election`.
- Add `ref` on all ObjectId fields in Mongoose schemas so `populate()` works predictably.

---

### 1.3 Authentication

**Strengths**
- Passport.js + `passport-local` + `express-session` is battle-tested for academic/single-server apps.
- `bcryptjs` is appropriate for password hashing.
- Session-based auth avoids JWT complexity (correct call for a 7-day project).

**Weaknesses**

| Issue | Risk |
|---|---|
| Default in-memory session store (`MemoryStore`) leaks memory and does not survive restarts | Sessions lost on server restart; memory bloat under load |
| No rate limiting on `POST /login` | Brute-force attacks |
| No CSRF protection | Session hijacking via cross-site form submission |
| Password strength policy undefined | Weak passwords accepted |
| No `secure`/`httpOnly` cookie flags explicitly configured | Cookie accessible to JS; sent over HTTP |

**Recommended Improvements**
- Use `connect-mongo` as the session store (same MongoDB connection, minimal overhead).
- Set `cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' }`.
- Add `express-rate-limit` on `/api/auth/login` (e.g., 10 attempts per 15 minutes per IP).
- Minimum password length of 8 characters validated in the route before hashing.

---

### 1.4 Authorization

**Strengths**
- Two-role system (`admin` / `voter`) is simple and sufficient for the stated requirements.
- Role is stored on the User document — easy to check.

**Weaknesses**
- No documented middleware strategy — auth guards are likely duplicated across routes.
- Election ownership is not enforced — any admin can edit any election. This may be intentional but should be explicit.
- No check preventing a voter account from calling admin endpoints if middleware is accidentally omitted.

**Recommended Improvements**
- Centralize auth guards into three composable middleware functions: `requireAuth`, `requireAdmin`, `requireVoter`. Apply at the router level, not individual route handlers.
- Decide explicitly whether election ownership matters (recommended: no, any admin can manage any election — simpler).

---

### 1.5 Voting Integrity

**Strengths**
- One vote per position per election per voter is the correct constraint.
- `timestamp` on each vote enables audit.
- Vote records reference all relevant IDs — aggregation is straightforward.

**Weaknesses**

| Issue | Risk |
|---|---|
| No database-level uniqueness constraint on votes | Race condition allows two simultaneous submissions to both succeed |
| No check that `candidateId` belongs to `positionId` | Votes for mismatched candidates accepted |
| No check that `positionId` belongs to `electionId` | Cross-election vote injection possible |
| No check that the election is `active` at vote time | Votes accepted on closed elections if app-layer check is bypassed |

**Recommended Improvements**
- Add compound unique index: `{ electionId: 1, positionId: 1, voterId: 1 }` — this is the single most important integrity safeguard.
- In the vote submission route, validate: (a) election is `active`, (b) position belongs to election, (c) candidate belongs to position. All three checks before writing.
- Use `findOneAndUpdate` with `upsert` or catch `E11000` duplicate key errors to gracefully handle race conditions.

---

### 1.6 Election Lifecycle

**Strengths**
- Three statuses (`upcoming` / `active` / `closed`) cover the full lifecycle.
- Manual open/close gives admins explicit control.
- `startDate` / `endDate` provide reference timestamps.

**Weaknesses**
- `startDate` / `endDate` exist but do not drive status — status is purely manual. These dates can diverge from actual state with no reconciliation.
- No validation that an election must have at least one position and one candidate before it can be opened.
- No protection against re-opening a closed election.
- No protection against deleting an active election.

**Recommended Improvements**
- On `open`: validate status is `upcoming`, and optionally require at least one position with at least one candidate.
- On `close`: validate status is `active`. Set status to `closed` — do not allow reverting.
- On `delete`: reject if status is `active`. Require explicit close first.
- Status transitions: `upcoming → active → closed` only. No backward transitions.

---

### 1.7 Image Storage

**Strengths**
- Multer + local storage is the fastest path to working uploads.
- Noting future Cloudinary compatibility is good forward thinking.

**Weaknesses**
- No file type validation (MIME type + extension) — arbitrary file uploads possible.
- No file size limit defined.
- Filenames are not sanitized — path traversal risk if original filename is used.
- Uploaded files are not cleaned up when a candidate is deleted.
- Local storage ties the app to a single server with persistent disk.

**Recommended Improvements**
- Validate MIME type with `fileFilter` in Multer: allow only `image/jpeg`, `image/png`, `image/webp`.
- Set `limits: { fileSize: 2 * 1024 * 1024 }` (2 MB max).
- Generate filenames with `Date.now() + '-' + Math.random().toString(36).slice(2) + ext` — never use `req.file.originalname` directly.
- On candidate delete, use `fs.unlink` to remove the associated image file.
- Store only the relative path (e.g., `/uploads/candidates/filename.jpg`) in the DB — not a full URL — to support future storage migration.

---

### 1.8 Scalability

**Strengths**
- MongoDB scales horizontally.
- React + Vite frontend can be served as a static CDN build.

**Weaknesses**
- In-memory session store does not support horizontal scaling (addressed above with connect-mongo).
- Local file uploads are not portable across instances.
- No caching strategy — every dashboard load hits the DB.

**Assessment:** For a single-server academic deployment, none of these are blockers. Flag them as known limitations in documentation, not items to solve now.

---

### 1.9 Security

**Weaknesses**

| Issue | Fix |
|---|---|
| No `helmet.js` — missing security headers (CSP, HSTS, X-Frame-Options) | `app.use(helmet())` |
| No CORS policy defined | `cors({ origin: process.env.CLIENT_URL, credentials: true })` |
| Raw error stack traces may be returned in production | Use a global error handler that strips stack in production |
| No input sanitization — XSS via candidate `platform` / `description` fields | Sanitize on output or use `DOMPurify` in React |
| `.env` file management not defined | Add `.env` to `.gitignore` on day one |

---

## Part 2 — Implementation Backlog

---

### Phase 1 — Project Setup

---

#### - [ ] Task 1
**Objective:** Create the monorepo directory structure with `/server` and `/client` directories and a root-level `.gitignore`.
**Dependencies:** None
**Files Created:** `/server/`, `/client/`, `.gitignore`, `README.md`
**Files Modified:** None
**Acceptance Criteria:**
- `/server` and `/client` directories exist.
- `.gitignore` excludes `node_modules/`, `.env`, `uploads/`, `dist/`.

---

#### - [ ] Task 2
**Objective:** Initialize the Node.js/Express backend with core dependencies installed and a working `server.js` entry point that starts on port 5000.
**Dependencies:** Task 1
**Files Created:** `server/package.json`, `server/server.js`
**Files Modified:** None
**Acceptance Criteria:**
- `npm install` succeeds in `/server`.
- `node server.js` starts without errors.
- Dependencies include: `express`, `mongoose`, `passport`, `passport-local`, `express-session`, `connect-mongo`, `bcryptjs`, `multer`, `cors`, `helmet`, `express-rate-limit`, `dotenv`.

---

#### - [ ] Task 3
**Objective:** Configure environment variable loading with `dotenv` and create `.env` and `.env.example` files.
**Dependencies:** Task 2
**Files Created:** `server/.env`, `server/.env.example`
**Files Modified:** `server/server.js`
**Acceptance Criteria:**
- `.env` contains `MONGO_URI`, `SESSION_SECRET`, `PORT`, `NODE_ENV`, `CLIENT_URL`.
- `.env.example` has the same keys with placeholder values.
- `server.js` loads env vars before any other imports.

---

#### - [ ] Task 4
**Objective:** Configure Mongoose connection to MongoDB with connection error handling and graceful shutdown.
**Dependencies:** Task 3
**Files Created:** `server/config/db.js`
**Files Modified:** `server/server.js`
**Acceptance Criteria:**
- Running `node server.js` with a valid `MONGO_URI` logs "MongoDB connected".
- Connection failure logs the error and exits with code 1.

---

#### - [ ] Task 5
**Objective:** Configure Express middleware stack: `helmet`, `cors`, JSON body parser, `express-session` with `connect-mongo` store, and global error handler.
**Dependencies:** Task 4
**Files Created:** `server/middleware/errorHandler.js`
**Files Modified:** `server/server.js`
**Acceptance Criteria:**
- `GET /api/health` returns `{ status: 'ok' }`.
- Response includes security headers (`X-Frame-Options`, etc.) from Helmet.
- Session persists across server restarts (stored in MongoDB).

---

#### - [ ] Task 6
**Objective:** Initialize the React/Vite frontend project with React Router and configure the Vite dev server proxy to forward `/api` requests to `localhost:5000`.
**Dependencies:** Task 1
**Files Created:** `client/` (full Vite scaffold), `client/vite.config.js`
**Files Modified:** None
**Acceptance Criteria:**
- `npm run dev` starts the Vite dev server on port 5173.
- `fetch('/api/health')` from the browser returns `{ status: 'ok' }`.
- React Router is installed and `BrowserRouter` wraps the app.

---

#### - [ ] Task 7
**Objective:** Install and configure Tailwind CSS and initialize shadcn/ui with the default theme.
**Dependencies:** Task 6
**Files Created:** `client/tailwind.config.js`, `client/src/index.css`, `client/components.json`
**Files Modified:** `client/src/main.jsx`, `client/vite.config.js`
**Acceptance Criteria:**
- Tailwind utility classes apply correctly on a test element.
- `npx shadcn@latest add button` successfully adds a Button component to `client/src/components/ui/`.

---

#### - [ ] Task 8
**Objective:** Configure a shared Axios instance with `baseURL: '/api'`, `withCredentials: true`, and a response interceptor that redirects to `/login` on 401.
**Dependencies:** Task 6
**Files Created:** `client/src/lib/axios.js`
**Files Modified:** None
**Acceptance Criteria:**
- Importing `axiosInstance` from `lib/axios.js` and calling `.get('/health')` returns the health response.
- A 401 response triggers navigation to `/login`.

---

### Phase 2 — Authentication

---

#### - [ ] Task 9
**Objective:** Create the `User` Mongoose model with fields: `studentId` (unique sparse), `fullName`, `email` (unique), `password` (hashed), `role` (enum: `admin`/`voter`), and a pre-save hook for bcrypt hashing.
**Dependencies:** Task 4
**Files Created:** `server/models/User.js`
**Files Modified:** None
**Acceptance Criteria:**
- Saving a User document hashes the password (not stored in plaintext).
- Saving two Users with the same `email` throws a duplicate key error.
- `role` defaults to `'voter'`.

---

#### - [ ] Task 10
**Objective:** Configure Passport.js with the `LocalStrategy` (authenticate by email + password) and implement `serializeUser` / `deserializeUser` using the User `_id`.
**Dependencies:** Task 5, Task 9
**Files Created:** `server/config/passport.js`
**Files Modified:** `server/server.js`
**Acceptance Criteria:**
- Calling `passport.authenticate('local')` with valid credentials resolves.
- `req.user` is populated on subsequent authenticated requests.
- `req.isAuthenticated()` returns `true` after login.

---

#### - [ ] Task 11
**Objective:** Implement auth routes: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.
**Dependencies:** Task 10
**Files Created:** `server/routes/auth.js`
**Files Modified:** `server/server.js`
**Acceptance Criteria:**
- `POST /register` with valid body creates a voter and returns `201`.
- `POST /register` with duplicate email returns `409`.
- `POST /login` with valid credentials returns `200` with user object (no password).
- `POST /login` with invalid credentials returns `401`.
- `POST /logout` destroys session and returns `200`.
- `GET /me` returns current user when authenticated, `401` when not.

---

#### - [ ] Task 12
**Objective:** Implement three reusable auth middleware functions: `requireAuth` (401 if not logged in), `requireAdmin` (403 if not admin), `requireVoter` (403 if not voter).
**Dependencies:** Task 11
**Files Created:** `server/middleware/auth.js`
**Files Modified:** None
**Acceptance Criteria:**
- Unauthenticated request to a `requireAuth`-guarded route returns `401`.
- Voter accessing a `requireAdmin`-guarded route returns `403`.
- Admin accessing a `requireVoter`-guarded route returns `403`.

---

#### - [ ] Task 13
**Objective:** Build the Register page with form fields (fullName, email, password, confirm password), client-side validation, and submission via the auth API service.
**Dependencies:** Task 7
**Files Created:** `client/src/pages/auth/RegisterPage.jsx`
**Files Modified:** `client/src/App.jsx`
**Acceptance Criteria:**
- Submitting valid data calls `POST /api/auth/register`.
- Password mismatch shows an inline error without submitting.
- Successful registration navigates to `/login`.
- Server errors (e.g., duplicate email) display a user-readable message.

---

#### - [ ] Task 14
**Objective:** Build the Login page with email and password fields, submission handling, and navigation to the appropriate dashboard based on role.
**Dependencies:** Task 7
**Files Created:** `client/src/pages/auth/LoginPage.jsx`
**Files Modified:** `client/src/App.jsx`
**Acceptance Criteria:**
- Successful login redirects admins to `/admin/elections`, voters to `/elections`.
- Invalid credentials display "Invalid email or password."
- Already-authenticated users visiting `/login` are redirected away.

---

#### - [ ] Task 15
**Objective:** Build the auth API service module with functions: `register(data)`, `login(data)`, `logout()`, `getMe()`.
**Dependencies:** Task 8, Task 11
**Files Created:** `client/src/services/authService.js`
**Files Modified:** None
**Acceptance Criteria:**
- Each function calls the correct endpoint using the shared Axios instance.
- Functions return the `data` field of the Axios response.

---

#### - [ ] Task 16
**Objective:** Build `AuthContext` providing `user`, `isLoading`, `login()`, `logout()`, and `register()` — loaded by calling `getMe()` on mount.
**Dependencies:** Task 15
**Files Created:** `client/src/context/AuthContext.jsx`, `client/src/hooks/useAuth.js`
**Files Modified:** `client/src/main.jsx`
**Acceptance Criteria:**
- `user` is `null` before login and a user object after.
- `isLoading` is `true` during the initial `getMe()` fetch.
- Calling `logout()` sets `user` to `null`.

---

#### - [ ] Task 17
**Objective:** Implement `PrivateRoute` (redirects to `/login` if not authenticated) and `AdminRoute` (redirects to `/unauthorized` if not admin). Add a basic `/unauthorized` page.
**Dependencies:** Task 16
**Files Created:** `client/src/components/routing/PrivateRoute.jsx`, `client/src/components/routing/AdminRoute.jsx`, `client/src/pages/UnauthorizedPage.jsx`
**Files Modified:** `client/src/App.jsx`
**Acceptance Criteria:**
- Unauthenticated user visiting `/admin/*` is redirected to `/login`.
- Voter visiting `/admin/*` is redirected to `/unauthorized`.
- Auth check waits for `isLoading` before redirecting (no flash).

---

### Phase 3 — User Management

---

#### - [ ] Task 18
**Objective:** Implement voter profile routes: `GET /api/users/me` and `PUT /api/users/me` for updating `fullName` and `studentId`.
**Dependencies:** Task 12
**Files Created:** `server/routes/users.js`
**Files Modified:** `server/server.js`
**Acceptance Criteria:**
- `PUT /api/users/me` with valid body updates and returns the user (no password).
- Email cannot be changed via this endpoint.
- Unauthenticated request returns `401`.

---

#### - [ ] Task 19
**Objective:** Implement admin voter management routes: `GET /api/admin/users` (paginated list of all voters) and `DELETE /api/admin/users/:id`.
**Dependencies:** Task 12
**Files Created:** `server/routes/admin/users.js`
**Files Modified:** `server/server.js`
**Acceptance Criteria:**
- `GET /api/admin/users` returns paginated voter list (exclude passwords).
- `DELETE /api/admin/users/:id` removes the voter.
- Both routes require `requireAdmin`.
- Deleting an admin account returns `403`.

---

#### - [ ] Task 20
**Objective:** Build the voter profile page showing current user info and an inline edit form for `fullName` and `studentId`.
**Dependencies:** Task 17, Task 18
**Files Created:** `client/src/pages/voter/ProfilePage.jsx`
**Files Modified:** `client/src/App.jsx`
**Acceptance Criteria:**
- Current user data pre-fills the form.
- Successful save shows a success message.
- The page is accessible at `/profile` and wrapped in `PrivateRoute`.

---

#### - [ ] Task 21
**Objective:** Build the admin voter list page with a searchable table showing all registered voters and a delete action with confirmation.
**Dependencies:** Task 17, Task 19
**Files Created:** `client/src/pages/admin/UsersPage.jsx`
**Files Modified:** `client/src/App.jsx`
**Acceptance Criteria:**
- Table lists all voters with columns: fullName, email, studentId, role.
- Search filters the list by name or email (client-side).
- Delete button shows a confirmation dialog before calling the API.
- The page is accessible at `/admin/users` and wrapped in `AdminRoute`.

---

#### - [ ] Task 22
**Objective:** Implement `PUT /api/users/me/password` route for changing the current user's password (requires old password verification) and a change-password form on the profile page.
**Dependencies:** Task 18, Task 20
**Files Created:** None
**Files Modified:** `server/routes/users.js`, `client/src/pages/voter/ProfilePage.jsx`
**Acceptance Criteria:**
- Route verifies old password with bcrypt before updating.
- Wrong old password returns `400`.
- New password is hashed before saving.
- Form has fields: current password, new password, confirm new password.

---

### Phase 4 — Election Management

---

#### - [ ] Task 23
**Objective:** Create the `Election` Mongoose model with fields: `title`, `description`, `startDate`, `endDate`, `status` (enum, default `upcoming`), `createdBy` (ref User), `deletedAt`.
**Dependencies:** Task 4
**Files Created:** `server/models/Election.js`
**Files Modified:** None
**Acceptance Criteria:**
- Invalid `status` value fails Mongoose validation.
- `deletedAt` is `null` by default.
- Model has a static method or query helper to filter out soft-deleted records.

---

#### - [ ] Task 24
**Objective:** Implement election CRUD routes: `POST /api/admin/elections`, `GET /api/elections`, `GET /api/elections/:id`, `PUT /api/admin/elections/:id`, `DELETE /api/admin/elections/:id` (soft delete, reject if active).
**Dependencies:** Task 23, Task 12
**Files Created:** `server/routes/admin/elections.js`, `server/routes/elections.js`
**Files Modified:** `server/server.js`
**Acceptance Criteria:**
- `POST` creates election with status `upcoming`, sets `createdBy` to `req.user._id`.
- `GET /api/elections` returns all non-deleted elections.
- `DELETE` on an active election returns `400`.
- `DELETE` sets `deletedAt` to current timestamp, does not remove the document.

---

#### - [ ] Task 25
**Objective:** Implement election status transition routes: `PATCH /api/admin/elections/:id/open` and `PATCH /api/admin/elections/:id/close` with lifecycle validation.
**Dependencies:** Task 24
**Files Created:** None
**Files Modified:** `server/routes/admin/elections.js`
**Acceptance Criteria:**
- `open`: requires status is `upcoming`, transitions to `active`.
- `close`: requires status is `active`, transitions to `closed`.
- Any other status combination returns `400` with a descriptive message.
- Closed elections cannot be reopened.

---

#### - [ ] Task 26
**Objective:** Build the admin election list page with a table of all elections, status badges, and action buttons (Edit, Open, Close, Delete).
**Dependencies:** Task 17, Task 25, Task 29
**Files Created:** `client/src/pages/admin/ElectionsPage.jsx`
**Files Modified:** `client/src/App.jsx`
**Acceptance Criteria:**
- Table shows: title, status badge, startDate, endDate, action buttons.
- Open/Close buttons are conditionally rendered based on current status.
- Delete shows a confirmation dialog.
- Accessible at `/admin/elections` wrapped in `AdminRoute`.

---

#### - [ ] Task 27
**Objective:** Build the election create/edit form page (shared component) with fields for title, description, startDate, endDate.
**Dependencies:** Task 17, Task 24
**Files Created:** `client/src/pages/admin/ElectionFormPage.jsx`
**Files Modified:** `client/src/App.jsx`
**Acceptance Criteria:**
- `/admin/elections/new` renders an empty form.
- `/admin/elections/:id/edit` pre-fills the form with existing data.
- Successful create navigates to `/admin/elections`.
- Successful update navigates back to the election list.

---

#### - [ ] Task 28
**Objective:** Build the voter-facing active elections list page showing only elections with status `active`.
**Dependencies:** Task 17, Task 24
**Files Created:** `client/src/pages/voter/ElectionsPage.jsx`
**Files Modified:** `client/src/App.jsx`
**Acceptance Criteria:**
- Only `active` elections are displayed.
- Each election card shows title, description, and a "Vote Now" button.
- Accessible at `/elections` wrapped in `PrivateRoute`.

---

#### - [ ] Task 29
**Objective:** Build the `ElectionStatusBadge` reusable component rendering colored badges for `upcoming` / `active` / `closed`.
**Dependencies:** Task 7
**Files Created:** `client/src/components/elections/ElectionStatusBadge.jsx`
**Files Modified:** None
**Acceptance Criteria:**
- `upcoming` → gray badge; `active` → green badge; `closed` → red badge.
- Component is used in both admin and voter election lists.

---

### Phase 5 — Position Management

---

#### - [ ] Task 30
**Objective:** Create the `Position` Mongoose model with fields: `electionId` (ref Election), `name`, `order` (Number, default 0).
**Dependencies:** Task 4, Task 23
**Files Created:** `server/models/Position.js`
**Files Modified:** None
**Acceptance Criteria:**
- Model references `Election` via `electionId`.
- Default sort by `order` ascending is defined.

---

#### - [ ] Task 31
**Objective:** Implement position CRUD routes scoped to an election: `POST /api/admin/elections/:electionId/positions`, `GET /api/elections/:electionId/positions`, `PUT /api/admin/positions/:id`, `DELETE /api/admin/positions/:id`.
**Dependencies:** Task 30, Task 12
**Files Created:** `server/routes/admin/positions.js`, `server/routes/positions.js`
**Files Modified:** `server/server.js`
**Acceptance Criteria:**
- `POST` requires admin; validates the election exists and is not closed.
- `DELETE` on a position that has votes returns `400` with a clear message.
- `GET` is accessible to authenticated users.

---

#### - [ ] Task 32
**Objective:** Build the admin position management page embedded within the election detail view, with a list of positions and create/edit/delete actions.
**Dependencies:** Task 17, Task 31, Task 27
**Files Created:** `client/src/pages/admin/ElectionDetailPage.jsx`
**Files Modified:** `client/src/App.jsx`
**Acceptance Criteria:**
- Accessible at `/admin/elections/:id`.
- Lists positions sorted by order.
- Inline "Add Position" form appears on button click.
- Edit and Delete actions work inline.

---

#### - [ ] Task 33
**Objective:** Build the `PositionFormModal` component (a dialog/modal for creating and editing positions).
**Dependencies:** Task 7, Task 31
**Files Created:** `client/src/components/positions/PositionFormModal.jsx`
**Files Modified:** None
**Acceptance Criteria:**
- Accepts `electionId`, optional `position` (for edit), and `onSuccess` callback.
- Submits to the correct endpoint based on create vs. edit mode.
- Closes on success and calls `onSuccess`.

---

### Phase 6 — Candidate Management

---

#### - [ ] Task 34
**Objective:** Create the `Candidate` Mongoose model with fields: `electionId` (ref Election), `positionId` (ref Position), `name`, `party`, `platform`, `imagePath`.
**Dependencies:** Task 4, Task 30
**Files Created:** `server/models/Candidate.js`
**Files Modified:** None
**Acceptance Criteria:**
- `electionId` and `positionId` are both required.
- `imagePath` is a String (relative path, nullable).

---

#### - [ ] Task 35
**Objective:** Configure Multer middleware for candidate image uploads with: destination `server/uploads/candidates/`, filename randomization, MIME type filter (JPEG/PNG/WebP only), and 2 MB size limit.
**Dependencies:** Task 2
**Files Created:** `server/middleware/upload.js`
**Files Modified:** None
**Acceptance Criteria:**
- Non-image uploads are rejected with a `400` error.
- Files over 2 MB are rejected.
- Saved filenames are random strings with the original extension (no user-controlled path segments).

---

#### - [ ] Task 36
**Objective:** Configure Express to serve `/uploads` as a static directory so uploaded images are accessible via `GET /uploads/candidates/<filename>`.
**Dependencies:** Task 35
**Files Created:** None
**Files Modified:** `server/server.js`
**Acceptance Criteria:**
- Uploading a test image and requesting the returned path returns the image with correct `Content-Type`.

---

#### - [ ] Task 37
**Objective:** Implement candidate CRUD routes: `POST /api/admin/candidates` (with image upload), `GET /api/elections/:electionId/candidates`, `PUT /api/admin/candidates/:id` (with optional image replace), `DELETE /api/admin/candidates/:id` (deletes image file).
**Dependencies:** Task 34, Task 35, Task 12
**Files Created:** `server/routes/admin/candidates.js`, `server/routes/candidates.js`
**Files Modified:** `server/server.js`
**Acceptance Criteria:**
- `POST` validates that `positionId` belongs to `electionId`.
- `DELETE` calls `fs.unlink` on the candidate's image file if it exists.
- `PUT` replaces old image file when a new one is uploaded.
- `GET` by election returns candidates filterable by `positionId`.

---

#### - [ ] Task 38
**Objective:** Build the admin candidate management section within the election detail page, showing candidates per position with add/edit/delete actions.
**Dependencies:** Task 17, Task 37, Task 32
**Files Created:** None
**Files Modified:** `client/src/pages/admin/ElectionDetailPage.jsx`
**Acceptance Criteria:**
- Each position section shows its candidates with name, party, and image thumbnail.
- "Add Candidate" button opens the candidate form modal.
- Delete shows a confirmation dialog.

---

#### - [ ] Task 39
**Objective:** Build the `CandidateFormModal` component with fields: name, party, platform (textarea), and image upload input with client-side preview.
**Dependencies:** Task 7, Task 37
**Files Created:** `client/src/components/candidates/CandidateFormModal.jsx`
**Files Modified:** None
**Acceptance Criteria:**
- Selecting an image file shows a preview before upload.
- Form submits as `multipart/form-data`.
- Works for both create (no initial data) and edit (pre-filled, image optional).

---

#### - [ ] Task 40
**Objective:** Build the `CandidateCard` display component showing candidate image, name, party, and platform — used in both admin and voter views.
**Dependencies:** Task 7, Task 36
**Files Created:** `client/src/components/candidates/CandidateCard.jsx`
**Files Modified:** None
**Acceptance Criteria:**
- Falls back to a placeholder avatar if `imagePath` is null.
- Accepts a `selected` boolean prop that renders a visual selection indicator.
- Accepts an `onClick` prop.

---

### Phase 7 — Voting

---

#### - [ ] Task 41
**Objective:** Create the `Vote` Mongoose model with fields: `electionId`, `positionId`, `candidateId`, `voterId`, `timestamp` — and a compound unique index on `{ electionId, positionId, voterId }`.
**Dependencies:** Task 4
**Files Created:** `server/models/Vote.js`
**Files Modified:** None
**Acceptance Criteria:**
- Attempting to insert two votes with the same `electionId + positionId + voterId` throws `E11000`.
- `timestamp` defaults to `Date.now`.

---

#### - [ ] Task 42
**Objective:** Implement the vote submission route: `POST /api/votes` — validates election is active, position belongs to election, candidate belongs to position, voter has not already voted for this position, then saves the vote.
**Dependencies:** Task 41, Task 12
**Files Created:** `server/routes/votes.js`
**Files Modified:** `server/server.js`
**Acceptance Criteria:**
- Returns `201` on success.
- Returns `400` if election is not active.
- Returns `409` if the voter already voted for that position (catches both app-level check and `E11000`).
- Returns `400` if `candidateId` does not belong to `positionId`.

---

#### - [ ] Task 43
**Objective:** Implement `GET /api/elections/:electionId/my-votes` returning the list of positionIds the current voter has already voted in for this election.
**Dependencies:** Task 42
**Files Created:** None
**Files Modified:** `server/routes/votes.js`
**Acceptance Criteria:**
- Returns an array of `positionId` strings.
- Returns `[]` if the voter has not voted in this election.
- Requires `requireVoter`.

---

#### - [ ] Task 44
**Objective:** Build the voter election ballot page at `/elections/:id/vote` that loads the election, its positions, candidates per position, and the voter's already-cast votes.
**Dependencies:** Task 17, Task 43, Task 40
**Files Created:** `client/src/pages/voter/BallotPage.jsx`
**Files Modified:** `client/src/App.jsx`
**Acceptance Criteria:**
- Redirects back to `/elections` if the election is not active.
- Shows all positions with their candidates.
- Positions already voted show the selected candidate highlighted and a "Voted" indicator.

---

#### - [ ] Task 45
**Objective:** Build the `BallotPosition` component — shows position name, a list of `CandidateCard`s for selection, and a "Cast Vote" button that is disabled if already voted.
**Dependencies:** Task 44
**Files Created:** `client/src/components/voting/BallotPosition.jsx`
**Files Modified:** None
**Acceptance Criteria:**
- Only one candidate can be selected at a time per position.
- "Cast Vote" is disabled if `alreadyVoted` is true.
- "Cast Vote" is disabled if no candidate is selected.
- On click, opens vote confirmation dialog.

---

#### - [ ] Task 46
**Objective:** Build the `VoteConfirmDialog` component that shows the selected candidate's name and position, and calls `POST /api/votes` on confirm.
**Dependencies:** Task 45
**Files Created:** `client/src/components/voting/VoteConfirmDialog.jsx`
**Files Modified:** None
**Acceptance Criteria:**
- Dialog shows "You are voting for [Candidate] for [Position]."
- Confirm button submits the vote and closes the dialog.
- On success, parent component marks the position as voted.
- On error, shows an error message inside the dialog.

---

#### - [ ] Task 47
**Objective:** Build the voter voting history page at `/history` showing all elections the voter has participated in and which candidates they voted for per position.
**Dependencies:** Task 17, Task 43
**Files Created:** `client/src/pages/voter/VotingHistoryPage.jsx`, `server/routes/votes.js` (new endpoint `GET /api/my-votes`)
**Files Modified:** `client/src/App.jsx`, `server/server.js`
**Acceptance Criteria:**
- Shows elections grouped by election title.
- Each group shows: position name → voted candidate name.
- Empty state message when no votes have been cast.

---

### Phase 8 — Results & Reporting

---

#### - [ ] Task 48
**Objective:** Implement results aggregation route `GET /api/elections/:id/results` that returns vote counts per candidate per position using a MongoDB aggregation pipeline.
**Dependencies:** Task 41, Task 12
**Files Created:** `server/routes/results.js`
**Files Modified:** `server/server.js`
**Acceptance Criteria:**
- Returns data shaped as: `{ positionId, positionName, candidates: [{ candidateId, name, party, imagePath, voteCount }] }[]` sorted by `voteCount` descending within each position.
- Accessible to `requireAdmin`.

---

#### - [ ] Task 49
**Objective:** Implement participation statistics route `GET /api/elections/:id/stats` returning: total registered voters, total unique voters who voted, turnout percentage, votes per position.
**Dependencies:** Task 48
**Files Created:** None
**Files Modified:** `server/routes/results.js`
**Acceptance Criteria:**
- `totalVoters` counts Users with `role: 'voter'`.
- `participatingVoters` counts distinct `voterId` values in Votes for this election.
- `turnout` is `(participatingVoters / totalVoters * 100).toFixed(1)`.

---

#### - [ ] Task 50
**Objective:** Build the admin results dashboard page at `/admin/elections/:id/results` composed of stats cards, bar charts, and candidate ranking tables.
**Dependencies:** Task 17, Task 49, Task 51, Task 52, Task 53
**Files Created:** `client/src/pages/admin/ResultsPage.jsx`
**Files Modified:** `client/src/App.jsx`
**Acceptance Criteria:**
- Page loads without error for elections with zero votes.
- Shows participation stats cards.
- Shows one chart/table per position.
- Accessible at `/admin/elections/:id/results` wrapped in `AdminRoute`.

---

#### - [ ] Task 51
**Objective:** Build the `VoteBarChart` component using Recharts `BarChart` to display vote counts per candidate for a single position.
**Dependencies:** Task 7, Task 48
**Files Created:** `client/src/components/results/VoteBarChart.jsx`
**Files Modified:** None
**Acceptance Criteria:**
- X-axis shows candidate names; Y-axis shows vote count.
- Bars are labeled with the vote count.
- Handles zero-vote state gracefully (renders empty chart, not an error).

---

#### - [ ] Task 52
**Objective:** Build the `CandidateRankingTable` component displaying candidates ranked by vote count with columns: rank, name, party, vote count, percentage.
**Dependencies:** Task 7, Task 48
**Files Created:** `client/src/components/results/CandidateRankingTable.jsx`
**Files Modified:** None
**Acceptance Criteria:**
- Leading candidate row is visually highlighted.
- Percentage column shows `(candidateVotes / totalVotesForPosition * 100).toFixed(1) + '%'`.

---

#### - [ ] Task 53
**Objective:** Build the `ParticipationStatsCards` component showing total voters, participating voters, and turnout percentage in shadcn Card components.
**Dependencies:** Task 7, Task 49
**Files Created:** `client/src/components/results/ParticipationStatsCards.jsx`
**Files Modified:** None
**Acceptance Criteria:**
- Three cards render side by side on desktop, stacked on mobile.
- Turnout card uses a color indicator: red below 50%, yellow 50–74%, green 75%+.

---

#### - [ ] Task 54
**Objective:** Implement CSV export route `GET /api/elections/:id/export/results` that generates and streams a CSV file of all results.
**Dependencies:** Task 48, Task 12
**Files Created:** None
**Files Modified:** `server/routes/results.js`
**Acceptance Criteria:**
- Response `Content-Type` is `text/csv`.
- `Content-Disposition: attachment; filename="election-results-<id>.csv"`.
- CSV has headers: Position, Candidate, Party, Votes, Percentage.
- Route requires `requireAdmin`.

---

#### - [ ] Task 55
**Objective:** Build the export report button on the results dashboard that triggers a CSV file download.
**Dependencies:** Task 54
**Files Created:** None
**Files Modified:** `client/src/pages/admin/ResultsPage.jsx`
**Acceptance Criteria:**
- Clicking "Export CSV" triggers a file download.
- Button is disabled while the election has zero votes.

---

### Phase 9 — UI Polish

---

#### - [ ] Task 56
**Objective:** Build a shared `Navbar` component with app title, current user display, role-appropriate navigation links, and logout button.
**Dependencies:** Task 7, Task 16
**Files Created:** `client/src/components/layout/Navbar.jsx`
**Files Modified:** None
**Acceptance Criteria:**
- Admin sees links to Elections, Users.
- Voter sees links to Elections, History, Profile.
- Logout calls `authService.logout()` and resets `AuthContext`.

---

#### - [ ] Task 57
**Objective:** Build the `AdminLayout` wrapper component with sidebar navigation and a main content area, used by all admin pages.
**Dependencies:** Task 56, Task 16
**Files Created:** `client/src/components/layout/AdminLayout.jsx`
**Files Modified:** `client/src/App.jsx`
**Acceptance Criteria:**
- Sidebar shows: Elections, Users navigation links.
- Active route is highlighted in the sidebar.
- Content area has consistent padding.

---

#### - [ ] Task 58
**Objective:** Build the `VoterLayout` wrapper component with the top navbar and content area, used by all voter pages.
**Dependencies:** Task 56, Task 16
**Files Created:** `client/src/components/layout/VoterLayout.jsx`
**Files Modified:** `client/src/App.jsx`
**Acceptance Criteria:**
- Navbar is present on all voter pages.
- Layout is consistent across Elections, Ballot, History, Profile pages.

---

#### - [ ] Task 59
**Objective:** Build reusable `LoadingSpinner` and `SkeletonCard` components and apply them as loading states on all data-fetching pages.
**Dependencies:** Task 7
**Files Created:** `client/src/components/ui/LoadingSpinner.jsx`, `client/src/components/ui/SkeletonCard.jsx`
**Files Modified:** All page components that fetch data
**Acceptance Criteria:**
- Every page that makes an API call shows a spinner or skeleton during `isLoading` state.
- No page renders an empty or broken layout while data is in flight.

---

#### - [ ] Task 60
**Objective:** Build an `ErrorBoundary` component and a `NotFoundPage` (404), and wire them into the router.
**Dependencies:** Task 7, Task 17
**Files Created:** `client/src/components/ErrorBoundary.jsx`, `client/src/pages/NotFoundPage.jsx`
**Files Modified:** `client/src/App.jsx`
**Acceptance Criteria:**
- Navigating to an unknown route renders the 404 page with a "Go Home" link.
- A runtime component error is caught by `ErrorBoundary` and shows a fallback UI.

---

#### - [ ] Task 61
**Objective:** Integrate a toast notification system (shadcn Sonner or `useToast`) and create a `showToast` utility used across all form submissions and mutations.
**Dependencies:** Task 7
**Files Created:** `client/src/lib/toast.js`
**Files Modified:** `client/src/main.jsx`, all form-submitting pages
**Acceptance Criteria:**
- Successful actions show a green success toast.
- Failed actions show a red error toast with the server error message.
- Toasts auto-dismiss after 4 seconds.

---

#### - [ ] Task 62
**Objective:** Build a reusable `ConfirmDialog` component used for all destructive actions (delete election, delete candidate, delete user).
**Dependencies:** Task 7, Task 61
**Files Created:** `client/src/components/ui/ConfirmDialog.jsx`
**Files Modified:** All pages with delete actions
**Acceptance Criteria:**
- Dialog shows a title and description passed as props.
- "Cancel" closes without action.
- "Confirm" calls an async `onConfirm` callback and shows a loading state on the button.

---

#### - [ ] Task 63
**Objective:** Audit and fix responsive layout across all pages — ensure all tables, forms, cards, and charts are usable on a 375px mobile viewport and a 1280px desktop viewport.
**Dependencies:** Task 50, Task 44, Task 26
**Files Created:** None
**Files Modified:** Various page and component files
**Acceptance Criteria:**
- No horizontal overflow on any page at 375px width.
- Tables on mobile collapse to cards or scroll horizontally within a container.
- Admin sidebar collapses to a hamburger menu on mobile.

---

### Phase 10 — Testing & Deployment

---

#### - [ ] Task 64
**Objective:** Create `server/.env.example` and `client/.env.example` with all required keys documented with descriptions.
**Dependencies:** Task 3
**Files Created:** `server/.env.example`, `client/.env.example`
**Files Modified:** None
**Acceptance Criteria:**
- Every environment variable used in the codebase has a corresponding entry in `.env.example`.
- Descriptions clarify the expected format.

---

#### - [ ] Task 65
**Objective:** Create a database seed script `server/scripts/seed.js` that creates one admin user, one voter user, one sample election with two positions and two candidates each.
**Dependencies:** Task 9, Task 23, Task 30, Task 34
**Files Created:** `server/scripts/seed.js`
**Files Modified:** `server/package.json`
**Acceptance Criteria:**
- Running `npm run seed` populates the database without errors.
- Running it twice does not create duplicates.
- Logs created resource IDs to the console.

---

#### - [ ] Task 66
**Objective:** Configure Vite production build and update the Express server to serve the built `client/dist` as static files with a catch-all route for client-side routing.
**Dependencies:** Task 7, Task 2
**Files Created:** None
**Files Modified:** `server/server.js`, `client/vite.config.js`
**Acceptance Criteria:**
- `npm run build` in `/client` produces a `dist/` directory.
- Visiting `http://localhost:5000/` after build serves the React app.
- Navigating directly to `/admin/elections` returns the React app (not 404).
- API routes under `/api` still work correctly.

---

#### - [ ] Task 67
**Objective:** Apply security hardening: add `express-rate-limit` to auth routes (15 requests / 15 min per IP), verify `helmet` headers are present, verify CORS allows only `CLIENT_URL`.
**Dependencies:** Task 5, Task 11
**Files Created:** None
**Files Modified:** `server/server.js`, `server/routes/auth.js`
**Acceptance Criteria:**
- More than 15 login attempts from one IP within 15 minutes returns `429`.
- Response headers include `X-Content-Type-Options`, `X-Frame-Options`.
- `OPTIONS` preflight request from a disallowed origin is rejected.

---

#### - [ ] Task 68
**Objective:** Manually test the full registration and login flow — register voter, login as voter, login as admin, logout.
**Dependencies:** Task 13, Task 14, Task 22
**Files Created:** None
**Files Modified:** None (fix any bugs found)
**Acceptance Criteria:**
- All four flows complete without console errors.
- Role-based redirects work correctly.
- Session persists across page refresh.

---

#### - [ ] Task 69
**Objective:** Manually test the complete election lifecycle — create election, add positions, add candidates with images, open election, vote as voter, close election, view results, export CSV.
**Dependencies:** Task 27, Task 31, Task 37, Task 44, Task 46, Task 50, Task 55
**Files Created:** None
**Files Modified:** None (fix any bugs found)
**Acceptance Criteria:**
- End-to-end flow completes without errors.
- Vote counts in results match votes cast.
- CSV export downloads and contains correct data.

---

#### - [ ] Task 70
**Objective:** Manually test duplicate vote prevention — attempt to vote twice for the same position in the same election.
**Dependencies:** Task 42, Task 45, Task 46
**Files Created:** None
**Files Modified:** None (fix any bugs found)
**Acceptance Criteria:**
- Second vote attempt returns `409` from the API.
- UI shows an appropriate error message.
- The vote count in the database remains 1.

---

#### - [ ] Task 71
**Objective:** Manually test candidate image upload, display, replacement on edit, and deletion cleanup.
**Dependencies:** Task 37, Task 39, Task 40
**Files Created:** None
**Files Modified:** None (fix any bugs found)
**Acceptance Criteria:**
- Uploaded images display correctly in candidate cards.
- Editing a candidate and uploading a new image replaces the old one (old file deleted from disk).
- Deleting a candidate removes its image file from disk.

---

#### - [ ] Task 72
**Objective:** Final review — verify `.env` is in `.gitignore`, no hardcoded secrets in source, all `console.log` statements are removed or gated behind `NODE_ENV`, and the seed script works on a fresh database.
**Dependencies:** Task 64, Task 65, Task 66, Task 67
**Files Created:** None
**Files Modified:** Any files with issues found
**Acceptance Criteria:**
- `git status` shows no `.env` file tracked.
- `grep -r "password123\|secret\|hardcoded" server/` returns no results.
- `npm run seed` on a fresh database completes successfully.

---

## Part 3 — Dependency Graph

Tasks where dependencies are purely sequential within a phase are listed for completeness. Tasks with no dependencies beyond the immediate prior task are omitted.

```
Task 2  → Task 1
Task 3  → Task 2
Task 4  → Task 3
Task 5  → Task 4
Task 6  → Task 1
Task 7  → Task 6
Task 8  → Task 6, Task 2

Task 9  → Task 4
Task 10 → Task 5, Task 9
Task 11 → Task 10
Task 12 → Task 11
Task 13 → Task 7
Task 14 → Task 7
Task 15 → Task 8, Task 11
Task 16 → Task 15, Task 14
Task 17 → Task 16, Task 12

Task 18 → Task 12, Task 9
Task 19 → Task 12, Task 9
Task 20 → Task 17, Task 18
Task 21 → Task 17, Task 19
Task 22 → Task 18, Task 20

Task 23 → Task 4
Task 24 → Task 23, Task 12
Task 25 → Task 24
Task 26 → Task 17, Task 25, Task 29
Task 27 → Task 17, Task 24
Task 28 → Task 17, Task 24
Task 29 → Task 7

Task 30 → Task 4, Task 23
Task 31 → Task 30, Task 12
Task 32 → Task 17, Task 31, Task 27
Task 33 → Task 7, Task 31

Task 34 → Task 4, Task 30
Task 35 → Task 2
Task 36 → Task 35
Task 37 → Task 34, Task 35, Task 12
Task 38 → Task 17, Task 37, Task 32
Task 39 → Task 7, Task 37
Task 40 → Task 7, Task 36

Task 41 → Task 4
Task 42 → Task 41, Task 12
Task 43 → Task 42
Task 44 → Task 17, Task 43, Task 40
Task 45 → Task 44
Task 46 → Task 45
Task 47 → Task 17, Task 43

Task 48 → Task 41, Task 12
Task 49 → Task 48
Task 50 → Task 17, Task 49, Task 51, Task 52, Task 53
Task 51 → Task 7, Task 48
Task 52 → Task 7, Task 48
Task 53 → Task 7, Task 49
Task 54 → Task 48, Task 12
Task 55 → Task 54

Task 56 → Task 7, Task 16
Task 57 → Task 56, Task 16
Task 58 → Task 56, Task 16
Task 59 → Task 7
Task 60 → Task 7, Task 17
Task 61 → Task 7
Task 62 → Task 7, Task 61
Task 63 → Task 50, Task 44, Task 26

Task 64 → Task 3
Task 65 → Task 9, Task 23, Task 30, Task 34
Task 66 → Task 7, Task 2
Task 67 → Task 5, Task 11
Task 68 → Task 13, Task 14, Task 22
Task 69 → Task 27, Task 31, Task 37, Task 44, Task 46, Task 50, Task 55
Task 70 → Task 42, Task 45, Task 46
Task 71 → Task 37, Task 39, Task 40
Task 72 → Task 64, Task 65, Task 66, Task 67
```

**Critical path (longest dependency chain):**

```
1 → 2 → 4 → 9 → 10 → 11 → 12 → 24 → 25 → 26 → 38 → 69
```

This chain cannot be parallelized. Everything else can run concurrently once its direct dependencies are met.

---

## Part 4 — Feature Prioritization

---

### MVP — Ship These or the System Does Not Work

| # | Feature | Tasks |
|---|---|---|
| 1 | Project setup + DB connection | 1–5 |
| 2 | Frontend scaffold + Axios | 6–8 |
| 3 | User registration, login, logout | 9–17 |
| 4 | Election CRUD + lifecycle (open/close) | 23–25 |
| 5 | Position CRUD | 30–31 |
| 6 | Candidate CRUD + image upload | 34–37 |
| 7 | Voter can view active elections | 28 |
| 8 | Ballot page + vote submission | 41–46 |
| 9 | Duplicate vote prevention (DB index) | 41, 42 |
| 10 | Basic results view (vote counts) | 48, 50–52 |
| 11 | Admin election list + candidate management UI | 26–27, 32, 38–39 |

---

### Recommended Build Order (7-Day Schedule)

| Day | Tasks | Goal |
|---|---|---|
| **Day 1** | 1–8 | Working full-stack scaffold, health check, Tailwind, Axios |
| **Day 2** | 9–17 | Auth complete — register, login, logout, route guards |
| **Day 3** | 23–29, 30–33 | Election + Position management (backend + admin UI) |
| **Day 4** | 34–40 | Candidate management + image upload |
| **Day 5** | 41–47 | Voting flow — ballot, submission, duplicate prevention |
| **Day 6** | 48–55, 56–62 | Results dashboard, CSV export, layouts, toasts |
| **Day 7** | 63–72, 18–22 | Polish, user profile, seed data, security hardening, testing |

---

### Nice-to-Have — Add If Time Permits

| Feature | Effort | Value |
|---|---|---|
| Voter profile + change password (Tasks 18–22) | Low | Medium — good for demo |
| Voting history page (Task 47) | Low | Medium |
| Responsive mobile layout (Task 63) | Medium | Low for defense/demo |
| Participation stats cards (Task 53) | Low | High visual impact for demo |
| Export CSV (Tasks 54–55) | Low | High for demo |
| Admin user management page (Task 21) | Low | Medium |
| Soft delete on Elections (part of Task 24) | Low | High for data integrity |
| Rate limiting on login (Task 67) | Low | High for defense questioning |

---

### Do Not Build (Out of Scope for 7 Days)

- Email verification on registration
- Password reset via email
- Real-time vote count updates (WebSocket)
- Cloudinary integration (keep local Multer)
- Automated date-based status transitions (cron job)
- Multi-language / i18n support
- Audit log collection
- PDF report export (CSV is sufficient)
- Vote anonymization / encryption
- Multi-admin ownership enforcement

---

## Key Architecture Decisions — Summary

| Decision | Recommendation | Rationale |
|---|---|---|
| Session store | `connect-mongo` | Survives restarts; zero extra infrastructure |
| Duplicate vote guard | DB unique index + app-layer check | Defense in depth against race conditions |
| `electionId` on Candidates | Keep (denormalized) | Simplifies queries; enforce consistency in route handler |
| `voterId` field name | Rename to `studentId` | Avoids confusion with MongoDB `_id` |
| Status transitions | Enforce `upcoming → active → closed` only | Prevents reopening contested elections |
| Image storage | Local Multer, relative path in DB | Fast to implement; path format supports future Cloudinary swap |
| Cascade delete | Implement in Election delete route | Prevents orphaned votes/candidates |
| Auth middleware | Three composable functions at router level | Prevents accidentally unguarded routes |

---

*72 tasks across 10 phases. All tasks are atomic and independently executable.*
*Use "Implement Task #N" or "Implement Tasks #N–M" to drive future implementation sessions.*
