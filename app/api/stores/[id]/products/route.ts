import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDatabase, getServiceRoleDatabase } from "@/lib/supabase/database";
import { withCache, cacheDelete } from "@/lib/redis";
import { rateLimits } from "@/lib/redis/rate-limit";
import { logAuditEvent } from "@/lib/audit/logger";
import { inngest } from "@/lib/inngest/client";
import { createProductSchema } from "@/lib/validations/product";

// GET /api/stores/[id]/products - List products for a store
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

    // Verify user owns the store
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

    // ── Pagination ───────────────────────────────────────────────────────────
    const { searchParams } = new URL(_req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
    const offset = (page - 1) * limit;

    // Cache products list for 2 minutes
    const result = await withCache(
      `products:store:${id}:page:${page}:limit:${limit}:user:${user.id}`,
      async () => {
        // Fetch products with pagination
        const { data: storeProducts, error: productsError, count } = await db
          .from('products')
          .select('*', { count: 'exact' })
          .eq('store_id', id)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (productsError) {
          console.error('[products] Failed to fetch products:', productsError);
          throw new Error('Failed to fetch products');
        }

        const total = count ?? 0;

        return {
          items: storeProducts || [],
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasMore: offset + (storeProducts?.length || 0) < total,
          },
        };
      },
      120 // 2 minutes
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST /api/stores/[id]/products - Create product
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

    // Rate limiting - use store-specific identifier
    if (rateLimits.productCreation) {
      const identifier = `product-create:${storeId}:${user.id}`;
      const rateLimit = await rateLimits.productCreation.limit(identifier);
      
      if (!rateLimit.success) {
        return NextResponse.json(
          { 
            error: "Too many product creation attempts",
            retryAfter: Math.ceil((rateLimit.reset - Date.now()) / 1000)
          },
          { status: 429 }
        );
      }
    }

    // Verify user owns the store
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

    // Validate input with Zod schema
    const validation = createProductSchema.safeParse({
      ...body,
      storeId,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message ?? "Validation failed" },
        { status: 400 }
      );
    }

    const { name, description, price, image } = validation.data;

    // Create product
    const serviceDb = getServiceRoleDatabase();
    const { data: newProductData, error: insertError } = await serviceDb
      .from('products')
      .insert({
        name,
        description,
        price,
        image,
        store_id: storeId,
      } as any)
      .select()
      .single();

    if (insertError || !newProductData) {
      console.error('[products] Failed to create product:', insertError);
      return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
    }

    const newProduct = newProductData as any;

    // Trigger background jobs (fire-and-forget)
    inngest.send({
      name: "product/created",
      data: {
        productId: newProduct.id,
        storeId,
        imageUrl: newProduct.image || undefined,
      },
    }).catch((error) => {
      console.error("[inngest] Failed to send product/created event:", error);
    });

    // Audit log (fire-and-forget)
    logAuditEvent({
      userId: user.id,
      action: "product.created",
      resource: "product",
      resourceId: newProduct.id,
      metadata: { storeId, name: newProduct.name, price },
    });

    // Invalidate product list cache
    await cacheDelete(`products:store:${storeId}:*`).catch(() => {});

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
