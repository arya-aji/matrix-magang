# INMA — Monitoring Target Entri Dokumen

Internal web application for monitoring the **daily document-entry target** of
interns. Each intern records document entries one by one — a **Nama Usaha**
(business name) or **Nama Keluarga** (family/household name) — and the app
compares the daily total against one shared target that applies to every intern.

Mobile-first, server-rendered, and deliberately lightweight.

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

`npm run db:seed` is an **idempotent bootstrap**: it creates the admin and every
intern in the roster defined in `src/db/seed.ts` (currently **24 interns**, all in
the `GEMPITA` department). It never deletes domain data and never overwrites an
existing password, so it is safe to re-run.

| Account | Email | Notes |
| ------- | ----- | ----- |
| ADMIN  | `SEED_ADMIN_EMAIL` (default `admin@example.com`) | manages the whole app |
| INTERN | the roster in `src/db/seed.ts` | 24 accounts |

Passwords come from `SEED_ADMIN_PASSWORD` and `SEED_INTERN_PASSWORD` (both
default to `Password123!` for local development).

> **Production:** set the `SEED_*_PASSWORD` variables before the first deploy.
> The seed never re-hashes existing passwords, so rotating a password later via
> **Users → Reset password** is preserved. `npm run db:seed:demo` adds sample
> document entries and is intended for local databases only.

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
| `npm run db:seed:demo`| Local-only demo entry data          |
| `npm run db:bundle`   | Bundle migrate + seed for the production image |
| `npm test`            | Run Vitest once                     |
| `npm run test:watch`  | Run Vitest in watch mode            |

## Roles

- **ADMIN** — users, interns (roster + internship period), departments, the shared
  daily target, and monitoring of every intern's progress.
- **INTERN** — record today's document entries, view today's progress and history.

Every permission is enforced **server-side** (`src/server/auth` and
`src/server/permissions`). Hiding a button is never authorization.

## Core workflow

```
Admin sets the daily target + interns (period, department)
   → Intern enters names one by one (Usaha/Keluarga) on /entri
   → Each entry counts toward today's progress vs the target
   → Admin watches every intern on /monitoring (per date, drill-down per intern)
```

## Pages

| Route            | Role   | Purpose                                                        |
| ---------------- | ------ | -------------------------------------------------------------- |
| `/dashboard`     | both   | Today's progress summary (intern) / company overview (admin)    |
| `/entri`         | INTERN | Fast entry form + today's entries + progress bar                |
| `/riwayat`       | INTERN | Daily totals for the last 30 days                               |
| `/monitoring`    | ADMIN  | All interns for a selected date: count vs target, met/not met   |
| `/interns/[id]`  | ADMIN  | One intern: today's entries + 30-day history                    |
| `/interns`       | ADMIN  | Roster management (internship period, department, status)       |
| `/users`         | ADMIN  | Account management (ADMIN / INTERN)                             |
| `/departments`   | ADMIN  | Department management                                           |
| `/settings`      | ADMIN  | Shared daily entry target                                       |

## Data model

- `users` — accounts with role `ADMIN` or `INTERN`.
- `internships` — one row per intern (period, department, status).
- `document_entries` — one row per entered name (`intern_id`, `entry_date`,
  `name`, `kind` = `USAHA`/`KELUARGA`, optional note).
- `app_settings` — a singleton row holding the shared `daily_target`.

Progress for a day is simply `COUNT(document_entries)` for that intern and
business date (Asia/Jakarta), compared to `daily_target`.

## Migrations

The overhaul to the document-entry model is captured in three migrations:

- `0004` — drops the previous tables (tasks, daily activities, feedback,
  performance reviews, calendar data).
- `0005` — adds `app_settings` and `document_entries`.
- `0006` — retires the `MENTOR` role and removes `internships.mentor_id`.

Apply with `npm run db:migrate`. **The old tables are dropped**, so run it only
when the previous data is disposable (it was demo/seed data).
