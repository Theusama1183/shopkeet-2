"use client";

import { useLoadingStore } from "@/lib/stores";
import Loader from "@/components/ui/loader";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

interface LoadingProviderProps {
  children: React.ReactNode;
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const isLoading = useLoadingStore((state) => state.isLoading);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only showing loader after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {children}
      {mounted && (
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-100 bg-white/95 backdrop-blur-sm flex items-center justify-center"
            >
              <Loader />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </>
  );
}

// Hook to manually control loading for specific operations
export function useGlobalLoading() {
  const { startLoading, stopLoading, isLoading, loadingKeys } = useLoadingStore();
  
  return {
    startLoading,
    stopLoading,
    isLoading,
    activeKeys: loadingKeys,
  };
}
