import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDatabase } from "@/lib/supabase/database";
import { rateLimits } from "@/lib/redis/rate-limit";
import { withCache } from "@/lib/redis";
import { validateStoreInput } from "@/lib/validations/store";
import { createStoreCore } from "@/lib/stores/service";
import { 
  withApiErrorHandler, 
  AuthenticationError, 
  RateLimitError,
  ConflictError,
  ValidationError,
  generateCorrelationId 
} from "@/lib/errors";
import { withCSRFProtection } from "@/lib/security/csrf";

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
export const POST = withCSRFProtection(withApiErrorHandler(async (req: Request) => {
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
    const newStore = await createStoreCore({
      userId: user.id,
      userEmail: user.email!,
      userName: user.user_metadata?.full_name,
      userImage: user.user_metadata?.avatar_url,
      name: validation.data!.name,
      subdomain: validation.data!.subdomain,
      description: validation.data!.description,
      correlationId
    });

    return NextResponse.json(newStore, { status: 201 });
  } catch (error: any) {
    if (error.code === "23505") {
      throw new ConflictError("Subdomain already taken");
    }
    throw error;
  }
}));
