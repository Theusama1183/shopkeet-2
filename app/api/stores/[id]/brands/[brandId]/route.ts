import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDatabase, getServiceRoleDatabase } from "@/lib/supabase/database";
import { cacheDelete } from "@/lib/redis";
import { logAuditEvent } from "@/lib/audit/logger";
import { z } from "zod";

const updateBrandSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional(),
  slug: z.string().min(1, "Slug is required").optional(),
  logo: z.string().url().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

// GET /api/stores/[id]/brands/[brandId]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; brandId: string }> }
) {
  try {
    const { id: storeId, brandId } = await params;
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

    const { data: brand, error: brandError } = await db
      .from('brands')
      .select('*')
      .eq('id', brandId)
      .eq('store_id', storeId)
      .is('deleted_at', null)
      .single();

    if (brandError || !brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    return NextResponse.json(brand);
  } catch (error) {
    console.error("Error fetching brand:", error);
    return NextResponse.json(
      { error: "Failed to fetch brand" },
      { status: 500 }
    );
  }
}

// PATCH /api/stores/[id]/brands/[brandId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; brandId: string }> }
) {
  try {
    const { id: storeId, brandId } = await params;
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
    const validation = updateBrandSchema.safeParse(body);

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
    if (validation.data.logo !== undefined) updates.logo = validation.data.logo || null;
    if (validation.data.website !== undefined) updates.website = validation.data.website || null;
    if (validation.data.isActive !== undefined) updates.is_active = validation.data.isActive;
    updates.updated_at = new Date().toISOString();

    const serviceDb = getServiceRoleDatabase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedBrand, error: updateError } = await (serviceDb as any)
      .from('brands')
      .update(updates)
      .eq('id', brandId)
      .eq('store_id', storeId)
      .select()
      .single();

    if (updateError || !updatedBrand) {
      console.error('[brands] Failed to update:', updateError);
      return NextResponse.json({ error: "Failed to update brand" }, { status: 500 });
    }

    logAuditEvent({
      userId: user.id,
      action: "brand.updated",
      resource: "brand",
      resourceId: brandId,
      metadata: { storeId, updates },
    });

    await cacheDelete(`brands:store:${storeId}:*`).catch(() => {});

    return NextResponse.json(updatedBrand);
  } catch (error) {
    console.error("Error updating brand:", error);
    return NextResponse.json(
      { error: "Failed to update brand" },
      { status: 500 }
    );
  }
}

// DELETE /api/stores/[id]/brands/[brandId]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; brandId: string }> }
) {
  try {
    const { id: storeId, brandId } = await params;
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
      .from('brands')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', brandId)
      .eq('store_id', storeId);

    if (deleteError) {
      console.error('[brands] Failed to delete:', deleteError);
      return NextResponse.json({ error: "Failed to delete brand" }, { status: 500 });
    }

    logAuditEvent({
      userId: user.id,
      action: "brand.deleted",
      resource: "brand",
      resourceId: brandId,
      metadata: { storeId },
    });

    await cacheDelete(`brands:store:${storeId}:*`).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting brand:", error);
    return NextResponse.json(
      { error: "Failed to delete brand" },
      { status: 500 }
    );
  }
}
