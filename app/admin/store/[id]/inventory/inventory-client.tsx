"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Column, FilterField, DataTableProps } from "@/components/ui/data-table";
import {
  Package, ImageIcon, Download, Upload, AlertTriangle, CheckCircle2,
} from "lucide-react";

const DataTable = dynamic(() => import("@/components/ui/data-table").then(m => ({ default: m.DataTable })), {
  loading: () => <div className="h-96 bg-zinc-50 rounded-xl animate-pulse" />,
}) as <T extends object>(props: DataTableProps<T>) => React.ReactElement;

interface InventoryItem {
  id: string;
  product_id: string;
  quantity: number;
  low_stock_threshold: number | null;
  track_inventory: boolean;
  allow_backorder: boolean;
  updated_at: string;
  product: {
    id: string;
    name: string;
    sku: string | null;
    image: string | null;
    price: number;
  } | null;
}

export function InventoryTable({ initialInventory, storeId }: { initialInventory: InventoryItem[]; storeId: string }) {
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);

  const columns: Column<InventoryItem>[] = [
    {
      key: "product",
      label: "Product",
      sortable: true,
      required: true,
      render: (i) => {
        if (!i.product) return <span className="text-sm text-zinc-400">—</span>;
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0 overflow-hidden border border-zinc-200">
              {i.product.image
                ? <img src={i.product.image} alt={i.product.name} className="w-full h-full object-cover" />
                : <ImageIcon className="w-4 h-4 text-zinc-400" />
              }
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900">{i.product.name}</p>
              {i.product.sku && <p className="text-xs text-zinc-400 font-mono">SKU: {i.product.sku}</p>}
            </div>
          </div>
        );
      },
    },
    {
      key: "quantity",
      label: "Stock",
      sortable: true,
      render: (i) => {
        const qty = i.quantity;
        const threshold = i.low_stock_threshold || 5;
        const isLow = qty <= threshold && qty > 0;
        const isOut = qty === 0;
        
        return (
          <div className="flex items-center gap-2">
            {isOut ? (
              <AlertTriangle className="w-4 h-4 text-red-500" />
            ) : isLow ? (
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            )}
            <span className={`text-sm font-medium ${isOut ? "text-red-600" : isLow ? "text-amber-600" : "text-zinc-900"}`}>
              {qty} {qty === 1 ? "unit" : "units"}
            </span>
          </div>
        );
      },
    },
    {
      key: "lowStockThreshold",
      label: "Low Stock Alert",
      render: (i) => (
        <span className="text-sm text-zinc-600">
          {i.low_stock_threshold || 5} units
        </span>
      ),
    },
    {
      key: "trackInventory",
      label: "Tracking",
      render: (i) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
          i.track_inventory
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-zinc-100 text-zinc-600 border-zinc-200"
        }`}>
          {i.track_inventory ? "Enabled" : "Disabled"}
        </span>
      ),
    },
    {
      key: "allowBackorder",
      label: "Backorder",
      render: (i) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
          i.allow_backorder
            ? "bg-blue-50 text-blue-700 border-blue-200"
            : "bg-zinc-100 text-zinc-600 border-zinc-200"
        }`}>
          {i.allow_backorder ? "Allowed" : "Not allowed"}
        </span>
      ),
    },
    {
      key: "updatedAt",
      label: "Last Updated",
      sortable: true,
      render: (i) => {
        if (!i.updated_at) return <span className="text-sm text-zinc-400">—</span>;
        const date = new Date(i.updated_at);
        if (isNaN(date.getTime())) return <span className="text-sm text-zinc-400">—</span>;
        return (
          <span className="text-sm text-zinc-500">
            {date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        );
      },
    },
  ];

  const filters: FilterField[] = [
    {
      key: "quantity",
      label: "Stock Level",
      type: "select",
      options: [
        { label: "Out of stock", value: "0" },
        { label: "Low stock", value: "low" },
        { label: "In stock", value: "in" },
      ],
    },
    {
      key: "trackInventory",
      label: "Tracking",
      type: "select",
      options: [
        { label: "Enabled", value: "true" },
        { label: "Disabled", value: "false" },
      ],
    },
  ];

  // Calculate stats
  const outOfStock = inventory.filter(i => i.quantity === 0).length;
  const lowStock = inventory.filter(i => i.quantity > 0 && i.quantity <= (i.lowStockThreshold || 5)).length;
  const inStock = inventory.filter(i => i.quantity > (i.lowStockThreshold || 5)).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Inventory</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{inventory.length} products tracked</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-zinc-600 border border-zinc-200 rounded-lg bg-white hover:bg-zinc-50 transition-colors">
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-zinc-600 border border-zinc-200 rounded-lg bg-white hover:bg-zinc-50 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">In Stock</span>
          </div>
          <p className="text-2xl font-semibold text-zinc-900">{inStock}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Low Stock</span>
          </div>
          <p className="text-2xl font-semibold text-amber-600">{lowStock}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Out of Stock</span>
          </div>
          <p className="text-2xl font-semibold text-red-600">{outOfStock}</p>
        </div>
      </div>

      {/* Table */}
      <DataTable
        data={inventory}
        columns={columns}
        loading={false}
        filters={filters}
        searchPlaceholder="Search inventory..."
        getRowId={(item) => String((item as InventoryItem).id)}
        emptyState={
          <div className="flex flex-col items-center gap-3 py-12">
            <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-zinc-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-700">No inventory tracked</p>
              <p className="text-xs text-zinc-400 mt-1">Add products to start tracking inventory</p>
            </div>
            <Link href={`/store/${storeId}/products/new`}>
              <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors">
                <Package className="w-4 h-4" />
                Add product
              </button>
            </Link>
          </div>
        }
      />
    </div>
  );
}
