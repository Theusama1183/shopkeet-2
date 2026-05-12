
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Supabase environment variables are not set");
  }

  // Safe cookie domain configuration with fallback
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';
  const domainPart = rootDomain.split(":")[0];
  const cookieDomain = domainPart.includes("localhost") 
    ? "localhost" 
    : `.${domainPart}`;

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookieOptions: {
        domain: cookieDomain,
        path: "/",
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      },
    }
  );
}
