import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDatabase, getServiceRoleDatabase } from "@/lib/supabase/database";
import { withCache, cacheDelete } from "@/lib/redis";
import { logAuditEvent } from "@/lib/audit/logger";
import { z } from "zod";

const createBrandSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  slug: z.string().min(1, "Slug is required"),
  logo: z.string().url().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

// GET /api/stores/[id]/brands
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
      `brands:store:${id}:user:${user.id}`,
      async () => {
        const { data: brands, error: brandsError } = await db
          .from('brands')
          .select('*')
          .eq('store_id', id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (brandsError) {
          console.error('[brands] Failed to fetch:', brandsError);
          throw new Error('Failed to fetch brands');
        }

        return brands || [];
      },
      120
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching brands:", error);
    return NextResponse.json(
      { error: "Failed to fetch brands" },
      { status: 500 }
    );
  }
}

// POST /api/stores/[id]/brands
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
    const validation = createBrandSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message ?? "Validation failed" },
        { status: 400 }
      );
    }

    const { name, description, slug, logo, website, isActive } = validation.data;

    const serviceDb = getServiceRoleDatabase();
    const { data: newBrand, error: insertError } = await serviceDb
      .from('brands')
      .insert({
        name,
        description,
        slug,
        logo: logo || null,
        website: website || null,
        is_active: isActive,
        store_id: storeId,
      } as any)
      .select()
      .single();

    if (insertError || !newBrand) {
      console.error('[brands] Failed to create:', insertError);
      return NextResponse.json({ error: "Failed to create brand" }, { status: 500 });
    }

    logAuditEvent({
      userId: user.id,
      action: "brand.created",
      resource: "brand",
      resourceId: (newBrand as any).id,
      metadata: { storeId, name },
    });

    await cacheDelete(`brands:store:${storeId}:*`).catch(() => {});

    return NextResponse.json(newBrand, { status: 201 });
  } catch (error) {
    console.error("Error creating brand:", error);
    return NextResponse.json(
      { error: "Failed to create brand" },
      { status: 500 }
    );
  }
}
