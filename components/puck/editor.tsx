"use client";

import { useCallback, useRef, useEffect } from "react";
import { Puck, Data } from "@puckeditor/core";
// CSS imported globally in app/layout.tsx to avoid chunk loading issues
import { getLayoutConfig } from "@/lib/puck/layouts";
import { setEditorStoreId } from "@/lib/puck/store-context";

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
      />
    </div>
  );
}
