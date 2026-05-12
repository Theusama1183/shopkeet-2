import { Suspense } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { ProductsTable } from "./products-client";
import { getDatabase } from "@/lib/supabase/database";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  is_active: boolean;
  status?: string;
  sku?: string | null;
  quantity?: number;
  created_at: string;
}

async function getProducts(storeId: string) {
  try {
    const db = await getDatabase();
    const { data, error } = await db
      .from('products')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[products] Failed to fetch:', error);
      return [];
    }

    // Convert snake_case to camelCase
    return (data || []).map((p: Product) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      image: p.image,
      isActive: p.is_active,
      status: p.status,
      sku: p.sku,
      quantity: p.quantity,
      createdAt: p.created_at,
    }));
  } catch (error) {
    console.error('[products] Failed to fetch:', error);
    return [];
  }
}

export default async function ProductsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: storeId } = await params;

  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="h-96 bg-zinc-50 rounded-xl animate-pulse" />}>
        <ProductsTable storeId={storeId} />
      </Suspense>
    </ErrorBoundary>
  );
}
