import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDatabase, getServiceRoleDatabase } from "@/lib/supabase/database";
import { withCache, cacheDelete } from "@/lib/redis";
import { logAuditEvent } from "@/lib/audit/logger";
import { invalidateStoreCache } from "@/lib/redis/cache";
import { invalidateTags } from "@/lib/cache-helpers";
import { inngest } from "@/lib/inngest/client";

// GET /api/stores/[id] - Get single store
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Cache store detail for 5 minutes
    const store = await withCache(
      `store:detail:${id}:user:${user.id}`,
      async () => {
        // Authorization check - user must own the store
        const db = await getDatabase();
        const { data, error } = await db
          .from('stores')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();

        if (error || !data) {
          return null;
        }

        return data;
      },
      300 // 5 minutes
    );

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    return NextResponse.json(store);
  } catch (error) {
    console.error("Error fetching store:", error);
    return NextResponse.json(
      { error: "Failed to fetch store" },
      { status: 500 }
    );
  }
}

// PATCH /api/stores/[id] - Update store
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Authorization check
    const db = await getDatabase();
    const { data: existingStore, error: fetchError } = await db
      .from('stores')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingStore) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name, description, logo, customDomain } = body;

    // Validate input (partial validation for updates)
    const updates: any = {};
    
    if (name !== undefined) {
      if (!name || name.length < 2 || name.length > 100) {
        return NextResponse.json(
          { error: "Store name must be 2-100 characters" },
          { status: 400 }
        );
      }
      updates.name = name.trim().replace(/[<>]/g, '');
    }

    if (description !== undefined) {
      if (description && description.length > 500) {
        return NextResponse.json(
          { error: "Description must be under 500 characters" },
          { status: 400 }
        );
      }
      updates.description = description?.trim().replace(/[<>]/g, '') || null;
    }

    if (logo !== undefined) {
      if (logo !== null) {
        try {
          new URL(logo);
        } catch {
          return NextResponse.json({ error: "Invalid logo URL" }, { status: 400 });
        }
      }
      updates.logo = logo;
    }

    if (customDomain !== undefined) {
      updates.custom_domain = customDomain;
    }

    updates.updated_at = new Date().toISOString();

    // Update store
    const serviceDb = getServiceRoleDatabase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedStoreData, error: updateError } = await (serviceDb as any)
      .from('stores')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError || !updatedStoreData) {
      return NextResponse.json({ error: "Failed to update store" }, { status: 500 });
    }

    const updatedStore = updatedStoreData as any;

    // Audit log (fire-and-forget)
    logAuditEvent({
      userId: user.id,
      action: "store.updated",
      resource: "store",
      resourceId: id,
      metadata: { changes: Object.keys(updates) },
    });

    // Invalidate caches
    await Promise.all([
      cacheDelete(`stores:user:${user.id}`),
      cacheDelete(`store:detail:${id}:user:${user.id}`),
      invalidateStoreCache(id, existingStore.subdomain),
    ]).catch(() => {});
    invalidateTags("stores", "pages", "templates");

    return NextResponse.json(updatedStore);
  } catch (error) {
    console.error("Error updating store:", error);
    return NextResponse.json(
      { error: "Failed to update store" },
      { status: 500 }
    );
  }
}

// DELETE /api/stores/[id] - Delete store
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Authorization check
    const db = await getDatabase();
    const { data: existingStore, error: fetchError } = await db
      .from('stores')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingStore) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // Delete store (cascade will delete products)
    const serviceDb = getServiceRoleDatabase();
    const { error: deleteError } = await serviceDb
      .from('stores')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json({ error: "Failed to delete store" }, { status: 500 });
    }

    // Trigger background cleanup jobs
    inngest.send({
      name: "store/deleted",
      data: {
        storeId: id,
        userId: user.id,
        subdomain: existingStore.subdomain,
      },
    }).catch((error) => {
      console.error("[inngest] Failed to send store/deleted event:", error);
    });

    // Audit log (fire-and-forget)
    logAuditEvent({
      userId: user.id,
      action: "store.deleted",
      resource: "store",
      resourceId: id,
      metadata: { subdomain: existingStore.subdomain },
    });

    // Invalidate caches
    await Promise.all([
      cacheDelete(`stores:user:${user.id}`),
      cacheDelete(`store:detail:${id}:user:${user.id}`),
      invalidateStoreCache(id, existingStore.subdomain),
    ]).catch(() => {});
    invalidateTags("stores");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting store:", error);
    return NextResponse.json(
      { error: "Failed to delete store" },
      { status: 500 }
    );
  }
}
