"use client";

import dynamic from "next/dynamic";
import { Column, DataTableProps } from "@/components/ui/data-table";
import { useSales } from "@/lib/queries/inventory";
import {
  DollarSign, TrendingUp, Package, ImageIcon, Receipt,
} from "lucide-react";

const DataTable = dynamic(() => import("@/components/ui/data-table").then(m => ({ default: m.DataTable })), {
  loading: () => <div className="h-96 bg-zinc-50 rounded-xl animate-pulse" />,
}) as <T extends object>(props: DataTableProps<T>) => React.ReactElement;

interface SaleItem {
  id: string;
  reference_number: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes: string | null;
  sale_date: string;
  created_at: string;
  products: { id: string; name: string; sku: string | null; image: string | null } | null;
  warehouses: { id: string; name: string } | null;
  suppliers: { id: string; name: string; company: string | null } | null;
}

export function SalesClient({ storeId }: { storeId: string }) {
  const { data: sales = [], isLoading } = useSales(storeId);

  // Stats
  const totalRevenue = sales.reduce((sum: number, s: SaleItem) => sum + s.total_price, 0);
  const totalUnits = sales.reduce((sum: number, s: SaleItem) => sum + s.quantity, 0);

  const columns: Column<SaleItem>[] = [
    {
      key: "reference_number",
      label: "Ref #",
      sortable: true,
      required: true,
      render: (s) => (
        <span className="text-sm font-mono font-medium text-zinc-900">{s.reference_number}</span>
      ),
    },
    {
      key: "products",
      label: "Product",
      render: (s) => {
        if (!s.products) return <span className="text-sm text-zinc-400">—</span>;
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0 overflow-hidden border border-zinc-200">
              {s.products.image
                ? <img src={s.products.image} alt={s.products.name} className="w-full h-full object-cover" />
                : <ImageIcon className="w-4 h-4 text-zinc-400" />
              }
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900">{s.products.name}</p>
              {s.products.sku && <p className="text-xs text-zinc-400 font-mono">SKU: {s.products.sku}</p>}
            </div>
          </div>
        );
      },
    },
    {
      key: "quantity",
      label: "Qty",
      sortable: true,
      render: (s) => (
        <span className="text-sm font-medium text-zinc-900">{s.quantity}</span>
      ),
    },
    {
      key: "unit_price",
      label: "Unit Price",
      sortable: true,
      render: (s) => (
        <span className="text-sm text-zinc-600">${(s.unit_price / 100).toFixed(2)}</span>
      ),
    },
    {
      key: "total_price",
      label: "Total",
      sortable: true,
      render: (s) => (
        <span className="text-sm font-semibold text-zinc-900">${(s.total_price / 100).toFixed(2)}</span>
      ),
    },
    {
      key: "warehouses",
      label: "Warehouse",
      render: (s) => (
        <span className="text-sm text-zinc-600">{s.warehouses?.name ?? "—"}</span>
      ),
    },
    {
      key: "sale_date",
      label: "Date",
      sortable: true,
      render: (s) => {
        const date = new Date(s.sale_date);
        return <span className="text-sm text-zinc-500">{date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>;
      },
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Sales</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{sales.length} sale{sales.length !== 1 ? "s" : ""} recorded</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Total Revenue</span>
          </div>
          <p className="text-2xl font-semibold text-zinc-900">${(totalRevenue / 100).toFixed(2)}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Units Sold</span>
          </div>
          <p className="text-2xl font-semibold text-zinc-900">{totalUnits}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Avg. Sale</span>
          </div>
          <p className="text-2xl font-semibold text-zinc-900">
            {sales.length > 0 ? `$${(totalRevenue / sales.length / 100).toFixed(2)}` : "$0.00"}
          </p>
        </div>
      </div>

      <DataTable
        data={sales}
        columns={columns}
        loading={isLoading}
        searchPlaceholder="Search sales..."
        getRowId={(item) => String((item as SaleItem).id)}
        emptyState={
          <div className="flex flex-col items-center gap-3 py-12">
            <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center">
              <Receipt className="w-6 h-6 text-zinc-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-700">No sales recorded</p>
              <p className="text-xs text-zinc-400 mt-1">Sales will appear here when inventory is sold</p>
            </div>
          </div>
        }
      />
    </div>
  );
}
