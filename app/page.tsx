import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [total, pending, inProgress, completed] = await Promise.all([
    prisma.jobOrder.count(),
    prisma.jobOrder.count({ where: { status: "PENDING" } }),
    prisma.jobOrder.count({ where: { status: "IN_PROGRESS" } }),
    prisma.jobOrder.count({ where: { status: "COMPLETED" } }),
  ]);

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <nav className="border-b border-slate-100">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <span className="text-sm font-semibold tracking-tight">Gabriel Vian</span>
          <a
            href="https://github.com/gabrielnvian/demo-ops-dashboard"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-slate-500 hover:text-slate-900 transition-colors"
          >
            Source on GitHub
          </a>
        </div>
      </nav>

      <section className="mx-auto max-w-3xl px-6 pt-24 pb-20">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
          Internal tools for small teams
        </p>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight leading-[1.05] text-slate-900">
          Messy spreadsheet to a real admin panel in two weeks.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
          I build custom internal tools for ops teams that have outgrown
          spreadsheets, Airtable, or Retool. Deployed, documented, and
          handed off so your team owns the code.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-5">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md bg-slate-900 px-7 py-3.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800 transition-colors"
          >
            Try the live demo &rarr;
          </Link>
          <span className="text-sm text-slate-500">
            <span className="font-medium text-slate-900">$3,500 typical scope</span>
            <span className="mx-2 text-slate-300">/</span>
            <span>$5k-$15k range</span>
          </span>
        </div>
      </section>

      <section className="border-t border-slate-100">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="text-xs font-medium uppercase tracking-wider text-slate-500">
            What you get
          </h2>
          <div className="mt-10 grid gap-10 md:grid-cols-3">
            <Feature
              title="A deployed admin panel"
              body="Auth, database, and CI/CD included. Not a Figma mock, not a localhost toy. A real app running on your domain."
            />
            <Feature
              title="Docs and handoff"
              body="Your team owns the code. Schema diagrams, README, and a walkthrough so the next developer can extend it without me."
            />
            <Feature
              title="Two weeks, not two quarters"
              body="Scope call on day one. Shipped and deployed by day fourteen. Fixed-price, milestone-based, no hourly surprises."
            />
          </div>
        </div>
      </section>

      <section className="border-t border-slate-100 bg-slate-50/60">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Who this is for
          </h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            <Persona
              headline="Your ops team lives in a spreadsheet."
              body="Shared Google Sheet, half-broken formulas, two people editing the same row. You need something real before it breaks something important."
            />
            <Persona
              headline="Retool is creaking under your data."
              body="It worked for the first year. Now queries time out, the bill keeps climbing, and you want to own the code instead of renting it."
            />
            <Persona
              headline="You can't hire a full-time dev yet."
              body="Series seed to Series B, lean team, one real tool away from unblocking ops. Not ready for a full engineering hire."
            />
          </div>
        </div>
      </section>

      <section className="border-t border-slate-100">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="text-xs font-medium uppercase tracking-wider text-slate-500">
            How it works
          </h2>
          <ol className="mt-10 divide-y divide-slate-100 border-y border-slate-100">
            <Step
              n="01"
              title="Scope call"
              body="30 minutes. I hear the problem, ask about data shape, and quote a fixed price before we start."
            />
            <Step
              n="02"
              title="Schema and mock by day 3"
              body="Database design and a clickable UI before any real build. You approve before I write production code."
            />
            <Step
              n="03"
              title="Build days 4-10"
              body="Full-stack build against your real data. Demo every other day so nothing ships you did not see."
            />
            <Step
              n="04"
              title="Deploy and handoff days 11-14"
              body="Deployed to production, docs written, handoff call. Two weeks of support included after go-live."
            />
          </ol>
        </div>
      </section>

      <section className="border-t border-slate-100 bg-slate-900 text-slate-50">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Live demo
          </h2>
          <p className="mt-4 text-2xl font-semibold tracking-tight">
            A job-orders tracker for a small service business.
          </p>
          <p className="mt-4 text-slate-300 leading-relaxed">
            Real database, real search, real status filters. Not a screenshot.
            Currently tracking {total} orders: {pending} pending, {inProgress}{" "}
            in progress, {completed} completed.
          </p>
          <div className="mt-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-md bg-white px-7 py-3.5 text-sm font-medium text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Open the dashboard &rarr;
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-100">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <h2 className="text-xs font-medium uppercase tracking-wider text-slate-500">
            About
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-700">
            Gabriel Vian builds and ships full-stack internal tools for SMBs
            and startups. Design, database, API, deploy, and handoff, all
            from one person. The goal: a senior engineer's output without
            hiring one.
          </p>
        </div>
      </section>

      <section className="border-t border-slate-100 bg-slate-50/60">
        <div className="mx-auto max-w-3xl px-6 py-14">
          <details className="group">
            <summary className="cursor-pointer text-xs font-medium uppercase tracking-wider text-slate-500 hover:text-slate-900 transition-colors">
              For developers
            </summary>
            <div className="mt-6 text-sm leading-relaxed text-slate-600 space-y-3">
              <p>
                This demo is built with Next.js 14 (App Router), PostgreSQL
                via Prisma, Tailwind CSS, and NextAuth. Server components for
                the data table, server actions scaffolded for mutations. Code
                is MIT-licensed and open on GitHub.
              </p>
              <p>
                <a
                  href="https://github.com/gabrielnvian/demo-ops-dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-slate-300 underline-offset-4 hover:text-slate-900"
                >
                  github.com/gabrielnvian/demo-ops-dashboard
                </a>
              </p>
            </div>
          </details>
        </div>
      </section>

      <footer className="border-t border-slate-100">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-8 text-xs text-slate-500">
          <span>Gabriel Vian, independent engineer</span>
          <a
            href="mailto:gvian07@gmail.com"
            className="hover:text-slate-900 transition-colors"
          >
            gvian07@gmail.com
          </a>
        </div>
      </footer>
    </main>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="text-base font-semibold tracking-tight text-slate-900">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p>
    </div>
  );
}

function Persona({ headline, body }: { headline: string; body: string }) {
  return (
    <div>
      <p className="text-base font-semibold tracking-tight text-slate-900">
        {headline}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <li className="flex gap-6 py-6">
      <span className="w-10 shrink-0 text-sm font-mono text-slate-400">{n}</span>
      <div>
        <p className="text-base font-semibold tracking-tight text-slate-900">
          {title}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">{body}</p>
      </div>
    </li>
  );
}
