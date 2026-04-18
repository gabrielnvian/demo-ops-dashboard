import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const statusStyles: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 ring-amber-600/20",
  IN_PROGRESS: "bg-blue-100 text-blue-800 ring-blue-600/20",
  COMPLETED: "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
  CANCELLED: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

const statusLabels: Record<string, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

function fmtDate(d: Date | null): string {
  if (!d) return "-";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function relative(d: Date | null): string {
  if (!d) return "";
  const days = Math.round((d.getTime() - Date.now()) / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  if (days < 0) return `${-days} days ago`;
  return `in ${days} days`;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { q?: string; status?: string };
}) {
  const q = searchParams?.q?.trim() ?? "";
  const statusFilter = searchParams?.status?.trim() ?? "";

  const orders = await prisma.jobOrder.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { customer: { contains: q, mode: "insensitive" } },
                { notes: { contains: q, mode: "insensitive" } },
              ],
            }
          : {},
        statusFilter ? { status: statusFilter as never } : {},
      ],
    },
    orderBy: [{ createdAt: "desc" }],
  });

  const counts = await prisma.jobOrder.groupBy({
    by: ["status"],
    _count: true,
  });
  const countsByStatus = Object.fromEntries(counts.map((c) => [c.status, c._count]));

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/" className="text-xs text-slate-500 hover:text-slate-900">
              &larr; Home
            </Link>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              Job orders
            </h1>
          </div>
          <button
            type="button"
            className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
            disabled
            title="Create flow scaffolded but not wired for the public demo"
          >
            + New order
          </button>
        </div>

        <form className="mb-6 flex flex-wrap gap-3" action="/dashboard">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by title, customer, or notes..."
            className="flex-1 min-w-[220px] rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
          <select
            name="status"
            defaultValue={statusFilter}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
          >
            <option value="">All statuses ({orders.length})</option>
            <option value="PENDING">Pending ({countsByStatus["PENDING"] ?? 0})</option>
            <option value="IN_PROGRESS">In progress ({countsByStatus["IN_PROGRESS"] ?? 0})</option>
            <option value="COMPLETED">Completed ({countsByStatus["COMPLETED"] ?? 0})</option>
            <option value="CANCELLED">Cancelled ({countsByStatus["CANCELLED"] ?? 0})</option>
          </select>
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
          >
            Apply
          </button>
          {(q || statusFilter) && (
            <Link
              href="/dashboard"
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Clear
            </Link>
          )}
        </form>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <Th>Order</Th>
                <Th>Customer</Th>
                <Th>Status</Th>
                <Th>Due</Th>
                <Th>Created</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                    No orders match your filter.
                  </td>
                </tr>
              )}
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm">
                    <div className="font-medium text-slate-900">{o.title}</div>
                    {o.notes && <div className="mt-0.5 text-xs text-slate-500">{o.notes}</div>}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{o.customer}</td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusStyles[o.status] ?? ""}`}
                    >
                      {statusLabels[o.status] ?? o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="text-slate-700">{fmtDate(o.dueAt)}</div>
                    <div className="text-xs text-slate-500">{relative(o.dueAt)}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{fmtDate(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-8 text-xs text-slate-500">
          Data is seeded sample data for the public demo. Search + status filters are
          live against PostgreSQL via Prisma. Create/edit flows are scaffolded and
          gated behind auth in production.
        </p>
      </div>
    </main>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
      {children}
    </th>
  );
}
