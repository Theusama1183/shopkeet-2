import { Suspense } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { SalesClient } from "./sales-client";

export default async function SalesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: storeId } = await params;

  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="h-96 bg-zinc-50 rounded-xl animate-pulse" />}>
        <SalesClient storeId={storeId} />
      </Suspense>
    </ErrorBoundary>
  );
}
