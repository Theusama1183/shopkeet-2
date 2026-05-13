/**
 * Audit logging — fire-and-forget, never blocks request flow.
 * At scale, audit logs are written asynchronously to avoid adding
 * latency to API responses.
 * 
 * Uses Supabase service role client to bypass RLS (system operation).
 */

import { getServiceRoleDatabase } from "@/lib/supabase/database";

export interface AuditEvent {
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  storeId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log an audit event asynchronously.
 * Uses fire-and-forget — never throws, never blocks the caller.
 */
export function logAuditEvent(event: AuditEvent): void {
  // Fire-and-forget: don't await, don't block the response
  _writeAuditLog(event).catch((err) => {
    // Only log in development — in production use a proper logger
    if (process.env.NODE_ENV !== "production") {
      console.error("[audit] Failed to log event:", err);
    }
  });
}

async function _writeAuditLog(event: AuditEvent): Promise<void> {
  const db = getServiceRoleDatabase();
  
  const { error } = await db
    .from('audit_logs')
    .insert({
      user_id: event.userId,
      action: event.action,
      resource: event.resource,
      resource_id: event.resourceId,
      // @ts-ignore - store_id not yet in types/supabase.ts
      store_id: event.storeId ?? null,
      metadata: (event.metadata as any) ?? {},
      timestamp: new Date().toISOString(),
    });

  if (error) {
    console.error('[audit] Failed to write log:', error);
    throw error;
  }
}

/**
 * Retrieve audit logs with filtering.
 * Always paginated — never returns unbounded results.
 * Uses service role to access all audit logs (admin operation).
 * 
 * @param filters - Filter options for querying audit logs
 * @param filters.userId - Filter by user ID
 * @param filters.storeId - Filter by store ID (application-level filter)
 * @param filters.resource - Filter by resource type
 * @param filters.resourceId - Filter by resource ID
 * @param filters.action - Filter by action type
 * @param filters.limit - Maximum number of results (default: 50, max: 200)
 * @param filters.offset - Number of results to skip (default: 0)
 * @returns Array of audit log entries
 */
export async function getAuditLogs(filters: {
  userId?: string;
  storeId?: string;
  resource?: string;
  resourceId?: string;
  action?: string;
  limit?: number;
  offset?: number;
}) {
  const { limit = 50, offset = 0 } = filters;

  // Cap at 200 to prevent accidental large queries
  const safeLimit = Math.min(limit, 200);

  try {
    const db = getServiceRoleDatabase();
    
    let query = db
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .range(offset, offset + safeLimit - 1);

    // Apply filters
    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters.resource) {
      query = query.eq('resource', filters.resource);
    }
    if (filters.resourceId) {
      query = query.eq('resource_id', filters.resourceId);
    }
    if (filters.action) {
      query = query.eq('action', filters.action);
    }
    if (filters.storeId) {
      query = query.eq('store_id', filters.storeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[audit] Failed to fetch logs:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("[audit] Failed to fetch logs:", error);
    return [];
  }
}
