# Case Study: Messy Spreadsheet to a Deployed Admin in Two Weeks

> **Note on framing:** This repo is a portfolio exercise, not a paid client engagement. The scenario below is a realistic small-services-business ops workflow modeled on the kind of 10-40 person operation that typically hires me: an HVAC contractor, an electrician, an appliance-repair shop, a plumbing outfit, a landscaping crew. No real customer names, no fabricated testimonials. The shape of the build, the schema, the code, and the cadence are the real thing. Swap the scenario for yours and the story mostly holds.

---

## The Hook

This is the shape of an internal tool I ship in two weeks: a deployed admin panel with a real database, real search, real filters, and a CSV drop that turns any visitor's spreadsheet into a working dashboard in seconds.

---

## The Scenario

Picture a 25-person electrical services outfit. Twelve licensed techs in the field, three dispatchers, a scheduler, an office manager, two owners, a handful of apprentices and admin staff. The business lives inside three Google Sheets. One is the master jobs list, maintained by the scheduler. One is the tech-assignment grid, kept by dispatch. The third is a "pending estimates" sheet the owner edits from her phone on the way to quotes. All three overlap. None of them agree.

The operational failure mode is always the same. A customer calls in the morning: "where is my guy?" The dispatcher pulls up the tech-assignment grid. The job is there, scheduled for 9:00. The tech is not there. The dispatcher calls him; he is at a different job because the scheduler moved it yesterday in the master sheet without syncing the grid. The customer is already angry. The office manager writes it up as "rescheduling mishap" in a fourth document nobody looks at. By Friday the owner wants a list of every open job over five days old, and the only way to answer is to sit down for ninety minutes with three tabs open, reconciling by hand.

What they actually need is boring. A single source of truth for job orders. Status (pending, in progress, completed, cancelled). Customer, title, due date, notes. Search. Filters. The ability for the scheduler to add a new job and have the dispatcher see it in the same breath. Nothing about that is complicated. Spreadsheets cannot give it to them because spreadsheets have no constraints, no enum for status, no "who touched this last," and no way to prevent two people from overwriting the same row. They need a real admin panel. They do not need Salesforce. They do not have budget for Salesforce. They have budget for two weeks of focused work from one engineer.

---

## What I Shipped

The live demo is the shape of the deliverable. Four surfaces:

1. **Landing page (`/`).** Outcome-first hero, what you get, who it is for, how the two weeks break down, live counts pulled from Postgres so nothing on the page is static marketing. `{screenshot: landing-hero}`
2. **Dashboard (`/dashboard`).** Server-rendered table of job orders, full-text search across title, customer, and notes, status filter with live counts per status, status badges, and a "+ New order" inline form that writes to the visitor's browser. `{screenshot: dashboard-view}`
3. **Upload page (`/upload`).** Drag-and-drop CSV flow. Server parses with papaparse, infers columns, shows a preview of the first rows and what is mappable, then a single "Import" button writes the rows to the same Postgres the dashboard reads from. `{screenshot: upload-preview}`
4. **For the public demo only:** uploaded rows and rows created via the "+ New order" button are scoped to the visitor's browser. They are written to localStorage by the client, merged into the dashboard on mount, and never travel over the network after the initial parse. Seeded demo data is persistent in Postgres; uploaded rows wear an "uploaded" badge. This lets any visitor touch a real insert without the demo becoming a graveyard of other people's data, and without standing up per-visitor session scoping or a TTL cron on the server.

What the demo is not: an auth-gated production app. NextAuth is scaffolded (User, Account, Session tables, credentials provider wired) but the gate is open on the public deploy so a visitor can actually use it. In a real client engagement this flips on in the first hour of week two and nobody except signed-in staff hits `/dashboard` again.

---

## Week 1: Schema and Mock

The two-week clock starts at the scope call. By end of day one I have the shape of the data, the rate quoted, and a signed SOW. Day two is schema. Day three is a clickable mock running against the real schema. Everything in week one is cheap to change. Everything in week two is not. So week one exists to make sure we never find out in week two that we modeled the wrong thing.

The core model ended up looking like this:

```prisma
model JobOrder {
  id         String        @id @default(cuid())
  title      String
  status     JobStatus     @default(PENDING)
  customer   String
  createdAt  DateTime      @default(now())
  dueAt      DateTime?
  notes      String?       @db.Text
  updatedAt  DateTime      @updatedAt
}

enum JobStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  CANCELLED
}
```

