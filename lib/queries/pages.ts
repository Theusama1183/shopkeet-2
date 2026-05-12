"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLoadingStore } from '@/lib/stores';
import { useEffect } from 'react';

// Query keys
export const pageKeys = {
  all: ['pages'] as const,
  lists: () => [...pageKeys.all, 'list'] as const,
  list: (storeId: string, filters?: Record<string, unknown>) => 
    [...pageKeys.lists(), storeId, filters] as const,
  details: () => [...pageKeys.all, 'detail'] as const,
  detail: (id: string) => [...pageKeys.details(), id] as const,
};

// Types
export interface Page {
  id: string;
  title: string;
  slug: string;
  content: any; // JSON content from Puck
  layout_id: string | null;
  is_home: boolean;
  meta_title: string | null;
  meta_description: string | null;
  store_id: string;
  is_published: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

interface CreatePageData {
  title: string;
  slug: string;
  content?: any;
  layoutId?: string;
  isHome?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  isPublished?: boolean;
}

interface UpdatePageData {
  title?: string;
  slug?: string;
  content?: any;
  layoutId?: string;
  isHome?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  isPublished?: boolean;
}

// API functions
async function fetchPages(storeId: string): Promise<{ items: Page[]; pagination: any }> {
  const res = await fetch(`/api/stores/${storeId}/pages`);
  if (!res.ok) throw new Error('Failed to fetch pages');
  const data = await res.json();
  // API returns { items, pagination }
  return data;
}

async function fetchPage(storeId: string, pageId: string): Promise<Page> {
  const res = await fetch(`/api/stores/${storeId}/pages/${pageId}`);
  if (!res.ok) throw new Error('Failed to fetch page');
  return res.json();
}

async function createPageApi(storeId: string, data: CreatePageData): Promise<Page> {
  const res = await fetch(`/api/stores/${storeId}/pages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create page');
  }
  return res.json();
}

async function updatePageApi(
  storeId: string, 
  pageId: string, 
  data: UpdatePageData
): Promise<Page> {
  const res = await fetch(`/api/stores/${storeId}/pages/${pageId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update page');
  }
  return res.json();
}

async function deletePageApi(storeId: string, pageId: string): Promise<void> {
  const res = await fetch(`/api/stores/${storeId}/pages/${pageId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete page');
  }
}

// Hooks
export function usePages(storeId: string) {
  const { startLoading, stopLoading } = useLoadingStore();
  
  const query = useQuery({
    queryKey: pageKeys.list(storeId),
    queryFn: () => fetchPages(storeId),
    select: (data) => data.items || [], // Extract items array from response
    enabled: !!storeId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5,    // 5 minutes
  });
  
  useEffect(() => {
    if (query.isLoading) {
      startLoading(`pages-${storeId}`);
    } else {
      stopLoading(`pages-${storeId}`);
    }
    return () => stopLoading(`pages-${storeId}`);
  }, [query.isLoading, storeId, startLoading, stopLoading]);
  
  return query;
}

export function usePage(storeId: string, pageId: string) {
  const { startLoading, stopLoading } = useLoadingStore();
  
  const query = useQuery({
    queryKey: pageKeys.detail(pageId),
    queryFn: () => fetchPage(storeId, pageId),
    enabled: !!storeId && !!pageId,
    staleTime: 1000 * 60 * 1, // 1 minute - pages change frequently during editing
    gcTime: 1000 * 60 * 5,    // 5 minutes
  });
  
  useEffect(() => {
    if (query.isLoading) {
      startLoading(`page-${pageId}`);
    } else {
      stopLoading(`page-${pageId}`);
    }
    return () => stopLoading(`page-${pageId}`);
  }, [query.isLoading, pageId, startLoading, stopLoading]);
  
  return query;
}

export function useCreatePage(storeId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreatePageData) => createPageApi(storeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pageKeys.list(storeId) });
    },
  });
}

export function useUpdatePage(storeId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ pageId, ...data }: { pageId: string } & UpdatePageData) => 
      updatePageApi(storeId, pageId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: pageKeys.detail(variables.pageId) });
      queryClient.invalidateQueries({ queryKey: pageKeys.list(storeId) });
    },
  });
}

export function useDeletePage(storeId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (pageId: string) => deletePageApi(storeId, pageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pageKeys.list(storeId) });
    },
  });
}
