/**
 * Length caps applied at the UI boundary when visitors type or upload data.
 * Kept intentionally short so a pasted novel or a rogue CSV cell cannot
 * balloon localStorage or the rendered table.
 */
export const TITLE_MAX = 100;
export const CUSTOMER_MAX = 80;
export const NOTES_MAX = 500;

/**
 * Error thrown when a value fails content-policy checks (embedded scripts or
 * iframes). Callers should catch this and surface the message to the user.
 */
export class UnsafeInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafeInputError";
  }
}

const BLOCKED_TAG_PATTERNS: RegExp[] = [/<script/i, /<iframe/i];

/**
 * Normalize a user-supplied string for safe storage and display.
 *
 * Steps applied in order:
 *   1. Reject if the input contains `<script` or `<iframe` (case-insensitive)
 *      anywhere in the raw value, by throwing `UnsafeInputError`.
 *   2. Strip control characters in the ranges 0x00 to 0x08, 0x0B to 0x0C,
 *      and 0x0E to 0x1F, and 0x7F. Newlines (\n) and tabs (\t) are kept.
 *   3. Trim surrounding whitespace.
 *   4. Truncate to `maxLength` code units (JavaScript string length).
 *
 * @param value raw input string
 * @param maxLength zero-or-greater integer cap; exceeding chars are dropped
 * @returns sanitized string safe to persist and render
 * @throws {UnsafeInputError} if the value contains `<script` or `<iframe`
 */
export function sanitizeText(value: string, maxLength: number): string {
  if (typeof value !== "string") {
    return "";
  }
  for (const pattern of BLOCKED_TAG_PATTERNS) {
    if (pattern.test(value)) {
      throw new UnsafeInputError(
        "Script or iframe tags are not allowed in demo data."
      );
    }
  }
  // Strip control characters but keep \n (0x0A) and \t (0x09).
  const stripped = value.replace(
    // eslint-disable-next-line no-control-regex
    /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g,
    ""
  );
  const trimmed = stripped.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return trimmed.slice(0, maxLength);
}
