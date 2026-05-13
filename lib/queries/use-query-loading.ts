"use client";

import { useEffect } from "react";
import { useLoadingStore } from "@/lib/stores";

/**
 * Integrates a React Query loading state with the global Zustand loading store.
 * Replaces the repeated useEffect pattern in every query hook.
 *
 * @param key   - Unique loading key (e.g. `products-${storeId}`)
 * @param isLoading - The `isLoading` boolean from useQuery
 */
export function useQueryLoading(key: string, isLoading: boolean): void {
  const { startLoading, stopLoading } = useLoadingStore();

  useEffect(() => {
    if (isLoading) {
      startLoading(key);
    } else {
      stopLoading(key);
    }
    return () => stopLoading(key);
  }, [isLoading, key, startLoading, stopLoading]);
}
