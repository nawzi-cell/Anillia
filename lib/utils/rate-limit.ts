/**
 * Simple in-memory fixed-window rate limiter.
 * Suitable for a single-instance deployment; not distributed-safe.
 */

const buckets = new Map<string, number[]>();
let lastPrune = Date.now();

const PRUNE_INTERVAL_MS = 60_000;
const MAX_KEYS = 20_000;

function prune(now: number): void {
  if (now - lastPrune < PRUNE_INTERVAL_MS) return;
  lastPrune = now;
  if (buckets.size <= MAX_KEYS) return;
  for (const [key, hits] of buckets) {
    const fresh = hits.filter((t) => now - t < PRUNE_INTERVAL_MS);
    if (fresh.length === 0) {
      buckets.delete(key);
    } else {
      buckets.set(key, fresh);
    }
  }
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
}

/**
 * Fixed-window rate limit: at most `limit` calls per `windowMs` for `key`.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  prune(now);

  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return { ok: false, remaining: 0 };
  }

  hits.push(now);
  buckets.set(key, hits);
  return { ok: true, remaining: limit - hits.length };
}
