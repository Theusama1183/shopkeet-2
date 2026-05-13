import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceRoleDatabase } from "@/lib/supabase/database";
import { logAuditEvent } from "@/lib/audit/logger";
import { updateProductSchema } from "@/lib/validations/product";
import { cacheDeletePattern } from "@/lib/redis";
import { invalidateTags } from "@/lib/cache-helpers";
import { inngest } from "@/lib/inngest/client";
import { withCSRFProtection } from "@/lib/security/csrf";

// GET /api/products/[id] - Get single product
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

    const { data: product, error } = await supabase
      .from('products')
      .select(`*, store:stores(*)`)
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Authorization — user must own the store
    if (!product.store || product.store.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

// PATCH /api/products/[id] - Update product
export const PATCH = withCSRFProtection(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch product with store info for authorization
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select(`*, store:stores(*)`)
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (fetchError || !existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (!existingProduct.store || existingProduct.store.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate with Zod schema (consistent with createProductSchema)
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const validation = updateProductSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message ?? "Validation failed" },
        { status: 400 }
      );
    }

    const { name, description, price, image } = validation.data;

    // Build update object with snake_case columns
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (name        !== undefined) updates.name        = name;
    if (description !== undefined) updates.description = description ?? null;
    if (price       !== undefined) updates.price       = price;
    if (image       !== undefined) updates.image       = image ?? null;

    const serviceDb = getServiceRoleDatabase();
    const { data: updatedProduct, error: updateError } = await serviceDb
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError || !updatedProduct) {
      return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
    }

    // Invalidate caches
    await cacheDeletePattern(`products:store:${existingProduct.store_id}:*`).catch(() => {});
    invalidateTags("products");

    // Fire Inngest event (fire-and-forget)
    inngest.send({
      name: "product/updated",
      data: {
        productId: id,
        storeId: existingProduct.store_id,
        changes: Object.keys(updates).filter(k => k !== 'updated_at'),
      },
    }).catch((err) => console.error("[inngest] Failed to send product/updated:", err));

    // Audit log (fire-and-forget)
    logAuditEvent({
      userId: user.id,
      action: "product.updated",
      resource: "product",
      resourceId: id,
      metadata: { storeId: existingProduct.store_id, changes: Object.keys(updates) },
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
});

// DELETE /api/products/[id] - Soft delete product
export const DELETE = withCSRFProtection(async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch product with store info for authorization
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select(`*, store:stores(*)`)
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (fetchError || !existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (!existingProduct.store || existingProduct.store.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Soft delete — set deleted_at instead of hard delete
    const serviceDb = getServiceRoleDatabase();
    const { error: deleteError } = await serviceDb
      .from('products')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
    }

    // Invalidate caches
    await cacheDeletePattern(`products:store:${existingProduct.store_id}:*`).catch(() => {});
    invalidateTags("products");

    // Fire Inngest event (fire-and-forget)
    inngest.send({
      name: "product/deleted",
      data: { productId: id, storeId: existingProduct.store_id },
    }).catch((err) => console.error("[inngest] Failed to send product/deleted:", err));

    // Audit log (fire-and-forget)
    logAuditEvent({
      userId: user.id,
      action: "product.deleted",
      resource: "product",
      resourceId: id,
      metadata: { storeId: existingProduct.store_id, name: existingProduct.name },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
});
