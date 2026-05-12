import { redis, isRedisConfigured } from "./client";

// Default TTL: 5 minutes
const DEFAULT_TTL = 60 * 5;

// ── Cache key prefixes ────────────────────────────────────────────────────────
// All keys include storeId for proper multi-tenant isolation
export const CacheKeys = {
  store: (storeId: string, subdomain: string) => `store:${storeId}:${subdomain}`,
  storeByDomain: (domain: string) => `store:domain:${domain}`,
  storeById: (storeId: string) => `store:id:${storeId}`,
  products: (storeId: string) => `products:${storeId}`,
  product: (storeId: string, productId: string) => `product:${storeId}:${productId}`,
  pages: (storeId: string) => `pages:${storeId}`,
  homePage: (storeId: string) => `home-page:${storeId}`,
  page: (storeId: string, pageId: string) => `page:${storeId}:${pageId}`,
  templates: (storeId: string) => `templates:${storeId}`,
  user: (id: string) => `user:${id}`,
  session: (token: string) => `session:${token}`,
} as const;

// ── Circuit breaker state ─────────────────────────────────────────────────────
// Prevents hammering a failing Redis with every request
// Note: This is per-instance state. For multi-instance deployments,
// consider using Redis itself to track circuit breaker state.
let circuitOpen = false;
let circuitOpenedAt = 0;
const CIRCUIT_RESET_MS = 30_000; // try again after 30 seconds

function recordSuccess() {
  if (circuitOpen) {
    circuitOpen = false;
    console.info("[cache] Redis circuit breaker closed — Redis is healthy");
  }
}

function recordFailure() {
  if (!circuitOpen) {
    circuitOpen = true;
    circuitOpenedAt = Date.now();
    console.warn("[cache] Redis circuit breaker OPEN — bypassing Redis for 30s");
  }
}

function isCircuitOpen(): boolean {
  if (!circuitOpen) return false;
  // Auto-reset after timeout
  if (Date.now() - circuitOpenedAt > CIRCUIT_RESET_MS) {
    circuitOpen = false;
    console.info("[cache] Redis circuit breaker half-open — testing Redis");
    return false;
  }
  return true;
}

function isRedisAvailable(): boolean {
  return isRedisConfigured() && !!redis && !isCircuitOpen();
}

// ── Generic cache get ─────────────────────────────────────────────────────────
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!isRedisAvailable()) return null;

  try {
    const cached = await redis!.get<T>(key);
    recordSuccess();
    return cached;
  } catch (error) {
    recordFailure();
    console.error(`[cache] get error for key ${key}:`, error);
    return null;
  }
}

// ── Generic cache set ─────────────────────────────────────────────────────────
export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number = DEFAULT_TTL
): Promise<void> {
  if (!isRedisAvailable()) return;

  try {
    await redis!.set(key, value, { ex: ttlSeconds });
    recordSuccess();
  } catch (error) {
    recordFailure();
    console.error(`[cache] set error for key ${key}:`, error);
  }
}

// ── Delete cache key ──────────────────────────────────────────────────────────
export async function cacheDelete(key: string): Promise<void> {
  if (!isRedisAvailable()) return;

  try {
    await redis!.del(key);
    recordSuccess();
  } catch (error) {
    recordFailure();
    console.error(`[cache] delete error for key ${key}:`, error);
  }
}

// ── Delete multiple cache keys by pattern (uses SCAN — safe at scale) ────────
export async function cacheDeletePattern(pattern: string): Promise<number> {
  if (!isRedisAvailable()) return 0;

  try {
    let cursor = 0;
    let deleted = 0;
    do {
      // SCAN is non-blocking unlike KEYS — safe for production Redis
      const [newCursor, keys] = await redis!.scan(cursor, {
        match: pattern,
        count: 100,
      });
      if (keys.length > 0) {
        await redis!.del(...keys);
        deleted += keys.length;
      }
      cursor = Number(newCursor);
    } while (cursor !== 0);
    recordSuccess();
    return deleted;
  } catch (error) {
    recordFailure();
    console.error(`[cache] delete pattern error for ${pattern}:`, error);
    return 0;
  }
}

// ── withCache — cache-aside with circuit breaker + stampede protection ────────
// Probabilistic early refresh: 1% chance to refresh before TTL expires,
// preventing thundering herd when cache expires simultaneously for many users.
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = DEFAULT_TTL
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    // Probabilistic early refresh — refresh in background 1% of the time
    // This prevents cache stampede when TTL expires
    if (Math.random() < 0.01) {
      fetcher()
        .then((data) => cacheSet(key, data, ttlSeconds))
        .catch(() => {});
    }
    return cached;
  }

  const data = await fetcher();
  // Fire-and-forget cache write — don't block the response
  cacheSet(key, data, ttlSeconds).catch(() => {});
  return data;
}

/**
 * Invalidate store-related caches
 * Clears all cache entries related to a specific store
 */
export async function invalidateStoreCache(
  storeId: string,
  subdomain: string
): Promise<void> {
  await Promise.allSettled([
    cacheDelete(CacheKeys.store(storeId, subdomain)),
    cacheDelete(CacheKeys.storeById(storeId)),
    cacheDelete(CacheKeys.pages(storeId)),
    cacheDelete(CacheKeys.homePage(storeId)),
    cacheDelete(CacheKeys.templates(storeId)),
  ]);
}

// ── Store-specific cache helpers ──────────────────────────────────────────────
export const storeCache = {
  async get(storeId: string, subdomain: string) {
    return cacheGet(CacheKeys.store(storeId, subdomain));
  },
  async set(storeId: string, subdomain: string, data: unknown, ttl = DEFAULT_TTL) {
    return cacheSet(CacheKeys.store(storeId, subdomain), data, ttl);
  },
  async invalidate(storeId: string, subdomain: string) {
    await cacheDelete(CacheKeys.store(storeId, subdomain));
  },
};

// ── Products cache helpers ────────────────────────────────────────────────────
export const productsCache = {
  async get(storeId: string) {
    return cacheGet(CacheKeys.products(storeId));
  },
  async set(storeId: string, data: unknown, ttl = DEFAULT_TTL) {
    return cacheSet(CacheKeys.products(storeId), data, ttl);
  },
  async invalidate(storeId: string) {
    await cacheDelete(CacheKeys.products(storeId));
  },
};
