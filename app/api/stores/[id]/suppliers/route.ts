import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceRoleDatabase } from "@/lib/supabase/database";
import { logAuditEvent } from "@/lib/audit/logger";
import { createSupplierSchema } from "@/lib/validations/inventory";
import { inngest } from "@/lib/inngest/client";

// GET /api/stores/[id]/suppliers
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
      .from("suppliers")
      .select("*")
      .eq("store_id", storeId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (error) {
    console.error("[suppliers] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/stores/[id]/suppliers
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

    const validation = createSupplierSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
    }

    const db = getServiceRoleDatabase();
    const { data: supplier, error } = await db
      .from("suppliers")
      .insert({
        name: validation.data.name,
        email: validation.data.email || null,
        phone: validation.data.phone || null,
        company: validation.data.company || null,
        address: validation.data.address || null,
        notes: validation.data.notes || null,
        store_id: storeId,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: "Failed to create supplier" }, { status: 500 });

    inngest.send({
      name: "inventory/supplier.created",
      data: { supplierId: supplier.id, storeId },
    }).catch((err) => console.error("[inngest] Failed to send supplier.created:", err));

    logAuditEvent({
      userId: user.id,
      action: "supplier.created",
      resource: "supplier",
      resourceId: supplier.id,
      storeId,
      metadata: { name: supplier.name },
    });

    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    console.error("[suppliers] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
