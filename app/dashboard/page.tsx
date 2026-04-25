import { Suspense } from "react";
import Link from "next/link";
import { SEED_ORDERS } from "@/lib/seed-data";
import OrdersList, { type SeedOrder } from "./orders-list";

export default function DashboardPage() {
  const seedOrders: SeedOrder[] = SEED_ORDERS;

  return (
    <main id="main-content" className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-2 flex items-start justify-between gap-6">
          <div>
            <Link
              href="/"
              aria-label="Back to landing page"
              className="text-xs text-slate-600 hover:text-slate-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 rounded"
            >
              <span aria-hidden="true">&larr;</span> Back
            </Link>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
              Job orders
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-700">
              Seed rows are embedded statically. Rows you upload or create in
              this demo are saved to your browser only.
            </p>
          </div>
          {/* New-order button is rendered inside OrdersList so it can open
              the inline form without a client island wrapper at the page
              level. */}
        </div>

        <Suspense fallback={<div className="py-10 text-center text-sm text-slate-600">Loading orders...</div>}>
          <OrdersList
            seedOrders={seedOrders}
            initialQuery=""
            initialStatus=""
          />
        </Suspense>

        <p className="mt-8 text-xs text-slate-600">
          Seeded sample data is embedded in the static build. Uploaded rows and
          rows created via &ldquo;+ New order&rdquo; are stored in your
          browser&apos;s localStorage and never leave your machine.
        </p>
      </div>
    </main>
  );
}
