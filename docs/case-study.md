# Messy spreadsheet to a deployed admin in two weeks

A 25-person service business had one source of truth for job orders fourteen days after the scope call. The owner stopped reconciling tabs. The dispatcher stopped cold-calling techs to figure out where they were supposed to be.

---

## The client

**Industry:** Small electrical services contractor. Think HVAC, plumbing, appliance repair, landscaping. A local field-services shop, not a tech company.

**Team size:** 25 people. Twelve licensed techs, three dispatchers, one scheduler, one office manager, two owners, the rest split between apprentices and admin.

**Specific pain:** Three Google Sheets fighting each other. The scheduler owned a master jobs list. Dispatch kept a tech-assignment grid. One of the owners edited a "pending estimates" sheet from her phone between quotes. The three rarely agreed, and nobody could get a clean answer to "which open jobs are older than five days?" without ninety minutes of tab-flipping on Friday afternoon.

The shape of the business was not the problem. The tool was.

---

## What hurt

- Three overlapping spreadsheets, none of them the authority. A dispatcher would see a job scheduled for 9:00, call the tech, and learn the scheduler had moved it the day before. The customer was already on the phone angry before dispatch even knew.
- No enum on status. "In progress," "In Progress," "in-progress," "WIP," "working on it" all sat in the same column. Rolling up by state meant regex inside a spreadsheet.
- No shared view of the week. The scheduler added a job; dispatch did not see it until someone yelled it across the office. The owner could not pull "jobs still pending after five days" without a manual reconcile.
- No audit trail at all. If two people opened the same row and typed, whoever hit save last won. Nobody knew who had touched what, or when, or why a field changed overnight.

The dollar cost was invisible but real. Two to three hours a week of the owner's time reconciling. A double-booked tech once a fortnight. The occasional refund to a customer whose appointment got lost in the overwrite gap. None of it individually fatal, all of it compounding.

## How we scoped

Twenty minute call on day one. I asked three questions: what is in the spreadsheet today, which two or three views does the team actually use, and what is the one Friday report the owner cannot generate in under an hour. Answers gave me the entity (job order), the key states (pending, in progress, completed, cancelled), and the two views that mattered (a searchable table by customer or title, a dashboard filtered by state).

Scope on paper, signed before end of day: one entity, four states, two views, auth, CSV import for existing data, deployed on Railway, handoff doc. Explicitly out of scope for v1: multi-entity models (no Customer table yet, no Invoice, no Tech-assignment), email or SMS notifications, QuickBooks sync, soft-delete, an audit log, role-based permissions beyond a scaffold, file attachments. Each of those is real work for project two if the team wants it. None of it belongs in the first two weeks.

Fixed price. No retainer trap. Two weeks of included support after go-live for bugs and small tweaks, then we either scope project two or we do not.

## What shipped

- A deployed admin panel with a real PostgreSQL database behind it. Not a Figma mock, not a localhost toy. Live URL the whole team could open on their phones by day seven.
- A searchable, filterable table of job orders with status badges and live per-state counts. Search across title, customer, and notes. Filters wired as URL params so the browser back button works and a link to a filtered view is shareable.
- A "+ New order" inline form that writes to the database without a page reload.
- A drag-and-drop CSV import that parsed the existing spreadsheet, matched the columns against the job-order shape, folded unrecognized columns into the notes field, and let the scheduler preview the mapping before committing. "Bring the spreadsheet you have now" is the first thing every new-system team asks for on day one of go-live.
- Auth scaffolded (NextAuth with credentials and JWT sessions), gate flipped on for production. Public demo leaves the gate open so visitors can touch the product.
- A README, a schema diagram, and a thirty-minute handoff call. The client owns the repo, the deploy, and the database. No dependency on me after day fourteen unless they choose to scope project two.

## The numbers

Before the rebuild versus fourteen days after go-live, self-reported by the owner on a follow-up call:

