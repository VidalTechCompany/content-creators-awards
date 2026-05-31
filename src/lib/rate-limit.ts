import Redis from "ioredis";

type Bucket = { count: number; reset: number };

const buckets = new Map<string, Bucket>();

let redisClient: Redis | null = null;

function getRedis() {
  if (redisClient) return redisClient;
  const url = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
  if (!url) return null;
  redisClient = new Redis(url);
  return redisClient;
}

/**
 * Rate limiter — uses Redis when `REDIS_URL` (or Upstash REST URL) is configured,
 * otherwise falls back to a process-local in-memory limiter.
 */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const redis = getRedis();
  if (!redis) {
    // In-memory fallback
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

  // Redis-backed limiter: INCR + EXPIRE
  const ttl = Math.ceil(windowMs / 1000);
  try {
    const val = await redis.incr(key);
    if (val === 1) {
      await redis.expire(key, ttl);
    }
    return val <= limit;
  } catch (err) {
    console.error("rateLimit(redis) error:", err);
    // Fail open on Redis error to avoid denying users
    return true;
  }
}
