import { NextRequest, NextResponse } from "next/server";
import { getAnonDatabase } from "@/lib/supabase/database";

// GET /api/storefront/[storeId]/filters
// Public endpoint — returns collections, categories, brands, tags for a store.
// Used by the Puck editor sidebar to populate filter dropdowns.
//
// Query params:
//   type  "collections" | "categories" | "brands" | "tags"  (required)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;
    const type = new URL(req.url).searchParams.get("type");

    if (!type || !["collections", "categories", "brands", "tags"].includes(type)) {
      return NextResponse.json(
        { error: "type must be one of: collections, categories, brands, tags" },
        { status: 400 }
      );
    }

    const db = getAnonDatabase();

    // Verify store exists
    const { data: store, error: storeError } = await db
      .from("stores")
      .select("id")
      .eq("id", storeId)
      .eq("is_active", true)
      .single();

    if (storeError || !store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    let items: { id: string; name: string }[] = [];

    if (type === "collections") {
      const { data } = await db
        .from("collections")
        .select("id, name")
        .eq("store_id", storeId)
        .eq("is_active", true)
        .is("deleted_at", null)
        .order("name", { ascending: true });
      items = (data ?? []) as { id: string; name: string }[];
    } else if (type === "categories") {
      const { data } = await db
        .from("categories")
        .select("id, name")
        .eq("store_id", storeId)
        .eq("is_active", true)
        .is("deleted_at", null)
        .order("name", { ascending: true });
      items = (data ?? []) as { id: string; name: string }[];
    } else if (type === "brands") {
      const { data } = await db
        .from("brands")
        .select("id, name")
        .eq("store_id", storeId)
        .eq("is_active", true)
        .is("deleted_at", null)
        .order("name", { ascending: true });
      items = (data ?? []) as { id: string; name: string }[];
    } else if (type === "tags") {
      const { data } = await db
        .from("tags")
        .select("id, name")
        .eq("store_id", storeId)
        .is("deleted_at", null)
        .order("name", { ascending: true });
      items = (data ?? []) as { id: string; name: string }[];
    }

    return NextResponse.json(items);
  } catch (error) {
    console.error("[storefront/filters] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