A few choices worth calling out, because they matter more than they look:

**Status is an enum, not a free-text string.** Spreadsheets have "in progress", "In Progress", "in-progress", "WIP", "working on it" all in the same column. Rolling that up by status becomes a regex exercise. An enum at the database level means the four states are the four states, the UI can render a filter dropdown from them, and the status badge colors can live in one place. It also means the day an owner says "I want to add an 'on hold' state," there is exactly one migration and the app picks it up.

**`customer` is a scalar string, not a foreign key to a Customer table.** This is a deliberate simplification. The 25-person outfit does not have clean customer records; the scheduler just types names. A real engagement might start here and grow into a `Customer` table once duplicates become painful. Ship the simple version first; the harder version is a migration, not a rewrite.

**`dueAt` is nullable.** Not every job has a committed due date on day one (quotes, standing maintenance contracts, anything pending an estimate). Making the field required would force the scheduler to invent a date, which means the data lies. Nullable is honest.

**`createdAt` and `updatedAt` are automatic.** Prisma populates both. The "who changed this last" question is out of scope for a two-week engagement; an audit log is a real-client feature and gets called out in "what I skipped" below. But `updatedAt` alone makes it possible to ask "what rows moved today" without any extra wiring.

**The schema is clean.** No demo-only columns leak in. The public demo keeps uploaded rows in the visitor's browser via localStorage rather than adding a TTL column to the shared table, so the schema shown to tech evaluators is the same schema a real client engagement starts from.

By end of day three the mock is running: same schema, seeded with twelve job orders in four statuses across eight plausible customers, sample titles that look like real field work ("replace condenser unit - main building," "diagnose intermittent tripping breaker," "emergency leak repair - kitchen"). The scheduler can open the dashboard and see something that feels like her week. This is the moment where scope either holds or moves. If she squints at the seeded data and says "we also need to track which tech is assigned, and whether it billed," that's a week-one conversation, not a week-two surprise, and I still have four days before a line of production code gets written.

## Week 2: Build and Deploy

Week two is linear. The surfaces are known, the schema is approved, and the goal is a deployed, documented, handoff-ready app by the end of day fourteen.

**Day 4 to 5.** Next.js 14 App Router project stood up, Tailwind and Prisma wired, seed script authored, local Postgres running. Dashboard page converted from mock into a real Server Component against Prisma. Search and status filter implemented as URL params so the state is shareable and the browser back button works without any client-side state machine.

**Day 6 to 7.** The CSV upload hero feature (its own section below). This is where the two weeks earns its keep vs a Retool equivalent.

**Day 8.** NextAuth scaffolded. Credentials provider, JWT sessions, User/Account/Session tables. On the public demo the gate stays off; on a real deployment this is the day `/dashboard` becomes private and `/login` becomes the only unauthenticated surface.

**Day 9.** Polish pass. Empty states, loading states, error states. Status badges. Relative date formatting ("in 3 days," "yesterday"). Friendly copy in every place the user might get stuck.

**Day 10.** Deploy. For this portfolio demo the deploy target is a systemd unit on the portfolio host; for a real client it is almost always Railway (Postgres plugin, GitHub auto-deploy, env vars in the dashboard, done) or Vercel plus a managed Postgres. The CI lives in `.github/workflows/` and runs `pnpm install && pnpm build` on every push to main. Green CI is the last gate before I hand over access.

**Day 11 to 13.** Real-data import. Handoff documentation. A walkthrough recording. The README in this repo is the shape of what ships. Schema diagram, local dev steps, deploy path, all in one file the next developer can read in ten minutes.

**Day 14.** Handoff call. The client owns the repo, the deploy, the database, the credentials. I have two weeks of included support for bugs and small tweaks. After that, either we do another scoped project or we do not. No retainer trap.

---

## The CSV Import Hero Feature

If you are evaluating me against another freelancer, this is the feature I point at.

If you are evaluating me against Retool, Airtable, or Monday, I am not trying to beat them. Those tools have hundreds of engineers and millions in funding. But none of them let a visitor to a stranger's portfolio drop a CSV and get a working admin view back in under five seconds. Portfolio demos that are hosted behind a "request access" form lose to this every time. So this is the interactive centerpiece of the demo, and it is also the feature I ship most often in real engagements: "take whatever spreadsheet you have now, turn it into the table in the new app."

The flow on the public demo:

