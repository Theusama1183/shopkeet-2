import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceRoleDatabase } from "@/lib/supabase/database";
import { logAuditEvent } from "@/lib/audit/logger";
import { createWarehouseSchema } from "@/lib/validations/inventory";
import { inngest } from "@/lib/inngest/client";

// GET /api/stores/[id]/warehouses - List warehouses
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
      .from("warehouses")
      .select("*")
      .eq("store_id", storeId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (error) {
    console.error("[warehouses] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/stores/[id]/warehouses - Create warehouse
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

    const validation = createWarehouseSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
    }

    const db = getServiceRoleDatabase();

    // If setting as default, unset other defaults first
    if (validation.data.isDefault) {
      await db.from("warehouses").update({ is_default: false }).eq("store_id", storeId);
    }

    const { data: warehouse, error } = await db
      .from("warehouses")
      .insert({
        name: validation.data.name,
        address: validation.data.address || null,
        city: validation.data.city || null,
        country: validation.data.country || null,
        is_default: validation.data.isDefault || false,
        store_id: storeId,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: "Failed to create warehouse" }, { status: 500 });

    inngest.send({
      name: "inventory/warehouse.created",
      data: { warehouseId: warehouse.id, storeId },
    }).catch((err) => console.error("[inngest] Failed to send warehouse.created:", err));

    logAuditEvent({
      userId: user.id,
      action: "warehouse.created",
      resource: "warehouse",
      resourceId: warehouse.id,
      storeId,
      metadata: { name: warehouse.name },
    });

    return NextResponse.json(warehouse, { status: 201 });
  } catch (error) {
    console.error("[warehouses] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
