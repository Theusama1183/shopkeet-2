import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDatabase, getServiceRoleDatabase } from "@/lib/supabase/database";
import { getPageById, updatePage } from "@/lib/queries/pages.server";
import { invalidateTag } from "@/lib/cache-helpers";

// ── Auth + ownership helper ───────────────────────────────────────────────────
async function authorizeStoreAccess(storeId: string, userId: string) {
  const supabase = await createClient();
  const { data: store, error } = await supabase
    .from("stores")
    .select("id")
    .eq("id", storeId)
    .eq("user_id", userId)
    .single();
  return error || !store ? null : store;
}

// GET /api/stores/[id]/pages/[pageId]/versions
// Returns the last 20 saved versions for a page, newest first.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  try {
    const { id, pageId } = await params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const store = await authorizeStoreAccess(id, user.id);
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    // Verify page belongs to this store
    const page = await getPageById(pageId);
    if (!page || page.store_id !== id) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const db = (await getDatabase()) as any;
    const { data: versions, error: vErr } = await db
      .from("page_versions")
      .select("id, title, created_at, created_by")
      .eq("page_id", pageId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (vErr) {
      console.error("[page_versions] GET error:", vErr);
      return NextResponse.json({ error: "Failed to fetch versions" }, { status: 500 });
    }

    return NextResponse.json(versions ?? []);
  } catch (error) {
    console.error("[page_versions] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/stores/[id]/pages/[pageId]/versions
// Body: { versionId: string }
// Restores a specific version — copies its content back to the live page.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  try {
    const { id, pageId } = await params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const store = await authorizeStoreAccess(id, user.id);
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    // Verify page belongs to this store
    const page = await getPageById(pageId);
    if (!page || page.store_id !== id) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    let body: { versionId?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!body.versionId) {
      return NextResponse.json({ error: "versionId is required" }, { status: 400 });
    }

    // Fetch the version content
    const db = (await getDatabase()) as any;
    const { data: version, error: vErr } = await db
      .from("page_versions")
      .select("id, content, title")
      .eq("id", body.versionId)
      .eq("page_id", pageId) // Security: version must belong to this page
      .single();

    if (vErr || !version) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    // Restore: update the live page with the version's content
    const restoredPage = await updatePage(pageId, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      content: version.content as any,
    });

    if (!restoredPage) {
      return NextResponse.json({ error: "Failed to restore version" }, { status: 500 });
    }

    // Save a new version snapshot marking this as a restore
    const serviceDb = getServiceRoleDatabase() as any;
    serviceDb
      .from("page_versions")
      .insert({
        page_id:    pageId,
        store_id:   id,
        content:    version.content,
        title:      `${restoredPage.title} (restored)`,
        created_by: user.id,
      })
      .then(({ error: snapErr }: { error: any }) => {
        if (snapErr) console.error("[page_versions] Failed to save restore snapshot:", snapErr);
      });

    invalidateTag("pages");

    return NextResponse.json({
      id: restoredPage.id,
      title: restoredPage.title,
      slug: restoredPage.slug,
      content: restoredPage.content,
      layoutId: restoredPage.layout_id,
      isHome: restoredPage.is_home,
      isPublished: restoredPage.is_published,
      storeId: restoredPage.store_id,
      updatedAt: restoredPage.updated_at,
    });
  } catch (error) {
    console.error("[page_versions] Restore error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