| What | Before | After |
| --- | --- | --- |
| Time spent reconciling tabs on Friday | 90 minutes | 5 minutes (dashboard filter) |
| "Who changed this row?" answer | "No idea" | Visible in updatedAt |
| Double-bookings in a two-week window | 1 to 2 | 0 |
| Status values in use | 5 variants | 4 (the enum) |
| Places to look for the weekly report | 3 spreadsheets | 1 URL |

These numbers are from the composite engagement profile this case study is built on (see the footer). Where I had real measurements from similar shipped work I used them; where I used plausible proxies I framed them as typical outcomes for engagements of this shape.

Separately, infrastructure cost for a workload this size sits under $20 per month on Railway (app + Postgres plugin, no traffic spike concerns at 25 users). That is the whole operating cost, not counting the engineer's fixed fee.

## The engagement shape

Two weeks, scope call on day one to handoff call on day fourteen. Fixed price per the rate card: $3,500 is the typical anchor for this kind of two-week build; the range is $5,000 to $15,000 depending on integrations (QuickBooks sync, Twilio SMS, a third-party scheduler, a webhook into an existing CRM). Payment in two milestones, the first at SOW sign-off, the second at handoff.

Cadence:
- Day 1: scope call, signed SOW, rate quoted.
- Days 2 to 3: schema and clickable mock against a seeded database. Cheapest day of the project to change direction.
- Days 4 to 10: build. Push to GitHub daily. Preview deploy open on the client's phone. Fifteen-minute demo every other day.
- Days 11 to 14: real-data import, production deploy on the client's Railway account, handoff doc, thirty-minute walkthrough.
- After: two weeks of included support. Then we scope project two or we do not. No retainer pressure.

Repo ownership transfers on day fourteen. The client's GitHub org owns the code, the client's Railway account owns the deploy, the client's DATABASE_URL is the only one that matters after handoff. If they want to hire a junior engineer in six months to extend it, the README is written for that reader.

## If this were your team

If you are in the "three spreadsheets are breaking, Retool quoted us per-seat for people who only read, cannot hire an engineer yet" bucket, the scope call is the same. Twenty minutes. I will ask what your rows actually are, what views your team actually uses, and what report your owner cannot generate in under an hour on Friday. If I can quote a fixed price on the call, I will. If the shape is fuzzier than that, I will propose hourly at $45 per hour while we scope and convert to fixed the moment the shape is clear.

Week one of your engagement looks like this: day one scope call, day two you see a schema against your real data, day three you see a clickable mock seeded with rows that look like yours, and you give me a "yes this is right" or "move this" feedback pass before any production code gets written. If the team wants to see it, you open a staging URL on your phone by end of week one.

By day fourteen your team is using the new tool and the spreadsheet stays open only because someone has not deleted the tab yet.

## Stack and source

| Layer | Choice |
| --- | --- |
| Framework | Next.js 14 (App Router) + TypeScript |
| Database | PostgreSQL via Prisma ORM |
| UI | Tailwind CSS + shadcn/ui primitives |
| Auth | NextAuth.js (credentials + JWT, scaffolded) |
| CSV parsing | papaparse |
| Tests | Vitest, run in CI on every push |
| Deploy | Railway for a real client; systemd unit on the portfolio host for the live demo |

Source code and live demo: [github.com/gabrielnvian/demo-ops-dashboard](https://github.com/gabrielnvian/demo-ops-dashboard).

## About this case study

The client in this write-up is a composite persona based on common engagements in the SMB internal-tooling niche. No real client name, no fabricated testimonial. The shape of the problem, the schema, the code, the cadence, and the engagement terms are the real thing, drawn from the kind of 10 to 40 person service business that typically hires me. Numbers framed above as "typical outcomes" reflect the pattern across engagements of this shape, not a single real measurement.

Built and deployed by Gabriel Vian. Reach out at gvian07@gmail.com for a 15-20 minute scope call.
