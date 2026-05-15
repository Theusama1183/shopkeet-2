import { inngest } from "../client";
import { invalidateTag } from "@/lib/cache-helpers";

// ─── Transfer Completed ──────────────────────────────────────────────────────
export const onTransferCompleted = inngest.createFunction(
  {
    id: "on-transfer-completed",
    name: "Inventory Transfer Completed",
    retries: 3,
    concurrency: { limit: 10 },
  },
  { event: "inventory/transfer.completed" },
  async ({ event, step }) => {
    const { transferId, storeId } = event.data;

    await step.run("update-warehouse-stock", async () => {
      const { getServiceRoleDatabase } = await import("@/lib/supabase/database");
      const db = getServiceRoleDatabase();

      // Fetch transfer with items
      const { data: transfer } = await db
        .from("inventory_transfers")
        .select("*, transfer_items(*)")
        .eq("id", transferId)
        .single();

      if (!transfer) throw new Error(`Transfer ${transferId} not found`);

      // For each item, deduct from source warehouse and add to destination
      // This is simplified — in production you'd want warehouse-level inventory tracking
      console.log(`[transfer] Processing ${transfer.transfer_items?.length ?? 0} items for transfer ${transferId}`);

      return { processed: true, transferId };
    });

    await step.run("invalidate-inventory-cache", async () => {
      const { cacheDeletePattern } = await import("@/lib/redis");
      await cacheDeletePattern(`inventory:store:${storeId}:*`);
      await cacheDeletePattern(`warehouses:store:${storeId}:*`);
      invalidateTag("inventory");
      return { invalidated: true };
    });

    await step.run("audit-log", async () => {
      const { logAuditEvent } = await import("@/lib/audit/logger");
      logAuditEvent({
        userId: "system",
        action: "transfer.completed",
        resource: "inventory_transfer",
        resourceId: transferId,
        storeId,
        metadata: { transferId, storeId },
      });
      return { logged: true };
    });

    return { success: true, transferId, storeId };
  }
);

// ─── Transfer Cancelled ──────────────────────────────────────────────────────
export const onTransferCancelled = inngest.createFunction(
  {
    id: "on-transfer-cancelled",
    name: "Inventory Transfer Cancelled",
    retries: 3,
    concurrency: { limit: 10 },
  },
  { event: "inventory/transfer.cancelled" },
  async ({ event, step }) => {
    const { transferId, storeId } = event.data;

    await step.run("invalidate-inventory-cache", async () => {
      const { cacheDeletePattern } = await import("@/lib/redis");
      await cacheDeletePattern(`inventory:store:${storeId}:*`);
      invalidateTag("inventory");
      return { invalidated: true };
    });

    await step.run("audit-log", async () => {
      const { logAuditEvent } = await import("@/lib/audit/logger");
      logAuditEvent({
        userId: "system",
        action: "transfer.cancelled",
        resource: "inventory_transfer",
        resourceId: transferId,
        storeId,
        metadata: { transferId, storeId },
      });
      return { logged: true };
    });

    return { success: true, transferId, storeId };
  }
);

// ─── Sale Recorded ───────────────────────────────────────────────────────────
export const onSaleRecorded = inngest.createFunction(
  {
    id: "on-sale-recorded",
    name: "Inventory Sale Recorded",
    retries: 3,
    concurrency: { limit: 20 },
  },
  { event: "inventory/sale.recorded" },
  async ({ event, step }) => {
    const { saleId, storeId, productId, quantity } = event.data;

    await step.run("deduct-inventory", async () => {
      const { getServiceRoleDatabase } = await import("@/lib/supabase/database");
      const db = getServiceRoleDatabase();

      // Deduct stock from inventory
      const { data: inv } = await db
        .from("inventory")
        .select("id, quantity, low_stock_threshold")
        .eq("product_id", productId)
        .eq("store_id", storeId)
        .single();

      if (inv) {
        const newQty = Math.max(0, inv.quantity - quantity);
        await db
          .from("inventory")
          .update({ quantity: newQty, updated_at: new Date().toISOString() })
          .eq("id", inv.id);

        // Check low stock threshold
        const threshold = inv.low_stock_threshold ?? 5;
        if (newQty <= threshold && inv.quantity > threshold) {
          console.log(`[sale] Low stock alert: product ${productId} now at ${newQty} units (threshold: ${threshold})`);
          // TODO: Send low-stock notification email/webhook
        }

        return { deducted: true, previousQty: inv.quantity, newQty };
      }

      return { deducted: false, reason: "No inventory record found" };
    });

    await step.run("invalidate-cache", async () => {
      const { cacheDeletePattern } = await import("@/lib/redis");
      await cacheDeletePattern(`inventory:store:${storeId}:*`);
      await cacheDeletePattern(`sales:store:${storeId}:*`);
      invalidateTag("inventory");
      return { invalidated: true };
    });

    return { success: true, saleId, storeId };
  }
);

// ─── Warehouse Created ───────────────────────────────────────────────────────
export const onWarehouseCreated = inngest.createFunction(
  {
    id: "on-warehouse-created",
    name: "Warehouse Created Handler",
    retries: 3,
    concurrency: { limit: 10 },
  },
  { event: "inventory/warehouse.created" },
  async ({ event, step }) => {
    const { warehouseId, storeId } = event.data;

    await step.run("invalidate-warehouse-cache", async () => {
      const { cacheDeletePattern } = await import("@/lib/redis");
      await cacheDeletePattern(`warehouses:store:${storeId}:*`);
      invalidateTag("warehouses");
      return { invalidated: true };
    });

    return { success: true, warehouseId, storeId };
  }
);

// ─── Supplier Created ────────────────────────────────────────────────────────
export const onSupplierCreated = inngest.createFunction(
  {
    id: "on-supplier-created",
    name: "Supplier Created Handler",
    retries: 3,
    concurrency: { limit: 10 },
  },
  { event: "inventory/supplier.created" },
  async ({ event, step }) => {
    const { supplierId, storeId } = event.data;

    await step.run("invalidate-supplier-cache", async () => {
      const { cacheDeletePattern } = await import("@/lib/redis");
      await cacheDeletePattern(`suppliers:store:${storeId}:*`);
      invalidateTag("suppliers");
      return { invalidated: true };
    });

    return { success: true, supplierId, storeId };
  }
);
