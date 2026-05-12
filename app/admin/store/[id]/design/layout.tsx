import { ReactNode } from "react";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoadingProvider } from "@/components/providers";

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
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const domain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";
    return redirect(`${protocol}://auth.${domain}/login`);
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
