import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";
import { getHomePage } from "@/lib/queries/pages.server";
import { resolveStoreCached, parseSubdomain } from "@/lib/queries/store.server";
import { PuckRenderer } from "@/components/puck/renderer";

// ISR: revalidate every 5 minutes — pages served from CDN edge
export const revalidate = 300;

// ── Cached home page — keyed per store ───────────────────────────────────────
function resolveHomePageCached(storeId: string) {
  return unstable_cache(
    () => getHomePage(storeId),
    [`storefront-home-page-${storeId}`],
    { revalidate: 300, tags: ["pages"] }
  );
}

export default async function StorefrontPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;
  const decodedDomain = decodeURIComponent(domain);
  const subdomain = parseSubdomain(decodedDomain);

  const store = await resolveStoreCached(subdomain, decodedDomain)();
  if (!store) notFound();

  const homePage = await resolveHomePageCached(store.id)();

  if (homePage) {
    if (homePage.content && typeof homePage.content === "object") {
      return (
        <div className="min-h-screen">
          <PuckRenderer
            data={homePage.content as Parameters<typeof PuckRenderer>[0]["data"]}
            layoutId={homePage.layoutId || "default"}
          />
        </div>
      );
    }
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="p-8 text-center border border-red-300 bg-red-50 rounded-lg">
          <p className="text-red-600 font-semibold">Invalid page content</p>
          <p className="text-sm text-gray-600 mt-2">
            The page content is malformed. Please contact support.
          </p>
        </div>
      </div>
    );
  }

  // No home page set — show default store landing
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">{store.name || domain}</h1>
        <p className="text-gray-600">{store.description || "Welcome to our store"}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg overflow-hidden hover:shadow-lg transition">
            <div className="h-48 bg-gray-200" />
            <div className="p-4">
              <h3 className="font-bold">Product {i}</h3>
              <p className="text-gray-500">$19.99</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
