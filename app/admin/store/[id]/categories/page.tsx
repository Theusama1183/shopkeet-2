import { Suspense } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { CategoriesTable } from "./categories-client";
import { getDatabase } from "@/lib/supabase/database";

interface Category {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  image: string | null;
  parent_id: string | null;
  is_active: boolean;
  created_at: string;
}

async function getCategories(storeId: string) {
  try {
    const db = await getDatabase();
    const { data, error } = await db
      .from('categories')
      .select('*')
      .eq('store_id', storeId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[categories] Failed to fetch:', error);
      return [];
    }

    return (data || []).map((c: Category) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      slug: c.slug,
      image: c.image,
      parentId: c.parent_id,
      isActive: c.is_active,
      createdAt: c.created_at,
    }));
  } catch (error) {
    console.error('[categories] Failed to fetch:', error);
    return [];
  }
}

export default async function CategoriesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: storeId } = await params;

  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="h-96 bg-zinc-50 rounded-xl animate-pulse" />}>
        <CategoriesTable storeId={storeId} />
      </Suspense>
    </ErrorBoundary>
  );
}
