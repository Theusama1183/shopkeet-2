import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getLoginUrl, getAdminStoreUrl } from "@/lib/auth/redirect";

// This page calls Supabase — must never be statically prerendered
export const dynamic = "force-dynamic";

export default async function Overview() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect(getLoginUrl("/login"));
  }

  // Use Supabase client instead of Drizzle
  const { data: userStores, error } = await supabase
    .from('stores')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching stores:', error);
  }

  if (!userStores || userStores.length === 0) {
    return redirect("/onboarding");
  }

  if (userStores.length === 1) {
    return redirect(getAdminStoreUrl(userStores[0].id));
  }

  return (
    <div className="h-screen py-16 px-6 flex flex-col bg-linear-to-br from-violet-600 via-violet-500 to-purple-600 items-center justify-center relative overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div className="text-center">
          <h1 className="text-[48px] text-white font-bold tracking-tight">Select a Workspace</h1>
          <p className="text-white text-xl">You have access to {userStores.length} stores</p>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl divide-y divide-zinc-200 shadow-sm w-112.5">
        {userStores.map((store) => (
          <Link
            href={getAdminStoreUrl(store.id)}
            key={store.id}
            className="flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-white font-bold">
                {store.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-medium text-zinc-900">{store.name}</h3>
                <p className="text-xs text-zinc-400">{store.subdomain}.shopkeet.com</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-medium text-zinc-900">0 orders</p>
                <p className="text-[10px] text-zinc-400">Last 24h</p>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-300" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
