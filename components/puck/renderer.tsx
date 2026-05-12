"use client";

import { Render, type Data } from "@puckeditor/core";
import { getLayoutConfig } from "@/lib/puck/layouts";

// NOTE: We intentionally do NOT import "@puckeditor/core/puck.css" here.
// That stylesheet is the full Puck editor UI — it's only needed in the design
// editor (components/puck/editor.tsx), not on the storefront renderer.

interface PuckRendererProps {
  data: Data;
  layoutId?: string;
}

export function PuckRenderer({ data }: PuckRendererProps) {
  const config = getLayoutConfig();
  return <Render config={config} data={data} />;
}
