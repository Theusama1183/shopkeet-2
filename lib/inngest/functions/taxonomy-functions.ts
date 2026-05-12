import { inngest } from "../client";

// ── Tag Created ───────────────────────────────────────────────────────────────
export const onTagCreated = inngest.createFunction(
  {
    id: "on-tag-created",
    name: "Tag Created",
  },
  { event: "tag/created" },
  async ({ event, step }) => {
    const { tagId, storeId, name } = event.data;

    // Step 1: Update search index
    await step.run("update-search-index", async () => {
      console.log(`[search] Indexing tag: ${name} (${tagId})`);
      // TODO: Update search index (e.g., Algolia, Meilisearch)
      return { indexed: true };
    });

    // Step 2: Invalidate cache
    await step.run("invalidate-cache", async () => {
      await inngest.send({
        name: "cache/invalidate",
        data: {
          keys: [`tags:${storeId}`, `tag:${tagId}`],
        },
      });
      return { invalidated: true };
    });

    return { success: true, tagId };
  }
);

// ── Category Created ──────────────────────────────────────────────────────────
export const onCategoryCreated = inngest.createFunction(
  {
    id: "on-category-created",
    name: "Category Created",
  },
  { event: "category/created" },
  async ({ event, step }) => {
    const { categoryId, storeId, name } = event.data;

    // Step 1: Update search index
    await step.run("update-search-index", async () => {
      console.log(`[search] Indexing category: ${name} (${categoryId})`);
      return { indexed: true };
    });

    // Step 2: Invalidate cache
    await step.run("invalidate-cache", async () => {
      await inngest.send({
        name: "cache/invalidate",
        data: {
          keys: [`categories:${storeId}`, `category:${categoryId}`],
        },
      });
      return { invalidated: true };
    });

    return { success: true, categoryId };
  }
);

// ── Brand Created ─────────────────────────────────────────────────────────────
export const onBrandCreated = inngest.createFunction(
  {
    id: "on-brand-created",
    name: "Brand Created",
  },
  { event: "brand/created" },
  async ({ event, step }) => {
    const { brandId, storeId, name } = event.data;

    // Step 1: Update search index
    await step.run("update-search-index", async () => {
      console.log(`[search] Indexing brand: ${name} (${brandId})`);
      return { indexed: true };
    });

    // Step 2: Invalidate cache
    await step.run("invalidate-cache", async () => {
      await inngest.send({
        name: "cache/invalidate",
        data: {
          keys: [`brands:${storeId}`, `brand:${brandId}`],
        },
      });
      return { invalidated: true };
    });

    return { success: true, brandId };
  }
);

// ── Collection Created ────────────────────────────────────────────────────────
export const onCollectionCreated = inngest.createFunction(
  {
    id: "on-collection-created",
    name: "Collection Created",
  },
  { event: "collection/created" },
  async ({ event, step }) => {
    const { collectionId, storeId, name } = event.data;

    // Step 1: Update search index
    await step.run("update-search-index", async () => {
      console.log(`[search] Indexing collection: ${name} (${collectionId})`);
      return { indexed: true };
    });

    // Step 2: Invalidate cache
    await step.run("invalidate-cache", async () => {
      await inngest.send({
        name: "cache/invalidate",
        data: {
          keys: [`collections:${storeId}`, `collection:${collectionId}`],
        },
      });
      return { invalidated: true };
    });

    return { success: true, collectionId };
  }
);

// ── Tag Updated ───────────────────────────────────────────────────────────────
export const onTagUpdated = inngest.createFunction(
  {
    id: "on-tag-updated",
    name: "Tag Updated",
  },
  { event: "tag/updated" },
  async ({ event, step }) => {
    const { tagId, storeId } = event.data;

    await step.run("invalidate-cache", async () => {
      await inngest.send({
        name: "cache/invalidate",
        data: {
          keys: [`tags:${storeId}`, `tag:${tagId}`, `products:${storeId}`],
        },
      });
      return { invalidated: true };
    });

    return { success: true, tagId };
  }
);

