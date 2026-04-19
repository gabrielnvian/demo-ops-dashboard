import cron from "node-cron";
import { prisma } from "./prisma";

let started = false;

async function sweep() {
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
  } catch (err) {
    process.stderr.write(
      `[expiry-cleanup] sweep failed: ${String(err)}\n`
    );
  }
}

export function startExpiryCleanup() {
  if (started) return;
  started = true;
  // every 15 minutes
  cron.schedule("*/15 * * * *", () => {
    void sweep();
  });
  // run once at boot so stale rows do not linger across restarts
  void sweep();
  process.stderr.write("[expiry-cleanup] scheduled every 15 minutes\n");
}
