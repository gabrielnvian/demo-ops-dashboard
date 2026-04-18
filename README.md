# SMB Ops Dashboard

A production-quality internal tool: job-orders tracker for a small service business. Full-stack Next.js 14 + Prisma + PostgreSQL with a clean, searchable data table.

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 (App Router) + TypeScript |
| Database | PostgreSQL via Prisma ORM |
| UI | Tailwind CSS + shadcn/ui |
| Auth | NextAuth.js (credentials + JWT) |
| Deploy target | Railway (one-click Postgres + web service) |

## What's here (scaffold)

- `package.json` — all deps pinned; install with `pnpm install`
- `prisma/schema.prisma` — `JobOrder` model + NextAuth tables (`User`, `Account`, `Session`)
- `app/layout.tsx` + `app/page.tsx` — landing page
- `app/dashboard/page.tsx` — placeholder for the data table
- `app/api/auth/[...nextauth]/route.ts` — NextAuth API route
- `lib/prisma.ts` — singleton Prisma client (dev-safe)
- `lib/auth.ts` — NextAuth config (credentials provider placeholder)
- `lib/utils.ts` — shadcn `cn()` helper
- `components/ui/button.tsx` — first shadcn component

## What works in the demo

- Server-rendered landing page with live stats (`/`)
- Searchable, status-filterable job orders table (`/dashboard`)
- Real PostgreSQL via Prisma; 12 seeded sample orders
- Deployed and live

## What's scaffolded but gated behind auth

Auth (NextAuth.js) is wired but disabled for the public demo. In a real deployment the `/dashboard` route would require a logged-in session.

The create/edit flow (dialog + server actions + validation) is a natural next iteration — the schema and layout are ready for it.

## Local dev quickstart

```bash
cp .env.example .env.local
# Fill in DATABASE_URL and NEXTAUTH_SECRET in .env.local

pnpm install
pnpm db:push          # push schema to local Postgres (no migration history)
pnpm dev              # http://localhost:3000
```

## Deploy to Railway

1. Push repo to GitHub.
2. New Railway project → "Deploy from GitHub repo".
3. Add Postgres plugin → copy `DATABASE_URL` to env vars.
4. Add `NEXTAUTH_URL` (your Railway domain) and `NEXTAUTH_SECRET`.
5. Set start command: `pnpm build && pnpm start`.
6. Run `pnpm db:migrate` via Railway shell on first deploy.
