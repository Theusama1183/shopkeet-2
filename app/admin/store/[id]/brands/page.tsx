import { Suspense } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { BrandsTable } from "./brands-client";
import { getDatabase } from "@/lib/supabase/database";

interface Brand {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  logo: string | null;
  website: string | null;
  is_active: boolean;
  created_at: string;
}

async function getBrands(storeId: string) {
  try {
    const db = await getDatabase();
    const { data, error } = await db
      .from('brands')
      .select('*')
      .eq('store_id', storeId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[brands] Failed to fetch:', error);
      return [];
    }

    return (data || []).map((b: Brand) => ({
      id: b.id,
      name: b.name,
      description: b.description,
      slug: b.slug,
      logo: b.logo,
      website: b.website,
      isActive: b.is_active,
      createdAt: b.created_at,
    }));
  } catch (error) {
    console.error('[brands] Failed to fetch:', error);
    return [];
  }
}

export default async function BrandsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: storeId } = await params;

  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="h-96 bg-zinc-50 rounded-xl animate-pulse" />}>
        <BrandsTable storeId={storeId} />
      </Suspense>
    </ErrorBoundary>
  );
}
