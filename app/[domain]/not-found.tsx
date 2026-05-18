import { getAnonDatabase } from "@/lib/supabase/database";
import { getActiveTemplate } from "@/lib/queries/templates.server";
import { PuckRenderer } from "@/components/puck/renderer";
import { Store, ArrowLeft } from "lucide-react";
import Link from "next/link";
// This is a server component — it can fetch the not-found template
export default async function StoreNotFound({
  params,
}: {
  params?: Promise<{ domain: string }>;
}) {
  let notFoundTemplate = null;

  if (params) {
    try {
      const { domain } = await params;
      const decodedDomain = decodeURIComponent(domain);
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
      const isSubdomain = rootDomain ? decodedDomain.endsWith(`.${rootDomain}`) : false;
      const subdomain = isSubdomain ? decodedDomain.replace(`.${rootDomain}`, "") : null;

      // Use Supabase client instead of Drizzle
      const db = getAnonDatabase();
      let query = db.from('stores').select('*');
      
      if (subdomain) {
        query = query.or(`subdomain.eq.${subdomain},custom_domain.eq.${decodedDomain}`);
      } else {
        query = query.eq('custom_domain', decodedDomain);
      }
      
      const { data: store } = await query.single();

      if (store) {
        notFoundTemplate = await getActiveTemplate((store as any).id, "not-found", null);
      }
    } catch {
      // Ignore — fall back to default
    }
  }

  // Use custom not-found template if available
  if (notFoundTemplate) {
    return (
      <PuckRenderer
        data={notFoundTemplate.content as Parameters<typeof PuckRenderer>[0]["data"]}
        layoutId="default"
      />
    );
  }

  // Default 404 page
  return (
    <div className="fixed inset-0 z-50 bg-zinc-50 flex flex-col items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(#e4e4e7_1px,transparent_1px)] bg-size-[16px_16px] opacity-50" />
      <div className="relative z-10 text-center space-y-6 px-4">
        <div className="w-24 h-24 mx-auto bg-zinc-200 rounded-full flex items-center justify-center">
          <Store className="w-12 h-12 text-zinc-400" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-zinc-900 mb-2">Page Not Found</h1>
          <p className="text-zinc-500 text-lg max-w-md mx-auto">
            The page you&apos;re looking for doesn&apos;t exist or may have been removed.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </Link>
      </div>
    </div>
  );
}