/**
 * Server-side template query functions
 * Use these in Server Components, API routes, and Server Actions
 */

import { getAnonDatabase } from '@/lib/supabase/database';

interface Template {
  id: string;
  name: string;
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any;
  isActive: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  conditions: any;
  storeId: string;
  createdAt: string;
  updatedAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeTemplate(raw: any): Template {
  return {
    id: raw.id,
    name: raw.name,
    type: raw.type,
    content: raw.content,
    isActive: raw.is_active,
    conditions: raw.conditions,
    storeId: raw.store_id,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

/**
 * Get active template by type with optional fallback
 * Used in storefront pages for not-found templates
 */
export async function getActiveTemplate(
  storeId: string,
  type: string,
  _currentPageId: string | null
): Promise<Template | null> {
  try {
    const db = getAnonDatabase();
    
    const { data, error } = await db
      .from('templates')
      .select('*')
      .eq('store_id', storeId)
      .eq('type', type)
      .eq('is_active', true)
      .single();
    
    if (error || !data) return null;
    
    return normalizeTemplate(data);
  } catch {
    return null;
  }
}

/**
 * Get header and footer templates in a single batched call
 * Used in storefront layout
 */
export async function getLayoutTemplates(
  storeId: string,
  _currentPageId: string | null
): Promise<{ header: Template | null; footer: Template | null }> {
  try {
    const db = getAnonDatabase();
    
    const [headerResult, footerResult] = await Promise.all([
      db.from('templates').select('*').eq('store_id', storeId).eq('type', 'header').eq('is_active', true).single(),
      db.from('templates').select('*').eq('store_id', storeId).eq('type', 'footer').eq('is_active', true).single(),
    ]);

    if (headerResult.error && headerResult.error.code !== 'PGRST116') {
      console.error('[getLayoutTemplates] Header query error:', headerResult.error);
    }
    if (footerResult.error && footerResult.error.code !== 'PGRST116') {
      console.error('[getLayoutTemplates] Footer query error:', footerResult.error);
    }
    
    return {
      header: headerResult.data ? normalizeTemplate(headerResult.data) : null,
      footer: footerResult.data ? normalizeTemplate(footerResult.data) : null,
    };
  } catch (error) {
    console.error('[getLayoutTemplates] Error:', error);
    return { header: null, footer: null };
  }
}
