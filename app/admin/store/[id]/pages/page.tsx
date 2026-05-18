import { Suspense } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { PagesTable } from "./pages-client";
import { getDatabase } from "@/lib/supabase/database";

// Calls getDatabase() (reads cookies via JWT) — must be dynamic
export const dynamic = "force-dynamic";

async function getStore(storeId: string) {
  try {
    const db = await getDatabase();
    
    const { data: store, error } = await db
      .from('stores')
      .select('id, name, subdomain')
      .eq('id', storeId)
      .single();
      
    if (error) {
      console.error('[store] Failed to fetch:', error);
      return null;
    }

    return store ? {
      id: store.id,
      name: store.name,
      subdomain: store.subdomain,
    } : null;
  } catch (error) {
    console.error('[store] Failed to fetch:', error);
    return null;
  }
}

export default async function StorePagesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: storeId } = await params;
  
  // Fetch only store data server-side, pages will be fetched client-side with React Query
  const store = await getStore(storeId);

  if (!store) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
          <span className="text-red-500 text-2xl">!</span>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-zinc-900">Store not found</p>
          <p className="text-xs text-zinc-500 mt-1">The store you're looking for doesn't exist</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="h-96 bg-zinc-50 rounded-xl animate-pulse" />}>
        <PagesTable store={store} />
      </Suspense>
    </ErrorBoundary>
  );
}