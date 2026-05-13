"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DataTable, Column } from "@/components/ui/data-table";
import { Plus, Edit, Trash2, Layers, Check, Timer, TrendingUp, LogOut, MousePointer } from "lucide-react";
import type { PopupTriggerEvent } from "@/lib/popups/types";
import { TRIGGER_EVENT_LABELS } from "@/lib/popups/types";
import { usePopups, useCreatePopup, useDeletePopup, useTogglePopup } from "@/lib/queries";
import { useNotification } from "@/lib/stores";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PopupRow {
  id: string;
  name: string;
  isActive: boolean;
  trigger: { event?: PopupTriggerEvent; frequency?: string };
  createdAt: string;
  updatedAt: string;
}

// ─── Trigger icon map ─────────────────────────────────────────────────────────

const TRIGGER_ICONS: Record<PopupTriggerEvent, React.ElementType> = {
  "on-load":        Timer,
  "on-scroll":      TrendingUp,
  "on-exit-intent": LogOut,
  "on-click":       MousePointer,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function PopupsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: storeId } = use(params);
  const router = useRouter();
  const { data: popups = [], isLoading } = usePopups(storeId);
  const createPopup = useCreatePopup(storeId);
  const deletePopup = useDeletePopup(storeId);
  const togglePopup = useTogglePopup(storeId);
  const notification = useNotification();
  
  const [showCreate, setCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [createErr, setCreateErr] = useState("");

  const handleCreate = async () => {
    if (!newName.trim()) { setCreateErr("Name is required"); return; }
    setCreateErr("");
    
    try {
      const created = await createPopup.mutateAsync({ name: newName.trim() });
      setCreate(false);
      setNewName("");
      notification.success("Popup created", "The popup has been created successfully");
      router.push(`/store/${storeId}/design/popup/${created.id}`);
    } catch (error: any) {
      setCreateErr(error.message || "Failed to create popup");
    }
  };

  const handleToggleActive = async (popup: PopupRow) => {
    try {
      await togglePopup.mutateAsync({ popupId: popup.id, isActive: !popup.isActive });
      notification.success(
        popup.isActive ? "Popup deactivated" : "Popup activated",
        popup.isActive ? "The popup has been deactivated" : "The popup has been activated"
      );
    } catch (error) {
      notification.error("Failed to update", error instanceof Error ? error.message : "An error occurred");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this popup? This cannot be undone.")) return;
    
    try {
      await deletePopup.mutateAsync(id);
      notification.success("Popup deleted", "The popup has been deleted successfully");
    } catch (error) {
      notification.error("Failed to delete", error instanceof Error ? error.message : "An error occurred");
    }
  };

  // ── Columns ──────────────────────────────────────────────────────────────────

  const columns: Column<PopupRow>[] = [
    {
      key: "name",
      label: "Popup",
      sortable: true,
      required: true,
      render: (p) => {
        const event = p.trigger?.event ?? "on-load";
        const Icon = TRIGGER_ICONS[event] ?? Timer;
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-fuchsia-100 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4 text-fuchsia-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900">{p.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Icon className="w-3 h-3 text-zinc-400" />
                <p className="text-xs text-zinc-400">
                  {TRIGGER_EVENT_LABELS[event] ?? event}
                </p>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: "isActive",
      label: "Status",
      sortable: true,
      render: (p) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
          p.isActive
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
            : "bg-zinc-100 text-zinc-600 border border-zinc-200"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${p.isActive ? "bg-emerald-500" : "bg-zinc-400"}`} />
          {p.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "updatedAt",
      label: "Last Updated",
      sortable: true,
      render: (p) => (
        <span className="text-sm text-zinc-500">
          {new Date(p.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Popups</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Design and manage popups that appear on your storefront.
          </p>
        </div>
        <button
          onClick={() => setCreate(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New popup
        </button>
      </div>

      {/* Table */}
      <DataTable
        data={popups}
        columns={columns}
        loading={isLoading}
        selectable
        searchPlaceholder="Search popups..."
        getRowId={(p) => String(p.id)}
        builtinBulkActions={{
          onBulkDelete: async (items) => {
            if (!confirm(`Delete ${items.length} popup${items.length > 1 ? "s" : ""}?`)) return;
            try {
              await Promise.all(items.map(p => deletePopup.mutateAsync(p.id)));
              notification.success("Popups deleted", `${items.length} popup${items.length > 1 ? "s" : ""} have been deleted successfully`);
            } catch (error) {
              notification.error("Failed to delete", error instanceof Error ? error.message : "Failed to delete some popups");
            }
          },
        }}
        onRowClick={(item) => {
          router.push(`/store/${storeId}/design/popup/${item.id}`);
        }}
        actions={(item) => {
          const p = item as PopupRow;
          return (
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); handleToggleActive(p); }}
                title={p.isActive ? "Deactivate" : "Activate"}
                className={`p-1.5 rounded-lg transition-colors ${
                  p.isActive
                    ? "text-emerald-600 hover:bg-emerald-50"
                    : "text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50"
                }`}
              >
                <Check className="w-4 h-4" />
              </button>
              {storeId && (
                <Link href={`/store/${storeId}/design/popup/${p.id}`} onClick={e => e.stopPropagation()}>
                  <button className="p-1.5 rounded-lg text-zinc-400 hover:text-violet-600 hover:bg-violet-50 transition-colors" title="Open design editor">
                    <Edit className="w-4 h-4" />
                  </button>
                </Link>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Delete popup"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        }}
        emptyState={
          <div className="flex flex-col items-center gap-3 py-12">
            <div className="w-12 h-12 bg-fuchsia-50 rounded-xl flex items-center justify-center">
              <Layers className="w-6 h-6 text-fuchsia-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-700">No popups yet</p>
              <p className="text-xs text-zinc-400 mt-1">Create a popup and design it with the visual editor</p>
            </div>
            <button
              onClick={() => setCreate(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New popup
            </button>
          </div>
        }
      />

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setCreate(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
            <div>
              <h2 className="text-base font-semibold text-zinc-900">New Popup</h2>
              <p className="text-sm text-zinc-500 mt-1">Give your popup a name, then design it in the editor.</p>
            </div>

            {createErr && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{createErr}</p>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">
                Popup Name
              </label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreate()}
                placeholder="e.g. Newsletter Signup"
                autoFocus
                className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setCreate(false); setCreateErr(""); setNewName(""); }}
                className="flex-1 py-2.5 text-sm font-medium text-zinc-700 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={createPopup.isPending || !newName.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-40"
              >
                {createPopup.isPending
                  ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating...</>
                  : <><Plus className="w-3.5 h-3.5" />Create & Design</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
