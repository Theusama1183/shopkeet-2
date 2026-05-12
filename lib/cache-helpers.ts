/**
 * Next.js 16 cache invalidation helpers.
 *
 * In Next.js 16, `revalidateTag(tag)` requires a second `profile` argument.
 * This wrapper provides a stable API that works across Next.js versions.
 */
import { revalidateTag as _revalidateTag } from "next/cache";

/**
 * Invalidate all cached data tagged with `tag`.
 * Equivalent to `revalidateTag(tag, "max")` in Next.js 16.
 */
export function invalidateTag(tag: string): void {
  try {
    // Next.js 16 requires second argument; "max" means revalidate immediately
    _revalidateTag(tag, "max");
  } catch {
    // Silently ignore — cache invalidation failure should never crash the app
  }
}

/** Invalidate multiple tags at once */
export function invalidateTags(...tags: string[]): void {
  for (const tag of tags) {
    invalidateTag(tag);
  }
}
