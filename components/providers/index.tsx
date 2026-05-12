"use client";

import { QueryProvider } from "@/lib/providers/query-provider";
import { LoadingProvider } from "./loading-provider";
import { type ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

// Combined providers wrapper for the app
export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <LoadingProvider>
        {children}
      </LoadingProvider>
    </QueryProvider>
  );
}

// Export individual providers for granular use
export { QueryProvider } from "@/lib/providers/query-provider";
export { LoadingProvider, useGlobalLoading } from "./loading-provider";
