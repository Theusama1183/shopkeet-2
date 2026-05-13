import { Suspense } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { TagsTable } from "./tags-client";

export default async function TagsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: storeId } = await params;

  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="h-96 bg-zinc-50 rounded-xl animate-pulse" />}>
        <TagsTable storeId={storeId} />
      </Suspense>
    </ErrorBoundary>
  );
}
