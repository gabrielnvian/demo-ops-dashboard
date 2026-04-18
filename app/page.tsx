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
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Portfolio demo
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
            SMB Operations Dashboard
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-600">
            A job-orders tracker for small service businesses. Full-stack{" "}
            <span className="font-medium text-slate-900">Next.js 14</span> with{" "}
            <span className="font-medium text-slate-900">PostgreSQL</span>,{" "}
            <span className="font-medium text-slate-900">Prisma</span>, and{" "}
            <span className="font-medium text-slate-900">Tailwind</span>. Built
            to demonstrate the kind of internal tool small teams need when they
            outgrow spreadsheets or Retool.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-10">
          <Stat label="Total orders" value={total} />
          <Stat label="Pending" value={pending} accent="amber" />
          <Stat label="In progress" value={inProgress} accent="blue" />
          <Stat label="Completed" value={completed} accent="emerald" />
        </div>

        <div className="flex gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md bg-slate-900 px-6 py-3 text-sm font-medium text-white shadow hover:bg-slate-800 transition-colors"
          >
            View the dashboard &rarr;
          </Link>
          <a
            href="https://github.com/gabrielnvian/demo-ops-dashboard"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50 transition-colors"
          >
            Source on GitHub
          </a>
        </div>

        <p className="mt-16 text-xs text-slate-500">
          This is a public demo. Authentication is disabled for browsing —
          production would gate behind NextAuth.js (scaffolded in the repo).
        </p>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "amber" | "blue" | "emerald";
}) {
  const accentClass =
    accent === "amber"
      ? "text-amber-600"
      : accent === "blue"
      ? "text-blue-600"
      : accent === "emerald"
      ? "text-emerald-600"
      : "text-slate-900";
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className={`mt-2 text-3xl font-semibold ${accentClass}`}>{value}</p>
    </div>
  );
}
