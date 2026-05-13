import { Ratelimit } from "@upstash/ratelimit";
import { redis, isRedisConfigured } from "./client";

// Rate limit configurations — Redis only
// If Redis is not configured, rate limiting is DISABLED (fail-open)
// This is intentional: in-memory fallback is NOT safe for multi-instance deployments
export const rateLimits = {
  // API rate limiting: 100 requests per minute per user
  api: isRedisConfigured() && redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, "1 m"),
        analytics: true,
        prefix: "ratelimit:api",
        ephemeralCache: new Map(), // local L1 cache reduces Redis round-trips
      })
    : null,

  // Auth rate limiting: 10 attempts per minute (stricter)
  auth: isRedisConfigured() && redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "1 m"),
        analytics: true,
        prefix: "ratelimit:auth",
        ephemeralCache: new Map(),
      })
    : null,

  // Store creation: 5 per hour
  storeCreation: isRedisConfigured() && redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "1 h"),
        analytics: true,
        prefix: "ratelimit:store-create",
        ephemeralCache: new Map(),
      })
    : null,

  // Product creation: 50 per hour per store
  productCreation: isRedisConfigured() && redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(50, "1 h"),
        analytics: true,
        prefix: "ratelimit:product-create",
        ephemeralCache: new Map(),
      })
    : null,

  // Read operations: 1000 per minute (more lenient)
  read: isRedisConfigured() && redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(1000, "1 m"),
        analytics: true,
        prefix: "ratelimit:read",
        ephemeralCache: new Map(),
      })
    : null,

  // Global rate limit: 10000 requests per hour per IP
  global: isRedisConfigured() && redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10000, "1 h"),
        analytics: true,
        prefix: "ratelimit:global",
        ephemeralCache: new Map(),
      })
    : null,
};

// ── checkRateLimit — fail-open when Redis unavailable ────────────────────────
// At scale, it's safer to allow requests through than to crash the app when
// Redis is temporarily unavailable. Real DDoS protection should be at the
// CDN/WAF layer (Cloudflare, Vercel Firewall), not just in-app rate limiting.
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<{ success: boolean; remaining: number; reset: number }> {
  if (!limiter) {
    // Redis not configured — fail open (allow request)
    return { success: true, remaining: 999, reset: Date.now() + 60_000 };
  }

  try {
    const result = await limiter.limit(identifier);
    return {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    // Redis temporarily unavailable — fail open to avoid cascading failures
    console.error("[rate-limit] Redis error, failing open:", error);
    return { success: true, remaining: 999, reset: Date.now() + 60_000 };
  }
}

// ── withRateLimit — middleware helper ─────────────────────────────────────────
export async function withRateLimit(
  limiter: Ratelimit | null,
  identifier: string,
  handler: () => Promise<Response>
): Promise<Response> {
  const { success, remaining, reset } = await checkRateLimit(
    limiter,
    identifier
  );

  if (!success) {
    return new Response(
      JSON.stringify({
        error: "Too many requests",
        retryAfter: Math.ceil((reset - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
          "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  const response = await handler();

  const newHeaders = new Headers(response.headers);
  newHeaders.set("X-RateLimit-Remaining", remaining.toString());
  newHeaders.set("X-RateLimit-Reset", reset.toString());

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}
