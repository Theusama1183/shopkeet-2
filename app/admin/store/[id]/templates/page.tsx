import { Suspense } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { TemplatesClient } from "./templates-client";

export default async function TemplatesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: storeId } = await params;

  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="h-96 bg-zinc-50 rounded-xl animate-pulse" />}>
        <TemplatesClient storeId={storeId} />
      </Suspense>
    </ErrorBoundary>
  );
}
