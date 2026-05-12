import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDatabase, getServiceRoleDatabase } from "@/lib/supabase/database";
import { withCache, cacheDelete } from "@/lib/redis";
import { logAuditEvent } from "@/lib/audit/logger";
import { z } from "zod";

const createTagSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  color: z.string().default("#6366f1"),
});

// GET /api/stores/[id]/tags
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

    const result = await withCache(
      `tags:store:${id}:user:${user.id}`,
      async () => {
        const { data: tags, error: tagsError } = await db
          .from('tags')
          .select('*')
          .eq('store_id', id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (tagsError) {
          console.error('[tags] Failed to fetch:', tagsError);
          throw new Error('Failed to fetch tags');
        }

        return tags || [];
      },
      120
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 }
    );
  }
}

// POST /api/stores/[id]/tags
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
    const validation = createTagSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message ?? "Validation failed" },
        { status: 400 }
      );
    }

    const { name, slug, color } = validation.data;

    const serviceDb = getServiceRoleDatabase();
    const { data: newTag, error: insertError } = await serviceDb
      .from('tags')
      .insert({
        name,
        slug,
        color,
        store_id: storeId,
      } as any)
      .select()
      .single();

    if (insertError || !newTag) {
      console.error('[tags] Failed to create:', insertError);
      return NextResponse.json({ error: "Failed to create tag" }, { status: 500 });
    }

    logAuditEvent({
      userId: user.id,
      action: "tag.created",
      resource: "tag",
      resourceId: (newTag as any).id,
      metadata: { storeId, name },
    });

    await cacheDelete(`tags:store:${storeId}:*`).catch(() => {});

    return NextResponse.json(newTag, { status: 201 });
  } catch (error) {
    console.error("Error creating tag:", error);
    return NextResponse.json(
      { error: "Failed to create tag" },
      { status: 500 }
    );
  }
}
