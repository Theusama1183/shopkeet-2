import { Suspense } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { CategoriesTable } from "./categories-client";

export default async function CategoriesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: storeId } = await params;

  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="h-96 bg-zinc-50 rounded-xl animate-pulse" />}>
        <CategoriesTable storeId={storeId} />
      </Suspense>
    </ErrorBoundary>
  );
}
