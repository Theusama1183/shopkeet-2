"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useQueryLoading } from './use-query-loading';

// Query keys
export const templateKeys = {
  all: ['templates'] as const,
  lists: () => [...templateKeys.all, 'list'] as const,
  list: (storeId: string, filters?: Record<string, unknown>) => 
    [...templateKeys.lists(), storeId, filters] as const,
  details: () => [...templateKeys.all, 'detail'] as const,
  detail: (id: string) => [...templateKeys.details(), id] as const,
};

// Types
interface Template {
  id: string;
  name: string;
  type: string;
  content: any; // JSON content
  isActive: boolean;
  conditions: any; // JSON conditions
  storeId: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateTemplateData {
  name: string;
  type: string;
  content?: any;
  isActive?: boolean;
  conditions?: any;
}

interface UpdateTemplateData {
  name?: string;
  type?: string;
  content?: any;
  isActive?: boolean;
  conditions?: any;
}

// API functions
async function fetchTemplates(storeId: string): Promise<Template[]> {
  const res = await fetch(`/api/stores/${storeId}/templates`);
  if (!res.ok) throw new Error('Failed to fetch templates');
  const data = await res.json();
  
  // Convert snake_case to camelCase
  return Array.isArray(data) ? data.map(convertTemplate) : [];
}

async function fetchTemplate(storeId: string, templateId: string): Promise<Template> {
  const res = await fetch(`/api/stores/${storeId}/templates/${templateId}`);
  if (!res.ok) throw new Error('Failed to fetch template');
  const data = await res.json();
  
  // Convert snake_case to camelCase
  return convertTemplate(data);
}

// Helper function to convert snake_case to camelCase
function convertTemplate(raw: any): Template {
  return {
    id: raw.id,
    name: raw.name,
    type: raw.type,
    content: raw.content,
    isActive: raw.is_active ?? false,
    conditions: raw.conditions,
    storeId: raw.store_id,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

async function createTemplateApi(
  storeId: string, 
  data: CreateTemplateData
): Promise<Template> {
  const res = await fetch(`/api/stores/${storeId}/templates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create template');
  }
  const raw = await res.json();
  return convertTemplate(raw);
}

async function updateTemplateApi(
  storeId: string,
  templateId: string,
  data: UpdateTemplateData
): Promise<Template> {
  const res = await fetch(`/api/stores/${storeId}/templates/${templateId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update template');
  }
  const raw = await res.json();
  return convertTemplate(raw);
}

async function deleteTemplateApi(storeId: string, templateId: string): Promise<void> {
  const res = await fetch(`/api/stores/${storeId}/templates/${templateId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete template');
  }
}

async function activateTemplateApi(
  storeId: string,
  templateId: string,
  isActive: boolean
): Promise<Template> {
  const res = await fetch(`/api/stores/${storeId}/templates/${templateId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isActive }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to activate template');
  }
  const raw = await res.json();
  return convertTemplate(raw);
}

// Hooks
export function useTemplates(storeId: string) {
  const query = useQuery({
    queryKey: templateKeys.list(storeId),
    queryFn: () => fetchTemplates(storeId),
    enabled: !!storeId,
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 10,
  });
  useQueryLoading(`templates-${storeId}`, query.isLoading);
  return query;
}

export function useTemplate(storeId: string, templateId: string) {
  const query = useQuery({
    queryKey: templateKeys.detail(templateId),
    queryFn: () => fetchTemplate(storeId, templateId),
    enabled: !!storeId && !!templateId,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });
  useQueryLoading(`template-${templateId}`, query.isLoading);
  return query;
}

export function useCreateTemplate(storeId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateTemplateData) => createTemplateApi(storeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.list(storeId) });
    },
  });
}

export function useUpdateTemplate(storeId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ templateId, ...data }: { templateId: string } & UpdateTemplateData) => 
      updateTemplateApi(storeId, templateId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.detail(variables.templateId) });
      queryClient.invalidateQueries({ queryKey: templateKeys.list(storeId) });
    },
  });
}

export function useDeleteTemplate(storeId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (templateId: string) => deleteTemplateApi(storeId, templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.list(storeId) });
    },
  });
}

export function useActivateTemplate(storeId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ templateId, isActive }: { templateId: string; isActive: boolean }) => 
      activateTemplateApi(storeId, templateId, isActive),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.detail(variables.templateId) });
      queryClient.invalidateQueries({ queryKey: templateKeys.list(storeId) });
    },
  });
}
