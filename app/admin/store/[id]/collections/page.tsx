import { Suspense } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { CollectionsTable } from "./collections-client";

export default async function CollectionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: storeId } = await params;

  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="h-96 bg-zinc-50 rounded-xl animate-pulse" />}>
        <CollectionsTable storeId={storeId} />
      </Suspense>
    </ErrorBoundary>
  );
}
