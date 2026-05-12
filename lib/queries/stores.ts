"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLoadingStore } from '@/lib/stores';
import { useEffect } from 'react';

// Query keys
export const storeKeys = {
  all: ['stores'] as const,
  lists: () => [...storeKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...storeKeys.lists(), filters] as const,
  details: () => [...storeKeys.all, 'detail'] as const,
  detail: (id: string) => [...storeKeys.details(), id] as const,
};

// Types
interface Store {
  id: string;
  name: string | null;
  subdomain: string | null;
  description: string | null;
  logo: string | null;
  customDomain: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Fetch stores for current user
async function fetchStores(): Promise<Store[]> {
  const res = await fetch('/api/stores');
  if (!res.ok) throw new Error('Failed to fetch stores');
  return res.json();
}

// Fetch single store
async function fetchStore(id: string): Promise<Store> {
  const res = await fetch(`/api/stores/${id}`);
  if (!res.ok) throw new Error('Failed to fetch store');
  return res.json();
}

// Create store
async function createStoreApi(data: { 
  name: string; 
  subdomain: string; 
  description?: string 
}): Promise<Store> {
  const res = await fetch('/api/stores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create store');
  return res.json();
}

// Update store
async function updateStoreApi(
  id: string, 
  data: Partial<Omit<Store, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Store> {
  const res = await fetch(`/api/stores/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update store');
  return res.json();
}

// Delete store
async function deleteStoreApi(id: string): Promise<void> {
  const res = await fetch(`/api/stores/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete store');
}

// Hooks
export function useStores() {
  const { startLoading, stopLoading } = useLoadingStore();
  
  const query = useQuery({
    queryKey: storeKeys.lists(),
    queryFn: fetchStores,
    staleTime: 1000 * 60 * 5, // 5 minutes - stores don't change frequently
    gcTime: 1000 * 60 * 10,   // Keep in cache for 10 minutes
  });
  
  // Integrate with global loading
  useEffect(() => {
    if (query.isLoading) {
      startLoading('stores-list');
    } else {
      stopLoading('stores-list');
    }
    return () => stopLoading('stores-list');
  }, [query.isLoading, startLoading, stopLoading]);
  
  return query;
}

export function useStore(id: string) {
  const { startLoading, stopLoading } = useLoadingStore();
  
  const query = useQuery({
    queryKey: storeKeys.detail(id),
    queryFn: () => fetchStore(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes - store details don't change frequently
    gcTime: 1000 * 60 * 10,   // Keep in cache for 10 minutes
  });
  
  useEffect(() => {
    if (query.isLoading) {
      startLoading(`store-${id}`);
    } else {
      stopLoading(`store-${id}`);
    }
    return () => stopLoading(`store-${id}`);
  }, [query.isLoading, id, startLoading, stopLoading]);
  
  return query;
}

export function useCreateStore() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createStoreApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storeKeys.lists() });
    },
  });
}

export function useUpdateStore() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Store>) => 
      updateStoreApi(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: storeKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: storeKeys.lists() });
    },
  });
}

export function useDeleteStore() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteStoreApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storeKeys.lists() });
    },
  });
}
