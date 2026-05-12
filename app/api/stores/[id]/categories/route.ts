import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDatabase, getServiceRoleDatabase } from "@/lib/supabase/database";
import { withCache, cacheDelete } from "@/lib/redis";
import { logAuditEvent } from "@/lib/audit/logger";
import { z } from "zod";

const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  slug: z.string().min(1, "Slug is required"),
  image: z.string().url().optional().or(z.literal("")),
  parentId: z.string().uuid().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

// GET /api/stores/[id]/categories
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
      `categories:store:${id}:user:${user.id}`,
      async () => {
        const { data: categories, error: categoriesError } = await db
          .from('categories')
          .select('*')
          .eq('store_id', id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (categoriesError) {
          console.error('[categories] Failed to fetch:', categoriesError);
          throw new Error('Failed to fetch categories');
        }

        return categories || [];
      },
      120
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST /api/stores/[id]/categories
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
    const validation = createCategorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message ?? "Validation failed" },
        { status: 400 }
      );
    }

    const { name, description, slug, image, parentId, isActive } = validation.data;

    const serviceDb = getServiceRoleDatabase();
    const { data: newCategory, error: insertError } = await serviceDb
      .from('categories')
      .insert({
        name,
        description,
        slug,
        image: image || null,
        parent_id: parentId || null,
        is_active: isActive,
        store_id: storeId,
      } as any)
      .select()
      .single();

    if (insertError || !newCategory) {
      console.error('[categories] Failed to create:', insertError);
      return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
    }

    logAuditEvent({
      userId: user.id,
      action: "category.created",
      resource: "category",
      resourceId: (newCategory as any).id,
      metadata: { storeId, name },
    });

    await cacheDelete(`categories:store:${storeId}:*`).catch(() => {});

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
