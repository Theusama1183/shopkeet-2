import { Suspense } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { CollectionsTable } from "./collections-client";
import { getDatabase } from "@/lib/supabase/database";

interface Collection {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  image: string | null;
  is_active: boolean;
  created_at: string;
}

async function getCollections(storeId: string) {
  try {
    const db = await getDatabase();
    const { data, error } = await db
      .from('collections')
      .select('*')
      .eq('store_id', storeId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[collections] Failed to fetch:', error);
      return [];
    }

    // Convert snake_case to camelCase
    return (data || []).map((c: Collection) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      slug: c.slug,
      image: c.image,
      isActive: c.is_active,
      createdAt: c.created_at,
    }));
  } catch (error) {
    console.error('[collections] Failed to fetch:', error);
    return [];
  }
}

export default async function CollectionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: storeId } = await params;

  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="h-96 bg-zinc-50 rounded-xl animate-pulse" />}>
        <CollectionsTable storeId={storeId} />
      </Suspense>
    </ErrorBoundary>
  );
}
