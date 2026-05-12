/**
 * Server-side template query functions
 * Use these in Server Components, API routes, and Server Actions
 */

import { getAnonDatabase } from '@/lib/supabase/database';

interface Template {
  id: string;
  name: string;
  type: string;
  content: any;
  isActive: boolean;
  conditions: any;
  storeId: string;
  createdAt: string;
  updatedAt: string;
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
    
    if (error) {
      console.error('[getActiveTemplate] Error:', error);
      return null;
    }
    
    if (!data) return null;
    
    // Convert snake_case to camelCase with type assertion
    const template = data as any;
    return {
      id: template.id,
      name: template.name,
      type: template.type,
      content: template.content,
      isActive: template.is_active,
      conditions: template.conditions,
      storeId: template.store_id,
      createdAt: template.created_at,
      updatedAt: template.updated_at,
    };
  } catch (error) {
    console.error('[getActiveTemplate] Error:', error);
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
    
    // Fetch both header and footer in parallel
    const [headerResult, footerResult] = await Promise.all([
      db
        .from('templates')
        .select('*')
        .eq('store_id', storeId)
        .eq('type', 'header')
        .eq('is_active', true)
        .single(),
      db
        .from('templates')
        .select('*')
        .eq('store_id', storeId)
        .eq('type', 'footer')
        .eq('is_active', true)
        .single(),
    ]);

    if (headerResult.error && headerResult.error.code !== 'PGRST116') {
      console.error('[getLayoutTemplates] Header query error:', headerResult.error);
    }
    if (footerResult.error && footerResult.error.code !== 'PGRST116') {
      console.error('[getLayoutTemplates] Footer query error:', footerResult.error);
    }
    
    const header = headerResult.data ? {
      id: (headerResult.data as any).id,
      name: (headerResult.data as any).name,
      type: (headerResult.data as any).type,
      content: (headerResult.data as any).content,
      isActive: (headerResult.data as any).is_active,
      conditions: (headerResult.data as any).conditions,
      storeId: (headerResult.data as any).store_id,
      createdAt: (headerResult.data as any).created_at,
      updatedAt: (headerResult.data as any).updated_at,
    } : null;
    
    const footer = footerResult.data ? {
      id: (footerResult.data as any).id,
      name: (footerResult.data as any).name,
      type: (footerResult.data as any).type,
      content: (footerResult.data as any).content,
      isActive: (footerResult.data as any).is_active,
      conditions: (footerResult.data as any).conditions,
      storeId: (footerResult.data as any).store_id,
      createdAt: (footerResult.data as any).created_at,
      updatedAt: (footerResult.data as any).updated_at,
    } : null;
    
    return { header, footer };
  } catch (error) {
    console.error('[getLayoutTemplates] Error:', error);
    return { header: null, footer: null };
  }
}
