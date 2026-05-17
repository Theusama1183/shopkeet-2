// Client Component — needs "use client" because:
// 1. The Puck config (lib/puck/config.tsx) imports client-only custom fields
//    (colorPickerField, etc.) from lib/puck/fields.tsx which has "use client".
// 2. Puck's Render function needs the full config including render functions
//    that reference client-side React components.
// 3. This component acts as the client boundary — the parent server page
//    fetches data and passes it as a plain serializable prop (Data JSON).
"use client";

import { Render } from "@puckeditor/core";
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
