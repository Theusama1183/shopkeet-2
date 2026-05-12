/**
 * Database transaction utilities
 * 
 * NOTE: These utilities are for Drizzle ORM transactions.
 * For Supabase client, use database functions (stored procedures) for atomic operations.
 * 
 * Supabase doesn't support traditional transactions via the client API.
 * Instead, create PostgreSQL functions for complex atomic operations:
 * 
 * Example:
 * ```sql
 * CREATE OR REPLACE FUNCTION create_store_with_defaults(
 *   p_name TEXT,
 *   p_subdomain TEXT,
 *   p_user_id UUID
 * ) RETURNS stores AS $$
 * DECLARE
 *   v_store stores;
 * BEGIN
 *   -- Insert store
 *   INSERT INTO stores (name, subdomain, user_id)
 *   VALUES (p_name, p_subdomain, p_user_id)
 *   RETURNING * INTO v_store;
 *   
 *   -- Create default page
 *   INSERT INTO pages (store_id, title, slug, is_home)
 *   VALUES (v_store.id, 'Home', 'home', true);
 *   
 *   RETURN v_store;
 * END;
 * $$ LANGUAGE plpgsql;
 * ```
 * 
 * Then call from Supabase client:
 * ```typescript
 * const { data, error } = await supabase.rpc('create_store_with_defaults', {
 *   p_name: 'My Store',
 *   p_subdomain: 'mystore',
 *   p_user_id: userId
 * });
 * ```
 */

import { db } from "@/db";
import { withQueryTiming } from "@/lib/monitoring/performance";

/**
 * Execute operations within a database transaction (Drizzle only)
 * 
 * @deprecated Use Supabase database functions for atomic operations instead
 */
export async function withTransaction<T>(
  operations: (tx: any) => Promise<T>
): Promise<T> {
  return withQueryTiming('transaction', async () => {
    return await db.transaction(async (tx) => {
      return await operations(tx);
    });
  });
}

/**
 * Retry a database operation with exponential backoff
 * Works with both Drizzle and Supabase clients
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on certain errors
      if (isNonRetryableError(error)) {
        throw error;
      }
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Check if an error should not be retried
 */
function isNonRetryableError(error: any): boolean {
  if (!error || typeof error !== 'object') return false;
  
  // Don't retry constraint violations, auth errors, etc.
  const nonRetryableCodes = [
    '23505', // unique_violation
    '23503', // foreign_key_violation
    '23502', // not_null_violation
    '23514', // check_violation
    '42P01', // undefined_table
    '42703', // undefined_column
    'PGRST301', // Supabase: JWT expired
    'PGRST302', // Supabase: JWT invalid
  ];
  
  return nonRetryableCodes.includes(error.code);
}

/**
 * Execute a batch of operations with proper error handling
 * Works with both Drizzle and Supabase clients
 */
export async function executeBatch<T>(
  operations: (() => Promise<T>)[],
  options: {
    concurrency?: number;
    failFast?: boolean;
  } = {}
): Promise<(T | Error)[]> {
  const { concurrency = 5, failFast = false } = options;
  const results: (T | Error)[] = [];
  
  // Process operations in batches
  for (let i = 0; i < operations.length; i += concurrency) {
    const batch = operations.slice(i, i + concurrency);
    
    const batchPromises = batch.map(async (operation, _index) => {
      try {
        return await operation();
      } catch (error) {
        if (failFast) {
          throw error;
        }
        return error as Error;
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Check for errors if failFast is enabled
    if (failFast && batchResults.some(result => result instanceof Error)) {
      const firstError = batchResults.find(result => result instanceof Error) as Error;
      throw firstError;
    }
  }
  
  return results;
}