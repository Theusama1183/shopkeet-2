"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const warehouseKeys = {
  all: ["warehouses"] as const,
  list: (storeId: string) => [...warehouseKeys.all, "list", storeId] as const,
  detail: (id: string) => [...warehouseKeys.all, "detail", id] as const,
};

export const supplierKeys = {
  all: ["suppliers"] as const,
  list: (storeId: string) => [...supplierKeys.all, "list", storeId] as const,
  detail: (id: string) => [...supplierKeys.all, "detail", id] as const,
};

export const transferKeys = {
  all: ["transfers"] as const,
  list: (storeId: string) => [...transferKeys.all, "list", storeId] as const,
  detail: (id: string) => [...transferKeys.all, "detail", id] as const,
};

export const saleKeys = {
  all: ["sales"] as const,
  list: (storeId: string) => [...saleKeys.all, "list", storeId] as const,
};

// ─── Fetch Functions ─────────────────────────────────────────────────────────

async function fetchWarehouses(storeId: string) {
  const res = await fetch(`/api/stores/${storeId}/warehouses`);
  if (!res.ok) throw new Error("Failed to fetch warehouses");
  return res.json();
}

async function fetchSuppliers(storeId: string) {
  const res = await fetch(`/api/stores/${storeId}/suppliers`);
  if (!res.ok) throw new Error("Failed to fetch suppliers");
  return res.json();
}

async function fetchTransfers(storeId: string) {
  const res = await fetch(`/api/stores/${storeId}/transfers`);
  if (!res.ok) throw new Error("Failed to fetch transfers");
  return res.json();
}

async function fetchSales(storeId: string) {
  const res = await fetch(`/api/stores/${storeId}/sales`);
  if (!res.ok) throw new Error("Failed to fetch sales");
  return res.json();
}

// ─── Warehouse Hooks ─────────────────────────────────────────────────────────

export function useWarehouses(storeId: string) {
  return useQuery({
    queryKey: warehouseKeys.list(storeId),
    queryFn: () => fetchWarehouses(storeId),
    enabled: !!storeId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateWarehouse(storeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; address?: string; city?: string; country?: string; isDefault?: boolean }) =>
      fetch(`/api/stores/${storeId}/warehouses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to create warehouse");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.list(storeId) });
    },
  });
}

export function useUpdateWarehouse(storeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ warehouseId, ...data }: { warehouseId: string; name?: string; address?: string; city?: string; country?: string; isDefault?: boolean }) =>
      fetch(`/api/stores/${storeId}/warehouses/${warehouseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to update warehouse");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.list(storeId) });
    },
  });
}

export function useDeleteWarehouse(storeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (warehouseId: string) =>
      fetch(`/api/stores/${storeId}/warehouses/${warehouseId}`, { method: "DELETE" }).then((r) => {
        if (!r.ok) throw new Error("Failed to delete warehouse");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.list(storeId) });
    },
  });
}

// ─── Supplier Hooks ──────────────────────────────────────────────────────────

export function useSuppliers(storeId: string) {
  return useQuery({
    queryKey: supplierKeys.list(storeId),
    queryFn: () => fetchSuppliers(storeId),
    enabled: !!storeId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateSupplier(storeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; email?: string; phone?: string; company?: string; address?: string; notes?: string }) =>
      fetch(`/api/stores/${storeId}/suppliers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to create supplier");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.list(storeId) });
    },
  });
}

export function useUpdateSupplier(storeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ supplierId, ...data }: { supplierId: string; name?: string; email?: string; phone?: string; company?: string; address?: string; notes?: string }) =>
      fetch(`/api/stores/${storeId}/suppliers/${supplierId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to update supplier");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.list(storeId) });
    },
  });
}

export function useDeleteSupplier(storeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (supplierId: string) =>
      fetch(`/api/stores/${storeId}/suppliers/${supplierId}`, { method: "DELETE" }).then((r) => {
        if (!r.ok) throw new Error("Failed to delete supplier");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.list(storeId) });
    },
  });
}

// ─── Transfer Hooks ──────────────────────────────────────────────────────────

export function useTransfers(storeId: string) {
  return useQuery({
    queryKey: transferKeys.list(storeId),
    queryFn: () => fetchTransfers(storeId),
    enabled: !!storeId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateTransfer(storeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { fromWarehouseId: string; toWarehouseId: string; notes?: string; items: { productId: string; quantity: number }[] }) =>
      fetch(`/api/stores/${storeId}/transfers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to create transfer");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transferKeys.list(storeId) });
    },
  });
}

export function useUpdateTransferStatus(storeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ transferId, status }: { transferId: string; status: string }) =>
      fetch(`/api/stores/${storeId}/transfers/${transferId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to update transfer status");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transferKeys.list(storeId) });
    },
  });
}

// ─── Sale Hooks ──────────────────────────────────────────────────────────────

export function useSales(storeId: string) {
  return useQuery({
    queryKey: saleKeys.list(storeId),
    queryFn: () => fetchSales(storeId),
    enabled: !!storeId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateSale(storeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { productId: string; quantity: number; unitPrice: number; warehouseId?: string; supplierId?: string; notes?: string; saleDate?: string }) =>
      fetch(`/api/stores/${storeId}/sales`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to record sale");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: saleKeys.list(storeId) });
    },
  });
}
