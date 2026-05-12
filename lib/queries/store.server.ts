/**
 * Shared storefront store resolver with per-domain caching.
 * Used by [domain]/layout.tsx, [domain]/page.tsx, [domain]/[slug]/page.tsx
 */
import { unstable_cache } from "next/cache";
import { getAnonDatabase } from "@/lib/supabase/database";
import { assertStore, type Store } from "@/lib/supabase/types-helper";

/**
 * Resolve a store from a subdomain or custom domain.
 * Cache is keyed per domain so different stores never share an entry.
 */
export function resolveStoreCached(
  subdomain: string | null,
  decodedDomain: string
): () => Promise<Store | null> {
  return unstable_cache(
    async (): Promise<Store | null> => {
      const db = getAnonDatabase();
      if (subdomain) {
        const { data } = await db
          .from("stores")
          .select("*")
          .or(`subdomain.eq.${subdomain},custom_domain.eq.${decodedDomain}`)
          .single();
        return data ? assertStore(data) : null;
      } else {
        const { data } = await db
          .from("stores")
          .select("*")
          .eq("custom_domain", decodedDomain)
          .single();
        return data ? assertStore(data) : null;
      }
    },
    // Key includes the domain so each store gets its own cache slot
    [`storefront-store-${subdomain ?? decodedDomain}`],
    { revalidate: 300, tags: ["stores"] }
  );
}

/** Parse subdomain from a decoded domain string */
export function parseSubdomain(decodedDomain: string): string | null {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  if (!rootDomain) return null;
  return decodedDomain.endsWith(`.${rootDomain}`)
    ? decodedDomain.replace(`.${rootDomain}`, "")
    : null;
}
