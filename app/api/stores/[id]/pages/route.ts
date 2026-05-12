import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createPage, getStorePagesAuth, isSlugAvailable } from "@/lib/queries/pages.server";
import { rateLimits, checkRateLimit } from "@/lib/redis/rate-limit";
import { createPageSchema } from "@/lib/validations/page";
import { invalidateTag } from "@/lib/cache-helpers";
import { inngest } from "@/lib/inngest/client";

// GET /api/stores/[id]/pages - Get all pages for a store
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ── Auth check ──────────────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Rate limiting ────────────────────────────────────────────────────────
    const rl = await checkRateLimit(rateLimits.read, "read", `read:${user.id}`);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests", retryAfter: Math.ceil((rl.reset - Date.now()) / 1000) },
        { status: 429 }
      );
    }

    // ── Authorization: user must own the store ───────────────────────────────
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    
    if (storeError || !store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // ── Pagination ───────────────────────────────────────────────────────────
    const { searchParams } = new URL(request.url);
    const includeUnpublished = searchParams.get("includeUnpublished") === "true";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
    const offset = (page - 1) * limit;

    const { items, total } = await getStorePagesAuth(id, includeUnpublished, limit, offset);

    return NextResponse.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + items.length < total,
      },
    });
  } catch (error) {
    console.error("Error fetching pages:", error);
    return NextResponse.json({ error: "Failed to fetch pages" }, { status: 500 });
  }
}

// POST /api/stores/[id]/pages - Create a new page
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ── Auth check ──────────────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Rate limiting ────────────────────────────────────────────────────────
    const rl = await checkRateLimit(rateLimits.api, "api", `page-create:${user.id}`);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests", retryAfter: Math.ceil((rl.reset - Date.now()) / 1000) },
        { status: 429 }
      );
    }

    // ── Authorization: user must own the store ───────────────────────────────
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    
    if (storeError || !store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // ── Input validation ─────────────────────────────────────────────────────
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = createPageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Validation failed" },
        { status: 400 }
      );
    }

    const { title, slug, content, layoutId, isHome, metaTitle, metaDescription, isPublished } = parsed.data;

    // ── Slug uniqueness ──────────────────────────────────────────────────────
    const slugAvailable = await isSlugAvailable(id, slug);
    if (!slugAvailable) {
      return NextResponse.json({ error: "Slug already exists for this store" }, { status: 400 });
    }

    // ── Create page ──────────────────────────────────────────────────────────
    const newPage = await createPage({
      title,
      slug,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      content: content as any,
      layoutId,
      isHome,
      metaTitle: metaTitle ?? undefined,
      metaDescription: metaDescription ?? undefined,
      storeId: id,
      isPublished,
    });

    if (!newPage) {
      return NextResponse.json({ error: "Failed to create page" }, { status: 500 });
    }

    // Trigger background jobs if page is published
    if (isPublished) {
      inngest.send({
        name: "page/published",
        data: {
          pageId: newPage.id,
          storeId: id,
          slug: newPage.slug,
        },
      }).catch((error) => {
        console.error("[inngest] Failed to send page/published event:", error);
      });
    }

    // Invalidate ISR cache so storefront reflects new page
    invalidateTag("pages");

    return NextResponse.json(newPage, { status: 201 });
  } catch (error) {
    console.error("Error creating page:", error);
    return NextResponse.json({ error: "Failed to create page" }, { status: 500 });
  }
}
