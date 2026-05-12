import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit/logger";

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

    // Fetch product with store info using Supabase
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        store:stores(*)
      `)
      .eq('id', id)
      .single();

    if (error || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Authorization check - user must own the store
    if (!product.store || product.store.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// PATCH /api/products/[id] - Update product
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch product with store info
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select(`
        *,
        store:stores(*)
      `)
      .eq('id', id)
      .single();

    if (fetchError || !existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Authorization check - user must own the store
    if (!existingProduct.store || existingProduct.store.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, price, image } = body;

    // Validate and build updates
    const updates: any = { updated_at: new Date().toISOString() };

    if (name !== undefined) {
      if (!name || name.length < 2 || name.length > 200) {
        return NextResponse.json(
          { error: "Product name must be 2-200 characters" },
          { status: 400 }
        );
      }
      updates.name = name.trim().replace(/[<>]/g, '');
    }

    if (description !== undefined) {
      if (description && description.length > 1000) {
        return NextResponse.json(
          { error: "Description must be under 1000 characters" },
          { status: 400 }
        );
      }
      updates.description = description?.trim().replace(/[<>]/g, '') || null;
    }

    if (price !== undefined) {
      if (typeof price !== "number" || price < 0) {
        return NextResponse.json(
          { error: "Valid price is required (in cents)" },
          { status: 400 }
        );
      }
      updates.price = price;
    }

    if (image !== undefined) {
      updates.image = image;
    }

    // Update product using Supabase
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError || !updatedProduct) {
      return NextResponse.json(
        { error: "Failed to update product" },
        { status: 500 }
      );
    }

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
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Delete product
export async function DELETE(
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

    // Fetch product with store info
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select(`
        *,
        store:stores(*)
      `)
      .eq('id', id)
      .single();

    if (fetchError || !existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Authorization check
    if (!existingProduct.store || existingProduct.store.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete product using Supabase
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json(
        { error: "Failed to delete product" },
        { status: 500 }
      );
    }

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
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
