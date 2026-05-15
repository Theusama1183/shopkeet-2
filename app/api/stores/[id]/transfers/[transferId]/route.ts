import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceRoleDatabase } from "@/lib/supabase/database";
import { logAuditEvent } from "@/lib/audit/logger";
import { updateTransferStatusSchema } from "@/lib/validations/inventory";
import { inngest } from "@/lib/inngest/client";

// GET /api/stores/[id]/transfers/[transferId]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; transferId: string }> }
) {
  try {
    const { id: storeId, transferId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: transfer, error } = await supabase
      .from("inventory_transfers")
      .select(`
        *,
        from_warehouse:warehouses!from_warehouse_id(id, name),
        to_warehouse:warehouses!to_warehouse_id(id, name),
        transfer_items(id, product_id, quantity)
      `)
      .eq("id", transferId)
      .eq("store_id", storeId)
      .single();

    if (error || !transfer) return NextResponse.json({ error: "Transfer not found" }, { status: 404 });
    return NextResponse.json(transfer);
  } catch (error) {
    console.error("[transfers] GET detail error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/stores/[id]/transfers/[transferId] - Update status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; transferId: string }> }
) {
  try {
    const { id: storeId, transferId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: store } = await supabase
      .from("stores").select("id").eq("id", storeId).eq("user_id", user.id).single();
    if (!store) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let body: unknown;
    try { body = await req.json(); } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const validation = updateTransferStatusSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
    }

    const db = getServiceRoleDatabase();

    // Verify current status allows this transition
    const { data: current } = await db
      .from("inventory_transfers")
      .select("status")
      .eq("id", transferId)
      .eq("store_id", storeId)
      .single();

    if (!current) return NextResponse.json({ error: "Transfer not found" }, { status: 404 });

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      pending: ["in_transit", "cancelled"],
      in_transit: ["completed", "cancelled"],
    };

    const allowed = validTransitions[current.status] || [];
    if (!allowed.includes(validation.data.status)) {
      return NextResponse.json(
        { error: `Cannot transition from '${current.status}' to '${validation.data.status}'` },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {
      status: validation.data.status,
      updated_at: new Date().toISOString(),
    };

    if (validation.data.status === "completed") {
      updates.completed_at = new Date().toISOString();
    }

    const { data: updated, error } = await db
      .from("inventory_transfers")
      .update(updates)
      .eq("id", transferId)
      .eq("store_id", storeId)
      .select()
      .single();

    if (error || !updated) return NextResponse.json({ error: "Failed to update transfer" }, { status: 500 });

    // Fire Inngest events based on status
    if (validation.data.status === "completed") {
      inngest.send({
        name: "inventory/transfer.completed",
        data: { transferId, storeId },
      }).catch((err) => console.error("[inngest] Failed:", err));
    } else if (validation.data.status === "cancelled") {
      inngest.send({
        name: "inventory/transfer.cancelled",
        data: { transferId, storeId },
      }).catch((err) => console.error("[inngest] Failed:", err));
    }

    logAuditEvent({
      userId: user.id,
      action: `transfer.${validation.data.status}`,
      resource: "inventory_transfer",
      resourceId: transferId,
      storeId,
      metadata: { previousStatus: current.status, newStatus: validation.data.status },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[transfers] PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
