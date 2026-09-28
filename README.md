# INMA — Internship Performance Matrix

Internal web application for managing and monitoring interns. It answers one question:

> **What is each intern working on today, what is the progress, and is anything blocking them?**

Mobile-first, server-rendered, and deliberately lightweight. It is **not** a full HRIS.

## Stack

| Layer      | Technology                                             |
| ---------- | ------------------------------------------------------ |
| Framework  | Next.js 16 (App Router, Turbopack), React 19            |
| Language   | TypeScript (strict)                                     |
| Styling    | Tailwind CSS v4, shadcn/ui-style components, Lucide     |
| Database   | PostgreSQL + Drizzle ORM / Drizzle Kit                  |
| Auth       | Auth.js (NextAuth v5 beta), Credentials + JWT sessions  |
| Validation | Zod (server-side)                                       |
| Testing    | Vitest                                                  |
| Deployment | Docker (standalone output) → Coolify                    |

## Prerequisites

- Node.js 22+
- PostgreSQL 17 (local, Docker, or Coolify-managed)

## Local setup

```bash
# 1. Environment
cp .env.example .env
#   then set DATABASE_URL and AUTH_SECRET

# 2. Dependencies
npm install

# 3. Schema + seed data
npm run db:migrate
npm run db:seed

# 4. Run
npm run dev
```

The app is served at `http://localhost:3000` and redirects to `/login`.

### Seeded accounts

`npm run db:seed` is an **idempotent bootstrap**: it creates the admin, the
mentor, and every intern in the roster defined in `src/db/seed.ts` (currently
**24 interns**, all mentored by `mentor@bpsjakpus.cloud`). It never deletes
domain data and never overwrites an existing password, so it is safe to re-run.

| Account | Email | Notes |
| ------- | ----- | ----- |
| ADMIN  | `SEED_ADMIN_EMAIL` (default `admin@example.com`) | |
| MENTOR | `SEED_MENTOR_EMAIL` (default `mentor@bpsjakpus.cloud`) | owns the whole roster |
| INTERN | the roster in `src/db/seed.ts` | 24 accounts |

Passwords come from `SEED_ADMIN_PASSWORD`, `SEED_MENTOR_PASSWORD` and
`SEED_INTERN_PASSWORD` (all default to `Password123!` for local development).

> **Production:** set the `SEED_*_PASSWORD` variables before the first deploy.
> The seed never re-hashes existing passwords, so rotating a password later via
> **Users → Reset password** is preserved. `npm run db:seed:demo` adds sample
> work data and is intended for local databases only.

## npm scripts

| Script                | Purpose                             |
| --------------------- | ----------------------------------- |
| `npm run dev`         | Start the development server        |
| `npm run build`       | Production build                    |
| `npm run start`       | Start the production server         |
| `npm run lint`        | ESLint                              |
| `npm run typecheck`   | `tsc --noEmit`                      |
| `npm run db:generate` | Generate SQL migrations from schema |
| `npm run db:migrate`  | Apply migrations                    |
| `npm run db:push`     | Push schema directly (dev only)     |
| `npm run db:seed`     | Idempotent bootstrap seed (real accounts) |
| `npm run db:seed:demo`| Local-only demo work data (tasks/activities) |
| `npm run db:bundle`   | Bundle migrate + seed for the production image |
| `npm test`            | Run Vitest once                     |
| `npm run test:watch`  | Run Vitest in watch mode            |

> **Note on `npm run start`:** it prints a warning because the build uses
> `output: "standalone"`. It still serves the app. The production Docker image runs
> `node .next/standalone/server.js` instead (the `Dockerfile` also copies
> `.next/static` and `public` into the standalone output).

## Calendar (`/calendar`)

A month grid for **interns and mentors** (admins get a company-wide view). It is
server-rendered with plain links (`?month=YYYY-MM&date=YYYY-MM-DD`), so it works
without client JavaScript and stays fast on mobile.

- **Intern** — each day shows whether an entry exists (filled dot = submitted,
  outline dot = draft). A "Rekap entri bulan ini" card counts filled days and
  lists the exact dates still missing, so it is obvious *whether work has been
  entered for a given day*. Selecting a day shows the entry and the work items
  that were logged.
- **Mentor** — each day shows how many interns entered work (badge). Selecting a
  day lists **who worked** (with the tasks they logged and any blocker) plus a
  ✔/✘ checklist of every intern marked "Sudah entri" / "Belum entri".
- Access is scoped: a mentor only sees their own interns, an intern only their
  own entries.

