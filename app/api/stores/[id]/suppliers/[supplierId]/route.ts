import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceRoleDatabase } from "@/lib/supabase/database";
import { logAuditEvent } from "@/lib/audit/logger";
import { updateSupplierSchema } from "@/lib/validations/inventory";

// GET /api/stores/[id]/suppliers/[supplierId]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; supplierId: string }> }
) {
  try {
    const { id: storeId, supplierId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: supplier, error } = await supabase
      .from("suppliers")
      .select("*")
      .eq("id", supplierId)
      .eq("store_id", storeId)
      .is("deleted_at", null)
      .single();

    if (error || !supplier) return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    return NextResponse.json(supplier);
  } catch (error) {
    console.error("[suppliers] GET detail error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/stores/[id]/suppliers/[supplierId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; supplierId: string }> }
) {
  try {
    const { id: storeId, supplierId } = await params;
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

    const validation = updateSupplierSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
    }

    const db = getServiceRoleDatabase();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (validation.data.name !== undefined) updates.name = validation.data.name;
    if (validation.data.email !== undefined) updates.email = validation.data.email ?? null;
    if (validation.data.phone !== undefined) updates.phone = validation.data.phone ?? null;
    if (validation.data.company !== undefined) updates.company = validation.data.company ?? null;
    if (validation.data.address !== undefined) updates.address = validation.data.address ?? null;
    if (validation.data.notes !== undefined) updates.notes = validation.data.notes ?? null;

    const { data: updated, error } = await db
      .from("suppliers")
      .update(updates)
      .eq("id", supplierId)
      .eq("store_id", storeId)
      .select()
      .single();

    if (error || !updated) return NextResponse.json({ error: "Failed to update supplier" }, { status: 500 });

    logAuditEvent({
      userId: user.id,
      action: "supplier.updated",
      resource: "supplier",
      resourceId: supplierId,
      storeId,
      metadata: { changes: Object.keys(updates) },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[suppliers] PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/stores/[id]/suppliers/[supplierId] - Soft delete
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; supplierId: string }> }
) {
  try {
    const { id: storeId, supplierId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: store } = await supabase
      .from("stores").select("id").eq("id", storeId).eq("user_id", user.id).single();
    if (!store) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const db = getServiceRoleDatabase();
    const { error } = await db
      .from("suppliers")
      .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", supplierId)
      .eq("store_id", storeId);

    if (error) return NextResponse.json({ error: "Failed to delete supplier" }, { status: 500 });

    logAuditEvent({
      userId: user.id,
      action: "supplier.deleted",
      resource: "supplier",
      resourceId: supplierId,
      storeId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[suppliers] DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
