import { unstable_cache } from "next/cache";
import { headers } from "next/headers";
import { getStorePages, getPageBySlug } from "@/lib/queries/pages.server";
import { getLayoutTemplates } from "@/lib/queries/templates.server";
import { resolveStoreCached, parseSubdomain } from "@/lib/queries/store.server";
import { StorefrontHeader } from "@/components/storefront/header";
import { StorefrontFooter } from "@/components/storefront/footer";
import { PuckRenderer } from "@/components/puck/renderer";

// ── Cached nav pages — keyed per store ───────────────────────────────────────
const resolveNavPages = unstable_cache(
  async (storeId: string) => {
    const result = await getStorePages(storeId, false, 10, 0);
    return result.items.map((p: any) => ({
      id: p.id as string,
      title: p.title as string,
      slug: p.slug as string,
    }));
  },
  ["storefront-nav-pages"],
  { revalidate: 300, tags: ["pages"] }
);

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;
  const decodedDomain = decodeURIComponent(domain);
  const subdomain = parseSubdomain(decodedDomain);

  // ── Cached store lookup — keyed per domain ────────────────────────────────
  const store = await resolveStoreCached(subdomain, decodedDomain)();

  // ── Nav pages — cached, limited to 10 ────────────────────────────────────
  const pages = store ? await resolveNavPages(store.id) : [];

  // ── Resolve current page ID for display conditions ────────────────────────
  let currentPageId: string | null = null;
  if (store) {
    try {
      const headersList = await headers();
      const pathname =
        headersList.get("x-pathname") ||
        headersList.get("x-forwarded-uri") ||
        "";
      const slug = pathname.replace(/^\//, "").split("?")[0];
      if (slug) {
        const page = await getPageBySlug(store.id, slug);
        if (page) currentPageId = page.id;
      }
    } catch {
      // headers() may not be available in all contexts
    }
  }

  // ── Single batched call for header + footer templates ─────────────────────
  const { header: headerTemplate, footer: footerTemplate } = store
    ? await getLayoutTemplates(store.id, currentPageId)
    : { header: null, footer: null };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {headerTemplate ? (
        <PuckRenderer
          data={headerTemplate.content as Parameters<typeof PuckRenderer>[0]["data"]}
          layoutId="default"
        />
      ) : (
        <StorefrontHeader
          storeName={store?.name || "Store"}
          logo={store?.logo}
          pages={pages}
          subdomain={store?.subdomain || ""}
        />
      )}

      <main className="flex-1">{children}</main>

      {footerTemplate ? (
        <PuckRenderer
          data={footerTemplate.content as Parameters<typeof PuckRenderer>[0]["data"]}
          layoutId="default"
        />
      ) : (
        <StorefrontFooter
          storeName={store?.name || "Store"}
          logo={store?.logo}
          description={store?.description}
          pages={pages}
        />
      )}
    </div>
  );
}
