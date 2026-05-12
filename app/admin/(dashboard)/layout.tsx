import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const domain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";
    return redirect(`${protocol}://auth.${domain}/login`);
  }

  // Email verification check
  if (!user.email_confirmed_at) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Verify Your Email</h2>
          <p className="text-gray-600 mb-4">
            Please check your email and click the verification link to continue.
          </p>
          <p className="text-sm text-gray-500">
            Email sent to: <strong>{user.email}</strong>
          </p>
        </div>
      </div>
    );
  }

  const { data: userStores, error } = await supabase
    .from('stores')
    .select('*')
    .eq('user_id', user.id);

  if (error) {
    console.error('[DASHBOARD LAYOUT] Error fetching stores:', error);
  }

  if (!userStores || userStores.length === 0) {
    redirect("/onboarding");
  }

  return <>{children}</>;
}