## Daily activity work items

The day's work is **defined by the mentor** (via task assignment); the intern
merely picks from a dropdown in the daily check-in form. Selections are stored
in `daily_activity_tasks`, so a day can be linked to several tasks. The free-text
field is now an optional note rather than the primary input, and the form
requires either at least one selected work item or a note. Interns can only log
work against tasks actually assigned to them (enforced server-side).

## UI principles (kept deliberately simple)

Every page is built to a small set of density rules so a single screen stays
scannable, while the flow remains one-directional and obvious:

- **One primary job per page.** Summary first, detail on demand.
- **One summary card per role** on the dashboard (period + key numbers +
  check-in status in a single card) instead of a grid of separate stat cards.
- **Collapsible detail** for secondary information (the role workflow, the
  monthly entry recap) using native `<details>` — no client JS, keyboard
  accessible, and closed by default so it never dominates the page.
- **Dense one-line rows** (`ListCard`/`ListRow`) for lists that replace tall
  cards, so several records fit on one mobile screen.
- **No duplicated controls.** A single filter entry point per page; no repeated
  status badges that merely restate an active filter.
- **Answers merged, not stacked.** The calendar shows one list per person that
  answers both "who worked?" and "has this person entered?".

### Intern recording flow (fast + accurate)

The intern's main job is to record today's work, so that path is the shortest:

- The dashboard summary card shows the check-in status, the work items already
  recorded today (as chips), and **one full-width primary button** to record.
- The check-in form requires **one interaction**: pick the work item from the
  mentor-defined dropdown, then tap **Kirim**. Progress, blocker, note and next
  step live behind a collapsed "Tambah detail (opsional)".
- After saving, the form stays usable (no dead-end success screen), so another
  item can be added immediately.
- Accuracy guards: only mentor-assigned tasks appear in the dropdown, they are
  listed active-first, `Selesai` / `Terhambat` states are labelled, and the
  server rejects logging work against a task not assigned to that intern.
- The intern's Tasks page has **no filter controls** (an intern only has their
  own tasks), and the dashboard no longer duplicates the feedback list — it
  lives on the task detail and performance screens.

## Roles

- **ADMIN** — users, interns, mentors, departments, tasks, performance criteria.
- **MENTOR** — assigned interns, task assignment and updates, daily activity monitoring, feedback, performance reviews.
- **INTERN** — own tasks and progress, daily activity check-in, own activity history, mentor feedback, own performance.

Every permission is enforced **server-side** (`src/server/auth` and
`src/server/permissions`). Hiding a button is never authorization.

## Core workflow

```
Mentor creates task → Intern sees task → Intern updates progress
   → Intern submits daily activity → Mentor monitors activity
   → Mentor gives feedback → Task completed
   → Activity becomes evidence for the performance review
```

## Task assignment (multiple assignees)

A task can be worked on by **more than one intern**. Assignment lives in the
`task_assignees` join table instead of a single column, so:

- every assignee sees the task on their own task list and dashboard, and each of
  them can update its progress/status (the progress is shared by the task);
- a mentor may only assign interns they actually mentor;
- a mentor can open a task only if they mentor at least one assignee, or they
  created the task — other mentors are denied (403);
- feedback on a shared task is still addressed to **one** intern, so the reviewer
  picks the recipient in the feedback form.

The migration that introduced this model backfills every pre-existing
`tasks.intern_id` into `task_assignees`, so no assignment data is lost.

## Dashboard

Each role lands on a tailored dashboard whose first block is that role's
**business flow** — *Alur kerja intern / mentor / administrator* — with the
current step highlighted from live data (e.g. an intern who has not checked in
yet sees step 3 "Check-in aktivitas harian" marked as *sekarang*). Operational
metrics and lists follow below.

## Timezone

Timestamps are stored in **UTC**. All business dates (daily activity "today",
overdue checks, internship progress) are calculated in `APP_TIMEZONE`
(default `Asia/Jakarta`) through a single module, `src/lib/date.ts`.

## Docker

```bash
docker compose up --build
```

This starts PostgreSQL plus the application. For a standalone production image:

```bash
docker build -t inma .
docker run --env-file .env -p 3000:3000 inma
```

The image uses the Next.js `standalone` output and runs as a non-root user.

## Deploying to Coolify

> **Panduan lengkap langkah-demi-langkah: [`DEPLOY.md`](./DEPLOY.md)** — mencakup
> pembuatan database, konfigurasi environment, seeding deploy pertama, domain/HTTPS,
> checklist verifikasi, rollback, dan troubleshooting.

