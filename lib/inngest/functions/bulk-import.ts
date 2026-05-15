import { inngest } from "../client";

/**
 * Background bulk product import — handles up to 5000 products
 * by processing them in batches of 50 via Inngest steps.
 *
 * Each batch is a separate step, so failures are isolated and
 * retried independently. This prevents timeouts and keeps the
 * main API responsive.
 */
export const onBulkProductImport = inngest.createFunction(
  {
    id: "on-bulk-product-import",
    name: "Bulk Product Import",
    retries: 2,
    concurrency: { limit: 5 },
    onFailure: async ({ event, error }) => {
      const { logAuditEvent } = await import("@/lib/audit/logger");
      const { storeId, userId } = event.data.event.data;
      logAuditEvent({
        userId,
        action: "products.bulk_import_failed",
        resource: "product",
        resourceId: storeId,
        storeId,
        metadata: { error: error.message },
      });
    },
  },
  { event: "product/bulk-import" },
  async ({ event, step }) => {
    const { storeId, userId, products } = event.data;
    const BATCH_SIZE = 50;

    // ── Security Check ───────────────────────────────────────────────────────
    // Verify user still has access to this store in the background
    const hasAccess = await step.run("verify-permissions", async () => {
      const { getServiceRoleDatabase } = await import("@/lib/supabase/database");
      const db = getServiceRoleDatabase();
      const { data } = await db
        .from("stores")
        .select("id")
        .eq("id", storeId)
        .eq("user_id", userId)
        .single();
      return !!data;
    });

    if (!hasAccess) {
      throw new Error(`User ${userId} no longer has access to store ${storeId}`);
    }

    const results = { imported: 0, skipped: 0, errors: [] as string[] };

    // Split into batches
    const totalBatches = Math.ceil(products.length / BATCH_SIZE);

    for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
      const batch = products.slice(batchIdx * BATCH_SIZE, (batchIdx + 1) * BATCH_SIZE);

      const batchResult = await step.run(
        `import-batch-${batchIdx + 1}-of-${totalBatches}`,
        async () => {
          const { getServiceRoleDatabase } = await import("@/lib/supabase/database");
          const db = getServiceRoleDatabase();

          const rowsToInsert: any[] = [];
          const rowMetadata: { originalIdx: number; quantity: number }[] = [];
          const batchErrors: string[] = [];
          let batchSkipped = 0;

          // 1. Process and Validate Batch
          for (let i = 0; i < batch.length; i++) {
            const p = batch[i];
            const globalIdx = batchIdx * BATCH_SIZE + i + 1;

            const validation = validateAndSanitizeProduct(p, globalIdx);
            if (!validation.success) {
              batchErrors.push(validation.error!);
              batchSkipped++;
              continue;
            }

            rowsToInsert.push({
              ...validation.data,
              store_id: storeId,
            });
            rowMetadata.push({
              originalIdx: i,
              quantity: parseQuantity(p.quantity),
            });
          }

          if (rowsToInsert.length === 0) {
            return { imported: 0, skipped: batchSkipped, errors: batchErrors };
          }

          // 2. Insert Products
          const { data: inserted, error: prodError } = await db
            .from("products")
            .insert(rowsToInsert)
            .select("id");

          if (prodError) {
            console.error(`[import] Batch ${batchIdx + 1} product error:`, prodError);
            return {
              imported: 0,
              skipped: rowsToInsert.length + batchSkipped,
              errors: [...batchErrors, `Batch ${batchIdx + 1} products failed: ${prodError.message}`],
            };
          }

          // 3. Create Inventory Records
          const importedCount = inserted?.length ?? 0;
          if (inserted && inserted.length > 0) {
            const inventoryRows = inserted.map((product: { id: string }, idx: number) => ({
              product_id: product.id,
              store_id: storeId,
              quantity: rowMetadata[idx].quantity,
              low_stock_threshold: 5,
              track_inventory: true,
              allow_backorder: false,
            }));

            const { error: invError } = await db.from("inventory").insert(inventoryRows);
            if (invError) {
              console.error(`[import] Batch ${batchIdx + 1} inventory error:`, invError);
              batchErrors.push(`Batch ${batchIdx + 1} inventory partially failed: ${invError.message}`);
            }
          }

          return { imported: importedCount, skipped: batchSkipped, errors: batchErrors };
        }
      );

      results.imported += batchResult.imported;
      results.skipped += batchResult.skipped;
      results.errors.push(...batchResult.errors);
    }

    // Invalidate cache after all batches
    await step.run("invalidate-cache", async () => {
      const { cacheDeletePattern } = await import("@/lib/redis");
      const { invalidateTag } = await import("@/lib/cache-helpers");
      await cacheDeletePattern(`products:store:${storeId}:*`);
      invalidateTag("products");
      return { invalidated: true };
    });

    // Audit log
    await step.run("audit-log", async () => {
      const { logAuditEvent } = await import("@/lib/audit/logger");
      logAuditEvent({
        userId,
        action: "products.bulk_imported",
        resource: "product",
        resourceId: storeId,
        storeId,
        metadata: {
          totalProducts: products.length,
          imported: results.imported,
          skipped: results.skipped,
          batches: totalBatches,
        },
      });
      return { logged: true };
    });

    console.log(
      `[import] Complete: ${results.imported} imported, ${results.skipped} skipped out of ${products.length} total`
    );

    return {
      success: true,
      storeId,
      ...results,
    };
  }
);

// ── Helpers ──────────────────────────────────────────────────────────────────

function validateAndSanitizeProduct(p: any, globalIdx: number) {
  if (!p.name || typeof p.name !== "string" || p.name.trim().length < 1) {
    return { success: false, error: `Row ${globalIdx}: Missing product name` };
  }

  // Parse price — handle "$12.99", "12.99", etc. Always treat as dollars -> cents.
  let priceCents = 0;
  if (p.price !== undefined && p.price !== null && String(p.price).trim() !== "") {
    const priceStr = String(p.price).replace(/[$,\s]/g, "");
    const priceNum = parseFloat(priceStr);
    if (!isNaN(priceNum)) {
      priceCents = Math.round(priceNum * 100);
    }
  }

  const sanitized = {
    name: p.name.trim().replace(/[<>]/g, "").slice(0, 2000),
    description: p.description
      ? String(p.description).trim().replace(/[<>]/g, "").slice(0, 2000)
      : null,
    price: priceCents,
    sku: p.sku ? String(p.sku).trim().slice(0, 100) : null,
    image: p.image && isValidUrl(String(p.image)) ? String(p.image) : null,
    is_active: p.status ? String(p.status).toLowerCase() !== "draft" : true,
  };

  return { success: true, data: sanitized };
}

function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function parseQuantity(val?: any): number {
  if (val === undefined || val === null || String(val).trim() === "") return 0;
  const num = parseInt(String(val), 10);
  return isNaN(num) ? 0 : Math.max(0, num);
}
