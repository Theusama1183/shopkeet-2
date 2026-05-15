import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceRoleDatabase } from "@/lib/supabase/database";
import { logAuditEvent } from "@/lib/audit/logger";
import { createSaleSchema } from "@/lib/validations/inventory";
import { inngest } from "@/lib/inngest/client";
import { nanoid } from "nanoid";

// GET /api/stores/[id]/sales
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
      .from("sales")
      .select(`
        *,
        products(id, name, sku, image),
        warehouses(id, name),
        suppliers(id, name, company)
      `)
      .eq("store_id", storeId)
      .order("sale_date", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (error) {
    console.error("[sales] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/stores/[id]/sales
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

    const validation = createSaleSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
    }

    const totalPrice = validation.data.unitPrice * validation.data.quantity;
    const referenceNumber = `SLE-${nanoid(8).toUpperCase()}`;

    const db = getServiceRoleDatabase();
    const { data: sale, error } = await db
      .from("sales")
      .insert({
        reference_number: referenceNumber,
        product_id: validation.data.productId,
        quantity: validation.data.quantity,
        unit_price: validation.data.unitPrice,
        total_price: totalPrice,
        warehouse_id: validation.data.warehouseId || null,
        supplier_id: validation.data.supplierId || null,
        notes: validation.data.notes || null,
        sale_date: validation.data.saleDate || new Date().toISOString(),
        store_id: storeId,
        created_by: user.id,
      })
      .select()
      .single();

    if (error || !sale) return NextResponse.json({ error: "Failed to record sale" }, { status: 500 });

    // Fire Inngest event — deducts inventory in background
    inngest.send({
      name: "inventory/sale.recorded",
      data: {
        saleId: sale.id,
        storeId,
        productId: validation.data.productId,
        quantity: validation.data.quantity,
      },
    }).catch((err) => console.error("[inngest] Failed to send sale.recorded:", err));

    logAuditEvent({
      userId: user.id,
      action: "sale.recorded",
      resource: "sale",
      resourceId: sale.id,
      storeId,
      metadata: { referenceNumber, productId: validation.data.productId, quantity: validation.data.quantity, totalPrice },
    });

    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    console.error("[sales] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
