import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDatabase, getServiceRoleDatabase } from "@/lib/supabase/database";
import { withCache, cacheDeletePattern } from "@/lib/redis";
import { logAuditEvent } from "@/lib/audit/logger";
import { z } from "zod";

const updateInventorySchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(0),
  lowStockThreshold: z.number().int().min(0).optional(),
  trackInventory: z.boolean().optional(),
  allowBackorder: z.boolean().optional(),
});

// GET /api/stores/[id]/inventory
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
      `inventory:store:${id}:user:${user.id}`,
      async () => {
        // Get inventory with product details
        const { data: inventory, error: inventoryError } = await db
          .from('inventory')
          .select(`
            *,
            products (
              id,
              name,
              sku,
              image,
              price
            )
          `)
          .eq('store_id', id)
          .order('updated_at', { ascending: false });

        if (inventoryError) {
          console.error('[inventory] Failed to fetch:', inventoryError);
          throw new Error('Failed to fetch inventory');
        }

        return inventory || [];
      },
      60 // 1 minute cache (inventory changes frequently)
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}

// POST /api/stores/[id]/inventory - Update inventory
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
    const validation = updateInventorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message ?? "Validation failed" },
        { status: 400 }
      );
    }

    const { productId, quantity, lowStockThreshold, trackInventory, allowBackorder } = validation.data;

    const serviceDb = getServiceRoleDatabase();
    
    // Upsert inventory
    const { data: inventory, error: upsertError } = await serviceDb
      .from('inventory')
      .upsert({
        product_id: productId,
        store_id: storeId,
        quantity,
        low_stock_threshold: lowStockThreshold,
        track_inventory: trackInventory,
        allow_backorder: allowBackorder,
        updated_at: new Date().toISOString(),
      } as any, {
        onConflict: 'product_id,store_id',
      })
      .select()
      .single();

    if (upsertError || !inventory) {
      console.error('[inventory] Failed to update:', upsertError);
      return NextResponse.json({ error: "Failed to update inventory" }, { status: 500 });
    }

    logAuditEvent({
      userId: user.id,
      action: "inventory.updated",
      resource: "inventory",
      resourceId: (inventory as any).id,
      metadata: { storeId, productId, quantity },
    });

    await cacheDeletePattern(`inventory:store:${storeId}:*`).catch(() => {});

    return NextResponse.json(inventory, { status: 200 });
  } catch (error) {
    console.error("Error updating inventory:", error);
    return NextResponse.json(
      { error: "Failed to update inventory" },
      { status: 500 }
    );
  }
}
