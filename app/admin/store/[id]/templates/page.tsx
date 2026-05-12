import { Suspense } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { TemplatesClient } from "./templates-client";
import { getDatabase } from "@/lib/supabase/database";

interface TemplateRow {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

async function getTemplates(storeId: string) {
  try {
    const db = await getDatabase();
    
    const { data, error } = await db
      .from('templates')
      .select('*')
      .eq('store_id', storeId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[templates] Failed to fetch:', error);
      return [];
    }

    // Convert snake_case to camelCase
    const templates = (data || []).map((t: TemplateRow) => ({
      id: t.id,
      name: t.name,
      type: t.type,
      isActive: t.is_active,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    }));

    return templates;
  } catch (error) {
    console.error('[templates] Failed to fetch:', error);
    return [];
  }
}

export default async function TemplatesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: storeId } = await params;

  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="h-96 bg-zinc-50 rounded-xl animate-pulse" />}>
        <TemplatesClient storeId={storeId} />
      </Suspense>
    </ErrorBoundary>
  );
}
