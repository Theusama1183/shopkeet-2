import { NextRequest, NextResponse } from "next/server";
import { getAnonDatabase } from "@/lib/supabase/database";

// GET /api/storefront/[storeId]/products
// Public endpoint — no auth required. Used by Puck ProductGrid/ProductCarousel
// on the storefront to fetch real products with filtering and pagination.
//
// Query params:
//   page          number  (default 1)
//   limit         number  (default 12, max 48)
//   collectionId  uuid    filter by collection
//   categoryId    uuid    filter by category
//   brandId       uuid    filter by brand
//   tagId         uuid    filter by tag (via product_tags join)
//   sort          string  newest | oldest | price_asc | price_desc | name_asc
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;
    const { searchParams } = new URL(req.url);

    const page  = Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10));
    const limit = Math.min(48, Math.max(1, parseInt(searchParams.get("limit") ?? "12", 10)));
    const offset = (page - 1) * limit;

    const collectionId = searchParams.get("collectionId") ?? null;
    const categoryId   = searchParams.get("categoryId")   ?? null;
    const brandId      = searchParams.get("brandId")      ?? null;
    const tagId        = searchParams.get("tagId")        ?? null;
    const sort         = searchParams.get("sort")         ?? "newest";

    const db = getAnonDatabase();

    // ── Verify store exists and is active ────────────────────────────────────
    const { data: store, error: storeError } = await db
      .from("stores")
      .select("id")
      .eq("id", storeId)
      .eq("is_active", true)
      .single();

    if (storeError || !store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // ── If filtering by tag, resolve matching product IDs first ──────────────
    let tagProductIds: string[] | null = null;
    if (tagId) {
      const { data: tagRows } = await db
        .from("product_tags")
        .select("product_id")
        .eq("tag_id", tagId);
      tagProductIds = (tagRows ?? []).map((r: { product_id: string }) => r.product_id);
      // If no products have this tag, return empty immediately
      if (tagProductIds.length === 0) {
        return NextResponse.json({
          items: [],
          pagination: { page, limit, total: 0, totalPages: 0, hasMore: false },
        });
      }
    }

    // ── Build query ───────────────────────────────────────────────────────────
    let query = db
      .from("products")
      .select(
        "id, name, price, image, images, slug, collection_id, category_id, brand_id",
        { count: "exact" }
      )
      .eq("store_id", storeId)
      .eq("is_active", true)
      .is("deleted_at", null);

    if (collectionId) query = query.eq("collection_id", collectionId);
    if (categoryId)   query = query.eq("category_id",   categoryId);
    if (brandId)      query = query.eq("brand_id",      brandId);
    if (tagProductIds) query = query.in("id", tagProductIds);

    // ── Sort ──────────────────────────────────────────────────────────────────
    switch (sort) {
      case "oldest":    query = query.order("created_at", { ascending: true });  break;
      case "price_asc": query = query.order("price",      { ascending: true });  break;
      case "price_desc":query = query.order("price",      { ascending: false }); break;
      case "name_asc":  query = query.order("name",       { ascending: true });  break;
      default:          query = query.order("created_at", { ascending: false }); break; // newest
    }

    // ── Paginate ──────────────────────────────────────────────────────────────
    query = query.range(offset, offset + limit - 1);

    const { data: products, error: productsError, count } = await query;

    if (productsError) {
      console.error("[storefront/products] Query error:", productsError);
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }

    const total = count ?? 0;

    return NextResponse.json({
      items: products ?? [],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + (products?.length ?? 0) < total,
      },
    });
  } catch (error) {
    console.error("[storefront/products] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