1. Visitor drops a CSV on `/upload` (drag-and-drop or file picker). Max 5 MB, max 500 rows.
2. The browser POSTs the file to `/api/upload`, which runs server-side (`runtime = "nodejs"`), parses with papaparse, infers columns, maps each row against the `JobOrder` shape, and returns both the preview and the fully mapped rows. The endpoint is stateless; no database writes on the server path.
3. The UI shows the detected columns and a small preview table. The user sees, before committing, whether the mapping looks right.
4. On confirm, the browser sanitizes each row (length caps, strip control characters, refuse `<script>`/`<iframe>`) and writes the batch to `localStorage` under a single key. Each row gets a client-generated UUID and an ISO `createdAt`.
5. The dashboard redirects with a success banner. Seed rows are rendered server-side from Postgres; the client hydrates the localStorage rows on mount, merges them with the seed rows, and renders the "uploaded" badge so the visitor can tell them apart.
6. There is no cron. There is no shared write state. A second visitor sees exactly the seeded twelve rows, no more, no less, because the first visitor's data lives only in the first visitor's browser. In a real engagement this flips: the same `/api/upload` handler would write directly to Postgres behind a signed-in session, and the localStorage detour goes away.

The mapping logic is the piece that makes the feature feel magic. Customer spreadsheets do not use clean column names. They have "Order," "Job Name," "Description," "customer," "Client," "Company." The mapper normalizes, matches against a small set of synonyms per field, and falls back gracefully:

```ts
// lib/csv-mapping.ts (excerpt)
const TITLE_KEYS = ["title", "order", "job", "name", "description"];
const CUSTOMER_KEYS = ["customer", "client", "company", "account"];
const STATUS_KEYS = ["status", "state"];
const DUE_KEYS = ["due", "dueat", "due_date", "due date", "deadline"];
const NOTES_KEYS = ["notes", "note", "comment", "comments"];

function normalize(key: string): string {
  return key.trim().toLowerCase().replace(/[\s_\-]+/g, "");
}

function keyMatches(raw: string, candidates: string[]): boolean {
  const n = normalize(raw);
  return candidates.some((c) => normalize(c) === n);
}
```

A row is valid if it produces a title. Unmatched columns do not get dropped; they get folded into `notes` as `key: value` lines, which is how I keep the "I know my spreadsheet has a column you did not think about" case from silently losing data. A dispatcher's idiosyncratic "route" or "van" or "crew" column ends up in the notes field rather than thrown away. That detail alone is why the "looks right?" preview works: the visitor sees every column accounted for.

The local-storage helpers are a thin module; the interesting part is what this removes:

```ts
// lib/local-orders.ts (excerpt)
export function addLocalOrder(
  order: Omit<LocalOrder, "id" | "createdAt">
): LocalOrder {
  assertClient("addLocalOrder");
  const full: LocalOrder = {
    ...order,
    id: randomId(),
    createdAt: new Date().toISOString(),
  };
  addLocalOrders([full]);
  return full;
}
```

