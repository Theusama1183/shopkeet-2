import { Suspense } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { SettingsClient } from "./settings-client";
import { getDatabase } from "@/lib/supabase/database";

// Calls getDatabase() (reads cookies via JWT) — must be dynamic
export const dynamic = "force-dynamic";

interface StoreRow {
  id: string;
  name: string;
  description: string | null;
  subdomain: string;
  custom_domain: string | null;
  logo: string | null;
  is_active: boolean;
}

async function getStore(storeId: string) {
  try {
    const db = await getDatabase();
    
    const { data, error } = await db
      .from('stores')
      .select('id, name, description, subdomain, custom_domain, logo, is_active')
      .eq('id', storeId)
      .single();

    if (error) {
      console.error('[settings] Failed to fetch store:', error);
      return null;
    }

    // Convert snake_case to camelCase
    const store: StoreRow = data;
    return {
      id: store.id,
      name: store.name,
      description: store.description,
      subdomain: store.subdomain,
      customDomain: store.custom_domain,
      logo: store.logo,
      isActive: store.is_active,
    };
  } catch (error) {
    console.error('[settings] Failed to fetch store:', error);
    return null;
  }
}

export default async function SettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: storeId } = await params;
  
  // Fetch data server-side
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
        <SettingsClient store={store} />
      </Suspense>
    </ErrorBoundary>
  );
}
