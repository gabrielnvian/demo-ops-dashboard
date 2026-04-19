# Ops Dashboard

Messy spreadsheet to a real admin panel in two weeks. Portfolio demo for
custom internal-tool work: a job-orders tracker for a small service business.

## What you get

- **A deployed admin panel.** Auth, database, and CI/CD included. Not a Figma
  mock, not a localhost toy.
- **Docs and handoff.** Schema diagrams, README, and a walkthrough so your
  team owns the code after day fourteen.
- **Two weeks from scope call to shipped.** Fixed-price, milestone-based.

Typical scope is $3,500. Range $5k-$15k depending on integrations.

## Who this is for

- Ops teams living in a shared spreadsheet that keeps breaking.
- Startups outgrowing Retool or Airtable and wanting to own the code.
- Small businesses one real tool away from unblocking operations, not ready
  for a full engineering hire.

## About

Gabriel Vian builds and ships full-stack internal tools for SMBs and
startups. Design, database, API, deploy, and handoff, from one person.

Contact: gvian07@gmail.com

---

## For developers

This section is the part that names the stack.

### Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 (App Router) + TypeScript |
| Database | PostgreSQL via Prisma ORM |
| UI | Tailwind CSS + shadcn/ui primitives |
| Auth | NextAuth.js (credentials + JWT, scaffolded) |
| Deploy | systemd unit on the portfolio host; Railway-ready |

### Schema

One core model (`JobOrder`) plus the NextAuth tables (`User`, `Account`,
`Session`). See `prisma/schema.prisma`.

`JobOrder` fields: id, title, customer, status (enum: PENDING /
IN_PROGRESS / COMPLETED / CANCELLED), notes, dueAt, createdAt, updatedAt.

### What's wired

- `/` server-rendered landing with live counts from Postgres.
- `/dashboard` searchable, status-filterable table against a real
  PostgreSQL instance via Prisma.
- NextAuth configured but disabled for the public demo; the `/dashboard`
  route would gate behind a session in production.
- Create and edit flows are scaffolded (dialog + server actions) but
  disabled on the public demo.

### Local dev

```bash
cp .env.example .env.local
# Fill DATABASE_URL and NEXTAUTH_SECRET

pnpm install
pnpm db:push   # sync schema to local Postgres
pnpm dev       # http://localhost:3000
```

### Deploy (Railway path)

1. Push to GitHub.
2. New Railway project, "Deploy from GitHub repo."
3. Add the Postgres plugin; Railway injects `DATABASE_URL`.
4. Add `NEXTAUTH_URL` (Railway domain) and `NEXTAUTH_SECRET`.
5. Start command: `pnpm build && pnpm start`.
6. First deploy: run `pnpm db:migrate` from the Railway shell.

### License

MIT.
