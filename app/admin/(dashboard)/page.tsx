import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getLoginUrl } from "@/lib/auth/redirect";

export const dynamic = 'force-dynamic';

export default async function Overview() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect(getLoginUrl("/login"));
  }

  const { data: userStores, error } = await supabase
    .from('stores')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_active', true);

  if (error) {
    console.error('[dashboard] Error fetching stores:', error);
  }

  if (!userStores || userStores.length === 0) {
    return redirect("/onboarding");
  }

  if (userStores.length === 1) {
    return redirect(`/store/${userStores[0].id}`);
  }

  return redirect(`/list`);
}
