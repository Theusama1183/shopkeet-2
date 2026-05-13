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

  // ── Resolve store first (everything else depends on it) ───────────────────
  const store = await resolveStoreCached(subdomain, decodedDomain)();

  if (!store) {
    // No store found — render minimal shell so children can show not-found
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  // ── Resolve pathname for display conditions ───────────────────────────────
  let slug = "";
  try {
    const headersList = await headers();
    const pathname =
      headersList.get("x-pathname") ||
      headersList.get("x-forwarded-uri") ||
      "";
    slug = pathname.replace(/^\//, "").split("?")[0];
  } catch {
    // headers() may not be available in all contexts
  }

  // ── Parallel fetch: nav pages + current page + templates ─────────────────
  // All three are independent once we have storeId + slug
  const [pages, currentPage, { header: headerTemplate, footer: footerTemplate }] =
    await Promise.all([
      resolveNavPages(store.id),
      slug ? getPageBySlug(store.id, slug) : Promise.resolve(null),
      getLayoutTemplates(store.id, null),
    ]);

  const currentPageId = currentPage?.id ?? null;
  void currentPageId; // available for future display-condition filtering

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {headerTemplate ? (
        <PuckRenderer
          data={headerTemplate.content as Parameters<typeof PuckRenderer>[0]["data"]}
          layoutId="default"
        />
      ) : (
        <StorefrontHeader
          storeName={store.name || "Store"}
          logo={store.logo}
          pages={pages}
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
          storeName={store.name || "Store"}
          logo={store.logo}
          description={store.description}
          pages={pages}
        />
      )}
    </div>
  );
}
