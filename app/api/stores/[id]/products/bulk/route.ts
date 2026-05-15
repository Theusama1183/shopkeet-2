import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit/logger";
import { cacheDeletePattern } from "@/lib/redis";

/**
 * POST /api/stores/[id]/products/bulk
 *
 * Handles bulk product operations via Inngest for large sets.
 * Supports: delete, update_status, update_price
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: storeId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: store } = await supabase
      .from("stores").select("id").eq("id", storeId).eq("user_id", user.id).single();
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    let body: BulkRequest;
    try { body = await req.json(); } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!body.action || !Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json({ error: "Missing action or ids" }, { status: 400 });
    }

    if (body.ids.length > 500) {
      return NextResponse.json({ error: "Maximum 500 products per bulk operation" }, { status: 400 });
    }

    const db = supabase;

    switch (body.action) {
      // ── Bulk Delete ──────────────────────────────────────────────────────
      case "delete": {
        const { error } = await db
          .from("products")
          .update({
            deleted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("store_id", storeId)
          .in("id", body.ids)
          .is("deleted_at", null);

        if (error) {
          console.error("[bulk] Delete error:", error);
          return NextResponse.json({ error: "Failed to delete products" }, { status: 500 });
        }

        await cacheDeletePattern(`products:store:${storeId}:*`).catch(() => {});

        logAuditEvent({
          userId: user.id,
          action: "products.bulk_deleted",
          resource: "product",
          resourceId: storeId,
          storeId,
          metadata: { count: body.ids.length },
        });

        return NextResponse.json({ deleted: body.ids.length });
      }

      // ── Bulk Update Status ───────────────────────────────────────────────
      case "update_status": {
        if (body.is_active === undefined) {
          return NextResponse.json({ error: "Missing is_active field" }, { status: 400 });
        }

        const { error } = await db
          .from("products")
          .update({
            is_active: body.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq("store_id", storeId)
          .in("id", body.ids)
          .is("deleted_at", null);

        if (error) {
          console.error("[bulk] Status update error:", error);
          return NextResponse.json({ error: "Failed to update products" }, { status: 500 });
        }

        await cacheDeletePattern(`products:store:${storeId}:*`).catch(() => {});

        logAuditEvent({
          userId: user.id,
          action: "products.bulk_status_updated",
          resource: "product",
          resourceId: storeId,
          storeId,
          metadata: { count: body.ids.length, is_active: body.is_active },
        });

        return NextResponse.json({ updated: body.ids.length });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${body.action}` }, { status: 400 });
    }
  } catch (error) {
    console.error("[bulk] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

interface BulkRequest {
  action: "delete" | "update_status";
  ids: string[];
  is_active?: boolean;
}
