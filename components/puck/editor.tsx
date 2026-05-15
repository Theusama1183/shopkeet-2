"use client";

import { useCallback, useRef, useEffect } from "react";
import { Puck, Data } from "@puckeditor/core";
// CSS imported globally in app/layout.tsx to avoid chunk loading issues
import { getLayoutConfig } from "@/lib/puck/layouts";
import { setEditorStoreId } from "@/lib/puck/store-context";
import { Monitor, Tablet, Smartphone } from "lucide-react";

interface PuckEditorProps {
  /** Initial data — only used on first mount. Changes to this prop are ignored
   *  to prevent Puck from unmounting/remounting on every parent re-render. */
  data: Data;
  onPublish: (data: Data) => Promise<void>;
  onSave?: (data: Data) => Promise<void>;
  layoutId?: string;
  /** Store ID — used by asyncSearchableSelectField to fetch filter options */
  storeId?: string;
}

// Viewport presets — shown as breakpoint switcher buttons in the Puck toolbar
const VIEWPORTS = [
  {
    width: 1280,
    height: "auto" as const,
    label: "Desktop",
    icon: <Monitor size={14} />,
  },
  {
    width: 768,
    height: "auto" as const,
    label: "Tablet",
    icon: <Tablet size={14} />,
  },
  {
    width: 390,
    height: "auto" as const,
    label: "Mobile",
    icon: <Smartphone size={14} />,
  },
];

export function PuckEditor({ data, onPublish, onSave, storeId }: PuckEditorProps) {
  // Capture initial data once — never update this ref so Puck never remounts
  const initialData = useRef<Data>(data);

  // Stable config reference — getLayoutConfig() is pure so this is safe
  const config = useRef(getLayoutConfig()).current;

  // Make storeId available to asyncSearchableSelectField in the sidebar
  useEffect(() => {
    if (storeId) setEditorStoreId(storeId);
  }, [storeId]);

  // Stable callbacks — these never change identity so Puck won't re-render
  const handlePublish = useCallback(
    (d: Data) => onPublish(d),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleChange = useCallback(
    (d: Data) => {
      onSave?.(d);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div className="h-screen">
      <Puck
        config={config}
        data={initialData.current}
        onPublish={handlePublish}
        onChange={handleChange}
        headerTitle="Page Editor"
        headerPath="/"
        iframe={{ enabled: true }}
        viewports={VIEWPORTS}
      />
    </div>
  );
}