// ── Category Updated ──────────────────────────────────────────────────────────
export const onCategoryUpdated = inngest.createFunction(
  {
    id: "on-category-updated",
    name: "Category Updated",
  },
  { event: "category/updated" },
  async ({ event, step }) => {
    const { categoryId, storeId } = event.data;

    await step.run("invalidate-cache", async () => {
      await inngest.send({
        name: "cache/invalidate",
        data: {
          keys: [`categories:${storeId}`, `category:${categoryId}`, `products:${storeId}`],
        },
      });
      return { invalidated: true };
    });

    return { success: true, categoryId };
  }
);

// ── Brand Updated ─────────────────────────────────────────────────────────────
export const onBrandUpdated = inngest.createFunction(
  {
    id: "on-brand-updated",
    name: "Brand Updated",
  },
  { event: "brand/updated" },
  async ({ event, step }) => {
    const { brandId, storeId } = event.data;

    await step.run("invalidate-cache", async () => {
      await inngest.send({
        name: "cache/invalidate",
        data: {
          keys: [`brands:${storeId}`, `brand:${brandId}`, `products:${storeId}`],
        },
      });
      return { invalidated: true };
    });

    return { success: true, brandId };
  }
);

// ── Collection Updated ────────────────────────────────────────────────────────
export const onCollectionUpdated = inngest.createFunction(
  {
    id: "on-collection-updated",
    name: "Collection Updated",
  },
  { event: "collection/updated" },
  async ({ event, step }) => {
    const { collectionId, storeId } = event.data;

    await step.run("invalidate-cache", async () => {
      await inngest.send({
        name: "cache/invalidate",
        data: {
          keys: [`collections:${storeId}`, `collection:${collectionId}`, `products:${storeId}`],
        },
      });
      return { invalidated: true };
    });

    return { success: true, collectionId };
  }
);

// ── Tag Deleted ───────────────────────────────────────────────────────────────
export const onTagDeleted = inngest.createFunction(
  {
    id: "on-tag-deleted",
    name: "Tag Deleted",
  },
  { event: "tag/deleted" },
  async ({ event, step }) => {
    const { tagId, storeId } = event.data;

    await step.run("invalidate-cache", async () => {
      await inngest.send({
        name: "cache/invalidate",
        data: {
          keys: [`tags:${storeId}`, `tag:${tagId}`, `products:${storeId}`],
        },
      });
      return { invalidated: true };
    });

    return { success: true, tagId };
  }
);

// ── Category Deleted ──────────────────────────────────────────────────────────
export const onCategoryDeleted = inngest.createFunction(
  {
    id: "on-category-deleted",
    name: "Category Deleted",
  },
  { event: "category/deleted" },
  async ({ event, step }) => {
    const { categoryId, storeId } = event.data;

    await step.run("invalidate-cache", async () => {
      await inngest.send({
        name: "cache/invalidate",
        data: {
          keys: [`categories:${storeId}`, `category:${categoryId}`, `products:${storeId}`],
        },
      });
      return { invalidated: true };
    });

    return { success: true, categoryId };
  }
);

// ── Brand Deleted ─────────────────────────────────────────────────────────────
export const onBrandDeleted = inngest.createFunction(
  {
    id: "on-brand-deleted",
    name: "Brand Deleted",
  },
  { event: "brand/deleted" },
  async ({ event, step }) => {
    const { brandId, storeId } = event.data;

    await step.run("invalidate-cache", async () => {
      await inngest.send({
        name: "cache/invalidate",
        data: {
          keys: [`brands:${storeId}`, `brand:${brandId}`, `products:${storeId}`],
        },
      });
      return { invalidated: true };
    });

    return { success: true, brandId };
  }
);

// ── Collection Deleted ────────────────────────────────────────────────────────
export const onCollectionDeleted = inngest.createFunction(
  {
    id: "on-collection-deleted",
    name: "Collection Deleted",
  },
  { event: "collection/deleted" },
  async ({ event, step }) => {
    const { collectionId, storeId } = event.data;

    await step.run("invalidate-cache", async () => {
      await inngest.send({
        name: "cache/invalidate",
        data: {
          keys: [`collections:${storeId}`, `collection:${collectionId}`, `products:${storeId}`],
        },
      });
      return { invalidated: true };
    });

    return { success: true, collectionId };
  }
);
