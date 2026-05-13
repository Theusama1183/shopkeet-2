"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useQueryLoading } from './use-query-loading';

// Query keys
export const tagKeys = {
  all: ['tags'] as const,
  lists: () => [...tagKeys.all, 'list'] as const,
  list: (storeId: string, filters?: Record<string, unknown>) => 
    [...tagKeys.lists(), storeId, filters] as const,
  details: () => [...tagKeys.all, 'detail'] as const,
  detail: (id: string) => [...tagKeys.details(), id] as const,
};

// Types
export interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string;
  store_id: string;
  created_at: string;
  updated_at: string;
}

interface CreateTagData {
  name: string;
  slug: string;
  color?: string;
}

interface UpdateTagData {
  name?: string;
  slug?: string;
  color?: string;
}

// API functions
async function fetchTags(storeId: string): Promise<Tag[]> {
  const res = await fetch(`/api/stores/${storeId}/tags`);
  if (!res.ok) throw new Error('Failed to fetch tags');
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function fetchTag(storeId: string, tagId: string): Promise<Tag> {
  const res = await fetch(`/api/stores/${storeId}/tags/${tagId}`);
  if (!res.ok) throw new Error('Failed to fetch tag');
  return res.json();
}

async function createTagApi(
  storeId: string,
  data: CreateTagData
): Promise<Tag> {
  const res = await fetch(`/api/stores/${storeId}/tags`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create tag');
  }
  return res.json();
}

async function updateTagApi(
  storeId: string,
  tagId: string,
  data: UpdateTagData
): Promise<Tag> {
  const res = await fetch(`/api/stores/${storeId}/tags/${tagId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update tag');
  }
  return res.json();
}

async function deleteTagApi(storeId: string, tagId: string): Promise<void> {
  const res = await fetch(`/api/stores/${storeId}/tags/${tagId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete tag');
  }
}

// Hooks
export function useTags(storeId: string) {
  const query = useQuery({
    queryKey: tagKeys.list(storeId),
    queryFn: () => fetchTags(storeId),
    enabled: !!storeId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
  useQueryLoading(`tags-${storeId}`, query.isLoading);
  return query;
}

export function useTag(storeId: string, tagId: string) {
  const query = useQuery({
    queryKey: tagKeys.detail(tagId),
    queryFn: () => fetchTag(storeId, tagId),
    enabled: !!storeId && !!tagId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
  useQueryLoading(`tag-${tagId}`, query.isLoading);
  return query;
}

export function useCreateTag(storeId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateTagData) => createTagApi(storeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagKeys.list(storeId) });
    },
  });
}

export function useUpdateTag(storeId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ tagId, ...data }: { tagId: string } & UpdateTagData) => 
      updateTagApi(storeId, tagId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: tagKeys.detail(variables.tagId) });
      queryClient.invalidateQueries({ queryKey: tagKeys.list(storeId) });
    },
  });
}

export function useDeleteTag(storeId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (tagId: string) => deleteTagApi(storeId, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagKeys.list(storeId) });
    },
  });
}
