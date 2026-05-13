/**
 * Supabase Database Client
 * 
 * This module provides a database client that works with RLS policies.
 * Unlike Drizzle's direct PostgreSQL connection, this client:
 * - Sends JWT tokens with every request
 * - Enables RLS policy enforcement via auth.uid()
 * - Provides defense-in-depth security
 * 
 * Usage:
 * - Use getDatabase() for authenticated queries (admin, API routes)
 * - Use getAnonDatabase() for public queries (storefront - no cookies)
 * - Use getServiceRoleDatabase() for system operations
 * - Keep Drizzle for schema definitions and migrations
 */

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

/**
 * Server-side database client (for API routes, server components)
 * Automatically includes user's JWT token for RLS enforcement
 */
export async function getDatabase() {
  const supabase = await createServerClient();
  return supabase;
}

/**
 * Anonymous database client (for public storefront pages)
 * Uses anon key without cookies - safe to use in unstable_cache()
 * 
 * Use this for:
 * - Public storefront pages
 * - Cached queries that don't need authentication
 * - Any query inside unstable_cache()
 */
export function getAnonDatabase() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set");
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

/**
 * Service role client (bypasses RLS)
 * Use ONLY for:
 * - System operations (audit logs, background jobs)
 * - Admin operations that need to bypass RLS
 * - Migrations and maintenance
 * 
 * ⚠️ WARNING: This bypasses ALL RLS policies. Use with extreme caution.
 */
export function getServiceRoleDatabase() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

/**
 * Helper to convert Drizzle-style queries to Supabase queries
 * This maintains type safety while using Supabase client
 */
export type SupabaseQuery<T> = {
  select: (columns?: string) => SupabaseQuery<T>;
  insert: (data: Partial<T> | Partial<T>[]) => SupabaseQuery<T>;
  update: (data: Partial<T>) => SupabaseQuery<T>;
  delete: () => SupabaseQuery<T>;
  eq: (column: keyof T, value: unknown) => SupabaseQuery<T>;
  neq: (column: keyof T, value: unknown) => SupabaseQuery<T>;
  is: (column: keyof T, value: unknown) => SupabaseQuery<T>;
  in: (column: keyof T, values: unknown[]) => SupabaseQuery<T>;
  order: (column: keyof T, options?: { ascending?: boolean }) => SupabaseQuery<T>;
  limit: (count: number) => SupabaseQuery<T>;
  range: (from: number, to: number) => SupabaseQuery<T>;
  single: () => Promise<{ data: T | null; error: Error | null }>;
  maybeSingle: () => Promise<{ data: T | null; error: Error | null }>;
};

/**
 * Type-safe table names
 */
export type TableName = 
  | "users"
  | "stores" 
  | "products"
  | "pages"
  | "templates"
  | "popups"
  | "audit_logs";

/**
 * Helper to get a table query builder with type safety
 */
export async function table<T = unknown>(tableName: TableName) {
  const db = await getDatabase();
  return db.from(tableName) as unknown as SupabaseQuery<T>;
}

/**
 * Helper for service role table access (bypasses RLS)
 */
export function serviceTable<T = unknown>(tableName: TableName) {
  const db = getServiceRoleDatabase();
  return db.from(tableName) as unknown as SupabaseQuery<T>;
}

/**
 * Convenience helper to get an authenticated database client.
 * NOTE: This is NOT a real transaction — operations are not atomic.
 * If you need atomicity, use a Supabase database function (RPC).
 */
export async function withDatabase<T>(
  operations: (db: Awaited<ReturnType<typeof getDatabase>>) => Promise<T>
): Promise<T> {
  const db = await getDatabase();
  return operations(db);
}

/**
 * @deprecated Use withDatabase() instead. This alias is kept for backward compatibility.
 */
export const transaction = withDatabase;
