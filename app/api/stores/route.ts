import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDatabase, getServiceRoleDatabase } from "@/lib/supabase/database";
import { rateLimits } from "@/lib/redis/rate-limit";
import { withCache } from "@/lib/redis";
import { logAuditEvent } from "@/lib/audit/logger";
import { validateStoreInput } from "@/lib/validations/store";
import { inngest } from "@/lib/inngest/client";
import type { Database } from "@/types/supabase";
import { 
  withApiErrorHandler, 
  AuthenticationError, 
  RateLimitError,
  ConflictError,
  ValidationError,
  generateCorrelationId 
} from "@/lib/errors";

// GET /api/stores - List all stores for authenticated user
export const GET = withApiErrorHandler(async (_req: Request) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new AuthenticationError();
  }

  // Rate limiting for read operations
  if (rateLimits.read) {
    const identifier = `read:stores:${user.id}`;
    const rateLimit = await rateLimits.read.limit(identifier);
    
    if (!rateLimit.success) {
      const retryAfter = Math.ceil((rateLimit.reset - Date.now()) / 1000);
      throw new RateLimitError("Too many requests", retryAfter);
    }
  }

  // Cache stores list for 5 minutes
  const userStores = await withCache(
    `stores:user:${user.id}`,
    async () => {
      const db = await getDatabase();
      const { data, error } = await db
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[stores] Failed to fetch stores:', error);
        throw new Error('Failed to fetch stores');
      }

      return data || [];
    },
    300 // 5 minutes
  );

  return NextResponse.json(userStores);
});

// POST /api/stores - Create new store
export const POST = withApiErrorHandler(async (req: Request) => {
  const correlationId = generateCorrelationId();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new AuthenticationError();
  }

  // Rate limiting
  if (rateLimits.storeCreation) {
    const identifier = `store-create:${user.id}`;
    const rateLimit = await rateLimits.storeCreation.limit(identifier);
    
    if (!rateLimit.success) {
      const retryAfter = Math.ceil((rateLimit.reset - Date.now()) / 1000);
      throw new RateLimitError("Too many store creation attempts", retryAfter);
    }
  }

  const body = await req.json();
  const { name, subdomain, description } = body;

  // Validate input
  const validation = validateStoreInput({ name, subdomain, description });
  if (!validation.success) {
    throw new ValidationError(validation.error || "Validation failed");
  }

  try {
    const db = getServiceRoleDatabase();
    
    // Ensure user exists in database
    await db.from('users').upsert({
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.full_name || user.email?.split("@")[0],
      image: user.user_metadata?.avatar_url,
    } as any, {
      onConflict: 'id',
      ignoreDuplicates: true
    });

    // Create store
    const { data: newStoreData, error } = await db
      .from('stores')
      .insert({
        name: validation.data!.name,
        subdomain: validation.data!.subdomain,
        description: validation.data!.description,
        user_id: user.id,
      } as any)
      .select()
      .single();

    if (error || !newStoreData) {
      if (error?.code === '23505') {
        throw new ConflictError("Subdomain already taken");
      }
      throw new Error('Failed to create store');
    }

    const newStore = newStoreData as any;

    // Trigger background jobs (fire-and-forget)
    inngest.send({
      name: "store/created",
      data: {
        storeId: newStore.id,
        userId: user.id,
        subdomain: newStore.subdomain,
      },
    }).catch((error) => {
      console.error("[inngest] Failed to send store/created event:", error);
    });

    // Audit log (fire-and-forget)
    logAuditEvent({
      userId: user.id,
      action: "store.created",
      resource: "store",
      resourceId: newStore.id,
      metadata: { 
        subdomain: newStore.subdomain, 
        name: newStore.name,
        correlationId 
      },
    });

    return NextResponse.json(newStore, { status: 201 });
  } catch (error: any) {
    if (error.code === "23505") {
      throw new ConflictError("Subdomain already taken");
    }
    throw error;
  }
});
