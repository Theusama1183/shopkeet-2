import { Suspense } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { TransfersClient } from "./transfers-client";

export default async function TransfersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: storeId } = await params;

  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="h-96 bg-zinc-50 rounded-xl animate-pulse" />}>
        <TransfersClient storeId={storeId} />
      </Suspense>
    </ErrorBoundary>
  );
}
