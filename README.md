# Ops Dashboard

Messy spreadsheet to a real admin panel in two weeks. Portfolio demo for
custom internal-tool work: a job-orders tracker for a small service business.

## Case study

A walkthrough of how the two weeks break down, the schema choices, the CSV
import hero feature, and what a real client engagement would add or skip:
[docs/case-study.md](docs/case-study.md).

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
  PostgreSQL instance via Prisma. Seed rows are SSR&apos;d from Postgres;
  per-visitor uploads and manual entries are hydrated from the browser's
  localStorage on mount.
- `/upload` drag-and-drop CSV import. The server parses and maps columns,
  the browser saves the mapped rows to localStorage.
- NextAuth configured but disabled for the public demo; the `/dashboard`
  route would gate behind a session in production.

### Public demo storage

Uploaded rows and rows created via the `+ New order` button live only in
your browser's localStorage. They do not leave your machine. The seed
rows you see are SSR'd from a shared Postgres instance. In production,
the upload path writes to the same Postgres the seed reads from, behind
a signed-in session. Running the write path client-side for the public
demo removes the need for per-visitor session scoping, TTL cron sweeps,
and cross-visitor content filtering, because there is no shared write
surface.

### Local dev

```bash
cp .env.example .env.local
# Fill DATABASE_URL and NEXTAUTH_SECRET

pnpm install
pnpm db:push   # sync schema to local Postgres
pnpm dev       # http://localhost:3000
```

### Tests

Vitest powers the unit and route-handler tests. CI runs `pnpm test` on every
push, so a red test blocks merge alongside a failing build.

```bash
pnpm test          # one-shot run
pnpm test:watch    # re-run on file changes
```

### Accessibility

The site targets WCAG 2.1 AA. Concretely:

- `<html lang="en">` set, `<main id="main-content">` on every route, a
  skip-to-main-content link revealed on keyboard focus.
- Semantic landmarks: `<nav aria-label="Primary">`, `<main>`, `<footer>`,
  headings in order (h1 -> h2 -> h3) with no skips.
- Every interactive control is a real `<button>` or `<a>` with a visible
  focus ring. The CSV dropzone is a button, not a div-with-onclick, so it
  is reachable by keyboard.
- Form inputs (dashboard filters, new-order form) have explicit
  `<label htmlFor>` associations. The hidden file input uses `aria-label`.
- Icon-only and ambiguous-text buttons (`+ New order`, `Reset demo data`,
  back links) carry descriptive `aria-label`s.
- Status messages (CSV import flash, toast, inline error) use
  `role="status" aria-live="polite"` or `role="alert"` so screen readers
  announce them.
- Body copy runs slate-700 / slate-800 on white to clear the 4.5:1 AA
  contrast ratio; slate-500 is reserved for decorative separators and is
  marked `aria-hidden`.

A source-level canary test in `app/__tests__/a11y-canaries.test.ts`
guards the fixes above against regression.

### Deploy (Railway path)

1. Push to GitHub.
2. New Railway project, "Deploy from GitHub repo."
3. Add the Postgres plugin; Railway injects `DATABASE_URL`.
4. Add `NEXTAUTH_URL` (Railway domain) and `NEXTAUTH_SECRET`.
5. Start command: `pnpm build && pnpm start`.
6. First deploy: run `pnpm db:migrate` from the Railway shell.

### License

MIT.
