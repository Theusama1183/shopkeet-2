"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DataTable, Column, FilterField } from "@/components/ui/data-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Plus, Edit, Trash2, Check, Layout,
  PanelTop, PanelBottom, Package, FileText,
  Archive, ShoppingCart, AlertCircle, Search, Rss,
} from "lucide-react";
import { useTemplates, useCreateTemplate, useDeleteTemplate, useActivateTemplate } from "@/lib/queries";
import { useNotification } from "@/lib/stores";

// ─── Template type metadata ───────────────────────────────────────────────────

const TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string; slot: string }> = {
  header:           { label: "Header",           icon: PanelTop,     color: "bg-violet-100 text-violet-600",  slot: "Global" },
  footer:           { label: "Footer",           icon: PanelBottom,  color: "bg-blue-100 text-blue-600",      slot: "Global" },
  "single-product": { label: "Single Product",   icon: Package,      color: "bg-emerald-100 text-emerald-600",slot: "Product" },
  "archive-products":{ label: "Products Archive",icon: Archive,      color: "bg-amber-100 text-amber-600",    slot: "Product" },
  "single-post":    { label: "Single Post",      icon: FileText,     color: "bg-pink-100 text-pink-600",      slot: "Blog" },
  "archive-blog":   { label: "Blog Archive",     icon: Rss,          color: "bg-orange-100 text-orange-600",  slot: "Blog" },
  cart:             { label: "Cart",             icon: ShoppingCart, color: "bg-cyan-100 text-cyan-600",      slot: "Commerce" },
  search:           { label: "Search Results",   icon: Search,       color: "bg-indigo-100 text-indigo-600",  slot: "Commerce" },
  "not-found":      { label: "404 Page",         icon: AlertCircle,  color: "bg-red-100 text-red-600",        slot: "System" },
};

const TEMPLATE_TYPES = Object.entries(TYPE_META).map(([type, meta]) => ({
  value: type,
  label: meta.label,
}));

// ─── Types ────────────────────────────────────────────────────────────────────

