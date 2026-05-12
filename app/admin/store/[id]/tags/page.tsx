import { Suspense } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { TagsTable } from "./tags-client";
import { getDatabase } from "@/lib/supabase/database";

interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string;
  created_at: string;
}

async function getTags(storeId: string) {
  try {
    const db = await getDatabase();
    const { data, error } = await db
      .from('tags')
      .select('*')
      .eq('store_id', storeId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[tags] Failed to fetch:', error);
      return [];
    }

    return (data || []).map((t: Tag) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      color: t.color,
      createdAt: t.created_at,
    }));
  } catch (error) {
    console.error('[tags] Failed to fetch:', error);
    return [];
  }
}

export default async function TagsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: storeId } = await params;

  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="h-96 bg-zinc-50 rounded-xl animate-pulse" />}>
        <TagsTable storeId={storeId} />
      </Suspense>
    </ErrorBoundary>
  );
}
