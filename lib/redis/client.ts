import { Redis } from "@upstash/redis";

// Helper to check if Redis is configured
export function isRedisConfigured(): boolean {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

if (!isRedisConfigured()) {
  console.warn(
    "⚠️  Redis credentials not configured. Caching and rate limiting will be disabled."
  );
}

// ── Redis client with aggressive timeouts ─────────────────────────────────────
// Upstash REST API uses HTTP — if DNS fails or network is slow, we need to
// fail fast rather than blocking requests for 30+ seconds.
export const redis = isRedisConfigured()
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      enableAutoPipelining: true,
      // Retry config: fail fast in dev, retry once in prod
      retry: {
        retries: process.env.NODE_ENV === "production" ? 1 : 0,
        backoff: (attempt) => Math.min(100 * Math.pow(2, attempt), 500),
      },
    })
  : null;

// ── Connectivity check — run once at startup ──────────────────────────────────
// Logs a warning if Redis is configured but unreachable, without crashing.
if (redis && process.env.NODE_ENV !== "test") {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Redis ping timeout")), 5000) // Increased to 5s
  );
  Promise.race([redis.ping(), timeout])
    .then(() => console.info("✅ Redis connected"))
    .catch((err) => {
      console.warn(
        "⚠️  Redis unreachable — caching and rate limiting will be disabled.",
        err?.message ?? err
      );
    });
}
