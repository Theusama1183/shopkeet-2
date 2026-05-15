"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Column, FilterField, DataTableProps } from "@/components/ui/data-table";
import {
  Plus, Edit, Trash2, Package, ImageIcon,
  Download, Upload, MoreHorizontal,
} from "lucide-react";
import { useProducts, useDeleteProduct, useBulkDeleteProducts, useBulkUpdateStatus, type Product } from "@/lib/queries";
import { useNotification } from "@/lib/stores";
import { CSVImportModal } from "@/components/products/csv-import-modal";

// Dynamic import DataTable (PERF-011)
const DataTable = dynamic(() => import("@/components/ui/data-table").then(m => ({ default: m.DataTable })), {
  loading: () => <div className="h-96 bg-zinc-50 rounded-xl animate-pulse" />,
}) as <T extends object>(props: DataTableProps<T>) => React.ReactElement;

export function ProductsTable({ storeId }: { storeId: string }) {
  const router = useRouter();
  const { data: products = [], isLoading, refetch } = useProducts(storeId);
  const deleteProduct = useDeleteProduct(storeId);
  const bulkDelete = useBulkDeleteProducts(storeId);
  const bulkUpdateStatus = useBulkUpdateStatus(storeId);
  const notification = useNotification();
  const [importOpen, setImportOpen] = useState(false);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    
    try {
      await deleteProduct.mutateAsync(id);
      notification.success("Product deleted", "The product has been deleted successfully");
    } catch (error) {
      notification.error("Failed to delete", error instanceof Error ? error.message : "An error occurred");
    }
  };

  const columns: Column<Product>[] = [
    {
      key: "name",
      label: "Product",
      sortable: true,
      required: true,
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0 overflow-hidden border border-zinc-200">
            {p.image
              ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
              : <ImageIcon className="w-4 h-4 text-zinc-400" />
            }
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-900">{p.name}</p>
            {p.sku && <p className="text-xs text-zinc-400 font-mono">SKU: {p.sku}</p>}
          </div>
        </div>
      ),
    },
    {
      key: "price",
      label: "Price",
      sortable: true,
      render: (p) => (
        <span className="text-sm font-medium text-zinc-900">
          ${(p.price / 100).toFixed(2)}
        </span>
      ),
    },
    {
      key: "quantity",
      label: "Stock",
      sortable: true,
      render: (p) => {
        const qty = p.quantity ?? 0;
        return (
          <span className={`text-sm ${qty === 0 ? "text-red-500 font-medium" : qty < 5 ? "text-amber-600" : "text-zinc-700"}`}>
            {qty === 0 ? "Out of stock" : `${qty} in stock`}
          </span>
        );
      },
    },
    {
      key: "isActive",
      label: "Status",
      sortable: true,
      render: (p) => {
        const status = p.status ?? (p.is_active ? "active" : "draft");
        const styles: Record<string, string> = {
          active:    "bg-emerald-50 text-emerald-700 border-emerald-200",
          draft:     "bg-zinc-100 text-zinc-600 border-zinc-200",
          archived:  "bg-amber-50 text-amber-700 border-amber-200",
          scheduled: "bg-blue-50 text-blue-700 border-blue-200",
        };
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status] ?? styles.draft}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status === "active" ? "bg-emerald-500" : "bg-zinc-400"}`} />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      },
    },
    {
      key: "createdAt",
      label: "Added",
      sortable: true,
      render: (p) => {
        if (!p.created_at) return <span className="text-sm text-zinc-400">—</span>;
        const date = new Date(p.created_at);
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
      key: "isActive",
      label: "Status",
      type: "select",
      options: [
        { label: "Active", value: "true" },
        { label: "Draft / Inactive", value: "false" },
      ],
    },
    { key: "createdAt", label: "Date Range", type: "date-range" },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Products</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{products.length} total</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-zinc-600 border border-zinc-200 rounded-lg bg-white hover:bg-zinc-50 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-zinc-600 border border-zinc-200 rounded-lg bg-white hover:bg-zinc-50 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
          <Link href={`/store/${storeId}/products/new`}>
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors">
              <Plus className="w-4 h-4" />
              Add product
            </button>
          </Link>
        </div>
      </div>

      {/* Table */}
      <DataTable
        data={products}
        columns={columns}
        loading={isLoading}
        selectable
        filters={filters}
        searchPlaceholder="Search products..."
        getRowId={(item) => String((item as Product).id)}
        onRowClick={(item) => router.push(`/store/${storeId}/products/${(item as Product).id}/edit`)}
        builtinBulkActions={{
          onBulkDelete: async (items) => {
            if (!confirm(`Delete ${items.length} products? This cannot be undone.`)) return;
            try {
              const ids = items.map((p) => (p as Product).id);
              await bulkDelete.mutateAsync(ids);
              notification.success("Products deleted", `${items.length} products deleted successfully`);
            } catch (error) {
              notification.error("Failed to delete", error instanceof Error ? error.message : "Failed to delete products");
            }
          },
          onBulkActivate: async (items) => {
            try {
              const ids = items.map((p) => (p as Product).id);
              await bulkUpdateStatus.mutateAsync({ ids, isActive: true });
              notification.success("Products activated", `${items.length} products set to active`);
            } catch (error) {
              notification.error("Failed to activate", error instanceof Error ? error.message : "Failed to update products");
            }
          },
          onBulkDeactivate: async (items) => {
            try {
              const ids = items.map((p) => (p as Product).id);
              await bulkUpdateStatus.mutateAsync({ ids, isActive: false });
              notification.success("Products deactivated", `${items.length} products set to draft`);
            } catch (error) {
              notification.error("Failed to deactivate", error instanceof Error ? error.message : "Failed to update products");
            }
          },
          onBulkExport: async (items) => {
            notification.info("Preparing export", `Generating CSV for ${items.length} products...`);
            
            // Short timeout to allow UI to show notification before heavy processing
            setTimeout(() => {
              const rows = items.map((p) => {
                const prod = p as Product;
                return [
                  `"${prod.name.replace(/"/g, '""')}"`, 
                  `"${(prod.sku || "").replace(/"/g, '""')}"`, 
                  ((prod.price || 0) / 100).toFixed(2), 
                  prod.is_active ? "Active" : "Draft"
                ].join(",");
              });
              
              const csv = ["Name,SKU,Price,Status", ...rows].join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `products-export-${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              URL.revokeObjectURL(url);
              notification.success("Exported", `${items.length} products exported to CSV`);
            }, 100);
          },
        }}
        actions={(item) => {
          const p = item as Product;
          return (
            <div className="flex items-center gap-1">
              <Link href={`/store/${storeId}/products/${p.id}/edit`} onClick={(e) => e.stopPropagation()}>
                <button className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors" title="Edit">
                  <Edit className="w-4 h-4" />
                </button>
              </Link>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          );
        }}
        emptyState={
          <div className="flex flex-col items-center gap-3 py-12">
            <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-zinc-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-700">No products yet</p>
              <p className="text-xs text-zinc-400 mt-1">Add your first product to start selling</p>
            </div>
            <Link href={`/store/${storeId}/products/new`}>
              <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors">
                <Plus className="w-4 h-4" />
                Add product
              </button>
            </Link>
          </div>
        }
      />

      {/* CSV Import Modal */}
      <CSVImportModal
        storeId={storeId}
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onComplete={(result) => {
          refetch();
          notification.success(
            "Products imported",
            `${result.imported} products imported successfully${result.skipped > 0 ? `, ${result.skipped} skipped` : ""}`
          );
        }}
      />
    </div>
  );
}
