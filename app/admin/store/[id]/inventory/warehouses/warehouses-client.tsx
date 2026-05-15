"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Column, DataTableProps } from "@/components/ui/data-table";
import { useWarehouses, useCreateWarehouse, useDeleteWarehouse } from "@/lib/queries/inventory";
import { useNotification } from "@/lib/stores";
import {
  Warehouse, Plus, MapPin, CheckCircle2, XCircle, Star, Trash2,
} from "lucide-react";

const DataTable = dynamic(() => import("@/components/ui/data-table").then(m => ({ default: m.DataTable })), {
  loading: () => <div className="h-96 bg-zinc-50 rounded-xl animate-pulse" />,
}) as <T extends object>(props: DataTableProps<T>) => React.ReactElement;

interface WarehouseItem {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  country: string | null;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

export function WarehousesClient({ storeId }: { storeId: string }) {
  const { data: warehouses = [], isLoading } = useWarehouses(storeId);
  const createWarehouse = useCreateWarehouse(storeId);
  const deleteWarehouse = useDeleteWarehouse(storeId);
  const notification = useNotification();

  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formCountry, setFormCountry] = useState("");

  const handleCreate = async () => {
    if (!formName.trim()) return;
    try {
      await createWarehouse.mutateAsync({ name: formName, address: formAddress || undefined, city: formCity || undefined, country: formCountry || undefined });
      notification.success("Created", "Warehouse created successfully");
      setShowForm(false);
      setFormName(""); setFormAddress(""); setFormCity(""); setFormCountry("");
    } catch {
      notification.error("Error", "Failed to create warehouse");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteWarehouse.mutateAsync(id);
      notification.success("Deleted", "Warehouse deleted successfully");
    } catch {
      notification.error("Error", "Failed to delete warehouse");
    }
  };

  const columns: Column<WarehouseItem>[] = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      required: true,
      render: (w) => (
        <div className="flex items-center gap-2">
          <Warehouse className="w-4 h-4 text-violet-500" />
          <span className="text-sm font-medium text-zinc-900">{w.name}</span>
          {w.is_default && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
        </div>
      ),
    },
    {
      key: "address",
      label: "Location",
      render: (w) => {
        const parts = [w.city, w.country].filter(Boolean);
        return parts.length > 0 ? (
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-sm text-zinc-600">{parts.join(", ")}</span>
          </div>
        ) : <span className="text-sm text-zinc-400">—</span>;
      },
    },
    {
      key: "is_active",
      label: "Status",
      render: (w) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
          w.is_active
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-zinc-100 text-zinc-600 border-zinc-200"
        }`}>
          {w.is_active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          {w.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "created_at",
      label: "Created",
      sortable: true,
      render: (w) => {
        const date = new Date(w.created_at);
        return <span className="text-sm text-zinc-500">{date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>;
      },
    },
    {
      key: "actions" as keyof WarehouseItem,
      label: "",
      render: (w) => (
        <button onClick={() => handleDelete(w.id)} className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Warehouses</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{warehouses.length} warehouse{warehouses.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add warehouse
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900">New Warehouse</h2>
          <div className="grid grid-cols-2 gap-4">
            <input
              value={formName} onChange={(e) => setFormName(e.target.value)}
              placeholder="Warehouse name *" className="px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <input
              value={formAddress} onChange={(e) => setFormAddress(e.target.value)}
              placeholder="Address" className="px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <input
              value={formCity} onChange={(e) => setFormCity(e.target.value)}
              placeholder="City" className="px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <input
              value={formCountry} onChange={(e) => setFormCountry(e.target.value)}
              placeholder="Country" className="px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={createWarehouse.isPending} className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors">
              {createWarehouse.isPending ? "Creating..." : "Create"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      <DataTable
        data={warehouses}
        columns={columns}
        loading={isLoading}
        searchPlaceholder="Search warehouses..."
        getRowId={(item) => String((item as WarehouseItem).id)}
        emptyState={
          <div className="flex flex-col items-center gap-3 py-12">
            <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center">
              <Warehouse className="w-6 h-6 text-zinc-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-700">No warehouses yet</p>
              <p className="text-xs text-zinc-400 mt-1">Add a warehouse to start managing stock locations</p>
            </div>
          </div>
        }
      />
    </div>
  );
}
