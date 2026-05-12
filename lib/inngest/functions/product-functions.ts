import { inngest } from "../client";
import { invalidateTag } from "@/lib/cache-helpers";

// ── Product Created ───────────────────────────────────────────────────────────
export const onProductCreated = inngest.createFunction(
  {
    id: "on-product-created",
    name: "Product Created Handler",
    retries: 3,
    concurrency: { limit: 20 },
  },
  { event: "product/created" },
  async ({ event, step }) => {
    const { productId, storeId, imageUrl } = event.data;

    await step.run("invalidate-product-cache", async () => {
      // Invalidate product listings cache
      const { cacheDelete, CacheKeys } = await import("@/lib/redis/cache");
      await cacheDelete(CacheKeys.products(storeId));
      invalidateTag("products");
      return { invalidated: true };
    });

    // If product has image, trigger image optimization
    if (imageUrl) {
      await step.run("optimize-product-image", async () => {
        // TODO: Integrate with image optimization service
        // For now, just log
        console.log(`[product] Image optimization queued for ${imageUrl}`);
        return { queued: true, imageUrl };
      });
    }

    await step.run("update-search-index", async () => {
      // TODO: Update search index (Algolia, Meilisearch, etc.)
      console.log(`[product] Search index update queued for product ${productId}`);
      return { indexed: true };
    });

    return { success: true, productId, storeId };
  }
);

// ── Product Deleted ───────────────────────────────────────────────────────────
export const onProductDeleted = inngest.createFunction(
  {
    id: "on-product-deleted",
    name: "Product Deleted Handler",
    retries: 3,
    concurrency: { limit: 20 },
  },
  { event: "product/deleted" },
  async ({ event, step }) => {
    const { productId, storeId } = event.data;

    await step.run("invalidate-product-cache", async () => {
      const { cacheDelete, CacheKeys } = await import("@/lib/redis/cache");
      await cacheDelete(CacheKeys.products(storeId));
      await cacheDelete(CacheKeys.product(storeId, productId));
      invalidateTag("products");
      return { invalidated: true };
    });

    await step.run("remove-from-search-index", async () => {
      // TODO: Remove from search index
      console.log(`[product] Search index removal queued for product ${productId}`);
      return { removed: true };
    });

    return { success: true, productId, storeId };
  }
);
