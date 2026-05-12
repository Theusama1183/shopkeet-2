import { inngest } from "../client";
import { getServiceRoleDatabase } from "@/lib/supabase/database";

// ── Audit Log Archiving ───────────────────────────────────────────────────────
// Runs daily via cron — deletes audit logs older than 90 days.
// Prevents unbounded table growth at 1M+ users.
export const archiveAuditLogs = inngest.createFunction(
  {
    id: "archive-audit-logs",
    name: "Archive Old Audit Logs",
    retries: 3,
    concurrency: { limit: 1 }, // Only one instance at a time
  },
  // Run daily at 2 AM UTC
  { cron: "0 2 * * *" },
  async ({ step }) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90); // 90 days ago

    const deleted = await step.run("delete-old-audit-logs", async () => {
      const db = getServiceRoleDatabase();
      
      const { data, error } = await db
        .from('audit_logs')
        .delete()
        .lt('timestamp', cutoffDate.toISOString())
        .select('id');

      if (error) {
        console.error('[maintenance] Failed to delete old audit logs:', error);
        throw error;
      }

      return data?.length || 0;
    });

    return {
      success: true,
      deletedCount: deleted,
      cutoffDate: cutoffDate.toISOString(),
    };
  }
);
