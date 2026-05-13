import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDatabase, getServiceRoleDatabase } from "@/lib/supabase/database";
import { withCache, cacheDeletePattern } from "@/lib/redis";
import { logAuditEvent } from "@/lib/audit/logger";
import { z } from "zod";

const createCollectionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  slug: z.string().min(1, "Slug is required"),
  image: z.string().url().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

// GET /api/stores/[id]/collections - List collections
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user owns the store
    const db = await getDatabase();
    const { data: store, error: storeError } = await db
      .from('stores')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (storeError || !store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // Cache collections list for 2 minutes
    const result = await withCache(
      `collections:store:${id}:user:${user.id}`,
      async () => {
        const { data: collections, error: collectionsError } = await db
          .from('collections')
          .select('*')
          .eq('store_id', id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (collectionsError) {
          console.error('[collections] Failed to fetch:', collectionsError);
          throw new Error('Failed to fetch collections');
        }

        return collections || [];
      },
      120
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching collections:", error);
    return NextResponse.json(
      { error: "Failed to fetch collections" },
      { status: 500 }
    );
  }
}

// POST /api/stores/[id]/collections - Create collection
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: storeId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user owns the store
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
    const validation = createCollectionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message ?? "Validation failed" },
        { status: 400 }
      );
    }

    const { name, description, slug, image, isActive } = validation.data;

    // Create collection
    const serviceDb = getServiceRoleDatabase();
    const { data: newCollection, error: insertError } = await serviceDb
      .from('collections')
      .insert({
        name,
        description,
        slug,
        image: image || null,
        is_active: isActive,
        store_id: storeId,
      } as any)
      .select()
      .single();

    if (insertError || !newCollection) {
      console.error('[collections] Failed to create:', insertError);
      return NextResponse.json({ error: "Failed to create collection" }, { status: 500 });
    }

    // Audit log
    logAuditEvent({
      userId: user.id,
      action: "collection.created",
      resource: "collection",
      resourceId: (newCollection as any).id,
      metadata: { storeId, name },
    });

    // Invalidate cache
    await cacheDeletePattern(`collections:store:${storeId}:*`).catch(() => {});

    return NextResponse.json(newCollection, { status: 201 });
  } catch (error) {
    console.error("Error creating collection:", error);
    return NextResponse.json(
      { error: "Failed to create collection" },
      { status: 500 }
    );
  }
}
