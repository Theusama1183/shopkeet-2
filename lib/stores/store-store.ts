"use client";

import { create } from 'zustand';

interface Store {
  id: string;
  name: string | null;
  subdomain: string | null;
  description: string | null;
  logo: string | null;
  customDomain: string | null;
}

interface StoreState {
  currentStore: Store | null;
  stores: Store[];
  
  // Actions
  setCurrentStore: (store: Store | null) => void;
  setStores: (stores: Store[]) => void;
  updateStore: (id: string, updates: Partial<Store>) => void;
  addStore: (store: Store) => void;
  removeStore: (id: string) => void;
}

export const useStoreStore = create<StoreState>((set) => ({
  currentStore: null,
  stores: [],
  
  setCurrentStore: (store) => set({ currentStore: store }),
  
  setStores: (stores) => set({ stores }),
  
  updateStore: (id, updates) => set((state) => ({
    stores: state.stores.map((s) => 
      s.id === id ? { ...s, ...updates } : s
    ),
    currentStore: state.currentStore?.id === id 
      ? { ...state.currentStore, ...updates } 
      : state.currentStore,
  })),
  
  addStore: (store) => set((state) => ({
    stores: [...state.stores, store],
  })),
  
  removeStore: (id) => set((state) => ({
    stores: state.stores.filter((s) => s.id !== id),
    currentStore: state.currentStore?.id === id ? null : state.currentStore,
  })),
}));
