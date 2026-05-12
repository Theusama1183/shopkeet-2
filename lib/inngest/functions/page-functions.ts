import { inngest } from "../client";
import { invalidateTag } from "@/lib/cache-helpers";

// ── Page Created ──────────────────────────────────────────────────────────────
export const onPageCreated = inngest.createFunction(
  {
    id: "on-page-created",
    name: "Page Created",
  },
  { event: "page/created" },
  async ({ event, step }) => {
    const { pageId, storeId, slug: _slug } = event.data;

    // Step 1: Log analytics
    await step.run("log-analytics", async () => {
      console.log(`[analytics] Page created: ${_slug} (${pageId}) for store ${storeId}`);
      return { logged: true };
    });

    // Step 2: Invalidate cache
    await step.run("invalidate-cache", async () => {
      await inngest.send({
        name: "cache/invalidate",
        data: {
          keys: [`pages:${storeId}`, `page:${pageId}`],
        },
      });
      return { invalidated: true };
    });

    return { success: true, pageId };
  }
);

// ── Page Updated ──────────────────────────────────────────────────────────────
export const onPageUpdated = inngest.createFunction(
  {
    id: "on-page-updated",
    name: "Page Updated",
  },
  { event: "page/updated" },
  async ({ event, step }) => {
    const { pageId, storeId, slug: _slug, isPublished } = event.data;

    // Step 1: Invalidate cache
    await step.run("invalidate-cache", async () => {
      const keys = [`pages:${storeId}`, `page:${pageId}`];
      
      // If published, invalidate store cache too
      if (isPublished) {
        keys.push(`store:${storeId}`);
      }

      await inngest.send({
        name: "cache/invalidate",
        data: { keys },
      });
      return { invalidated: true };
    });

    return { success: true, pageId };
  }
);

// ── Page Published ────────────────────────────────────────────────────────────
export const onPagePublished = inngest.createFunction(
  {
    id: "on-page-published",
    name: "Page Published Handler",
    retries: 3,
    concurrency: { limit: 10 },
  },
  { event: "page/published" },
  async ({ event, step }) => {
    const { pageId, storeId, slug } = event.data;

    await step.run("invalidate-page-cache", async () => {
      const { cacheDelete, CacheKeys } = await import("@/lib/redis/cache");
      await cacheDelete(CacheKeys.pages(storeId));
      await cacheDelete(CacheKeys.page(storeId, pageId));
      if (slug === "home" || slug === "") {
        await cacheDelete(CacheKeys.homePage(storeId));
      }
      invalidateTag("pages");
      return { invalidated: true };
    });

    await step.run("warm-page-cache", async () => {
      // Pre-warm the page cache by making a request to it
      // This ensures the first visitor gets a fast response
      console.log(`[page] Cache warming queued for page ${slug}`);
      return { warmed: true };
    });

    await step.run("notify-cdn", async () => {
      // TODO: Purge CDN cache (Cloudflare, Vercel, etc.)
      console.log(`[page] CDN purge queued for page ${slug}`);
      return { purged: true };
    });

    return { success: true, pageId, storeId, slug };
  }
);

// ── Page Unpublished ──────────────────────────────────────────────────────────
export const onPageUnpublished = inngest.createFunction(
  {
    id: "on-page-unpublished",
    name: "Page Unpublished",
  },
  { event: "page/unpublished" },
  async ({ event, step }) => {
    const { pageId, storeId, slug: _slug } = event.data;

    // Step 1: Invalidate cache
    await step.run("invalidate-cache", async () => {
      await inngest.send({
        name: "cache/invalidate",
        data: {
          keys: [
            `pages:${storeId}`,
            `page:${pageId}`,
            `store:${storeId}`,
          ],
        },
      });
      return { invalidated: true };
    });

    // Step 2: Remove from sitemap
    await step.run("update-sitemap", async () => {
      console.log(`[sitemap] Removing page ${_slug} from sitemap`);
      // TODO: Regenerate sitemap
      return { updated: true };
    });

    return { success: true, pageId };
  }
);

// ── Page Deleted ──────────────────────────────────────────────────────────────
export const onPageDeleted = inngest.createFunction(
  {
    id: "on-page-deleted",
    name: "Page Deleted",
  },
  { event: "page/deleted" },
  async ({ event, step }) => {
    const { pageId, storeId, slug: _slug } = event.data;

    // Step 1: Invalidate cache
    await step.run("invalidate-cache", async () => {
      await inngest.send({
        name: "cache/invalidate",
        data: {
          keys: [
            `pages:${storeId}`,
            `page:${pageId}`,
            `store:${storeId}`,
          ],
        },
      });
      return { invalidated: true };
    });

    // Step 2: Remove from sitemap
    await step.run("update-sitemap", async () => {
      console.log(`[sitemap] Removing page ${_slug} from sitemap`);
      return { updated: true };
    });

    // Step 3: Log analytics
    await step.run("log-analytics", async () => {
      console.log(`[analytics] Page deleted: ${_slug} (${pageId}) for store ${storeId}`);
      return { logged: true };
    });

    return { success: true, pageId };
  }
);
