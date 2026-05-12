import { inngest } from "../client";
import { getServiceRoleDatabase } from "@/lib/supabase/database";

// ── Template Created ──────────────────────────────────────────────────────────
export const onTemplateCreated = inngest.createFunction(
  {
    id: "on-template-created",
    name: "Template Created",
  },
  { event: "template/created" },
  async ({ event, step }) => {
    const { templateId, storeId, type } = event.data;

    // Step 1: Log analytics
    await step.run("log-analytics", async () => {
      console.log(`[analytics] Template created: ${templateId} (${type}) for store ${storeId}`);
      // TODO: Send to analytics service (e.g., PostHog, Mixpanel)
      return { logged: true };
    });

    // Step 2: Invalidate cache
    await step.run("invalidate-cache", async () => {
      // Trigger cache invalidation
      await inngest.send({
        name: "cache/invalidate",
        data: {
          keys: [
            `templates:${storeId}`,
            `template:${templateId}`,
          ],
        },
      });
      return { invalidated: true };
    });

    return { success: true, templateId };
  }
);

// ── Template Activated ────────────────────────────────────────────────────────
export const onTemplateActivated = inngest.createFunction(
  {
    id: "on-template-activated",
    name: "Template Activated",
  },
  { event: "template/activated" },
  async ({ event, step }) => {
    const { templateId, storeId, type } = event.data;

    // Step 1: Deactivate other templates of same type
    await step.run("deactivate-others", async () => {
      const db = getServiceRoleDatabase();
      
      const { error } = await db
        .from('templates')
        .update({ is_active: false, updated_at: new Date().toISOString() } as any)
        .eq('store_id', storeId)
        .eq('type', type)
        .neq('id', templateId);

      if (error) {
        console.error('[template-activated] Failed to deactivate others:', error);
        throw error;
      }

      return { deactivated: true };
    });

    // Step 2: Invalidate all page caches (template affects all pages)
    await step.run("invalidate-page-caches", async () => {
      await inngest.send({
        name: "cache/invalidate",
        data: {
          keys: [
            `templates:${storeId}`,
            `template:${templateId}`,
            `pages:${storeId}`,
            `store:${storeId}`,
          ],
        },
      });
      return { invalidated: true };
    });

    // Step 3: Log analytics
    await step.run("log-analytics", async () => {
      console.log(`[analytics] Template activated: ${templateId} (${type}) for store ${storeId}`);
      return { logged: true };
    });

    return { success: true, templateId };
  }
);

// ── Template Updated ──────────────────────────────────────────────────────────
export const onTemplateUpdated = inngest.createFunction(
  {
    id: "on-template-updated",
    name: "Template Updated",
  },
  { event: "template/updated" },
  async ({ event, step }) => {
    const { templateId, storeId, isActive } = event.data;

    // Step 1: Invalidate cache
    await step.run("invalidate-cache", async () => {
      const keys = [
        `templates:${storeId}`,
        `template:${templateId}`,
      ];

      // If template is active, invalidate all pages
      if (isActive) {
        keys.push(`pages:${storeId}`, `store:${storeId}`);
      }

      await inngest.send({
        name: "cache/invalidate",
        data: { keys },
      });
      return { invalidated: true };
    });

    return { success: true, templateId };
  }
);

// ── Template Deleted ──────────────────────────────────────────────────────────
export const onTemplateDeleted = inngest.createFunction(
  {
    id: "on-template-deleted",
    name: "Template Deleted",
  },
  { event: "template/deleted" },
  async ({ event, step }) => {
    const { templateId, storeId } = event.data;

    // Step 1: Invalidate cache
    await step.run("invalidate-cache", async () => {
      await inngest.send({
        name: "cache/invalidate",
        data: {
          keys: [
            `templates:${storeId}`,
            `template:${templateId}`,
            `pages:${storeId}`,
          ],
        },
      });
      return { invalidated: true };
    });

    // Step 2: Log analytics
    await step.run("log-analytics", async () => {
      console.log(`[analytics] Template deleted: ${templateId} for store ${storeId}`);
      return { logged: true };
    });

    return { success: true, templateId };
  }
);
