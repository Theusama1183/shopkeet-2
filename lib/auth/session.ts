import { createClient } from "@/lib/supabase/server";

/**
 * Require that the user has authenticated recently (within maxAgeMinutes).
 * Uses the JWT `iat` (issued-at) claim — the actual time this token was issued.
 * This is more accurate than `last_sign_in_at` which reflects the last login,
 * not the current session's issue time.
 */
export async function requireRecentSession(maxAgeMinutes: number = 5): Promise<void> {
  const supabase = await createClient();

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("No active session");
  }

  // Get the current session to read the JWT iat claim
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("No active session");
  }

  // Decode the JWT to get the issued-at time
  // The JWT payload is base64url encoded in the second segment
  try {
    const payload = JSON.parse(
      Buffer.from(session.access_token.split('.')[1], 'base64url').toString()
    );
    const issuedAt = payload.iat as number; // Unix timestamp in seconds
    const sessionAgeMs = Date.now() - issuedAt * 1000;
    const maxAgeMs = maxAgeMinutes * 60 * 1000;

    if (sessionAgeMs > maxAgeMs) {
      throw new Error("Session expired - please re-authenticate");
    }
  } catch (e) {
    if (e instanceof Error && e.message === "Session expired - please re-authenticate") {
      throw e;
    }
    // If we can't decode the JWT, require re-auth for security
    throw new Error("Session age cannot be determined - please re-authenticate");
  }
}
