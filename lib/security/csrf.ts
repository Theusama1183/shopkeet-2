/**
 * CSRF Protection for API Routes
 * 
 * Next.js Server Actions have built-in CSRF protection, but API routes do not.
 * This middleware validates that requests come from the same origin.
 */

import { headers } from 'next/headers';
import { NextRequest } from 'next/server';

export class CSRFError extends Error {
  constructor(message: string = 'CSRF validation failed') {
    super(message);
    this.name = 'CSRFError';
  }
}

/**
 * Extracts the root domain from a host string.
 * e.g. "admin.lvh.me:3000" → "lvh.me:3000"
 *      "store.myshop.com"   → "myshop.com"
 *      "localhost:3000"     → "localhost:3000"
 */
function getRootDomain(host: string): string {
  // Strip port for comparison logic, keep it for final result
  const [hostname, port] = host.split(':');
  const parts = hostname.split('.');
  // localhost or IP — return as-is
  if (parts.length <= 1) return host;
  // e.g. lvh.me (2 parts) or myshop.com (2 parts) — return as-is
  // e.g. admin.lvh.me (3 parts) — strip first subdomain
  const root = parts.length > 2 ? parts.slice(-2).join('.') : hostname;
  return port ? `${root}:${port}` : root;
}

/**
 * Validates CSRF token for state-changing requests (POST, PUT, PATCH, DELETE)
 * Uses origin-based validation for same-origin policy enforcement.
 * Supports subdomain routing (admin.domain.com calling /api/... on same root domain).
 */
export async function validateCSRF(_req?: NextRequest): Promise<void> {
  const headersList = await headers();

  const origin  = headersList.get('origin');
  const host    = headersList.get('host');
  const referer = headersList.get('referer');

  // ── Custom header check (fastest path) ───────────────────────────────────
  // If X-Requested-With is present and correct, skip all other checks.
  const xRequestedWith = headersList.get('x-requested-with');
  if (xRequestedWith === 'XMLHttpRequest') return;

  // ── Content-Type check ────────────────────────────────────────────────────
  // JSON API requests are safe — browsers can't send application/json cross-origin
  // without a preflight, which would be blocked by CORS.
  const contentType = headersList.get('content-type');
  if (contentType?.includes('application/json')) return;

  // ── Origin / Referer check ────────────────────────────────────────────────
  if (!origin && !referer) {
    throw new CSRFError('Missing origin, referer, and X-Requested-With headers');
  }

  const rootHost = host ? getRootDomain(host) : null;

  if (origin) {
    const originHost = new URL(origin).host;
    const rootOrigin = getRootDomain(originHost);
    if (rootOrigin !== rootHost) {
      throw new CSRFError(`Origin mismatch: ${rootOrigin} !== ${rootHost}`);
    }
    return;
  }

  if (referer) {
    const refererHost = new URL(referer).host;
    const rootReferer = getRootDomain(refererHost);
    if (rootReferer !== rootHost) {
      throw new CSRFError(`Referer mismatch: ${rootReferer} !== ${rootHost}`);
    }
    return;
  }
}

/**
 * Wrapper for API route handlers that adds CSRF protection
 * Only validates on state-changing methods (POST, PUT, PATCH, DELETE)
 */
export function withCSRFProtection<T extends any[]>(
  handler: (...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    const req = args[0] as NextRequest;
    const method = req.method;

    // Only validate CSRF on state-changing methods
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      try {
        await validateCSRF(req);
      } catch (error) {
        if (error instanceof CSRFError) {
          console.error('[csrf] Validation failed:', error.message);
          return new Response(
            JSON.stringify({
              error: 'CSRF validation failed',
              code: 'CSRF_ERROR',
            }),
            {
              status: 403,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
        throw error;
      }
    }

    return handler(...args);
  };
}
