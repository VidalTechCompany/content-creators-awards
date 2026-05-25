type Bucket = { count: number; reset: number };

const buckets = new Map<string, Bucket>();

/**
 * Simple in-memory rate limiter (per server instance).
 * For production multi-region scale, swap for Redis / Upstash.
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (b.count >= limit) return false;
  b.count += 1;
  return true;
}
