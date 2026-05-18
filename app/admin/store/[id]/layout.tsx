import { ReactNode } from "react";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoadingProvider, QueryProvider } from "@/components/providers";
import { ClientLayoutWrapper } from "./components";

// Calls createClient() which reads cookies — must be dynamic
export const dynamic = "force-dynamic";

// UUID v4 regex — validates the store ID before hitting the DB
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function AdminRootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // ── Guard: reject malformed IDs immediately (prevents corrupt DB queries) ──
  if (!UUID_REGEX.test(id)) {
    return notFound();
  }

  // ── Authentication ────────────────────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const domain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";
    return redirect(`${protocol}://auth.${domain}/login`);
  }

  // ── Authorization: user must own this store ───────────────────────────────
  // Use Supabase client (enforces RLS) instead of Drizzle
  const { data: store, error } = await supabase
    .from('stores')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (error || !store) {
    return notFound();
  }

  return (
    <QueryProvider>
      <LoadingProvider>
        <ClientLayoutWrapper
          storeId={store.id}
          storeName={store.name}
          storeSubdomain={store.subdomain}
        >
          {children}
        </ClientLayoutWrapper>
      </LoadingProvider>
    </QueryProvider>
  );
}
