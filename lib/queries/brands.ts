"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useQueryLoading } from './use-query-loading';

// Query keys
export const brandKeys = {
  all: ['brands'] as const,
  lists: () => [...brandKeys.all, 'list'] as const,
  list: (storeId: string, filters?: Record<string, unknown>) => 
    [...brandKeys.lists(), storeId, filters] as const,
  details: () => [...brandKeys.all, 'detail'] as const,
  detail: (id: string) => [...brandKeys.details(), id] as const,
};

// Types
export interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  website: string | null;
  is_active: boolean;
  store_id: string;
  created_at: string;
  updated_at: string;
}

interface CreateBrandData {
  name: string;
  slug: string;
  description?: string;
  logo?: string;
}

interface UpdateBrandData {
  name?: string;
  slug?: string;
  description?: string;
  logo?: string;
}

// API functions
async function fetchBrands(storeId: string): Promise<Brand[]> {
  const res = await fetch(`/api/stores/${storeId}/brands`);
  if (!res.ok) throw new Error('Failed to fetch brands');
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function fetchBrand(storeId: string, brandId: string): Promise<Brand> {
  const res = await fetch(`/api/stores/${storeId}/brands/${brandId}`);
  if (!res.ok) throw new Error('Failed to fetch brand');
  return res.json();
}

async function createBrandApi(
  storeId: string,
  data: CreateBrandData
): Promise<Brand> {
  const res = await fetch(`/api/stores/${storeId}/brands`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create brand');
  }
  return res.json();
}

async function updateBrandApi(
  storeId: string,
  brandId: string,
  data: UpdateBrandData
): Promise<Brand> {
  const res = await fetch(`/api/stores/${storeId}/brands/${brandId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update brand');
  }
  return res.json();
}

async function deleteBrandApi(storeId: string, brandId: string): Promise<void> {
  const res = await fetch(`/api/stores/${storeId}/brands/${brandId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete brand');
  }
}

// Hooks
export function useBrands(storeId: string) {
  const query = useQuery({
    queryKey: brandKeys.list(storeId),
    queryFn: () => fetchBrands(storeId),
    enabled: !!storeId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
  useQueryLoading(`brands-${storeId}`, query.isLoading);
  return query;
}

export function useBrand(storeId: string, brandId: string) {
  const query = useQuery({
    queryKey: brandKeys.detail(brandId),
    queryFn: () => fetchBrand(storeId, brandId),
    enabled: !!storeId && !!brandId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
  useQueryLoading(`brand-${brandId}`, query.isLoading);
  return query;
}

export function useCreateBrand(storeId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateBrandData) => createBrandApi(storeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandKeys.list(storeId) });
    },
  });
}

export function useUpdateBrand(storeId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ brandId, ...data }: { brandId: string } & UpdateBrandData) => 
      updateBrandApi(storeId, brandId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: brandKeys.detail(variables.brandId) });
      queryClient.invalidateQueries({ queryKey: brandKeys.list(storeId) });
    },
  });
}

export function useDeleteBrand(storeId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (brandId: string) => deleteBrandApi(storeId, brandId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandKeys.list(storeId) });
    },
  });
}
