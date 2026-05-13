"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Column, FilterField, DataTableProps } from "@/components/ui/data-table";
import {
  Plus, Edit, Trash2, FolderTree, ImageIcon,
  Download, Upload, MoreHorizontal,
} from "lucide-react";
import { useCategories, useDeleteCategory, type Category } from "@/lib/queries";
import { useNotification } from "@/lib/stores";

const DataTable = dynamic(() => import("@/components/ui/data-table").then(m => ({ default: m.DataTable })), {
  loading: () => <div className="h-96 bg-zinc-50 rounded-xl animate-pulse" />,
}) as <T extends object>(props: DataTableProps<T>) => React.ReactElement;

export function CategoriesTable({ storeId }: { storeId: string }) {
  const router = useRouter();
  const { data: categories = [], isLoading } = useCategories(storeId);
  const deleteCategory = useDeleteCategory(storeId);
  const notification = useNotification();

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category? This cannot be undone.")) return;
    
    try {
      await deleteCategory.mutateAsync(id);
      notification.success("Category deleted", "The category has been deleted successfully");
    } catch (error) {
      notification.error("Failed to delete", error instanceof Error ? error.message : "An error occurred");
    }
  };

  const columns: Column<Category>[] = [
    {
      key: "name",
      label: "Category",
      sortable: true,
      required: true,
      render: (c) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0 overflow-hidden border border-zinc-200">
            {c.image
              ? <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
              : <ImageIcon className="w-4 h-4 text-zinc-400" />
            }
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-900">{c.name}</p>
            <p className="text-xs text-zinc-400 font-mono">/{c.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: "description",
      label: "Description",
      render: (c) => (
        <span className="text-sm text-zinc-600 line-clamp-2">
          {c.description || "—"}
        </span>
      ),
    },
    {
      key: "parentId",
      label: "Parent",
      render: (c) => {
        if (!c.parent_id) return <span className="text-xs text-zinc-400">Root</span>;
        const parent = categories.find(cat => cat.id === c.parent_id);
        return <span className="text-sm text-zinc-600">{parent?.name || "—"}</span>;
      },
    },
    {
      key: "isActive",
      label: "Status",
      sortable: true,
      render: (c) => {
        const status = c.is_active ? "active" : "draft";
        const styles: Record<string, string> = {
          active: "bg-emerald-50 text-emerald-700 border-emerald-200",
          draft: "bg-zinc-100 text-zinc-600 border-zinc-200",
        };
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status === "active" ? "bg-emerald-500" : "bg-zinc-400"}`} />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      },
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      render: (c) => {
        if (!c.created_at) return <span className="text-sm text-zinc-400">—</span>;
        const date = new Date(c.created_at);
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
        { label: "Draft", value: "false" },
      ],
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Categories</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{categories.length} total</p>
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
          <Link href={`/store/${storeId}/categories/new`}>
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors">
              <Plus className="w-4 h-4" />
              Add category
            </button>
          </Link>
        </div>
      </div>

      <DataTable
        data={categories}
        columns={columns}
        loading={isLoading}
        selectable
        filters={filters}
        searchPlaceholder="Search categories..."
        getRowId={(item) => String((item as Category).id)}
        onRowClick={(item) => router.push(`/store/${storeId}/categories/${(item as Category).id}/edit`)}
        builtinBulkActions={{
          onBulkDelete: async (items) => {
            if (!confirm(`Delete ${items.length} categories?`)) return;
            try {
              await Promise.all(items.map((c) => deleteCategory.mutateAsync((c as Category).id)));
              notification.success("Categories deleted", `${items.length} categories have been deleted successfully`);
            } catch (error) {
              notification.error("Failed to delete", error instanceof Error ? error.message : "Failed to delete some categories");
            }
          },
        }}
        actions={(item) => {
          const c = item as Category;
          return (
            <div className="flex items-center gap-1">
              <Link href={`/store/${storeId}/categories/${c.id}/edit`} onClick={(e) => e.stopPropagation()}>
                <button className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors" title="Edit">
                  <Edit className="w-4 h-4" />
                </button>
              </Link>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
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
              <FolderTree className="w-6 h-6 text-zinc-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-700">No categories yet</p>
              <p className="text-xs text-zinc-400 mt-1">Organize your products with categories</p>
            </div>
            <Link href={`/store/${storeId}/categories/new`}>
              <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors">
                <Plus className="w-4 h-4" />
                Add category
              </button>
            </Link>
          </div>
        }
      />
    </div>
  );
}
