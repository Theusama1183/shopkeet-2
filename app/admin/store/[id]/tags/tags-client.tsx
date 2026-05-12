"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Column, DataTableProps } from "@/components/ui/data-table";
import {
  Plus, Edit, Trash2, Bookmark,
  Download, Upload, MoreHorizontal,
} from "lucide-react";
import { useTags, useDeleteTag, type Tag } from "@/lib/queries";
import { useNotification } from "@/lib/stores";

const DataTable = dynamic(() => import("@/components/ui/data-table").then(m => ({ default: m.DataTable })), {
  loading: () => <div className="h-96 bg-zinc-50 rounded-xl animate-pulse" />,
}) as <T extends object>(props: DataTableProps<T>) => React.ReactElement;

export function TagsTable({ storeId }: { storeId: string }) {
  const router = useRouter();
  const { data: tags = [], isLoading } = useTags(storeId);
  const deleteTag = useDeleteTag(storeId);
  const notification = useNotification();

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this tag? This cannot be undone.")) return;
    
    try {
      await deleteTag.mutateAsync(id);
      notification.success("Tag deleted", "The tag has been deleted successfully");
    } catch (error) {
      notification.error("Failed to delete", error instanceof Error ? error.message : "An error occurred");
    }
  };

  const columns: Column<Tag>[] = [
    {
      key: "name",
      label: "Tag",
      sortable: true,
      required: true,
      render: (t) => (
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border"
            style={{
              backgroundColor: `${t.color}15`,
              borderColor: `${t.color}30`,
            }}
          >
            <Bookmark className="w-4 h-4" style={{ color: t.color }} />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-900">{t.name}</p>
            <p className="text-xs text-zinc-400 font-mono">/{t.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: "color",
      label: "Color",
      render: (t) => (
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded border border-zinc-200"
            style={{ backgroundColor: t.color }}
          />
          <span className="text-sm text-zinc-600 font-mono">{t.color}</span>
        </div>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      render: (t) => {
        if (!t.created_at) return <span className="text-sm text-zinc-400">—</span>;
        const date = new Date(t.created_at);
        if (isNaN(date.getTime())) return <span className="text-sm text-zinc-400">—</span>;
        return (
          <span className="text-sm text-zinc-500">
            {date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Tags</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{tags.length} total</p>
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
          <Link href={`/store/${storeId}/tags/new`}>
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors">
              <Plus className="w-4 h-4" />
              Add tag
            </button>
          </Link>
        </div>
      </div>

      <DataTable
        data={tags}
        columns={columns}
        loading={isLoading}
        selectable
        searchPlaceholder="Search tags..."
        getRowId={(item) => String((item as Tag).id)}
        onRowClick={(item) => router.push(`/store/${storeId}/tags/${(item as Tag).id}/edit`)}
        builtinBulkActions={{
          onBulkDelete: async (items) => {
            if (!confirm(`Delete ${items.length} tags?`)) return;
            try {
              await Promise.all(items.map((t) => deleteTag.mutateAsync((t as Tag).id)));
              notification.success("Tags deleted", `${items.length} tags have been deleted successfully`);
            } catch (error) {
              notification.error("Failed to delete", error instanceof Error ? error.message : "Failed to delete some tags");
            }
          },
        }}
        actions={(item) => {
          const t = item as Tag;
          return (
            <div className="flex items-center gap-1">
              <Link href={`/store/${storeId}/tags/${t.id}/edit`} onClick={(e) => e.stopPropagation()}>
                <button className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors" title="Edit">
                  <Edit className="w-4 h-4" />
                </button>
              </Link>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
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
              <Bookmark className="w-6 h-6 text-zinc-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-700">No tags yet</p>
              <p className="text-xs text-zinc-400 mt-1">Tag your products for better organization</p>
            </div>
            <Link href={`/store/${storeId}/tags/new`}>
              <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors">
                <Plus className="w-4 h-4" />
                Add tag
              </button>
            </Link>
          </div>
        }
      />
    </div>
  );
}
