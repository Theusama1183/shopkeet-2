"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useQueryLoading } from './use-query-loading';

// Query keys
export const collectionKeys = {
  all: ['collections'] as const,
  lists: () => [...collectionKeys.all, 'list'] as const,
  list: (storeId: string, filters?: Record<string, unknown>) => 
    [...collectionKeys.lists(), storeId, filters] as const,
  details: () => [...collectionKeys.all, 'detail'] as const,
  detail: (id: string) => [...collectionKeys.details(), id] as const,
};

// Types
export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  is_active: boolean;
  store_id: string;
  created_at: string;
  updated_at: string;
}

interface CreateCollectionData {
  name: string;
  slug: string;
  description?: string;
}

interface UpdateCollectionData {
  name?: string;
  slug?: string;
  description?: string;
}

// API functions
async function fetchCollections(storeId: string): Promise<Collection[]> {
  const res = await fetch(`/api/stores/${storeId}/collections`);
  if (!res.ok) throw new Error('Failed to fetch collections');
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function fetchCollection(storeId: string, collectionId: string): Promise<Collection> {
  const res = await fetch(`/api/stores/${storeId}/collections/${collectionId}`);
  if (!res.ok) throw new Error('Failed to fetch collection');
  return res.json();
}

async function createCollectionApi(
  storeId: string,
  data: CreateCollectionData
): Promise<Collection> {
  const res = await fetch(`/api/stores/${storeId}/collections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create collection');
  }
  return res.json();
}

async function updateCollectionApi(
  storeId: string,
  collectionId: string,
  data: UpdateCollectionData
): Promise<Collection> {
  const res = await fetch(`/api/stores/${storeId}/collections/${collectionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update collection');
  }
  return res.json();
}

async function deleteCollectionApi(storeId: string, collectionId: string): Promise<void> {
  const res = await fetch(`/api/stores/${storeId}/collections/${collectionId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete collection');
  }
}

// Hooks
export function useCollections(storeId: string) {
  const query = useQuery({
    queryKey: collectionKeys.list(storeId),
    queryFn: () => fetchCollections(storeId),
    enabled: !!storeId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
  useQueryLoading(`collections-${storeId}`, query.isLoading);
  return query;
}

export function useCollection(storeId: string, collectionId: string) {
  const query = useQuery({
    queryKey: collectionKeys.detail(collectionId),
    queryFn: () => fetchCollection(storeId, collectionId),
    enabled: !!storeId && !!collectionId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
  useQueryLoading(`collection-${collectionId}`, query.isLoading);
  return query;
}

export function useCreateCollection(storeId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateCollectionData) => createCollectionApi(storeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.list(storeId) });
    },
  });
}

export function useUpdateCollection(storeId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ collectionId, ...data }: { collectionId: string } & UpdateCollectionData) => 
      updateCollectionApi(storeId, collectionId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.detail(variables.collectionId) });
      queryClient.invalidateQueries({ queryKey: collectionKeys.list(storeId) });
    },
  });
}

export function useDeleteCollection(storeId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (collectionId: string) => deleteCollectionApi(storeId, collectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.list(storeId) });
    },
  });
}
