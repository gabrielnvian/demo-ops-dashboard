import cron from "node-cron";
import { prisma } from "./prisma";

let started = false;

/**
 * Delete every JobOrder whose `expiresAt` is non-null and strictly in the past.
 * Safe to call directly (used by tests) or via the scheduled cron in
 * {@link startExpiryCleanup}. Never throws; failures are logged to stderr.
 * @returns the number of rows deleted, or 0 on error.
 */
export async function sweepExpired(): Promise<number> {
  try {
    const result = await prisma.jobOrder.deleteMany({
      where: {
        expiresAt: {
          not: null,
          lt: new Date(),
        },
      },
    });
    if (result.count > 0) {
      process.stderr.write(
        `[expiry-cleanup] removed ${result.count} expired job orders\n`
      );
    }
    return result.count;
  } catch (err) {
    process.stderr.write(
      `[expiry-cleanup] sweep failed: ${String(err)}\n`
    );
    return 0;
  }
}

export function startExpiryCleanup() {
  if (started) return;
  started = true;
  // every 15 minutes
  cron.schedule("*/15 * * * *", () => {
    void sweepExpired();
  });
  // run once at boot so stale rows do not linger across restarts
  void sweepExpired();
  process.stderr.write("[expiry-cleanup] scheduled every 15 minutes\n");
}
