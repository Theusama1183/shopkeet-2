import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDatabase, getServiceRoleDatabase } from "@/lib/supabase/database";
import { invalidateTag } from "@/lib/cache-helpers";
import type { Database } from "@/types/supabase";

type TemplateUpdate = Database["public"]["Tables"]["templates"]["Update"];

// GET /api/stores/[id]/templates/[templateId]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; templateId: string }> }
) {
  const { id, templateId } = await params;
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

  const { data: template, error: templateError } = await db
    .from('templates')
    .select('*')
    .eq('id', templateId)
    .eq('store_id', id)
    .is('deleted_at', null) // Exclude soft-deleted
    .single();
  
  if (templateError || !template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

  return NextResponse.json(template);
}

// PUT /api/stores/[id]/templates/[templateId]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; templateId: string }> }
) {
  const { id, templateId } = await params;
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
  const { name, content, isActive, conditions } = body;

  const updateData: TemplateUpdate = {
    updated_at: new Date().toISOString(),
  };
  if (name !== undefined) updateData.name = name as string;
  if (content !== undefined) updateData.content = content as Database["public"]["Tables"]["templates"]["Row"]["content"];
  if (conditions !== undefined) updateData.conditions = conditions as Database["public"]["Tables"]["templates"]["Row"]["conditions"];
  if (isActive !== undefined) updateData.is_active = isActive as boolean;

  // ── Atomic transaction: deactivate others + activate this one ────────────
  const serviceDb = getServiceRoleDatabase();
  
  if (isActive) {
    // Get current template type first
    const { data: current } = await serviceDb
      .from('templates')
      .select('type')
      .eq('id', templateId)
      .eq('store_id', id)
      .is('deleted_at', null)
      .single();

    if (current) {
      // Deactivate all other templates of same type (excluding this one)
      await serviceDb
        .from('templates')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('store_id', id)
        .eq('type', (current as { type: string }).type)
        .neq('id', templateId)
        .is('deleted_at', null);
    }
  }

  const { data: updatedData, error: updateError } = await serviceDb
    .from('templates')
    .update(updateData)
    .eq('id', templateId)
    .eq('store_id', id)
    .is('deleted_at', null)
    .select()
    .single();

  if (updateError || !updatedData) return NextResponse.json({ error: "Template not found" }, { status: 404 });

  invalidateTag("templates");
  return NextResponse.json(updatedData);
}

// DELETE /api/stores/[id]/templates/[templateId] — soft delete
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; templateId: string }> }
) {
  const { id, templateId } = await params;
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

  // Soft delete — set deleted_at timestamp
  const serviceDb = getServiceRoleDatabase();
  const { data: deletedData, error: deleteError } = await serviceDb
    .from('templates')
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', templateId)
    .eq('store_id', id)
    .is('deleted_at', null) // Prevent double-delete
    .select('id')
    .single();

  if (deleteError || !deletedData) {
    console.error('[templates] Failed to delete template:', deleteError);
    return NextResponse.json({ error: "Template not found or already deleted" }, { status: 404 });
  }

  invalidateTag("templates");
  return NextResponse.json({ success: true });
}
