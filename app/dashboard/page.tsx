import Link from "next/link";
import { prisma } from "@/lib/prisma";
import OrdersList, { type SeedOrder } from "./orders-list";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { q?: string; status?: string; imported?: string };
}) {
  const q = searchParams?.q?.trim() ?? "";
  const statusFilter = searchParams?.status?.trim() ?? "";

  // Seed data lives in Postgres and is shared across visitors. Per-visitor
  // uploads and manually created orders live in localStorage on the client;
  // OrdersList merges them on mount.
  const rows = await prisma.jobOrder.findMany({
    orderBy: [{ createdAt: "desc" }],
  });

  // Normalize Prisma types to plain JSON so the Client Component boundary
  // does not try to serialize Date objects.
  const seedOrders: SeedOrder[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    customer: r.customer,
    status: r.status,
    dueAt: r.dueAt ? r.dueAt.toISOString() : null,
    notes: r.notes,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-2 flex items-start justify-between gap-6">
          <div>
            <Link
              href="/"
              className="text-xs text-slate-500 hover:text-slate-900 transition-colors"
            >
              &larr; Back
            </Link>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
              Job orders
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-600">
              Seed rows are SSR&apos;d from PostgreSQL. Rows you upload or
              create in this demo are saved to your browser only.
            </p>
          </div>
          {/* New-order button is rendered inside OrdersList so it can open
              the inline form without a client island wrapper at the page
              level. */}
        </div>

        <OrdersList
          seedOrders={seedOrders}
          initialQuery={q}
          initialStatus={statusFilter}
        />

        <p className="mt-8 text-xs text-slate-500">
          Seeded sample data is live from PostgreSQL. Uploaded rows and rows
          created via &ldquo;+ New order&rdquo; are stored in your browser&apos;s
          localStorage and never leave your machine. In production, the
          upload path writes to the same Postgres the seed reads from.
        </p>
      </div>
    </main>
  );
}
