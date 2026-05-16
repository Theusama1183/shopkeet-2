import { NextRequest, NextResponse } from "next/server";
import { getAnonDatabase } from "@/lib/supabase/database";

// GET /api/storefront/[storeId]/products/[productId]
// Public endpoint — no auth required. Returns a single active product.
// Used by ProductCardBlock on the storefront.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ storeId: string; productId: string }> }
) {
  try {
    const { storeId, productId } = await params;

    const db = getAnonDatabase();

    // Verify store exists and is active
    const { data: store, error: storeError } = await db
      .from("stores")
      .select("id")
      .eq("id", storeId)
      .eq("is_active", true)
      .single();

    if (storeError || !store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // Fetch the product — only expose safe fields, never internal/sensitive ones
    const { data: product, error: productError } = await db
      .from("products")
      .select("id, name, price, image, images, description, slug")
      .eq("id", productId)
      .eq("store_id", storeId)
      .eq("is_active", true)
      .is("deleted_at", null)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("[storefront/products/[productId]] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
