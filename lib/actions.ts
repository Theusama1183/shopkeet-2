"use server";

import { createClient } from "@/lib/supabase/server";
import { getAnonDatabase } from "@/lib/supabase/database";
import { validateStoreInput, validateSubdomain } from "@/lib/validations/store";
import { checkStoreCreationRateLimit } from "@/lib/auth/rate-limit";
import { createStoreCore } from "@/lib/stores/service";

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

    // Use central service
    const newStore = await createStoreCore({
      userId: user.id,
      userEmail: user.email!,
      userName: user.user_metadata?.full_name,
      userImage: user.user_metadata?.avatar_url,
      name,
      subdomain,
      description
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
