import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDatabase, getServiceRoleDatabase } from "@/lib/supabase/database";
import { cacheDeletePattern } from "@/lib/redis";
import { logAuditEvent } from "@/lib/audit/logger";
import { z } from "zod";

const updateTagSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  slug: z.string().min(1, "Slug is required").optional(),
  color: z.string().optional(),
});

// GET /api/stores/[id]/tags/[tagId]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; tagId: string }> }
) {
  try {
    const { id: storeId, tagId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDatabase();
    const { data: store, error: storeError } = await db
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .eq('user_id', user.id)
      .single();

    if (storeError || !store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const { data: tag, error: tagError } = await db
      .from('tags')
      .select('*')
      .eq('id', tagId)
      .eq('store_id', storeId)
      .is('deleted_at', null)
      .single();

    if (tagError || !tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    return NextResponse.json(tag);
  } catch (error) {
    console.error("Error fetching tag:", error);
    return NextResponse.json(
      { error: "Failed to fetch tag" },
      { status: 500 }
    );
  }
}

// PATCH /api/stores/[id]/tags/[tagId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; tagId: string }> }
) {
  try {
    const { id: storeId, tagId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDatabase();
    const { data: store, error: storeError } = await db
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .eq('user_id', user.id)
      .single();

    if (storeError || !store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const body = await req.json();
    const validation = updateTagSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message ?? "Validation failed" },
        { status: 400 }
      );
    }

    const updates: any = {};
    if (validation.data.name !== undefined) updates.name = validation.data.name;
    if (validation.data.slug !== undefined) updates.slug = validation.data.slug;
    if (validation.data.color !== undefined) updates.color = validation.data.color;
    updates.updated_at = new Date().toISOString();

    const serviceDb = getServiceRoleDatabase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedTag, error: updateError } = await (serviceDb as any)
      .from('tags')
      .update(updates)
      .eq('id', tagId)
      .eq('store_id', storeId)
      .select()
      .single();

    if (updateError || !updatedTag) {
      console.error('[tags] Failed to update:', updateError);
      return NextResponse.json({ error: "Failed to update tag" }, { status: 500 });
    }

    logAuditEvent({
      userId: user.id,
      action: "tag.updated",
      resource: "tag",
      resourceId: tagId,
      metadata: { storeId, updates },
    });

    await cacheDeletePattern(`tags:store:${storeId}:*`).catch(() => {});

    return NextResponse.json(updatedTag);
  } catch (error) {
    console.error("Error updating tag:", error);
    return NextResponse.json(
      { error: "Failed to update tag" },
      { status: 500 }
    );
  }
}

// DELETE /api/stores/[id]/tags/[tagId]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; tagId: string }> }
) {
  try {
    const { id: storeId, tagId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDatabase();
    const { data: store, error: storeError } = await db
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .eq('user_id', user.id)
      .single();

    if (storeError || !store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const serviceDb = getServiceRoleDatabase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (serviceDb as any)
      .from('tags')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', tagId)
      .eq('store_id', storeId);

    if (deleteError) {
      console.error('[tags] Failed to delete:', deleteError);
      return NextResponse.json({ error: "Failed to delete tag" }, { status: 500 });
    }

    logAuditEvent({
      userId: user.id,
      action: "tag.deleted",
      resource: "tag",
      resourceId: tagId,
      metadata: { storeId },
    });

    await cacheDeletePattern(`tags:store:${storeId}:*`).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting tag:", error);
    return NextResponse.json(
      { error: "Failed to delete tag" },
      { status: 500 }
    );
  }
}
