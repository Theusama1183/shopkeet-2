import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceRoleDatabase } from "@/lib/supabase/database";
import { logAuditEvent } from "@/lib/audit/logger";
import { createTransferSchema } from "@/lib/validations/inventory";
import { nanoid } from "nanoid";

// GET /api/stores/[id]/transfers
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: storeId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: store } = await supabase
      .from("stores").select("id").eq("id", storeId).eq("user_id", user.id).single();
    if (!store) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data, error } = await supabase
      .from("inventory_transfers")
      .select(`
        *,
        from_warehouse:warehouses!from_warehouse_id(id, name),
        to_warehouse:warehouses!to_warehouse_id(id, name),
        transfer_items(id, product_id, quantity)
      `)
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (error) {
    console.error("[transfers] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/stores/[id]/transfers
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
    if (!store) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let body: unknown;
    try { body = await req.json(); } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const validation = createTransferSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
    }

    const db = getServiceRoleDatabase();
    const referenceNumber = `TRF-${nanoid(8).toUpperCase()}`;

    // Create transfer
    const { data: transfer, error: transferError } = await db
      .from("inventory_transfers")
      .insert({
        reference_number: referenceNumber,
        from_warehouse_id: validation.data.fromWarehouseId,
        to_warehouse_id: validation.data.toWarehouseId,
        status: "pending",
        notes: validation.data.notes || null,
        store_id: storeId,
        created_by: user.id,
      })
      .select()
      .single();

    if (transferError || !transfer) {
      return NextResponse.json({ error: "Failed to create transfer" }, { status: 500 });
    }

    // Insert transfer items
    const items = validation.data.items.map((item) => ({
      transfer_id: transfer.id,
      product_id: item.productId,
      quantity: item.quantity,
    }));

    const { error: itemsError } = await db
      .from("transfer_items")
      .insert(items);

    if (itemsError) {
      // Rollback transfer
      await db.from("inventory_transfers").delete().eq("id", transfer.id);
      return NextResponse.json({ error: "Failed to create transfer items" }, { status: 500 });
    }

    logAuditEvent({
      userId: user.id,
      action: "transfer.created",
      resource: "inventory_transfer",
      resourceId: transfer.id,
      storeId,
      metadata: { referenceNumber, itemCount: items.length },
    });

    return NextResponse.json(transfer, { status: 201 });
  } catch (error) {
    console.error("[transfers] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
