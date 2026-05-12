import { inngest } from "../client";

// ── Popup Created ─────────────────────────────────────────────────────────────
export const onPopupCreated = inngest.createFunction(
  {
    id: "on-popup-created",
    name: "Popup Created",
  },
  { event: "popup/created" },
  async ({ event, step }) => {
    const { popupId, storeId } = event.data;

    // Step 1: Log analytics
    await step.run("log-analytics", async () => {
      console.log(`[analytics] Popup created: ${popupId} for store ${storeId}`);
      // TODO: Send to analytics service
      return { logged: true };
    });

    // Step 2: Invalidate cache
    await step.run("invalidate-cache", async () => {
      await inngest.send({
        name: "cache/invalidate",
        data: {
          keys: [
            `popups:${storeId}`,
            `popup:${popupId}`,
          ],
        },
      });
      return { invalidated: true };
    });

    return { success: true, popupId };
  }
);

// ── Popup Activated ───────────────────────────────────────────────────────────
export const onPopupActivated = inngest.createFunction(
  {
    id: "on-popup-activated",
    name: "Popup Activated",
  },
  { event: "popup/activated" },
  async ({ event, step }) => {
    const { popupId, storeId } = event.data;

    // Step 1: Invalidate cache (active popups affect all pages)
    await step.run("invalidate-cache", async () => {
      await inngest.send({
        name: "cache/invalidate",
        data: {
          keys: [
            `popups:${storeId}`,
            `popup:${popupId}`,
            `store:${storeId}`,
          ],
        },
      });
      return { invalidated: true };
    });

    // Step 2: Log analytics
    await step.run("log-analytics", async () => {
      console.log(`[analytics] Popup activated: ${popupId} for store ${storeId}`);
      return { logged: true };
    });

    return { success: true, popupId };
  }
);

// ── Popup Deactivated ─────────────────────────────────────────────────────────
export const onPopupDeactivated = inngest.createFunction(
  {
    id: "on-popup-deactivated",
    name: "Popup Deactivated",
  },
  { event: "popup/deactivated" },
  async ({ event, step }) => {
    const { popupId, storeId } = event.data;

    // Step 1: Invalidate cache
    await step.run("invalidate-cache", async () => {
      await inngest.send({
        name: "cache/invalidate",
        data: {
          keys: [
            `popups:${storeId}`,
            `popup:${popupId}`,
            `store:${storeId}`,
          ],
        },
      });
      return { invalidated: true };
    });

    return { success: true, popupId };
  }
);

// ── Popup Updated ─────────────────────────────────────────────────────────────
export const onPopupUpdated = inngest.createFunction(
  {
    id: "on-popup-updated",
    name: "Popup Updated",
  },
  { event: "popup/updated" },
  async ({ event, step }) => {
    const { popupId, storeId, isActive } = event.data;

    // Step 1: Invalidate cache
    await step.run("invalidate-cache", async () => {
      const keys = [
        `popups:${storeId}`,
        `popup:${popupId}`,
      ];

      // If popup is active, invalidate store cache
      if (isActive) {
        keys.push(`store:${storeId}`);
      }

      await inngest.send({
        name: "cache/invalidate",
        data: { keys },
      });
      return { invalidated: true };
    });

    return { success: true, popupId };
  }
);

// ── Popup Deleted ─────────────────────────────────────────────────────────────
export const onPopupDeleted = inngest.createFunction(
  {
    id: "on-popup-deleted",
    name: "Popup Deleted",
  },
  { event: "popup/deleted" },
  async ({ event, step }) => {
    const { popupId, storeId } = event.data;

    // Step 1: Invalidate cache
    await step.run("invalidate-cache", async () => {
      await inngest.send({
        name: "cache/invalidate",
        data: {
          keys: [
            `popups:${storeId}`,
            `popup:${popupId}`,
            `store:${storeId}`,
          ],
        },
      });
      return { invalidated: true };
    });

    // Step 2: Log analytics
    await step.run("log-analytics", async () => {
      console.log(`[analytics] Popup deleted: ${popupId} for store ${storeId}`);
      return { logged: true };
    });

    return { success: true, popupId };
  }
);
