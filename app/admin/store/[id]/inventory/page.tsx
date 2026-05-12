import { Suspense } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { InventoryTable } from "./inventory-client";
import { getDatabase } from "@/lib/supabase/database";

interface InventoryItem {
  id: string;
  product_id: string;
  quantity: number;
  low_stock_threshold: number | null;
  track_inventory: boolean;
  allow_backorder: boolean;
  updated_at: string;
  products: {
    id: string;
    name: string;
    sku: string | null;
    image: string | null;
    price: number;
  } | null;
}

async function getInventory(storeId: string) {
  try {
    const db = await getDatabase();
    const { data, error } = await db
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
      .eq('store_id', storeId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[inventory] Failed to fetch:', error);
      return [];
    }

    return (data || []).map((i: InventoryItem) => ({
      id: i.id,
      productId: i.product_id,
      quantity: i.quantity,
      lowStockThreshold: i.low_stock_threshold,
      trackInventory: i.track_inventory,
      allowBackorder: i.allow_backorder,
      updatedAt: i.updated_at,
      product: i.products ? {
        id: i.products.id,
        name: i.products.name,
        sku: i.products.sku,
        image: i.products.image,
        price: i.products.price,
      } : null,
    }));
  } catch (error) {
    console.error('[inventory] Failed to fetch:', error);
    return [];
  }
}

export default async function InventoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: storeId } = await params;
  const inventory = await getInventory(storeId);

  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="h-96 bg-zinc-50 rounded-xl animate-pulse" />}>
        <InventoryTable initialInventory={inventory} storeId={storeId} />
      </Suspense>
    </ErrorBoundary>
  );
}
