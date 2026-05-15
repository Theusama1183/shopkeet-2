import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceRoleDatabase } from "@/lib/supabase/database";
import { logAuditEvent } from "@/lib/audit/logger";
import { updateWarehouseSchema } from "@/lib/validations/inventory";

// GET /api/stores/[id]/warehouses/[warehouseId]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; warehouseId: string }> }
) {
  try {
    const { id: storeId, warehouseId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: warehouse, error } = await supabase
      .from("warehouses")
      .select("*")
      .eq("id", warehouseId)
      .eq("store_id", storeId)
      .is("deleted_at", null)
      .single();

    if (error || !warehouse) return NextResponse.json({ error: "Warehouse not found" }, { status: 404 });
    return NextResponse.json(warehouse);
  } catch (error) {
    console.error("[warehouses] GET detail error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/stores/[id]/warehouses/[warehouseId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; warehouseId: string }> }
) {
  try {
    const { id: storeId, warehouseId } = await params;
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

    const validation = updateWarehouseSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
    }

    const db = getServiceRoleDatabase();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (validation.data.name !== undefined) updates.name = validation.data.name;
    if (validation.data.address !== undefined) updates.address = validation.data.address ?? null;
    if (validation.data.city !== undefined) updates.city = validation.data.city ?? null;
    if (validation.data.country !== undefined) updates.country = validation.data.country ?? null;
    if (validation.data.isDefault !== undefined) {
      if (validation.data.isDefault) {
        await db.from("warehouses").update({ is_default: false }).eq("store_id", storeId);
      }
      updates.is_default = validation.data.isDefault;
    }

    const { data: updated, error } = await db
      .from("warehouses")
      .update(updates)
      .eq("id", warehouseId)
      .eq("store_id", storeId)
      .select()
      .single();

    if (error || !updated) return NextResponse.json({ error: "Failed to update warehouse" }, { status: 500 });

    logAuditEvent({
      userId: user.id,
      action: "warehouse.updated",
      resource: "warehouse",
      resourceId: warehouseId,
      storeId,
      metadata: { changes: Object.keys(updates) },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[warehouses] PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/stores/[id]/warehouses/[warehouseId] - Soft delete
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; warehouseId: string }> }
) {
  try {
    const { id: storeId, warehouseId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: store } = await supabase
      .from("stores").select("id").eq("id", storeId).eq("user_id", user.id).single();
    if (!store) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const db = getServiceRoleDatabase();
    const { error } = await db
      .from("warehouses")
      .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", warehouseId)
      .eq("store_id", storeId);

    if (error) return NextResponse.json({ error: "Failed to delete warehouse" }, { status: 500 });

    logAuditEvent({
      userId: user.id,
      action: "warehouse.deleted",
      resource: "warehouse",
      resourceId: warehouseId,
      storeId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[warehouses] DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
