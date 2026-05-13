import { inngest } from "../client";
import { getServiceRoleDatabase } from "@/lib/supabase/database";

const BATCH_SIZE = 500; // Delete in batches to avoid DB timeouts

// ── Audit Log Archiving ───────────────────────────────────────────────────────
// Runs daily at 2 AM UTC — soft-deletes audit logs older than 90 days.
// Batched to prevent DB timeouts at scale.
export const archiveAuditLogs = inngest.createFunction(
  {
    id: "archive-audit-logs",
    name: "Archive Old Audit Logs",
    retries: 3,
    concurrency: { limit: 1 }, // Only one instance at a time
  },
  { cron: "0 2 * * *" },
  async ({ step }) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);
    const cutoffIso = cutoffDate.toISOString();

    let totalDeleted = 0;
    let hasMore = true;

    while (hasMore) {
      const batchDeleted = await step.run(`delete-batch-${totalDeleted}`, async () => {
        const db = getServiceRoleDatabase();

        // Fetch IDs of old logs in batches — avoids single massive DELETE
        const { data: ids, error: fetchError } = await db
          .from('audit_logs')
          .select('id')
          .lt('timestamp', cutoffIso)
          .limit(BATCH_SIZE);

        if (fetchError) {
          console.error('[maintenance] Failed to fetch audit log IDs:', fetchError);
          throw fetchError;
        }

        if (!ids || ids.length === 0) return 0;

        const { error: deleteError } = await db
          .from('audit_logs')
          .delete()
          .in('id', ids.map(r => r.id));

        if (deleteError) {
          console.error('[maintenance] Failed to delete audit logs:', deleteError);
          throw deleteError;
        }

        return ids.length;
      });

      totalDeleted += batchDeleted;
      // If we got fewer than BATCH_SIZE, there are no more rows
      hasMore = batchDeleted === BATCH_SIZE;
    }

    return {
      success: true,
      deletedCount: totalDeleted,
      cutoffDate: cutoffIso,
    };
  }
);
