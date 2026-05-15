"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useQueryLoading } from './use-query-loading';

// Query keys
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (storeId: string, filters?: Record<string, unknown>) => 
    [...productKeys.lists(), storeId, filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
};

// Types
export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  sku: string | null;
  is_active: boolean;
  status?: string;
  quantity?: number;
  store_id: string;
  created_at: string;
  updated_at: string;
}

// Fetch products for a store
async function fetchProducts(storeId: string): Promise<{ items: Product[]; pagination: any }> {
  const res = await fetch(`/api/stores/${storeId}/products`);
  if (!res.ok) throw new Error('Failed to fetch products');
  const data = await res.json();
  // API returns { items, pagination }
  return data;
}

// Fetch single product
async function fetchProduct(id: string): Promise<Product> {
  const res = await fetch(`/api/products/${id}`);
  if (!res.ok) throw new Error('Failed to fetch product');
  return res.json();
}

// Create product
async function createProductApi(data: { 
  name: string; 
  description?: string;
  price: number;
  image?: string;
  storeId: string;
}): Promise<Product> {
  const res = await fetch(`/api/stores/${data.storeId}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create product');
  return res.json();
}

// Update product
async function updateProductApi(
  id: string, 
  data: Partial<Omit<Product, 'id' | 'storeId' | 'createdAt' | 'updatedAt'>>
): Promise<Product> {
  const res = await fetch(`/api/products/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update product');
  return res.json();
}

// Delete product
async function deleteProductApi(id: string): Promise<void> {
  const res = await fetch(`/api/products/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to delete product');
  }
}

// Bulk delete products
async function bulkDeleteProductsApi(storeId: string, ids: string[]): Promise<{ deleted: number; errors: string[] }> {
  const res = await fetch(`/api/stores/${storeId}/products/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete', ids }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Bulk delete failed');
  }
  return res.json();
}

// Bulk update status
async function bulkUpdateStatusApi(storeId: string, ids: string[], isActive: boolean): Promise<{ updated: number }> {
  const res = await fetch(`/api/stores/${storeId}/products/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update_status', ids, is_active: isActive }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Bulk update failed');
  }
  return res.json();
}

// Hooks
export function useProducts(storeId: string) {
  const query = useQuery({
    queryKey: productKeys.list(storeId),
    queryFn: () => fetchProducts(storeId),
    select: (data) => data.items || [],
    enabled: !!storeId,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
  });
  useQueryLoading(`products-${storeId}`, query.isLoading);
  return query;
}

export function useProduct(id: string) {
  const query = useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => fetchProduct(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
  });
  useQueryLoading(`product-${id}`, query.isLoading);
  return query;
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createProductApi,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: productKeys.list(variables.storeId) 
      });
    },
  });
}

export function useUpdateProduct(storeId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Product>) => 
      updateProductApi(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: productKeys.list(storeId) });
    },
  });
}

export function useDeleteProduct(storeId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteProductApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.list(storeId) });
    },
  });
}

export function useBulkDeleteProducts(storeId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (ids: string[]) => bulkDeleteProductsApi(storeId, ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.list(storeId) });
    },
  });
}

export function useBulkUpdateStatus(storeId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ ids, isActive }: { ids: string[]; isActive: boolean }) =>
      bulkUpdateStatusApi(storeId, ids, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.list(storeId) });
    },
  });
}
