// Server Component — no "use client" directive.
// Puck ships a dedicated RSC entry point (@puckeditor/core/rsc) that exports
// a server-safe Render function. This avoids shipping the full ~180KB Puck
// editor bundle to the browser on every storefront page load.

import { Render } from "@puckeditor/core/rsc";
import type { Data } from "@puckeditor/core";
import { getLayoutConfig } from "@/lib/puck/layouts";
import { StoreContextProvider } from "@/lib/puck/store-context";
import { ErrorBoundary } from "@/components/error-boundary";

// NOTE: We intentionally do NOT import "@puckeditor/core/puck.css" here.
// That stylesheet is the full Puck editor UI — it's only needed in the design
// editor (components/puck/editor.tsx), not on the storefront renderer.

interface PuckRendererProps {
  data: Data;
  layoutId?: string;
  /** Pass storeId so ProductGrid/ProductCarousel can fetch real products */
  storeId?: string;
}

// Minimal fallback shown when a Puck component crashes on the storefront.
// Keeps the rest of the page intact — only the broken block is replaced.
function PuckFallback() {
  return (
    <div className="py-8 px-6 text-center text-zinc-400 text-sm">
      This section could not be displayed.
    </div>
  );
}

export function PuckRenderer({ data, storeId }: PuckRendererProps) {
  const config = getLayoutConfig();

  // Validate data shape before passing to Render — prevents crash on DB corruption
  if (!data || typeof data !== "object" || !Array.isArray((data as { content?: unknown }).content)) {
    return <PuckFallback />;
  }

  const rendered = (
    <ErrorBoundary fallback={<PuckFallback />}>
      <Render config={config} data={data} />
    </ErrorBoundary>
  );

  // Wrap in StoreContextProvider only when storeId is available (storefront)
  // so product components can fetch real data
  if (storeId) {
    return (
      <StoreContextProvider storeId={storeId}>
        {rendered}
      </StoreContextProvider>
    );
  }

  return rendered;
}
