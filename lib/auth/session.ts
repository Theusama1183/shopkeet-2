import { createClient } from "@/lib/supabase/server";

export async function requireRecentSession(maxAgeMinutes: number = 5): Promise<void> {
  const supabase = await createClient();
  
  // Use getUser() instead of getSession() to validate with Supabase servers
  // This prevents token spoofing attacks
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error("No active session");
  }
  
  // Validate session age using user.last_sign_in_at
  const lastSignInAt = user.last_sign_in_at;
  if (!lastSignInAt) {
    // If we can't determine session age, require re-authentication for security
    throw new Error("Session age cannot be determined - please re-authenticate");
  }
  
  const sessionAge = Date.now() - new Date(lastSignInAt).getTime();
  const maxAge = maxAgeMinutes * 60 * 1000;
  
  if (sessionAge > maxAge) {
    throw new Error("Session expired - please re-authenticate");
  }
}
