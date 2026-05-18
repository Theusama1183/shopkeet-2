import { ReactNode } from "react";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoadingProvider } from "@/components/providers";
import { getLoginUrl } from "@/lib/auth/redirect";

// Calls createClient() which reads cookies — must be dynamic
export const dynamic = "force-dynamic";

export default async function DesignLayout({ 
  children, 
  params 
}: { 
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Authentication check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect(getLoginUrl("/login"));
  }

  // Authorization check: Verify user owns this store using Supabase client
  const { data: store, error } = await supabase
    .from('stores')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (error || !store) {
    console.error('Error fetching store:', error);
    return notFound();
  }

  // Return completely isolated layout without inheriting parent layout
  return (
    <LoadingProvider>
      <div className="design-editor-root">
        {children}
      </div>
    </LoadingProvider>
  );
}
