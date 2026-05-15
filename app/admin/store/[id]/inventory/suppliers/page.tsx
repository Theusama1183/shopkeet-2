import { Suspense } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { SuppliersClient } from "./suppliers-client";

export default async function SuppliersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: storeId } = await params;

  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="h-96 bg-zinc-50 rounded-xl animate-pulse" />}>
        <SuppliersClient storeId={storeId} />
      </Suspense>
    </ErrorBoundary>
  );
}
