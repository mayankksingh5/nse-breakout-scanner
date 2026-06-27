# Team Workspace (`/workspace`)

A simplified Jira/Trello-style task manager for a 5–10 person team, built into the
existing Next.js app. The public stock/IPO dashboard is unchanged and stays
public; the team workspace lives under `/workspace` and is gated behind login.
Sign-in is a global modal (header "Sign in"); `/login` remains as a fallback.
Legacy `/tasks/*` URLs permanently redirect to `/workspace/*`.

## What it does
- **Roles:** Admin (full control + member management) and Team Member.
- **Tasks:** create / edit / delete, assign & reassign, due date, priority
  (Low/Medium/High/Critical), workflow (New → In Progress → Review → Done → Closed).
- **Comments** with full history, and an **audit log** of every task change.
- **Views:** Dashboard, Kanban board (drag-and-drop), Table, My Tasks.
- **Members** admin page to add/edit/deactivate users.
- Search, filtering, sorting, responsive layout, dark mode (shared with the app).

## Stack
- Next.js API route handlers (REST) under `src/app/api/*`
- MongoDB (native driver) — `src/lib/server/mongo.ts`
- Auth: bcrypt password hashing + JWT in an httpOnly cookie (`jose`), enforced by
  `src/middleware.ts` and per-route `requireAuth`.

## Setup
1. **MongoDB:** create a free cluster at <https://www.mongodb.com/atlas> and copy the
   connection string.
2. **Env:** copy `frontend/.env.example` to `frontend/.env.local` and set:
   - `MONGODB_URI` — your Atlas string
   - `JWT_SECRET` — a long random value
     (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`)
   - `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` — your first admin login
3. **Install & seed:**
   ```bash
   cd frontend
   npm install
   npm run seed      # creates the admin + a few sample members/tasks
   ```
4. **Run:** `npm run dev`, then open <http://localhost:3000> and click **Sign in**
   (or go to `/workspace`).

## Deploying on Vercel
Add the same env vars (`MONGODB_URI`, `JWT_SECRET`, …) in **Project → Settings →
Environment Variables**. In Atlas, allow Vercel's egress (Network Access → allow
`0.0.0.0/0`, or Atlas + Vercel integration). Run the seed once locally against the
production `MONGODB_URI` (or temporarily set it and `npm run seed`).

## REST API summary
| Method | Path | Notes |
| --- | --- | --- |
| POST | `/api/auth/login` · `/api/auth/logout` | session cookie |
| GET | `/api/auth/me` | current user |
| GET/POST | `/api/users` | list (any) / create (admin) |
| PATCH/DELETE | `/api/users/[id]` | admin; DELETE soft-deactivates |
| GET/POST | `/api/tasks` | list (filters/sort/search) / create |
| GET/PATCH/DELETE | `/api/tasks/[id]` | detail+comments+audit / edit / delete |
| GET/POST | `/api/tasks/[id]/comments` | comment history / add |
| GET | `/api/dashboard/stats` | aggregated counts |

## Permissions
- **Admin:** everything, including user management and deleting any task.
- **Member:** create tasks; comment; change status/priority/due on tasks they
  created or are assigned to; reassign only on tasks they created. Deleting a task
  is limited to its creator or an admin.
