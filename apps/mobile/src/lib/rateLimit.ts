const windowMap = new Map<string, number[]>();

const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function pruneStaleKeys(now: number): void {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, timestamps] of windowMap) {
    const active = timestamps.filter((t) => t > now - 3_600_000);
    if (active.length === 0) {
      windowMap.delete(key);
    } else {
      windowMap.set(key, active);
    }
  }
}

/**
 * Sliding-window in-memory rate limiter.
 *
 * @param key         Unique key per caller+endpoint (e.g. "checkout:1.2.3.4")
 * @param maxRequests Maximum number of requests allowed within the window
 * @param windowMs    Window size in milliseconds
 * @returns true if the request should be allowed, false if rate limited
 */
export function rateLimitCheck(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  pruneStaleKeys(now);
  const cutoff = now - windowMs;

  const timestamps = (windowMap.get(key) ?? []).filter((t) => t > cutoff);
  timestamps.push(now);
  windowMap.set(key, timestamps);

  return timestamps.length <= maxRequests;
}
