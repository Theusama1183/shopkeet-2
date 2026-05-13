import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDatabase, getServiceRoleDatabase } from "@/lib/supabase/database";
import { cacheDelete } from "@/lib/redis";
import { logAuditEvent } from "@/lib/audit/logger";
import { z } from "zod";

const updateCollectionSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional(),
  slug: z.string().min(1, "Slug is required").optional(),
  image: z.string().url().optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

// GET /api/stores/[id]/collections/[collectionId]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; collectionId: string }> }
) {
  try {
    const { id: storeId, collectionId } = await params;
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

    const { data: collection, error: collectionError } = await db
      .from('collections')
      .select('*')
      .eq('id', collectionId)
      .eq('store_id', storeId)
      .is('deleted_at', null)
      .single();

    if (collectionError || !collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    return NextResponse.json(collection);
  } catch (error) {
    console.error("Error fetching collection:", error);
    return NextResponse.json(
      { error: "Failed to fetch collection" },
      { status: 500 }
    );
  }
}

// PATCH /api/stores/[id]/collections/[collectionId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; collectionId: string }> }
) {
  try {
    const { id: storeId, collectionId } = await params;
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
    const validation = updateCollectionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message ?? "Validation failed" },
        { status: 400 }
      );
    }

    const updates: any = {};
    if (validation.data.name !== undefined) updates.name = validation.data.name;
    if (validation.data.description !== undefined) updates.description = validation.data.description || null;
    if (validation.data.slug !== undefined) updates.slug = validation.data.slug;
    if (validation.data.image !== undefined) updates.image = validation.data.image || null;
    if (validation.data.isActive !== undefined) updates.is_active = validation.data.isActive;
    updates.updated_at = new Date().toISOString();

    const serviceDb = getServiceRoleDatabase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedCollection, error: updateError } = await (serviceDb as any)
      .from('collections')
      .update(updates)
      .eq('id', collectionId)
      .eq('store_id', storeId)
      .select()
      .single();

    if (updateError || !updatedCollection) {
      console.error('[collections] Failed to update:', updateError);
      return NextResponse.json({ error: "Failed to update collection" }, { status: 500 });
    }

    logAuditEvent({
      userId: user.id,
      action: "collection.updated",
      resource: "collection",
      resourceId: collectionId,
      metadata: { storeId, updates },
    });

    await cacheDelete(`collections:store:${storeId}:*`).catch(() => {});

    return NextResponse.json(updatedCollection);
  } catch (error) {
    console.error("Error updating collection:", error);
    return NextResponse.json(
      { error: "Failed to update collection" },
      { status: 500 }
    );
  }
}

// DELETE /api/stores/[id]/collections/[collectionId]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; collectionId: string }> }
) {
  try {
    const { id: storeId, collectionId } = await params;
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
      .from('collections')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', collectionId)
      .eq('store_id', storeId);

    if (deleteError) {
      console.error('[collections] Failed to delete:', deleteError);
      return NextResponse.json({ error: "Failed to delete collection" }, { status: 500 });
    }

    logAuditEvent({
      userId: user.id,
      action: "collection.deleted",
      resource: "collection",
      resourceId: collectionId,
      metadata: { storeId },
    });

    await cacheDelete(`collections:store:${storeId}:*`).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting collection:", error);
    return NextResponse.json(
      { error: "Failed to delete collection" },
      { status: 500 }
    );
  }
}
