# SMB Ops Dashboard — Demo 1

A production-quality internal tool template: job-orders tracker for a small service business. Demonstrates full-stack Next.js with auth, a real DB schema, and a clean UI.

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

## Next steps to finish (~8h remaining)

1. **Data table** (3h) — `app/dashboard/page.tsx`: fetch JobOrders server-side, render with `@tanstack/react-table` + shadcn Table, add column sorting + search filter + pagination.
2. **Auth flow** (2h) — `app/login/page.tsx`: login form; middleware.ts to protect `/dashboard`; real credential check with bcrypt against DB users.
3. **Create/edit form** (2h) — modal dialog (`components/job-order-form.tsx`) with React Hook Form + Zod; server actions for create/update/delete.
4. **Deploy** (1h) — Railway project, attach Postgres addon, set env vars, `prisma migrate deploy`, verify live URL.

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
