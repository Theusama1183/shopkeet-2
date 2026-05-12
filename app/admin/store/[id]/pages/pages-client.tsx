"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { Column, FilterField, DataTableProps } from "@/components/ui/data-table";
import { Plus, Edit, Eye, Trash2, Home, FileText, Palette } from "lucide-react";
import { usePages, useDeletePage, type Page } from "@/lib/queries";
import { useNotification } from "@/lib/stores";

// Dynamic import DataTable
const DataTable = dynamic(() => import("@/components/ui/data-table").then(m => ({ default: m.DataTable })), {
  loading: () => <div className="h-96 bg-zinc-50 rounded-xl animate-pulse" />,
}) as <T extends object>(props: DataTableProps<T>) => React.ReactElement;

interface Store {
  id: string;
  name: string;
  subdomain: string;
}

export function PagesTable({ store }: { store: Store }) {
  // Use React Query hooks
  const { data: pages = [], isLoading } = usePages(store.id);
  const deletePage = useDeletePage(store.id);
  const notification = useNotification();

  const handleDelete = async (pageId: string) => {
    if (!confirm("Delete this page? This cannot be undone.")) return;
    
    deletePage.mutate(pageId, {
      onSuccess: () => {
        notification.success("Page deleted", "The page has been deleted successfully");
      },
      onError: (error) => {
        notification.error("Failed to delete", error.message);
      },
    });
  };

  const columns: Column<Page>[] = [
    {
      key: "title",
      label: "Page",
      sortable: true,
      required: true,
      render: (page) => (
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            page.is_home ? "bg-violet-100" : "bg-zinc-100"
          }`}>
            {page.is_home
              ? <Home className="w-4 h-4 text-violet-600" />
              : <FileText className="w-4 h-4 text-zinc-400" />
            }
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-900">{page.title}</p>
            <p className="text-xs text-zinc-400 font-mono">/{page.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: "is_published",
      label: "Status",
      sortable: true,
      render: (page) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
          page.is_published
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
            : "bg-zinc-100 text-zinc-600 border border-zinc-200"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${page.is_published ? "bg-emerald-500" : "bg-zinc-400"}`} />
          {page.is_published ? "Published" : "Draft"}
        </span>
      ),
    },
    {
      key: "updated_at",
      label: "Last Updated",
      sortable: true,
      render: (page) => {
        if (!page.updated_at) return <span className="text-sm text-zinc-400">—</span>;
        const date = new Date(page.updated_at);
        if (isNaN(date.getTime())) return <span className="text-sm text-zinc-400">—</span>;
        return (
          <span className="text-sm text-zinc-500">
            {date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        );
      },
    },
  ];

  const filters: FilterField[] = [
    {
      key: "is_published",
      label: "Status",
      type: "select",
      options: [
        { label: "Published", value: "true" },
        { label: "Draft", value: "false" },
      ],
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Pages</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{store.name}</p>
        </div>
        <Link href={`/store/${store.id}/pages/new`}>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors">
            <Plus className="w-4 h-4" />
            Add page
          </button>
        </Link>
      </div>

      {/* Table */}
      <DataTable
        data={pages}
        columns={columns}
        loading={isLoading}
        selectable
        filters={filters}
        searchPlaceholder="Search pages..."
        getRowId={(item) => String((item as Page).id)}
        builtinBulkActions={{
          onBulkDelete: (items) => {
            if (!confirm(`Delete ${items.length} pages? This cannot be undone.`)) return;
            Promise.all(
              items.map((p) => deletePage.mutateAsync((p as Page).id))
            ).then(() => {
              notification.success("Pages deleted", `${items.length} pages have been deleted`);
            }).catch((error) => {
              notification.error("Failed to delete pages", error.message);
            });
          },
        }}
        onRowClick={(item) => {
          window.location.href = `/store/${store.id}/pages/${(item as Page).id}/edit`;
        }}
        actions={(item) => {
          const page = item as Page;
          return (
            <div className="flex items-center gap-1">
              {page.is_published && (
                <a
                  href={`http://${store.subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}/${page.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                    title="View live"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </a>
              )}
              <Link href={`/store/${store.id}/pages/${page.id}/edit`} onClick={(e) => e.stopPropagation()}>
                <button
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                  title="Edit page"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </Link>
              <Link href={`/store/${store.id}/design/${page.id}`} onClick={(e) => e.stopPropagation()}>
                <button
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                  title="Open design editor"
                >
                  <Palette className="w-4 h-4" />
                </button>
              </Link>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(page.id); }}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Delete page"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        }}
        emptyState={
          <div className="flex flex-col items-center gap-3 py-12">
            <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-zinc-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-700">No pages yet</p>
              <p className="text-xs text-zinc-400 mt-1">Create your first page to get started</p>
            </div>
            <Link href={`/store/${store.id}/pages/new`}>
              <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors">
                <Plus className="w-4 h-4" />
                Add page
              </button>
            </Link>
          </div>
        }
      />
    </div>
  );
}
