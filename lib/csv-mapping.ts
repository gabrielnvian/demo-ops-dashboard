import { JobStatus } from "@prisma/client";

/** Maximum number of data rows accepted from a single CSV upload. */
export const MAX_ROWS = 500;
/** Maximum byte size accepted from a single CSV upload (5 MB). */
export const MAX_BYTES = 5 * 1024 * 1024;

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

function parseStatus(value: string): JobStatus {
  const v = value.trim().toUpperCase().replace(/[\s\-]+/g, "_");
  if (v === "PENDING" || v === "IN_PROGRESS" || v === "COMPLETED" || v === "CANCELLED") {
    return v as JobStatus;
  }
  return "PENDING";
}

function parseDate(value: string): Date | null {
  if (!value || !value.trim()) return null;
  const d = new Date(value.trim());
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export type MappedRow = {
  title: string;
  customer: string;
  status: JobStatus;
  dueAt: Date | null;
  notes: string | null;
};

/**
 * Map a raw CSV row (header keys to string values) into a JobOrder shape.
 *
 * Column headers are matched case-insensitively and tolerate whitespace,
 * underscores, and hyphens (so `due date`, `Due_Date`, and `due-date` all map
 * to `dueAt`). Status values are normalized against the Prisma `JobStatus`
 * enum and default to `PENDING` when unrecognized. Unknown columns with a
 * non-empty value are preserved as `Key: value` lines appended to notes.
 *
 * @param row plain object of header name to cell string
 * @returns the mapped row, or `null` if no title-like column was found
 */
export function mapRow(row: Record<string, string>): MappedRow | null {
  let title = "";
  let customer = "";
  let status: JobStatus = "PENDING";
  let dueAt: Date | null = null;
  const notesLines: string[] = [];
  const extraLines: string[] = [];

  for (const rawKey of Object.keys(row)) {
    if (!rawKey) continue;
    const value = (row[rawKey] ?? "").toString();
    if (keyMatches(rawKey, TITLE_KEYS) && !title) {
      title = value.trim();
    } else if (keyMatches(rawKey, CUSTOMER_KEYS) && !customer) {
      customer = value.trim();
    } else if (keyMatches(rawKey, STATUS_KEYS)) {
      status = parseStatus(value);
    } else if (keyMatches(rawKey, DUE_KEYS)) {
      dueAt = parseDate(value);
    } else if (keyMatches(rawKey, NOTES_KEYS)) {
      if (value.trim()) notesLines.push(value.trim());
    } else if (value.trim()) {
      extraLines.push(`${rawKey.trim()}: ${value.trim()}`);
    }
  }

  if (!title) return null;
  if (!customer) customer = "Unknown";

  const combined = [...notesLines, ...extraLines].join("\n").trim();
  return {
    title,
    customer,
    status,
    dueAt,
    notes: combined || null,
  };
}
