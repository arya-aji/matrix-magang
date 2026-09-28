/**
 * In-memory fixed-window rate limiter (PRD §50 requires login rate limiting).
 *
 * A single-process store is sufficient for the MVP. If the app is ever scaled
 * horizontally this should move to Redis, but that is intentionally out of
 * scope for now.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  const allowed = existing.count <= limit;

  return {
    allowed,
    remaining: Math.max(0, limit - existing.count),
    retryAfterSeconds: allowed ? 0 : Math.ceil((existing.resetAt - now) / 1000),
  };
}

/** Clear a bucket after a successful login. */
export function resetRateLimit(key: string) {
  buckets.delete(key);
}

/** Exposed for tests. */
export function clearAllRateLimits() {
  buckets.clear();
}
