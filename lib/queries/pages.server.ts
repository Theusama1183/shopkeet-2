// Server-side query functions for pages
// These are used by API routes and server components

import { getAnonDatabase, getDatabase } from "@/lib/supabase/database";

/**
 * Get store pages (PUBLIC - for storefront)
 * Uses anon database, safe for unstable_cache()
 */
export async function getStorePages(
  storeId: string,
  includeUnpublished: boolean = false,
  limit: number = 50,
  offset: number = 0
) {
  // Use anon database for public queries (no cookies)
  const db = getAnonDatabase();
  
  let query = db
    .from('pages')
    .select('*', { count: 'exact' })
    .eq('store_id', storeId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (!includeUnpublished) {
    query = query.eq('is_published', true);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching pages:', error);
    throw new Error(error.message);
  }

  return {
    items: data || [],
    total: count || 0,
  };
}

/**
 * Get store pages (AUTHENTICATED - for API routes)
 * Uses authenticated database with RLS
 */
export async function getStorePagesAuth(
  storeId: string,
  includeUnpublished: boolean = false,
  limit: number = 50,
  offset: number = 0
) {
  // Use authenticated database for API routes
  const db = await getDatabase();
  
  let query = db
    .from('pages')
    .select('*', { count: 'exact' })
    .eq('store_id', storeId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (!includeUnpublished) {
    query = query.eq('is_published', true);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching pages:', error);
    throw new Error(error.message);
  }

  return {
    items: data || [],
    total: count || 0,
  };
}

export async function getPageById(pageId: string) {
  const db = await getDatabase();

  const { data, error } = await db
    .from('pages')
    .select('*')
    .eq('id', pageId)
    .is('deleted_at', null)
    .single();

  if (error) {
    // PGRST116 = no rows found (not an error, just not found)
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching page:', error);
    throw new Error(error.message);
  }

  return data;
}

export async function isSlugAvailable(storeId: string, slug: string, excludePageId?: string) {
  const db = await getDatabase();
  
  let query = db
    .from('pages')
    .select('id')
    .eq('store_id', storeId)
    .eq('slug', slug)
    .is('deleted_at', null);

  if (excludePageId) {
    query = query.neq('id', excludePageId);
  }

  const { data, error } = await query.single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
    console.error('Error checking slug availability:', error);
    throw new Error(error.message);
  }

  return !data; // true if slug is available (no existing page found)
}

export async function createPage(pageData: {
  title: string;
  slug: string;
  content: any;
  layoutId?: string;
  isHome?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  storeId: string;
  isPublished?: boolean;
}) {
  const db = await getDatabase();

  const { data, error } = await db
    .from('pages')
    .insert({
      title: pageData.title,
      slug: pageData.slug,
      content: pageData.content,
      layout_id: pageData.layoutId || null,
      is_home: pageData.isHome || false,
      meta_title: pageData.metaTitle || null,
      meta_description: pageData.metaDescription || null,
      store_id: pageData.storeId,
      is_published: pageData.isPublished || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating page:', error);
    throw new Error(error.message);
  }

  return data;
}

export async function updatePage(
  pageId: string,
  updates: {
    title?: string;
    slug?: string;
    content?: any;
    layoutId?: string;
    isHome?: boolean;
    metaTitle?: string;
    metaDescription?: string;
    isPublished?: boolean;
  }
) {
  const db = await getDatabase();

  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.slug !== undefined) updateData.slug = updates.slug;
  if (updates.content !== undefined) updateData.content = updates.content;
  if (updates.layoutId !== undefined) updateData.layout_id = updates.layoutId;
  if (updates.isHome !== undefined) updateData.is_home = updates.isHome;
  if (updates.metaTitle !== undefined) updateData.meta_title = updates.metaTitle;
  if (updates.metaDescription !== undefined) updateData.meta_description = updates.metaDescription;
  if (updates.isPublished !== undefined) updateData.is_published = updates.isPublished;

  const { data, error } = await db
    .from('pages')
    .update(updateData)
    .eq('id', pageId)
    .select()
    .single();

  if (error) {
    console.error('Error updating page:', error);
    throw new Error(error.message);
  }

  return data;
}

export async function deletePage(pageId: string) {
  const db = await getDatabase();

  const { error } = await db
    .from('pages')
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', pageId);

  if (error) {
    console.error('Error deleting page:', error);
    throw new Error(error.message);
  }

  return true;
}

export async function getPageBySlug(storeId: string, slug: string) {
  const db = getAnonDatabase();

  const { data, error } = await db
    .from('pages')
    .select('*')
    .eq('store_id', storeId)
    .eq('slug', slug)
    .eq('is_published', true)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows found
      return null;
    }
    console.error('Error fetching page by slug:', error);
    return null;
  }

  if (!data) return null;

  // Normalize to camelCase so all consumers get consistent shape
  const raw = data as any;
  return {
    id: raw.id,
    title: raw.title,
    slug: raw.slug,
    content: raw.content,
    layoutId: raw.layout_id,
    isHome: raw.is_home,
    isPublished: raw.is_published,
    metaTitle: raw.meta_title,
    metaDescription: raw.meta_description,
    storeId: raw.store_id,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

export async function getHomePage(storeId: string) {
  const db = getAnonDatabase();

  // First try to get the page marked as home
  const { data: homePage, error: homeError } = await db
    .from('pages')
    .select('*')
    .eq('store_id', storeId)
    .eq('is_home', true)
    .eq('is_published', true)
    .is('deleted_at', null)
    .single();

  const normalize = (raw: any) => ({
    id: raw.id,
    title: raw.title,
    slug: raw.slug,
    content: raw.content,
    layoutId: raw.layout_id,
    isHome: raw.is_home,
    isPublished: raw.is_published,
    metaTitle: raw.meta_title,
    metaDescription: raw.meta_description,
    storeId: raw.store_id,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  });

  if (!homeError && homePage) {
    return normalize(homePage);
  }

  // Fallback: try to get a page with slug 'home' or 'index'
  const { data: fallbackPage, error: fallbackError } = await db
    .from('pages')
    .select('*')
    .eq('store_id', storeId)
    .in('slug', ['home', 'index', ''])
    .eq('is_published', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (!fallbackError && fallbackPage) {
    return normalize(fallbackPage);
  }

  // No home page found
  return null;
}
