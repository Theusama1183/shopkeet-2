import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPageById, updatePage, deletePage, isSlugAvailable } from "@/lib/queries/pages.server";
import { getDatabase, getServiceRoleDatabase } from "@/lib/supabase/database";
import { rateLimits, checkRateLimit } from "@/lib/redis/rate-limit";
import { updatePageSchema } from "@/lib/validations/page";
import { invalidateTag } from "@/lib/cache-helpers";

// ── Shared auth + ownership helper ──────────────────────────────────────────
async function authorizeStoreAccess(storeId: string, userId: string) {
  const supabase = await createClient();
  const { data: store, error } = await supabase
    .from('stores')
    .select('id')
    .eq('id', storeId)
    .eq('user_id', userId)
    .single();
  
  return error || !store ? null : store;
}

// GET /api/stores/[id]/pages/[pageId]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  try {
    const { id, pageId } = await params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rl = await checkRateLimit(rateLimits.read, `read:${user.id}`);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests", retryAfter: Math.ceil((rl.reset - Date.now()) / 1000) },
        { status: 429 }
      );
    }

    // Authorization: user must own the store
    const store = await authorizeStoreAccess(id, user.id);
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const page = await getPageById(pageId);
    if (!page || page.store_id !== id) { // Fixed: Use snake_case from database
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Convert snake_case to camelCase for the client
    return NextResponse.json({
      id: page.id,
      title: page.title,
      slug: page.slug,
      content: page.content,
      layoutId: page.layout_id,
      isHome: page.is_home,
      isPublished: page.is_published,
      metaTitle: page.meta_title,
      metaDescription: page.meta_description,
      storeId: page.store_id,
      createdAt: page.created_at,
      updatedAt: page.updated_at,
    });
  } catch (error) {
    console.error("Error fetching page:", error);
    return NextResponse.json({ error: "Failed to fetch page" }, { status: 500 });
  }
}

// PUT /api/stores/[id]/pages/[pageId]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  try {
    const { id, pageId } = await params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rl = await checkRateLimit(rateLimits.api, `page-update:${user.id}`);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests", retryAfter: Math.ceil((rl.reset - Date.now()) / 1000) },
        { status: 429 }
      );
    }

    // Authorization: user must own the store
    const store = await authorizeStoreAccess(id, user.id);
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    // Verify page belongs to this store
    const existingPage = await getPageById(pageId);
    if (!existingPage || existingPage.store_id !== id) { // Fixed: Use snake_case from database
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Input validation
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = updatePageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Validation failed" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // If slug is changing, check uniqueness (exclude current page)
    if (data.slug && data.slug !== existingPage.slug) {
      const slugAvailable = await isSlugAvailable(id, data.slug, pageId);
      if (!slugAvailable) {
        return NextResponse.json({ error: "Slug already exists for this store" }, { status: 400 });
      }
    }

    // If setting this page as home, clear is_home on all other pages for this store
    if (data.isHome === true) {
      const db = await getDatabase();
      await db
        .from('pages')
        .update({ is_home: false, updated_at: new Date().toISOString() })
        .eq('store_id', id)
        .neq('id', pageId);
    }

    const updatedPage = await updatePage(pageId, {
      ...data,
      metaTitle: data.metaTitle ?? undefined,
      metaDescription: data.metaDescription ?? undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      content: data.content as any,
    });

    if (!updatedPage) {
      return NextResponse.json({ error: "Failed to update page" }, { status: 500 });
    }

    // ── Snapshot version (fire-and-forget) ───────────────────────────────────
    // Save a version snapshot whenever content changes.
    // Uses service role so it works even if RLS is restrictive.
    if (data.content) {
      const serviceDb = getServiceRoleDatabase() as any;
      serviceDb
        .from("page_versions")
        .insert({
          page_id:    pageId,
          store_id:   id,
          content:    data.content,
          title:      updatedPage.title,
          created_by: user.id,
        })
        .then(({ error: vErr }: { error: any }) => {
          if (vErr) console.error("[page_versions] Failed to save version:", vErr);
        });
    }

    // Invalidate ISR cache
    invalidateTag("pages");

    // Convert snake_case to camelCase for the client
    return NextResponse.json({
      id: updatedPage.id,
      title: updatedPage.title,
      slug: updatedPage.slug,
      content: updatedPage.content,
      layoutId: updatedPage.layout_id,
      isHome: updatedPage.is_home,
      isPublished: updatedPage.is_published,
      metaTitle: updatedPage.meta_title,
      metaDescription: updatedPage.meta_description,
      storeId: updatedPage.store_id,
      createdAt: updatedPage.created_at,
      updatedAt: updatedPage.updated_at,
    });
  } catch (error) {
    console.error("Error updating page:", error);
    return NextResponse.json({ error: "Failed to update page" }, { status: 500 });
  }
}

// DELETE /api/stores/[id]/pages/[pageId]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  try {
    const { id, pageId } = await params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rl = await checkRateLimit(rateLimits.api, `page-delete:${user.id}`);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests", retryAfter: Math.ceil((rl.reset - Date.now()) / 1000) },
        { status: 429 }
      );
    }

    // Authorization: user must own the store
    const store = await authorizeStoreAccess(id, user.id);
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    // Verify page belongs to this store
    const existingPage = await getPageById(pageId);
    if (!existingPage || existingPage.store_id !== id) { // Fixed: Use snake_case from database
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const success = await deletePage(pageId);
    if (!success) {
      return NextResponse.json({ error: "Failed to delete page" }, { status: 404 });
    }

    // Invalidate ISR cache
    invalidateTag("pages");

    return NextResponse.json({ message: "Page deleted successfully" });
  } catch (error) {
    console.error("Error deleting page:", error);
    return NextResponse.json({ error: "Failed to delete page" }, { status: 500 });
  }
}
