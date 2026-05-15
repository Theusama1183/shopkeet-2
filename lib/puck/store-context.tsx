"use client";

import { createContext, useContext } from "react";

// Context that makes the current store's ID available to Puck components
// that need to fetch real data (ProductGrid, ProductCarousel, etc.)
// Also used by asyncSearchableSelectField in the Puck editor sidebar.
const StoreContext = createContext<string | null>(null);

export function StoreContextProvider({
  storeId,
  children,
}: {
  storeId: string;
  children: React.ReactNode;
}) {
  return (
    <StoreContext.Provider value={storeId}>{children}</StoreContext.Provider>
  );
}

export function useStoreId(): string | null {
  return useContext(StoreContext);
}

// ── Editor-side store ID ──────────────────────────────────────────────────────
// The Puck editor doesn't wrap content in StoreContextProvider, so we use a
// separate module-level variable set by the editor page before rendering Puck.
// This lets asyncSearchableSelectField know which store to fetch filters for.

let _editorStoreId: string | null = null;

export function setEditorStoreId(storeId: string) {
  _editorStoreId = storeId;
}

export function getEditorStoreId(): string | null {
  return _editorStoreId;
}
