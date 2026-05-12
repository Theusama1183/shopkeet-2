import { create } from 'zustand';

interface LoadingState {
  loadingKeys: Set<string>;
  isLoading: boolean;
  
  // Actions
  startLoading: (key: string) => void;
  stopLoading: (key: string) => void;
  isKeyLoading: (key: string) => boolean;
}

// Cleanup timeout tracking
const cleanupTimeouts = new Map<string, NodeJS.Timeout>();

export const useLoadingStore = create<LoadingState>((set, get) => ({
  loadingKeys: new Set<string>(),
  isLoading: false,
  
  startLoading: (key: string) => {
    set((state) => {
      const newKeys = new Set(state.loadingKeys);
      newKeys.add(key);
      
      // Auto-cleanup after 30 seconds to prevent memory leaks
      const existingTimeout = cleanupTimeouts.get(key);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }
      
      const timeout = setTimeout(() => {
        get().stopLoading(key);
        cleanupTimeouts.delete(key);
      }, 30000);
      
      cleanupTimeouts.set(key, timeout);
      
      return { 
        loadingKeys: newKeys, 
        isLoading: true 
      };
    });
  },
  
  stopLoading: (key: string) => {
    // Clear cleanup timeout if exists
    const timeout = cleanupTimeouts.get(key);
    if (timeout) {
      clearTimeout(timeout);
      cleanupTimeouts.delete(key);
    }
    
    set((state) => {
      const newKeys = new Set(state.loadingKeys);
      newKeys.delete(key);
      return { 
        loadingKeys: newKeys, 
        isLoading: newKeys.size > 0 
      };
    });
  },
  
  isKeyLoading: (key: string) => {
    return get().loadingKeys.has(key);
  },
}));

// Hook for using loading state with automatic cleanup
export function useLoading(key: string) {
  const { startLoading, stopLoading, isKeyLoading } = useLoadingStore();
  
  return {
    start: () => startLoading(key),
    stop: () => stopLoading(key),
    isLoading: isKeyLoading(key),
  };
}
