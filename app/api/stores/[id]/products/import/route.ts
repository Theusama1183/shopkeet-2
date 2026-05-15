import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { inngest } from "@/lib/inngest/client";

/**
 * POST /api/stores/[id]/products/import
 *
 * Lightweight endpoint — validates CSV data then queues an Inngest
 * background job for the heavy DB work. Returns instantly so Vercel
 * never times out, even for 5 000-product imports.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: storeId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: store } = await supabase
      .from("stores").select("id").eq("id", storeId).eq("user_id", user.id).single();
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    let body: { products: ImportProduct[] };
    try { body = await req.json(); } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!Array.isArray(body.products) || body.products.length === 0) {
      return NextResponse.json({ error: "No products to import" }, { status: 400 });
    }

    // Cap at 5000 products per import
    if (body.products.length > 5000) {
      return NextResponse.json({ error: "Maximum 5,000 products per import" }, { status: 400 });
    }

    // Quick validation — ensure at least some rows have names
    const validCount = body.products.filter(
      (p) => p.name && typeof p.name === "string" && p.name.trim().length > 0
    ).length;

    if (validCount === 0) {
      return NextResponse.json({ error: "No valid products found (all rows missing name)" }, { status: 400 });
    }

    // ── Queue to Inngest for background processing ──────────────────────────
    await inngest.send({
      name: "product/bulk-import",
      data: {
        storeId,
        userId: user.id,
        products: body.products,
      },
    });

    return NextResponse.json(
      {
        queued: true,
        totalRows: body.products.length,
        validRows: validCount,
        message: `Import queued — ${validCount} products will be processed in the background.`,
      },
      { status: 202 }
    );
  } catch (error) {
    console.error("[import] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── Types ────────────────────────────────────────────────────────────────────

interface ImportProduct {
  name?: string;
  description?: string;
  price?: string | number;
  sku?: string;
  image?: string;
  quantity?: string | number;
  status?: string;
}
