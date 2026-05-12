import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic';

export default async function Overview() {
  // Note: Layout already checks auth and redirects if no stores
  // This page only handles routing logic for users with stores
  
  console.log('[DASHBOARD PAGE] Rendering at', new Date().toISOString());
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  console.log('[DASHBOARD PAGE] User:', user?.id);
  
  // Safety check (layout should have already handled this)
  if (!user) {
    console.log('[DASHBOARD PAGE] No user found (unexpected), redirecting to login');
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const domain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";
    return redirect(`${protocol}://auth.${domain}/login`);
  }

  // Fetch user's active stores using Supabase client
  const { data: userStores, error } = await supabase
    .from('stores')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true);

  if (error) {
    console.error('[DASHBOARD PAGE] Error fetching stores:', error);
  }

  console.log('[DASHBOARD PAGE] User stores count:', userStores?.length ?? 0);

  // Layout already redirects if no stores, but keep as safety net
  if (!userStores || userStores.length === 0) {
    console.log('[DASHBOARD PAGE] No stores found (unexpected), redirecting to onboarding');
    return redirect("/onboarding");
  }

  // Single store - go directly to it
  if (userStores.length === 1) {
    console.log('[DASHBOARD PAGE] Single store, redirecting to:', userStores[0].id);
    return redirect(`/store/${userStores[0].id}`);
  }

  // Multiple stores - show list
  console.log('[DASHBOARD PAGE] Multiple stores, redirecting to list');
  return redirect(`/list`);
}
