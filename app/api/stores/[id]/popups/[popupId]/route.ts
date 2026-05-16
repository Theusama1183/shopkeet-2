import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDatabase, getServiceRoleDatabase } from "@/lib/supabase/database";
import { inngest } from "@/lib/inngest/client";
import type { Database } from "@/types/supabase";
import { updatePopupSchema } from "@/lib/validations/popup";

type PopupUpdate = Database["public"]["Tables"]["popups"]["Update"];

// GET /api/stores/[id]/popups/[popupId]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; popupId: string }> }
) {
  try {
    const { id, popupId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = await getDatabase();
    const { data: store, error: storeError } = await db
      .from('stores')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (storeError || !store) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: popup, error: popupError } = await db
      .from('popups')
      .select('*')
      .eq('id', popupId)
      .eq('store_id', id)
      .is('deleted_at', null) // Exclude soft-deleted
      .single();

    if (popupError || !popup) return NextResponse.json({ error: "Popup not found" }, { status: 404 });

    return NextResponse.json(popup);
  } catch (error) {
    console.error("[popups] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch popup" }, { status: 500 });
  }
}

// PUT /api/stores/[id]/popups/[popupId]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; popupId: string }> }
) {
  try {
    const { id, popupId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = await getDatabase();
    const { data: store, error: storeError } = await db
      .from('stores')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (storeError || !store) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = updatePopupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Validation failed" },
        { status: 400 }
      );
    }

    const { name, content, trigger, conditions, isActive } = parsed.data;

    const updateData: PopupUpdate = {
      updated_at: new Date().toISOString(),
    };
    if (name       !== undefined) updateData.name       = name;
    if (content    !== undefined) updateData.content    = content as Database["public"]["Tables"]["popups"]["Row"]["content"];
    if (trigger    !== undefined) updateData.trigger    = trigger as Database["public"]["Tables"]["popups"]["Row"]["trigger"];
    if (conditions !== undefined) updateData.conditions = conditions as Database["public"]["Tables"]["popups"]["Row"]["conditions"];
    if (isActive   !== undefined) updateData.is_active  = isActive;

    const serviceDb = getServiceRoleDatabase();
    const { data: updatedData, error: updateError } = await serviceDb
      .from('popups')
      .update(updateData)
      .eq('id', popupId)
      .eq('store_id', id)
      .select()
      .single();

    if (updateError || !updatedData) {
      return NextResponse.json({ error: "Popup not found" }, { status: 404 });
    }

    // Fire Inngest event (fire-and-forget)
    inngest.send({
      name: "popup/updated",
      data: { popupId, storeId: id, isActive: isActive as boolean | undefined },
    }).catch((err) => console.error("[inngest] Failed to send popup/updated:", err));

    return NextResponse.json(updatedData);
  } catch (error) {
    console.error("[popups] PUT error:", error);
    return NextResponse.json({ error: "Failed to update popup" }, { status: 500 });
  }
}

// DELETE /api/stores/[id]/popups/[popupId] — soft delete
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; popupId: string }> }
) {
  try {
    const { id, popupId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = await getDatabase();
    const { data: store, error: storeError } = await db
      .from('stores')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (storeError || !store) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Soft delete — set deleted_at timestamp
    const serviceDb = getServiceRoleDatabase();
    const { data: deletedData, error: deleteError } = await serviceDb
      .from('popups')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', popupId)
      .eq('store_id', id)
      .is('deleted_at', null) // Prevent double-delete
      .select('id')
      .single();

    if (deleteError || !deletedData) {
      console.error('[popups] Failed to delete popup:', deleteError);
      return NextResponse.json({ error: "Popup not found or already deleted" }, { status: 404 });
    }

    // Fire Inngest event (fire-and-forget)
    inngest.send({
      name: "popup/deleted",
      data: { popupId, storeId: id },
    }).catch((err) => console.error("[inngest] Failed to send popup/deleted:", err));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[popups] DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete popup" }, { status: 500 });
  }
}
