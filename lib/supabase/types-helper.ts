/**
 * Supabase Type Helpers
 * 
 * Helper functions to properly type Supabase query results
 * and avoid TypeScript 'never' type errors
 */

import type { Database } from "@/types/supabase";

// Extract table row types
export type Tables = Database['public']['Tables'];
export type Store = Tables['stores']['Row'];
export type Product = Tables['products']['Row'];
export type Page = Tables['pages']['Row'];
export type Template = Tables['templates']['Row'];
export type Popup = Tables['popups']['Row'];
export type User = Tables['users']['Row'];
export type AuditLog = Tables['audit_logs']['Row'];

// Insert types
export type StoreInsert = Tables['stores']['Insert'];
export type ProductInsert = Tables['products']['Insert'];
export type PageInsert = Tables['pages']['Insert'];
export type TemplateInsert = Tables['templates']['Insert'];
export type PopupInsert = Tables['popups']['Insert'];
export type UserInsert = Tables['users']['Insert'];
export type AuditLogInsert = Tables['audit_logs']['Insert'];

// Update types
export type StoreUpdate = Tables['stores']['Update'];
export type ProductUpdate = Tables['products']['Update'];
export type PageUpdate = Tables['pages']['Update'];
export type TemplateUpdate = Tables['templates']['Update'];
export type PopupUpdate = Tables['popups']['Update'];
export type UserUpdate = Tables['users']['Update'];

/**
 * Type guard to check if a value is not null
 */
export function isNotNull<T>(value: T | null): value is T {
  return value !== null;
}

/**
 * Type assertion helper for Supabase query results
 */
export function assertStore(data: unknown): Store {
  return data as Store;
}

export function assertProduct(data: unknown): Product {
  return data as Product;
}

export function assertPage(data: unknown): Page {
  return data as Page;
}

export function assertTemplate(data: unknown): Template {
  return data as Template;
}

export function assertPopup(data: unknown): Popup {
  return data as Popup;
}

/**
 * Type-safe array assertion
 */
export function assertStores(data: unknown): Store[] {
  return (data as Store[]) || [];
}

export function assertProducts(data: unknown): Product[] {
  return (data as Product[]) || [];
}

export function assertPages(data: unknown): Page[] {
  return (data as Page[]) || [];
}

export function assertTemplates(data: unknown): Template[] {
  return (data as Template[]) || [];
}

export function assertPopups(data: unknown): Popup[] {
  return (data as Popup[]) || [];
}
