"use client";

import { useCallback, useRef, useEffect, useState } from "react";
import { Puck, Data, createUsePuck } from "@puckeditor/core";
// CSS imported globally in app/layout.tsx to avoid chunk loading issues
import { getLayoutConfig } from "@/lib/puck/layouts";
import { setEditorStoreId } from "@/lib/puck/store-context";
import { Monitor, Tablet, Smartphone, Sparkles } from "lucide-react";
import { AiGeneratePanel } from "@/components/puck/ai-generate-panel";

interface PuckEditorProps {
  /** Initial data — only used on first mount. Changes to this prop are ignored
   *  to prevent Puck from unmounting/remounting on every parent re-render. */
  data: Data;
  onPublish: (data: Data) => Promise<void>;
  onSave?: (data: Data) => Promise<void>;
  layoutId?: string;
  /** Store ID — used by asyncSearchableSelectField and AI generation */
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

// usePuck hook — used inside the headerActions override to dispatch data updates
const usePuck = createUsePuck();

// ── AI Button — rendered inside Puck's header via overrides.headerActions ─────
// Must be a separate component so it can call usePuck() inside the Puck tree
function AiHeaderButton({ storeId }: { storeId: string }) {
  const [showPanel, setShowPanel] = useState(false);
  const { dispatch } = usePuck((s) => s);

  const handleApply = useCallback(
    (generatedData: Data) => {
      // Replace the entire page content using Puck's internal dispatch
      dispatch({
        type: "setData",
        data: generatedData,
      });
    },
    [dispatch]
  );

  return (
    <>
      <button
        onClick={() => setShowPanel(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors shadow-sm"
        title="Generate page with AI"
      >
        <Sparkles className="w-3.5 h-3.5" />
        AI Generate
      </button>

      {showPanel && (
        <AiGeneratePanel
          storeId={storeId}
          onApply={handleApply}
          onClose={() => setShowPanel(false)}
        />
      )}
    </>
  );
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

  // ── Puck overrides — inject AI button into the header ─────────────────────
  const overrides = useRef({
    headerActions: ({ children }: { children: React.ReactNode }) => (
      <>
        {/* AI Generate button — only shown when storeId is available */}
        {storeId && <AiHeaderButton storeId={storeId} />}
        {/* Default Puck header actions (publish button etc.) */}
        {children}
      </>
    ),
  }).current;

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
        overrides={overrides}
      />
    </div>
  );
}
