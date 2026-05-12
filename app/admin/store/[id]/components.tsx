"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DashboardLayout } from "@/components/layout";

interface ClientLayoutWrapperProps {
  children: ReactNode;
  storeId: string;
  storeName: string;
  storeSubdomain: string;
}

export function ClientLayoutWrapper({
  children,
  storeId,
  storeName,
  storeSubdomain,
}: ClientLayoutWrapperProps) {
  const pathname = usePathname();

  const isDesignRoute = pathname.includes("/design/");

  if (isDesignRoute) {
    return <>{children}</>;
  }

  return (
    <DashboardLayout
      storeId={storeId}
      storeName={storeName}
      storeSubdomain={storeSubdomain}
    >
      {children}
    </DashboardLayout>
  );
}
