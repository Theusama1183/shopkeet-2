import { Suspense } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { ProductsTable } from "./products-client";

export default async function ProductsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: storeId } = await params;

  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="h-96 bg-zinc-50 rounded-xl animate-pulse" />}>
        <ProductsTable storeId={storeId} />
      </Suspense>
    </ErrorBoundary>
  );
}
