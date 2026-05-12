import { inngest } from "../client";
import { invalidateStoreCache } from "@/lib/redis/cache";

// ── Store Deleted Cleanup ─────────────────────────────────────────────────────
export const onStoreDeleted = inngest.createFunction(
  {
    id: "on-store-deleted",
    name: "Store Deleted Cleanup Handler",
    retries: 3,
    concurrency: { limit: 5 },
  },
  { event: "store/deleted" },
  async ({ event, step }) => {
    const { storeId, userId, subdomain } = event.data;

    await step.run("cleanup-cache", async () => {
      // Remove all cache entries for this store
      await invalidateStoreCache(storeId, subdomain);
      return { cleaned: true };
    });

    await step.run("cleanup-files", async () => {
      // TODO: Delete all files from R2/S3 for this store
      // This prevents orphaned files from consuming storage
      console.log(`[cleanup] File cleanup queued for store ${storeId}`);
      return { queued: true };
    });

    await step.run("cancel-subscriptions", async () => {
      // TODO: Cancel any active subscriptions for this store
      console.log(`[cleanup] Subscription cancellation queued for store ${storeId}`);
      return { cancelled: true };
    });

    await step.run("notify-user", async () => {
      // TODO: Send confirmation email to user
      console.log(`[cleanup] Deletion confirmation email queued for user ${userId}`);
      return { notified: true };
    });

    return { success: true, storeId, userId };
  }
);
