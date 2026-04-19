/**
 * Visitor-scoped local storage for demo orders.
 *
 * The public demo writes every user-created or uploaded order to the
 * visitor's browser localStorage instead of the shared Postgres. This makes
 * the demo safe to expose to strangers (no shared mutable state, no TTL
 * sweep, no per-visitor session scoping on the server) and gives visitors
 * better UX: their data persists across tabs and reloads on their own
 * machine and never travels over the network after the upload parse.
 *
 * Every function in this module is client-only. Calling any of them during
 * SSR throws a clear error. The server renders seed rows from Postgres; the
 * client merges these entries on mount.
 */

import type { JobStatus } from "@prisma/client";

const STORAGE_KEY = "demo-ops-local-orders";

/**
 * Shape of a demo order stored in the visitor's browser. Mirrors the
 * subset of the Postgres JobOrder model that the dashboard renders, minus
 * id-generation (we issue UUIDs on the client) and with dates as ISO
 * strings so JSON round-trips cleanly.
 */
export type LocalOrder = {
  id: string;
  title: string;
  customer: string;
  status: JobStatus;
  dueAt: string | null;
  notes: string | null;
  createdAt: string;
};

function assertClient(fn: string): void {
  if (typeof window === "undefined") {
    throw new Error(
      `[local-orders] ${fn} called on the server; this module is client-only.`
    );
  }
}

function randomId(): string {
  // Prefer the platform crypto.randomUUID when available (all evergreen
  // browsers since 2022 plus Node 19+). Fall back to a RFC-4122-ish string
  // built from crypto.getRandomValues so older browsers do not crash.
  if (typeof crypto !== "undefined") {
    if (typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    if (typeof crypto.getRandomValues === "function") {
      const buf = new Uint8Array(16);
      crypto.getRandomValues(buf);
      buf[6] = (buf[6]! & 0x0f) | 0x40;
      buf[8] = (buf[8]! & 0x3f) | 0x80;
      const hex = Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join(
        ""
      );
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }
  }
  // Last-resort fallback. Not cryptographically strong but adequate for
  // deduping a handful of demo rows.
  return `lo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Client-side only. Read and parse the locally stored demo orders. Returns
 * an empty array when the key is missing, the JSON is malformed, or the
 * value is not an array. Never throws on bad data.
 */
export function getLocalOrders(): LocalOrder[] {
  assertClient("getLocalOrders");
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Only keep entries that look like LocalOrder. Defensive parsing so
    // a manually-edited localStorage entry cannot take down the page.
    return parsed.filter(
      (o): o is LocalOrder =>
        o != null &&
        typeof o === "object" &&
        typeof o.id === "string" &&
        typeof o.title === "string" &&
        typeof o.customer === "string" &&
        typeof o.status === "string" &&
        typeof o.createdAt === "string"
    );
  } catch {
    return [];
  }
}

/**
 * Client-side only. Merge `orders` into existing storage. Dedupes by `id`;
 * incoming entries replace prior ones that share the same id. Preserves
 * insertion order of existing entries and appends new ones at the end.
 */
export function addLocalOrders(orders: LocalOrder[]): void {
  assertClient("addLocalOrders");
  if (!Array.isArray(orders) || orders.length === 0) return;
  const existing = getLocalOrders();
  const byId = new Map<string, LocalOrder>();
  for (const o of existing) byId.set(o.id, o);
  for (const o of orders) {
    if (!o || typeof o.id !== "string") continue;
    byId.set(o.id, o);
  }
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(Array.from(byId.values()))
    );
  } catch {
    // QuotaExceeded or storage disabled. Silently skip; dashboard will
    // continue to show whatever has already persisted.
  }
}

/**
 * Client-side only. Add a single order. Assigns a fresh UUID and an ISO
 * createdAt timestamp, then returns the fully-formed LocalOrder.
 */
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

/**
 * Client-side only. Remove every demo order from localStorage. Used by the
 * "Reset demo data" link on the dashboard.
 */
export function clearLocalOrders(): void {
  assertClient("clearLocalOrders");
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore.
  }
}

/**
 * Client-side only. Assign a fresh id and createdAt to each incoming row
 * and append them all to localStorage. Returns the stored rows so callers
 * can use the count (and final shape) for the redirect flash banner.
 */
export function addLocalOrdersFromMapped(
  rows: Array<Omit<LocalOrder, "id" | "createdAt">>
): LocalOrder[] {
  assertClient("addLocalOrdersFromMapped");
  const now = new Date().toISOString();
  const built: LocalOrder[] = rows.map((r) => ({
    ...r,
    id: randomId(),
    createdAt: now,
  }));
  addLocalOrders(built);
  return built;
}

/** Exposed for tests and debugging; the raw key used in localStorage. */
export const LOCAL_ORDERS_KEY = STORAGE_KEY;
