import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDatabase, getServiceRoleDatabase } from "@/lib/supabase/database";

// GET /api/stores/[id]/popups/[popupId]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; popupId: string }> }
) {
  const { id, popupId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDatabase();
  const { data: store, error: storeError } = await db
    .from('stores')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
  
  if (storeError || !store) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: popup, error: popupError } = await db
    .from('popups')
    .select('*')
    .eq('id', popupId)
    .eq('store_id', id)
    .single();
  
  if (popupError || !popup) return NextResponse.json({ error: "Popup not found" }, { status: 404 });

  return NextResponse.json(popup);
}

// PUT /api/stores/[id]/popups/[popupId] — update content, trigger, conditions, or isActive
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; popupId: string }> }
) {
  const { id, popupId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDatabase();
  const { data: store, error: storeError } = await db
    .from('stores')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
  
  if (storeError || !store) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { name, content, trigger, conditions, isActive } = body;

  const updateData: any = {
    updated_at: new Date().toISOString(),
  };
  if (name       !== undefined) updateData.name       = name;
  if (content    !== undefined) updateData.content    = content;
  if (trigger    !== undefined) updateData.trigger    = trigger;
  if (conditions !== undefined) updateData.conditions = conditions;
  if (isActive   !== undefined) updateData.is_active  = isActive;

  const serviceDb = getServiceRoleDatabase();
  const { data: updatedData, error: updateError } = await (serviceDb
    .from('popups')
    // @ts-expect-error - Supabase type inference issue
    .update(updateData)
    .eq('id', popupId)
    .eq('store_id', id)
    .select()
    .single());

  if (updateError || !updatedData) return NextResponse.json({ error: "Popup not found" }, { status: 404 });
  
  const updated = updatedData as any;
  return NextResponse.json(updated);
}

// DELETE /api/stores/[id]/popups/[popupId]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; popupId: string }> }
) {
  const { id, popupId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDatabase();
  const { data: store, error: storeError } = await db
    .from('stores')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
  
  if (storeError || !store) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const serviceDb = getServiceRoleDatabase();
  const { error: deleteError } = await serviceDb
    .from('popups')
    .delete()
    .eq('id', popupId)
    .eq('store_id', id);

  if (deleteError) {
    console.error('[popups] Failed to delete popup:', deleteError);
    return NextResponse.json({ error: "Failed to delete popup" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
