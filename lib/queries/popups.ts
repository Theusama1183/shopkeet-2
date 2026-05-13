"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useQueryLoading } from './use-query-loading';

// Query keys
export const popupKeys = {
  all: ['popups'] as const,
  lists: () => [...popupKeys.all, 'list'] as const,
  list: (storeId: string, filters?: Record<string, unknown>) => 
    [...popupKeys.lists(), storeId, filters] as const,
  details: () => [...popupKeys.all, 'detail'] as const,
  detail: (id: string) => [...popupKeys.details(), id] as const,
};

// Types
interface Popup {
  id: string;
  name: string;
  content: any; // JSON content
  trigger: any; // JSON trigger config
  conditions: any; // JSON conditions
  isActive: boolean;
  storeId: string;
  createdAt: string;
  updatedAt: string;
}

interface CreatePopupData {
  name: string;
  content?: any;
  trigger?: any;
  conditions?: any;
  isActive?: boolean;
}

interface UpdatePopupData {
  name?: string;
  content?: any;
  trigger?: any;
  conditions?: any;
  isActive?: boolean;
}

// API functions
async function fetchPopups(storeId: string): Promise<Popup[]> {
  const res = await fetch(`/api/stores/${storeId}/popups`);
  if (!res.ok) throw new Error('Failed to fetch popups');
  return res.json();
}

async function fetchPopup(storeId: string, popupId: string): Promise<Popup> {
  const res = await fetch(`/api/stores/${storeId}/popups/${popupId}`);
  if (!res.ok) throw new Error('Failed to fetch popup');
  return res.json();
}

async function createPopupApi(
  storeId: string,
  data: CreatePopupData
): Promise<Popup> {
  const res = await fetch(`/api/stores/${storeId}/popups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create popup');
  }
  return res.json();
}

async function updatePopupApi(
  storeId: string,
  popupId: string,
  data: UpdatePopupData
): Promise<Popup> {
  const res = await fetch(`/api/stores/${storeId}/popups/${popupId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update popup');
  }
  return res.json();
}

async function deletePopupApi(storeId: string, popupId: string): Promise<void> {
  const res = await fetch(`/api/stores/${storeId}/popups/${popupId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete popup');
  }
}

async function togglePopupApi(
  storeId: string,
  popupId: string,
  isActive: boolean
): Promise<Popup> {
  const res = await fetch(`/api/stores/${storeId}/popups/${popupId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isActive }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to toggle popup');
  }
  return res.json();
}

// Hooks
export function usePopups(storeId: string) {
  const query = useQuery({
    queryKey: popupKeys.list(storeId),
    queryFn: () => fetchPopups(storeId),
    enabled: !!storeId,
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 10,
  });
  useQueryLoading(`popups-${storeId}`, query.isLoading);
  return query;
}

export function usePopup(storeId: string, popupId: string) {
  const query = useQuery({
    queryKey: popupKeys.detail(popupId),
    queryFn: () => fetchPopup(storeId, popupId),
    enabled: !!storeId && !!popupId,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });
  useQueryLoading(`popup-${popupId}`, query.isLoading);
  return query;
}

export function useCreatePopup(storeId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreatePopupData) => createPopupApi(storeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: popupKeys.list(storeId) });
    },
  });
}

export function useUpdatePopup(storeId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ popupId, ...data }: { popupId: string } & UpdatePopupData) => 
      updatePopupApi(storeId, popupId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: popupKeys.detail(variables.popupId) });
      queryClient.invalidateQueries({ queryKey: popupKeys.list(storeId) });
    },
  });
}

export function useDeletePopup(storeId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (popupId: string) => deletePopupApi(storeId, popupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: popupKeys.list(storeId) });
    },
  });
}

export function useTogglePopup(storeId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ popupId, isActive }: { popupId: string; isActive: boolean }) => 
      togglePopupApi(storeId, popupId, isActive),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: popupKeys.detail(variables.popupId) });
      queryClient.invalidateQueries({ queryKey: popupKeys.list(storeId) });
    },
  });
}
