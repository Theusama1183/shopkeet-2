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
 * Validates CSRF token for state-changing requests (POST, PUT, PATCH, DELETE)
 * Uses origin-based validation for same-origin policy enforcement
 */
export async function validateCSRF(_req?: NextRequest): Promise<void> {
  const headersList = await headers();
  
  const origin = headersList.get('origin');
  const host = headersList.get('host');
  const referer = headersList.get('referer');
  
  // Allow requests without origin (same-origin requests from older browsers)
  // But require referer in that case
  if (!origin && !referer) {
    throw new CSRFError('Missing origin and referer headers');
  }
  
  // Validate origin matches host
  if (origin) {
    const originHost = new URL(origin).host;
    if (originHost !== host) {
      throw new CSRFError(`Origin mismatch: ${originHost} !== ${host}`);
    }
  }
  
  // Validate referer if origin is missing
  if (!origin && referer) {
    const refererHost = new URL(referer).host;
    if (refererHost !== host) {
      throw new CSRFError(`Referer mismatch: ${refererHost} !== ${host}`);
    }
  }
  
  // For extra security, check for custom header (prevents simple form submissions)
  const csrfHeader = headersList.get('x-requested-with');
  if (!csrfHeader || csrfHeader !== 'XMLHttpRequest') {
    // Allow if Content-Type is application/json (API requests)
    const contentType = headersList.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw new CSRFError('Missing X-Requested-With header');
    }
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
          return new Response(
            JSON.stringify({ 
              error: 'CSRF validation failed',
              code: 'CSRF_ERROR' 
            }),
            { 
              status: 403,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
        throw error;
      }
    }
    
    return handler(...args);
  };
}
