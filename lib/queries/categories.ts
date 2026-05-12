"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLoadingStore } from '@/lib/stores';
import { useEffect } from 'react';

// Query keys
export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: (storeId: string, filters?: Record<string, unknown>) => 
    [...categoryKeys.lists(), storeId, filters] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
};

// Types
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parent_id: string | null;
  is_active: boolean;
  store_id: string;
  created_at: string;
  updated_at: string;
}

interface CreateCategoryData {
  name: string;
  slug: string;
  description?: string;
}

interface UpdateCategoryData {
  name?: string;
  slug?: string;
  description?: string;
}

// API functions
async function fetchCategories(storeId: string): Promise<Category[]> {
  const res = await fetch(`/api/stores/${storeId}/categories`);
  if (!res.ok) throw new Error('Failed to fetch categories');
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function fetchCategory(storeId: string, categoryId: string): Promise<Category> {
  const res = await fetch(`/api/stores/${storeId}/categories/${categoryId}`);
  if (!res.ok) throw new Error('Failed to fetch category');
  return res.json();
}

async function createCategoryApi(
  storeId: string,
  data: CreateCategoryData
): Promise<Category> {
  const res = await fetch(`/api/stores/${storeId}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create category');
  }
  return res.json();
}

async function updateCategoryApi(
  storeId: string,
  categoryId: string,
  data: UpdateCategoryData
): Promise<Category> {
  const res = await fetch(`/api/stores/${storeId}/categories/${categoryId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update category');
  }
  return res.json();
}

async function deleteCategoryApi(storeId: string, categoryId: string): Promise<void> {
  const res = await fetch(`/api/stores/${storeId}/categories/${categoryId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete category');
  }
}

// Hooks
export function useCategories(storeId: string) {
  const { startLoading, stopLoading } = useLoadingStore();
  
  const query = useQuery({
    queryKey: categoryKeys.list(storeId),
    queryFn: () => fetchCategories(storeId),
    enabled: !!storeId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10,   // 10 minutes
  });
  
  useEffect(() => {
    if (query.isLoading) {
      startLoading(`categories-${storeId}`);
    } else {
      stopLoading(`categories-${storeId}`);
    }
    return () => stopLoading(`categories-${storeId}`);
  }, [query.isLoading, storeId, startLoading, stopLoading]);
  
  return query;
}

export function useCategory(storeId: string, categoryId: string) {
  const { startLoading, stopLoading } = useLoadingStore();
  
  const query = useQuery({
    queryKey: categoryKeys.detail(categoryId),
    queryFn: () => fetchCategory(storeId, categoryId),
    enabled: !!storeId && !!categoryId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10,   // 10 minutes
  });
  
  useEffect(() => {
    if (query.isLoading) {
      startLoading(`category-${categoryId}`);
    } else {
      stopLoading(`category-${categoryId}`);
    }
    return () => stopLoading(`category-${categoryId}`);
  }, [query.isLoading, categoryId, startLoading, stopLoading]);
  
  return query;
}

export function useCreateCategory(storeId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateCategoryData) => createCategoryApi(storeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.list(storeId) });
    },
  });
}

export function useUpdateCategory(storeId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ categoryId, ...data }: { categoryId: string } & UpdateCategoryData) => 
      updateCategoryApi(storeId, categoryId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.detail(variables.categoryId) });
      queryClient.invalidateQueries({ queryKey: categoryKeys.list(storeId) });
    },
  });
}

export function useDeleteCategory(storeId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (categoryId: string) => deleteCategoryApi(storeId, categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.list(storeId) });
    },
  });
}