1. Point Coolify at this repository and choose **Dockerfile** as the build pack.
2. Set the environment variables in Coolify (never commit `.env`):
   - `DATABASE_URL` — connection string for the provisioned PostgreSQL
   - `AUTH_SECRET` — a long random secret
   - `NEXT_PUBLIC_APP_URL` — the public URL
   - `APP_TIMEZONE` — e.g. `Asia/Jakarta`
   - `SEED_ADMIN_PASSWORD`, `SEED_MENTOR_PASSWORD`, `SEED_INTERN_PASSWORD` — **change these**
   - optional: `SEED_ADMIN_EMAIL`, `SEED_MENTOR_EMAIL`, `SEED_MENTOR_NAME`,
     `SEED_INTERNSHIP_START`, `SEED_INTERNSHIP_DAYS`
3. Expose port `3000`. The health check is `GET /api/health`.
4. **First deployment:** set `RUN_SEED_ON_START=true`. The container entrypoint
   applies migrations, then runs the (idempotent) seed, then starts the server.
   After the first successful deploy you can set it back to `false`.

### What runs automatically on container start

`docker-entrypoint.sh` executes:

1. `node ./db/migrate.mjs` — applies pending SQL migrations. **Fatal** on
   failure: the app refuses to start with an unmigrated schema.
2. `node ./db/seed.mjs` — only when `RUN_SEED_ON_START=true`. **Non-fatal**: a
   seed problem is logged but never takes the app offline.

Both are self-contained bundles built by `npm run db:bundle`, so the production
image needs no dev toolchain (`drizzle-kit`, `tsx` are not installed there).

### What the seed creates

| Item | Value |
| ---- | ----- |
| Admin | `SEED_ADMIN_EMAIL` (default `admin@example.com`) |
| Mentor | `SEED_MENTOR_EMAIL` (default `mentor@bpsjakpus.cloud`) |
| Interns | 24 accounts with ACTIVE internships, all mentored by the mentor above |
| Departments | `GEMPITA` — every intern is placed in this single department |
| Performance criteria | 5 criteria, weights totalling 100 |

The seed **never deletes domain data** and re-running it is a no-op (`0 created`
in the summary). It also removes the accounts created by the earlier demo seed
(`budi@`, `sinta@`, `andi@`, `rara@`, `mentor@example.com`, `mentor2@example.com`)
if they still exist. It does **not** fabricate tasks, activities, feedback or
reviews for real interns — use `npm run db:seed:demo` on a local database only.

> **Security:** the default password is `Password123!`. Set the `SEED_*_PASSWORD`
> variables in Coolify before the first deploy. Existing passwords are never
> re-hashed by the seed, so an admin can safely rotate passwords later via
> **Users → Reset password**.

## Project structure

```
src/
├── app/                 # App Router routes (auth + dashboard groups, api/health)
├── actions/             # Server Actions (auth, tasks, activities, feedback, performance, users, ...)
├── components/          # ui/ primitives, layout/ shell, and domain components
├── db/                  # Drizzle client, schema/, seed.ts
├── lib/                 # utils, date, validations, rate-limit, logger, constants
├── server/
│   ├── auth/            # session helpers (requireAuth, requireRole)
│   ├── permissions/     # resource-level authorization
│   └── queries/         # aggregation/batched read queries (no N+1)
└── types/
```

## Health check

```bash
curl http://localhost:3000/api/health
# {"status":"ok"}
```

Returns `503 {"status":"degraded"}` when the database is unreachable. It never
exposes database details. Unknown-route handling lives in `src/app/not-found.tsx`,
and unexpected errors render `src/app/(dashboard)/error.tsx`.

## Known deviations from the PRD

- Tasks are **many-to-many** with interns via `task_assignees`, replacing the
  PRD's single `tasks.intern_id`, because a task can be worked on by more than
  one person. The migration backfills existing assignments.
- `performance_reviews.overall_score` uses `numeric(5,2)` instead of the PRD's
  `numeric(3,2)`, which cannot store values ≥ 10 (a weighted score of `74.00`
  overflows it).
- `daily_activities.summary` is nullable, because the day's work is now captured
  structurally by selecting mentor-assigned tasks from a dropdown. The form
  requires at least one selected work item **or** a note.
- No `Calendar`/date-picker component: native `<input type="date">` is used, which
  is the better control on the mobile-first target device.
- The task/intern filter forms are server-rendered `GET` forms (progressive
  enhancement) rather than client-side `Select` state, so they work without JS.
