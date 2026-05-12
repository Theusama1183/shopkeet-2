"use server";

import { createClient } from "@/lib/supabase/server";
import { getAnonDatabase, getServiceRoleDatabase } from "@/lib/supabase/database";
import { validateStoreInput, validateSubdomain } from "@/lib/validations/store";
import { checkStoreCreationRateLimit } from "@/lib/auth/rate-limit";
import { logAuditEvent } from "@/lib/audit/logger";
import type { Database } from "@/types/supabase";

export async function checkSubdomain(subdomain: string) {
  // Note: This function is intentionally public (no auth required)
  // It's used during signup/onboarding to check subdomain availability
  // This is acceptable as it only reveals if a subdomain is taken, not sensitive data
  
  const validation = validateSubdomain(subdomain);
  
  if (!validation.valid) {
    return { available: false, error: validation.error };
  }

  const slug = validation.slug!;
  
  // Use anon database for public subdomain check
  const db = getAnonDatabase();
  const { data: existing } = await db
    .from('stores')
    .select('id')
    .eq('subdomain', slug)
    .single();

  return { available: !existing, slug };
}

export async function createStore(_prevState: any, formData: FormData) {
  let userId: string | undefined;
  
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Not authenticated" };
    }

    userId = user.id;

    // Rate limiting
    const rateLimit = await checkStoreCreationRateLimit(user.id);
    if (!rateLimit.success) {
      return {
        error: `Too many store creation attempts. Please try again in ${rateLimit.retryAfter} seconds.`,
      };
    }

    // Extract and sanitize form data
    const rawName = formData.get("name") as string;
    const rawSubdomain = formData.get("subdomain") as string;
    const rawDescription = formData.get("description") as string;

    if (!rawName || !rawSubdomain) {
      return { error: "Name and subdomain are required" };
    }

    // Validate input
    const validation = validateStoreInput({ 
      name: rawName, 
      subdomain: rawSubdomain, 
      description: rawDescription 
    });
    
    if (!validation.success) {
      return { error: validation.error };
    }

    const { name, subdomain, description } = validation.data!;

    // Double-check subdomain availability
    const subdomainCheck = await checkSubdomain(subdomain);
    if (!subdomainCheck.available) {
      return { error: "Subdomain is not available" };
    }

    // Use service role database to bypass RLS for user creation
    const db = getServiceRoleDatabase();

    // Ensure user exists in public.users table (FK constraint)
    const { error: userError } = await db
      .from('users')
      .upsert({
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.full_name || user.email?.split("@")[0] || 'User',
        image: user.user_metadata?.avatar_url || null,
      } as any, {
        onConflict: 'id',
        ignoreDuplicates: true,
      });

    if (userError) {
      console.error('[store-create] Failed to upsert user:', userError);
      // Continue anyway - user might already exist
    }

    // Create store
    const { data: response, error: storeError } = await db
      .from('stores')
      .insert({
        name,
        subdomain,
        description: description || null,
        user_id: user.id,
      } as any)
      .select()
      .single();

    if (storeError || !response) {
      throw storeError || new Error('Failed to create store');
    }

    const newStore = response as Database['public']['Tables']['stores']['Row'];

    // Log audit event (fire-and-forget)
    logAuditEvent({
      userId: user.id,
      action: "store.created",
      resource: "store",
      resourceId: newStore.id,
      metadata: { subdomain, name },
    });

    return { success: true, subdomain: newStore.subdomain };
  } catch (error: any) {
    console.error("Store creation error:", error);

    // Log detailed error server-side only
    if (userId) {
      console.error("[store-create] Error details:", {
        code: error.code,
        message: error.message,
        userId,
      });
    }

    // Return user-friendly error messages without exposing internal details
    if (error.code === "23505") {
      return { error: "Subdomain already taken" };
    }

    // Generic error for all other cases (don't expose FK constraints or internal errors)
    return { error: "Failed to create store. Please try again." };
  }
}
