"use client";

import dynamic from "next/dynamic";
import { Column, DataTableProps } from "@/components/ui/data-table";
import { useTransfers, useUpdateTransferStatus } from "@/lib/queries/inventory";
import { useNotification } from "@/lib/stores";
import {
  ArrowRightLeft, ArrowRight, Clock, Truck, CheckCircle2, XCircle,
} from "lucide-react";

const DataTable = dynamic(() => import("@/components/ui/data-table").then(m => ({ default: m.DataTable })), {
  loading: () => <div className="h-96 bg-zinc-50 rounded-xl animate-pulse" />,
}) as <T extends object>(props: DataTableProps<T>) => React.ReactElement;

interface TransferItem {
  id: string;
  reference_number: string;
  status: string;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
  from_warehouse: { id: string; name: string } | null;
  to_warehouse: { id: string; name: string } | null;
  transfer_items: { id: string; quantity: number; products: { id: string; name: string } | null }[];
}

const statusConfig: Record<string, { icon: React.ReactNode; label: string; className: string }> = {
  pending: { icon: <Clock className="w-3 h-3" />, label: "Pending", className: "bg-amber-50 text-amber-700 border-amber-200" },
  in_transit: { icon: <Truck className="w-3 h-3" />, label: "In Transit", className: "bg-blue-50 text-blue-700 border-blue-200" },
  completed: { icon: <CheckCircle2 className="w-3 h-3" />, label: "Completed", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelled: { icon: <XCircle className="w-3 h-3" />, label: "Cancelled", className: "bg-zinc-100 text-zinc-600 border-zinc-200" },
};

export function TransfersClient({ storeId }: { storeId: string }) {
  const { data: transfers = [], isLoading } = useTransfers(storeId);
  const updateStatus = useUpdateTransferStatus(storeId);
  const notification = useNotification();

  const handleStatusChange = async (transferId: string, status: string) => {
    try {
      await updateStatus.mutateAsync({ transferId, status });
      notification.success("Updated", `Transfer marked as ${status}`);
    } catch {
      notification.error("Error", "Failed to update transfer status");
    }
  };

  const columns: Column<TransferItem>[] = [
    {
      key: "reference_number",
      label: "Reference",
      sortable: true,
      required: true,
      render: (t) => (
        <span className="text-sm font-mono font-medium text-zinc-900">{t.reference_number}</span>
      ),
    },
    {
      key: "from_warehouse",
      label: "Route",
      render: (t) => (
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-700">{t.from_warehouse?.name ?? "—"}</span>
          <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-sm text-zinc-700">{t.to_warehouse?.name ?? "—"}</span>
        </div>
      ),
    },
    {
      key: "transfer_items",
      label: "Items",
      render: (t) => {
        const count = t.transfer_items?.length ?? 0;
        const totalQty = t.transfer_items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
        return (
          <span className="text-sm text-zinc-600">
            {count} item{count !== 1 ? "s" : ""} · {totalQty} unit{totalQty !== 1 ? "s" : ""}
          </span>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (t) => {
        const cfg = statusConfig[t.status] || statusConfig.pending;
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.className}`}>
            {cfg.icon}
            {cfg.label}
          </span>
        );
      },
    },
    {
      key: "created_at",
      label: "Created",
      sortable: true,
      render: (t) => {
        const date = new Date(t.created_at);
        return <span className="text-sm text-zinc-500">{date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>;
      },
    },
    {
      key: "actions" as keyof TransferItem,
      label: "",
      render: (t) => {
        if (t.status === "completed" || t.status === "cancelled") return null;
        return (
          <div className="flex items-center gap-1">
            {t.status === "pending" && (
              <button onClick={() => handleStatusChange(t.id, "in_transit")} className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors">
                Ship
              </button>
            )}
            {(t.status === "pending" || t.status === "in_transit") && (
              <button onClick={() => handleStatusChange(t.id, "completed")} className="px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 transition-colors">
                Complete
              </button>
            )}
            {t.status !== "cancelled" && (
              <button onClick={() => handleStatusChange(t.id, "cancelled")} className="px-2 py-1 text-xs font-medium text-zinc-600 bg-zinc-50 border border-zinc-200 rounded hover:bg-zinc-100 transition-colors">
                Cancel
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Transfers</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{transfers.length} transfer{transfers.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {Object.entries(statusConfig).map(([key, cfg]) => {
          const count = transfers.filter((t: TransferItem) => t.status === key).length;
          return (
            <div key={key} className="bg-white border border-zinc-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                {cfg.icon}
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{cfg.label}</span>
              </div>
              <p className="text-2xl font-semibold text-zinc-900">{count}</p>
            </div>
          );
        })}
      </div>

      <DataTable
        data={transfers}
        columns={columns}
        loading={isLoading}
        searchPlaceholder="Search transfers..."
        getRowId={(item) => String((item as TransferItem).id)}
        emptyState={
          <div className="flex flex-col items-center gap-3 py-12">
            <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center">
              <ArrowRightLeft className="w-6 h-6 text-zinc-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-700">No transfers yet</p>
              <p className="text-xs text-zinc-400 mt-1">Create a transfer to move stock between warehouses</p>
            </div>
          </div>
        }
      />
    </div>
  );
}