No TTL column on the schema. No scheduled cron in-process. No per-visitor session scoping on the server. No cross-visitor content filtering. Each of those was a real cost with a real failure mode (stale rows after restart, expired-but-unswept data, visitor-A seeing visitor-B's junk), and all of them existed to solve a problem I created by writing uploads to shared Postgres in the first place. Moving the write path to the browser deletes the problem.

What stays in the server path is the CSV import parser and the column mapper, because "I want to bring in my existing data" is the first thing every new-system client asks on day one of go-live, and that logic is the same whether the destination is localStorage or Postgres. In a real engagement the destination flips. The parser and mapper do not.

`{screenshot: csv-upload-flow}`

---

## What I Deliberately Skipped and Why

Honest scope matters more than bragging about scope. Here is what this demo does not do and what I would do about each in a real client engagement.

**A focused Vitest suite, not a battleship of tests.** The repo ships unit tests for the CSV parser, the column mapper, the sanitization helpers, and the localStorage round-trip. CI runs `pnpm test` on every push. Playwright end-to-end for the upload-and-see-in-dashboard happy path is the next-engagement add; in a client project I budget a day of week two for it. A non-technical reader does not read tests, but a technical evaluator reading this README does check that the tests exist and run green.

**No internationalization.** All copy is English. If you sell into multiple locales, the day-one client conversation is whether we wire next-intl now (it is cheap if we do it before the strings are scattered) or defer (cheap to do later if string inventory stays small). I pick per project based on the roadmap, not by default.

**No role-based permissions beyond the NextAuth scaffold.** The schema has a `Role` enum (ADMIN, STAFF) on the `User` model; nothing yet reads it. A real engagement adds a middleware that gates `/dashboard` on session and gates destructive actions on role. That is a half-day and I do it on day eight, not day one, because it is easier to layer in than to retrofit after a dozen mutations exist.

**No audit log.** If you need "who changed this row and when," I add an `AuditLog` model with a trigger or a Prisma middleware that captures mutations. This is the feature everyone requests after three months, never on day one. I will push back if a client asks for it up front, because it is the kind of work that quietly doubles the engagement if you do it wrong, and most teams discover they only wanted two or three tracked fields, not the whole thing.

**No soft-delete.** Right now a deleted row is gone. Adding a `deletedAt` column and filtering it out everywhere is a day of work and a source of bugs for a month afterward. I do not add it unless the client asks, because the teams that need it know they need it and the teams that do not will find it confusing.

**No inline editing on the dashboard.** The demo shows the viewer mode of the table. Inline edit is the first feature I add in a real engagement, usually day six or seven; it is a server action and a client island around each editable cell. The "+ New order" form on the public demo is the first step of that flow running against localStorage; wiring it to a server action in a real project is a short exercise, not a rearchitect.

**No file attachments, email notifications, Stripe billing, or webhook integrations.** None of those belong in a two-week starting scope. All of them are day-one conversations for project two.

Read that list as a scope menu, not as a list of gaps. The point of a two-week engagement is shipping the thing that unblocks the team now. Everything above is real work, real money, real value, and it belongs in the right week of the right project. A founder who wants all of it in the first two weeks is either mis-scoping or needs a different kind of engineer.

---

## How This Applies to a Real Client

If you bring me your existing spreadsheet, here is what the two weeks actually look like.

**Day 1: scope call and SOW.** Thirty minutes. I ask three questions: what does your spreadsheet have in it today, what are the two or three views your team actually uses, and what is the one report your owner asks for on Friday that nobody can generate in under an hour. That is enough to quote. Fixed price. $3,500 is typical; the range is $5k to $15k depending on integrations (QuickBooks sync, Twilio SMS, a third-party scheduler, a webhook into an existing CRM). A signed SOW by end of day, or we part friends and I refer you on.

**Days 2 to 3: schema and clickable mock.** I model your data and build a dashboard against a seeded database that looks like your data. You see it, touch it, and either approve or we adjust. This is the cheapest moment in the project to change direction, and I design the week one checkpoint around making sure direction changes happen here rather than on day twelve.

**Days 4 to 10: build.** App Router, Server Components, Prisma, Postgres. I push to GitHub every day; you have a preview deploy you can open on your phone. I demo every other day in a fifteen-minute call. The CSV import of your existing spreadsheet happens in this window, usually around day six or seven, because that is when importing real data starts to catch edge cases that the seeded mock hid.

**Days 11 to 14: deploy, docs, handoff.** Production deploy on your domain or a Railway subdomain you own. Auth wired. Roles set. Environment variables documented. A README that reads like the one in this repo. A thirty-minute handoff call where I walk through the schema, the deploy path, and how to add a field or a page yourself if you ever hire a junior engineer. Two weeks of included support after go-live for bugs and small adjustments. After that we either scope project two or we do not. No retainer, no ongoing bill unless we both want one.

**Why fixed price, not hourly.** Hourly is the default in this market because freelancers cannot estimate. I can. Two weeks is not a promise; it is a contract. If I misscope, I eat it. If scope changes (new page, new field, new integration), we write a change order with a fixed price for the change. The client should never have to watch the clock.

**Why two weeks, not three months.** Because internal tools that take three months to ship are internal tools that get cancelled before they ship. The founder loses patience, the ops team keeps patching the spreadsheet, the engineer burns out, the invoice becomes a fight. Two weeks with a narrow scope is the shape that actually lands. Project two is how we add what project one skipped.

If you are in the "spreadsheet is breaking, Retool is expensive, cannot hire yet" bucket, that is the profile I was built for. Send me the spreadsheet; I can usually quote the same day.

---

## About

Gabriel Vian builds and ships full-stack internal tools for SMBs and startups. Design, database, API, deploy, and handoff, all from one person. The goal: a senior engineer's output without hiring one.

Reach me at gvian07@gmail.com.
