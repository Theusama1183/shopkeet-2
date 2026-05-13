import { Suspense } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { BrandsTable } from "./brands-client";

export default async function BrandsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: storeId } = await params;

  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="h-96 bg-zinc-50 rounded-xl animate-pulse" />}>
        <BrandsTable storeId={storeId} />
      </Suspense>
    </ErrorBoundary>
  );
}
