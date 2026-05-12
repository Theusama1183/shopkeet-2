import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

// ── Connection pool configuration ────────────────────────────────────────────
// Pool size tuned for Supabase transaction pooler (port 6543)
const PRODUCTION_POOL_SIZE = 25; // Supabase transaction pooler limit
const DEVELOPMENT_POOL_SIZE = 2;  // Minimal for local dev
const IDLE_TIMEOUT_SECONDS = 300; // 5 minutes
const CONNECT_TIMEOUT_SECONDS = 30; // Increased from 10s to handle slow networks
const MAX_LIFETIME_SECONDS = 60 * 30; // 30 minutes - recycle connections

// ── Connection pool tuned for 1M traffic ─────────────────────────────────────
// Supabase free tier: 60 direct connections max → use transaction pooler (port 6543)
// Supabase pro tier: 200+ connections → can increase max to 25-30
// Rule of thumb: max = (available_connections / num_instances) - 5 buffer
const client =
  globalForDb.conn ??
  postgres(process.env.DATABASE_URL, {
    // Prepared statements are incompatible with PgBouncer transaction mode
    prepare: false,

    // Pool size: 25 for production (assumes Supabase transaction pooler)
    // Set DATABASE_POOL_MAX env var to override per environment
    max: process.env.NODE_ENV === "production"
      ? parseInt(process.env.DATABASE_POOL_MAX ?? String(PRODUCTION_POOL_SIZE), 10)
      : DEVELOPMENT_POOL_SIZE,

    // Keep idle connections alive longer — reduces reconnect overhead
    idle_timeout: IDLE_TIMEOUT_SECONDS,

    // Fail fast on connection issues — don't block request for 60s
    connect_timeout: CONNECT_TIMEOUT_SECONDS,

    // Recycle connections after 30 minutes to avoid stale state
    max_lifetime: MAX_LIFETIME_SECONDS,

    // SSL required for Supabase
    ssl: "require",

    // Log connection errors in production
    onnotice: () => {},
  });

// In development, reuse connection across hot reloads
if (process.env.NODE_ENV !== "production") globalForDb.conn = client;

export const db = drizzle(client, { schema });

// ── Graceful shutdown ─────────────────────────────────────────────────────────
// Prevents connection leaks during deploys / process exits
if (typeof process !== "undefined") {
  const shutdown = async () => {
    try {
      await client.end({ timeout: 5 });
    } catch {
      // ignore
    }
  };
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
}
