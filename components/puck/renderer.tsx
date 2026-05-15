// Server Component — no "use client" directive.
// Puck ships a dedicated RSC entry point (@puckeditor/core/rsc) that exports
// a server-safe Render function. This avoids shipping the full ~180KB Puck
// editor bundle to the browser on every storefront page load.

import { Render } from "@puckeditor/core/rsc";
import type { Data } from "@puckeditor/core";
import { getLayoutConfig } from "@/lib/puck/layouts";
import { StoreContextProvider } from "@/lib/puck/store-context";

// NOTE: We intentionally do NOT import "@puckeditor/core/puck.css" here.
// That stylesheet is the full Puck editor UI — it's only needed in the design
// editor (components/puck/editor.tsx), not on the storefront renderer.

interface PuckRendererProps {
  data: Data;
  layoutId?: string;
  /** Pass storeId so ProductGrid/ProductCarousel can fetch real products */
  storeId?: string;
}

export function PuckRenderer({ data, storeId }: PuckRendererProps) {
  const config = getLayoutConfig();
  const rendered = <Render config={config} data={data} />;

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
