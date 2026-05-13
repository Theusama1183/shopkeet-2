/**
 * Next.js cache invalidation helpers.
 */
import { revalidateTag as _revalidateTag } from "next/cache";

/**
 * Invalidate all cached data tagged with `tag`.
 * Next.js 16 requires a second `profile` argument — "default" revalidates immediately.
 */
export function invalidateTag(tag: string): void {
  try {
    _revalidateTag(tag, "default");
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
