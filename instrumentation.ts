export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { startExpiryCleanup } = await import("./lib/expiry-cleanup");
  startExpiryCleanup();
}