interface Template {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ConfirmState {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
}

interface TemplatesClientProps {
  storeId: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TemplatesClient({ storeId }: TemplatesClientProps) {
  const router = useRouter();
  const { data: templates = [], isLoading } = useTemplates(storeId);
  const createTemplate = useCreateTemplate(storeId);
  const deleteTemplate = useDeleteTemplate(storeId);
  const activateTemplate = useActivateTemplate(storeId);
  const notification = useNotification();
  
  const [showCreate, setShowCreate] = useState(false);
  const [createType, setCreateType] = useState("header");
  const [createName, setCreateName] = useState("");
  const [createError, setCreateError] = useState("");
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  const closeConfirm = useCallback(() => {
    setConfirmState(prev => ({ ...prev, open: false }));
  }, []);

  const handleCreate = async () => {
    if (!createName.trim()) { setCreateError("Template name is required"); return; }
    setCreateError("");
    
    try {
      const created = await createTemplate.mutateAsync({ name: createName.trim(), type: createType });
      setShowCreate(false);
      setCreateName("");
      notification.success("Template created", "The template has been created successfully");
      router.push(`/admin/store/${storeId}/design/template/${created.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create template";
      setCreateError(message);
    }
  };

  const handleActivate = async (template: Template) => {
    try {
      await activateTemplate.mutateAsync({ 
        templateId: template.id, 
        isActive: !template.isActive 
      });
      notification.success(
        template.isActive ? "Template deactivated" : "Template activated",
        template.isActive ? "The template has been deactivated" : "The template has been activated"
      );
    } catch (error) {
      notification.error("Failed to update", error instanceof Error ? error.message : "An error occurred");
    }
  };

  const handleDelete = useCallback((id: string, name: string) => {
    setConfirmState({
      open: true,
      title: "Delete template",
      description: `"${name}" will be permanently deleted. If it is active, your storefront will lose this template.`,
      onConfirm: async () => {
        closeConfirm();
        try {
          await deleteTemplate.mutateAsync(id);
          notification.success("Template deleted", "The template has been deleted");
        } catch (error) {
          notification.error("Failed to delete", error instanceof Error ? error.message : "An error occurred");
        }
      },
    });
  }, [closeConfirm, deleteTemplate, notification]);

  const handleBulkDelete = useCallback((items: Template[]) => {
    setConfirmState({
      open: true,
      title: `Delete ${items.length} template${items.length > 1 ? "s" : ""}`,
      description: `${items.length} template${items.length > 1 ? "s" : ""} will be permanently deleted. Active templates will be removed from your storefront.`,
      onConfirm: async () => {
        closeConfirm();
        // Sequential delete with per-item error tracking
        const failed: string[] = [];
        for (const template of items) {
          try {
            await deleteTemplate.mutateAsync(template.id);
          } catch {
            failed.push(template.name);
          }
        }
        const succeeded = items.length - failed.length;
        if (failed.length === 0) {
          notification.success(
            "Templates deleted",
            `${succeeded} template${succeeded > 1 ? "s" : ""} deleted successfully`
          );
        } else if (succeeded > 0) {
          notification.error(
            "Partial failure",
            `${succeeded} deleted, failed: ${failed.join(", ")}`
          );
        } else {
          notification.error("Delete failed", `Failed to delete: ${failed.join(", ")}`);
        }
      },
    });
  }, [closeConfirm, deleteTemplate, notification]);

  // ── Columns ──
  const columns: Column<Template>[] = [
    {
      key: "name",
      label: "Template",
      sortable: true,
      required: true,
      render: (t) => {
        const meta = TYPE_META[t.type];
        const Icon = meta?.icon ?? Layout;
        return (
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${meta?.color ?? "bg-zinc-100 text-zinc-500"}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900">{t.name}</p>
              <p className="text-xs text-zinc-400">{meta?.label ?? t.type}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: "type",
      label: "Slot",
      sortable: true,
      render: (t) => {
        const slot = TYPE_META[t.type]?.slot ?? "Other";
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600">
            {slot}
          </span>
        );
      },
    },
    {
      key: "isActive",
      label: "Status",
      sortable: true,
      render: (t) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
          t.isActive
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
            : "bg-zinc-100 text-zinc-600 border border-zinc-200"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${t.isActive ? "bg-emerald-500" : "bg-zinc-400"}`} />
          {t.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "updatedAt",
      label: "Last Updated",
      sortable: true,
      render: (t) => (
        <span className="text-sm text-zinc-500">
          {new Date(t.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      ),
    },
  ];

  // ── Filters ──
  const filters: FilterField[] = [
    {
      key: "type",
      label: "Slot / Type",
      type: "select",
      options: TEMPLATE_TYPES,
    },
    {
      key: "isActive",
      label: "Status",
      type: "select",
      options: [
        { label: "Active", value: "true" },
        { label: "Inactive", value: "false" },
      ],
    },
  ];

  return (
    <div className="space-y-5">

      {/* Confirm dialog */}
      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        description={confirmState.description}
        confirmLabel="Delete"
        destructive
        onConfirm={confirmState.onConfirm}
        onCancel={closeConfirm}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Templates</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Design global layouts — header, footer, product pages, and more.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New template
        </button>
      </div>

      {/* DataTable */}
      <DataTable
        data={templates}
        columns={columns}
        loading={isLoading}
        selectable
        filters={filters}
        searchPlaceholder="Search templates..."
        getRowId={(t) => String(t.id)}
        builtinBulkActions={{
          onBulkDelete: (items) => handleBulkDelete(items),
        }}
        onRowClick={(item) => {
          router.push(`/admin/store/${storeId}/design/template/${item.id}`);
        }}
        actions={(item) => {
          const t = item as Template;
          return (
            <div className="flex items-center gap-1">
              {/* Activate / Deactivate */}
              <button
                onClick={(e) => { e.stopPropagation(); handleActivate(t); }}
                title={t.isActive ? "Deactivate" : "Set active"}
                className={`p-1.5 rounded-lg transition-colors ${
                  t.isActive
                    ? "text-emerald-600 hover:bg-emerald-50"
                    : "text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50"
                }`}
              >
                <Check className="w-4 h-4" />
              </button>

              {/* Design editor */}
              {storeId && (
                <Link href={`/admin/store/${storeId}/design/template/${t.id}`} onClick={(e) => e.stopPropagation()}>
                  <button className="p-1.5 rounded-lg text-zinc-400 hover:text-violet-600 hover:bg-violet-50 transition-colors" title="Open design editor">
                    <Edit className="w-4 h-4" />
                  </button>
                </Link>
              )}

              {/* Delete */}
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(t.id, t.name); }}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Delete template"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        }}
        emptyState={
          <div className="flex flex-col items-center gap-3 py-12">
            <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center">
              <Layout className="w-6 h-6 text-zinc-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-700">No templates yet</p>
              <p className="text-xs text-zinc-400 mt-1">
                Create a header, footer, or other global layout template
              </p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New template
            </button>
          </div>
        }
      />

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div>
              <h2 className="text-base font-semibold text-zinc-900">New Template</h2>
              <p className="text-sm text-zinc-500 mt-1">
                Create a template and open the design editor.
              </p>
            </div>

            {createError && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {createError}
              </div>
            )}

            {/* Type selector */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                Template Type
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-0.5">
                {Object.entries(TYPE_META).map(([type, meta]) => {
                  const Icon = meta.icon;
                  const isSelected = createType === type;
                  return (
                    <button
                      key={type}
                      onClick={() => { setCreateType(type); setCreateName(meta.label + " Template"); }}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${
                        isSelected ? "border-violet-500 bg-violet-50" : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${meta.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold truncate ${isSelected ? "text-violet-900" : "text-zinc-800"}`}>
                          {meta.label}
                        </p>
                        <p className="text-[10px] text-zinc-400">{meta.slot}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">
                Template Name
              </label>
              <input
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="e.g. Main Header"
                autoFocus
                className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setShowCreate(false); setCreateError(""); }}
                className="flex-1 py-2.5 text-sm font-medium text-zinc-700 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={createTemplate.isPending || !createName.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-40"
              >
                {createTemplate.isPending ? (
                  <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating...</>
                ) : (
                  <><Plus className="w-3.5 h-3.5" />Create & Design</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
