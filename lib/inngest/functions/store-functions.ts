import { inngest } from "../client";
import { invalidateStoreCache } from "@/lib/redis/cache";

// ── Store Created ─────────────────────────────────────────────────────────────
export const onStoreCreated = inngest.createFunction(
  {
    id: "on-store-created",
    name: "Store Created Handler",
    retries: 3,
    concurrency: { limit: 10 },
  },
  { event: "store/created" },
  async ({ event, step }) => {
    const { storeId, subdomain } = event.data;

    await step.run("initialize-store-defaults", async () => {
      // Initialize default pages, settings, etc.
      return { initialized: true };
    });

    await step.run("send-welcome-notification", async () => {
      // Integrate with email service (e.g. Resend, SendGrid)
      return { notified: true };
    });

    await step.run("warm-store-cache", async () => {
      // Pre-warm Redis cache so first visitor doesn't hit DB cold
      // (actual cache warming happens via the storefront request)
      return { warmed: true, storeId, subdomain };
    });

    return { success: true, storeId };
  }
);

// ── User Onboarded ────────────────────────────────────────────────────────────
export const onUserOnboarded = inngest.createFunction(
  {
    id: "on-user-onboarded",
    name: "User Onboarded Handler",
    retries: 3,
    concurrency: { limit: 20 },
  },
  { event: "user/onboarded" },
  async ({ event, step }) => {
    const { userId, email } = event.data;

    await step.run("track-onboarding", async () => {
      // Analytics tracking
      return { tracked: true, userId };
    });

    await step.run("send-onboarding-email", async () => {
      // Send onboarding email
      return { sent: true, email };
    });

    return { success: true };
  }
);

// ── Cache Invalidation ────────────────────────────────────────────────────────
// Triggered after store/page/product mutations to keep caches fresh
export const onCacheInvalidate = inngest.createFunction(
  {
    id: "on-cache-invalidate",
    name: "Cache Invalidation Handler",
    retries: 5, // More retries — cache consistency is important
    concurrency: { limit: 5 }, // Limit concurrent invalidations
  },
  { event: "cache/invalidate" },
  async ({ event, step }) => {
    const { keys, storeId, subdomain, tags } = event.data as {
      keys?: string[];
      storeId?: string;
      subdomain?: string;
      tags?: string[];
    };

    await step.run("invalidate-redis-keys", async () => {
      if (storeId && subdomain) {
        await invalidateStoreCache(storeId, subdomain);
        return { invalidated: "store", storeId };
      }
      // Fallback: invalidate specific keys
      if (keys?.length) {
        const { cacheDelete } = await import("@/lib/redis/cache");
        await Promise.allSettled(keys.map((k) => cacheDelete(k)));
        return { invalidated: keys.length };
      }
      return { invalidated: 0 };
    });

    await step.run("revalidate-next-cache", async () => {
      // Revalidate Next.js ISR cache tags
      const tagsToRevalidate = tags ?? ["stores", "pages", "templates"];
      const { invalidateTag } = await import("@/lib/cache-helpers");
      for (const tag of tagsToRevalidate) {
        invalidateTag(tag);
      }
      return { revalidated: tagsToRevalidate };
    });

    return { success: true };
  }
);
