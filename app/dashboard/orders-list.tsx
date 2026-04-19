"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  addLocalOrder,
  clearLocalOrders,
  getLocalOrders,
  type LocalOrder,
} from "@/lib/local-orders";
import {
  CUSTOMER_MAX,
  NOTES_MAX,
  TITLE_MAX,
  UnsafeInputError,
  sanitizeText,
} from "@/lib/validation";

export type SeedOrder = {
  id: string;
  title: string;
  customer: string;
  status: string;
  dueAt: string | null;
  notes: string | null;
  createdAt: string;
};

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

type Row = {
  id: string;
  title: string;
  customer: string;
  status: string;
  dueAt: string | null;
  notes: string | null;
  createdAt: string;
  isLocal: boolean;
};

function fmtDate(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function relative(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const days = Math.round((d.getTime() - Date.now()) / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  if (days < 0) return `${-days} days ago`;
  return `in ${days} days`;
}

export default function OrdersList({
  seedOrders,
  initialQuery,
  initialStatus,
}: {
  seedOrders: SeedOrder[];
  initialQuery: string;
  initialStatus: string;
}) {
  const searchParams = useSearchParams();
  const [localOrders, setLocalOrders] = useState<LocalOrder[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [flash, setFlash] = useState<number | null>(null);

  // Hydrate from localStorage on mount. Deliberate: this produces a small
  // visual delay (sub-100ms on typical hardware) where seed rows render
  // first and uploaded rows appear shortly after. That is acceptable; it
  // is the signal that the local-orders path is per-browser.
  useEffect(() => {
    setLocalOrders(getLocalOrders());
    setHydrated(true);
  }, []);

  // Flash banner: shown when /upload redirects here with ?imported=<N>.
  // Fades out after a short dwell.
  useEffect(() => {
    const raw = searchParams?.get("imported");
    const n = raw ? Number(raw) : 0;
    if (!Number.isFinite(n) || n <= 0) {
      setFlash(null);
      return;
    }
    setFlash(n);
    const t = setTimeout(() => setFlash(null), 5000);
    return () => clearTimeout(t);
  }, [searchParams]);

  // Keep the toast one-shot; auto-dismiss after a couple of seconds.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const merged: Row[] = useMemo(() => {
    const localRows: Row[] = localOrders.map((o) => ({ ...o, isLocal: true }));
    const seedRows: Row[] = seedOrders.map((o) => ({ ...o, isLocal: false }));
    // Uploaded / locally-created rows are newer by definition; render them
    // first so the visitor sees their contribution at the top.
    return [...localRows, ...seedRows].sort((a, b) => {
      const aT = new Date(a.createdAt).getTime();
      const bT = new Date(b.createdAt).getTime();
      if (Number.isNaN(aT) || Number.isNaN(bT)) return 0;
      return bT - aT;
    });
  }, [localOrders, seedOrders]);

  const q = initialQuery.toLowerCase();
  const filtered = merged.filter((r) => {
    if (initialStatus && r.status !== initialStatus) return false;
    if (!q) return true;
    return (
      r.title.toLowerCase().includes(q) ||
      r.customer.toLowerCase().includes(q) ||
      (r.notes ?? "").toLowerCase().includes(q)
    );
  });

  const countsByStatus: Record<string, number> = {};
  for (const r of merged) {
    countsByStatus[r.status] = (countsByStatus[r.status] ?? 0) + 1;
  }

  const onReset = () => {
    if (typeof window === "undefined") return;
    const ok = window.confirm(
      "Remove all demo data stored in this browser? Seeded rows remain."
    );
    if (!ok) return;
    clearLocalOrders();
    setLocalOrders([]);
    setToast("Local demo data cleared.");
  };

  const onAdded = (o: LocalOrder) => {
    setLocalOrders((prev) => [o, ...prev]);
    setShowForm(false);
    setToast("Added to your demo data.");
  };

  return (
    <>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <p className="text-xs text-slate-600">
          Your data is stored locally in this browser.{" "}
          {hydrated && localOrders.length > 0 && (
            <button
              type="button"
              onClick={onReset}
              aria-label="Reset all locally stored demo data in this browser"
              className="underline decoration-slate-300 underline-offset-4 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 rounded"
            >
              Reset demo data
            </button>
          )}
        </p>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          aria-expanded={showForm}
          aria-controls="new-order-form"
          aria-label={showForm ? "Cancel new order" : "Create a new order"}
          className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
        >
          {showForm ? "Cancel" : (<><span aria-hidden="true">+ </span>New order</>)}
        </button>
      </div>

      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {flash !== null ? `Imported ${flash} ${flash === 1 ? "row" : "rows"} into this browser.` : ""}
        {toast ?? ""}
      </div>

      {flash !== null && (
        <div className="mb-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 transition-opacity">
          Imported {flash} {flash === 1 ? "row" : "rows"} into this browser.
        </div>
      )}

      {toast && (
        <div className="mb-6 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
          {toast}
        </div>
      )}

      {showForm && <NewOrderForm onAdded={onAdded} />}

      <form
        className="mb-6 flex flex-wrap gap-3"
        action="/dashboard"
        role="search"
        aria-label="Filter orders"
      >
        <label htmlFor="filter-q" className="sr-only">
          Search orders by title, customer, or notes
        </label>
        <input
          id="filter-q"
          type="text"
          name="q"
          defaultValue={initialQuery}
          placeholder="Search by title, customer, or notes..."
          className="flex-1 min-w-[220px] rounded-md border border-slate-400 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-500 focus:border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-700"
        />
        <label htmlFor="filter-status" className="sr-only">
          Filter by status
        </label>
        <select
          id="filter-status"
          name="status"
          defaultValue={initialStatus}
          className="rounded-md border border-slate-400 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-700"
        >
          <option value="">All statuses ({merged.length})</option>
          <option value="PENDING">
            Pending ({countsByStatus["PENDING"] ?? 0})
          </option>
          <option value="IN_PROGRESS">
            In progress ({countsByStatus["IN_PROGRESS"] ?? 0})
          </option>
          <option value="COMPLETED">
            Completed ({countsByStatus["COMPLETED"] ?? 0})
          </option>
          <option value="CANCELLED">
            Cancelled ({countsByStatus["CANCELLED"] ?? 0})
          </option>
        </select>
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
        >
          Apply
        </button>
        {(initialQuery || initialStatus) && (
          <Link
            href="/dashboard"
            aria-label="Clear search and status filters"
            className="rounded-md border border-slate-400 bg-white px-4 py-2 text-sm text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
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
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-sm text-slate-600"
                >
                  No orders match your filter.
                </td>
              </tr>
            )}
            {filtered.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">
                      {o.title}
                    </span>
                    {o.isLocal && (
                      <span className="inline-flex items-center rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
                        uploaded
                      </span>
                    )}
                  </div>
                  {o.notes && (
                    <div className="mt-0.5 text-xs text-slate-600">
                      {o.notes}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  {o.customer}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusStyles[o.status] ?? ""}`}
                  >
                    {statusLabels[o.status] ?? o.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="text-slate-700">{fmtDate(o.dueAt)}</div>
                  <div className="text-xs text-slate-600">
                    {relative(o.dueAt)}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  {fmtDate(o.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">
      {children}
    </th>
  );
}

function NewOrderForm({ onAdded }: { onAdded: (o: LocalOrder) => void }) {
  const [title, setTitle] = useState("");
  const [customer, setCustomer] = useState("");
  const [status, setStatus] = useState<
    "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
  >("PENDING");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const cleanTitle = sanitizeText(title, TITLE_MAX);
      if (!cleanTitle) {
        setError("Title is required.");
        return;
      }
      const cleanCustomer = sanitizeText(customer, CUSTOMER_MAX) || "Unknown";
      const cleanNotes = sanitizeText(notes, NOTES_MAX);
      const saved = addLocalOrder({
        title: cleanTitle,
        customer: cleanCustomer,
        status,
        dueAt: null,
        notes: cleanNotes || null,
      });
      setTitle("");
      setCustomer("");
      setStatus("PENDING");
      setNotes("");
      onAdded(saved);
    } catch (err) {
      if (err instanceof UnsafeInputError) {
        setError(err.message);
      } else {
        setError("Could not save. Try again.");
      }
    }
  };

  return (
    <form
      id="new-order-form"
      onSubmit={onSubmit}
      aria-labelledby="new-order-heading"
      className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
    >
      <h2 id="new-order-heading" className="text-sm font-semibold text-slate-900">New order</h2>
      <p className="mt-1 text-xs text-slate-600">
        Saved to your browser only. Not sent to the server.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label htmlFor="new-order-title" className="block text-xs font-medium text-slate-800">
          Title
          <input
            id="new-order-title"
            type="text"
            required
            maxLength={TITLE_MAX}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full rounded-md border border-slate-400 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-500 focus:border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-700"
            placeholder="Replace condenser unit"
          />
        </label>
        <label htmlFor="new-order-customer" className="block text-xs font-medium text-slate-800">
          Customer
          <input
            id="new-order-customer"
            type="text"
            maxLength={CUSTOMER_MAX}
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            className="mt-1 block w-full rounded-md border border-slate-400 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-500 focus:border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-700"
            placeholder="Acme Co (optional)"
          />
        </label>
        <label htmlFor="new-order-status" className="block text-xs font-medium text-slate-800">
          Status
          <select
            id="new-order-status"
            value={status}
            onChange={(e) =>
              setStatus(
                e.target.value as
                  | "PENDING"
                  | "IN_PROGRESS"
                  | "COMPLETED"
                  | "CANCELLED"
              )
            }
            className="mt-1 block w-full rounded-md border border-slate-400 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-700"
          >
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </label>
        <label htmlFor="new-order-notes" className="block text-xs font-medium text-slate-800 sm:col-span-2">
          Notes
          <textarea
            id="new-order-notes"
            rows={3}
            maxLength={NOTES_MAX}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 block w-full rounded-md border border-slate-400 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-500 focus:border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-700"
            placeholder="Optional"
          />
        </label>
      </div>
      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
          {error}
        </div>
      )}
      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
        >
          Save order
        </button>
        <span className="text-xs text-slate-600">
          {TITLE_MAX}-char title, {CUSTOMER_MAX}-char customer,{" "}
          {NOTES_MAX}-char notes.
        </span>
      </div>
      {error && (
        <div role="alert" aria-live="assertive" className="sr-only">
          {error}
        </div>
      )}
    </form>
  );
}
