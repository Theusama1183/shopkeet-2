/**
 * Database transaction utilities
 *
 * NOTE: Supabase client does NOT support traditional transactions.
 * For atomic operations, create PostgreSQL functions (stored procedures)
 * and call them via supabase.rpc().
 *
 * Example:
 * ```typescript
 * const { data, error } = await supabase.rpc('create_store_with_defaults', {
 *   p_name: 'My Store',
 *   p_subdomain: 'mystore',
 *   p_user_id: userId
 * });
 * ```
 */

import { withQueryTiming } from "@/lib/monitoring/performance";

/**
 * Retry a database operation with exponential backoff.
 * Works with Supabase client operations.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error = new Error("Unknown error");

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

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

  throw lastError;
}

function isNonRetryableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as Record<string, unknown>;
  const nonRetryableCodes = [
    '23505', '23503', '23502', '23514',
    '42P01', '42703',
    'PGRST301', 'PGRST302',
  ];
  return typeof e.code === 'string' && nonRetryableCodes.includes(e.code);
}

/**
 * Execute a batch of operations with concurrency control.
 */
export async function executeBatch<T>(
  operations: (() => Promise<T>)[],
  options: { concurrency?: number; failFast?: boolean } = {}
): Promise<(T | Error)[]> {
  const { concurrency = 5, failFast = false } = options;
  const results: (T | Error)[] = [];

  for (let i = 0; i < operations.length; i += concurrency) {
    const batch = operations.slice(i, i + concurrency);

    const batchResults = await Promise.all(
      batch.map(async (op) => {
        try {
          return await op();
        } catch (error) {
          if (failFast) throw error;
          return error as Error;
        }
      })
    );

    results.push(...batchResults);

    if (failFast && batchResults.some(r => r instanceof Error)) {
      throw batchResults.find(r => r instanceof Error) as Error;
    }
  }

  return results;
}

// Re-export for convenience
export { withQueryTiming };