import { unstable_cache } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { getPageBySlug } from "@/lib/queries/pages.server";
import { resolveStoreCached, parseSubdomain } from "@/lib/queries/store.server";
import { PuckRenderer } from "@/components/puck/renderer";
import type { Metadata } from "next";

// ISR: revalidate every 5 minutes
export const revalidate = 300;

// ── Pre-render top stores at build time ───────────────────────────────────────
export async function generateStaticParams() {
  try {
    // Import here to avoid edge-runtime issues with the module at build time
    const { getAnonDatabase } = await import("@/lib/supabase/database");
    const db = getAnonDatabase();
    const { data: topStores } = await db
      .from("stores")
      .select("subdomain, custom_domain")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(50);

    const params: { domain: string; slug: string }[] = [];
    for (const store of topStores || []) {
      const s = store as { subdomain: string | null; custom_domain: string | null };
      const domain = s.subdomain || s.custom_domain;
      if (domain) params.push({ domain, slug: "home" });
    }
    return params;
  } catch {
    return [];
  }
}

interface PageProps {
  params: Promise<{ domain: string; slug: string }>;
}

// ── Cached page resolver — keyed per store+slug ───────────────────────────────
function resolvePageCached(storeId: string, slug: string) {
  return unstable_cache(
    () => getPageBySlug(storeId, slug),
    [`storefront-page-${storeId}-${slug}`],
    { revalidate: 300, tags: ["pages"] }
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { domain, slug } = await params;
  const decodedDomain = decodeURIComponent(domain);
  const subdomain = parseSubdomain(decodedDomain);

  const store = await resolveStoreCached(subdomain, decodedDomain)();
  if (!store) return { title: "Page Not Found" };

  const page = await resolvePageCached(store.id, slug)();
  if (!page) return { title: "Page Not Found" };

  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription || `${page.title} - ${store.name}`,
    openGraph: {
      title: page.metaTitle || page.title,
      description: page.metaDescription || `${page.title} - ${store.name}`,
      siteName: store.name ?? undefined,
    },
  };
}

export default async function StorePage({ params }: PageProps) {
  const { domain, slug } = await params;
  const decodedDomain = decodeURIComponent(domain);
  const subdomain = parseSubdomain(decodedDomain);

  const store = await resolveStoreCached(subdomain, decodedDomain)();
  if (!store) notFound();

  const page = await resolvePageCached(store.id, slug)();
  if (!page) notFound();

  // If this page is the home page, redirect to / to avoid duplicate URLs
  if (page.isHome) redirect("/");

  return (
    <div className="min-h-screen">
      <PuckRenderer data={page.content} layoutId={page.layoutId ?? undefined} storeId={store.id} />
    </div>
  );
}
