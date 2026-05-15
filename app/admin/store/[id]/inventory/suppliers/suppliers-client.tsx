"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Column, DataTableProps } from "@/components/ui/data-table";
import { useSuppliers, useCreateSupplier, useDeleteSupplier } from "@/lib/queries/inventory";
import { useNotification } from "@/lib/stores";
import {
  Users, Plus, Mail, Phone, Building2, Trash2, CheckCircle2, XCircle,
} from "lucide-react";

const DataTable = dynamic(() => import("@/components/ui/data-table").then(m => ({ default: m.DataTable })), {
  loading: () => <div className="h-96 bg-zinc-50 rounded-xl animate-pulse" />,
}) as <T extends object>(props: DataTableProps<T>) => React.ReactElement;

interface SupplierItem {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

export function SuppliersClient({ storeId }: { storeId: string }) {
  const { data: suppliers = [], isLoading } = useSuppliers(storeId);
  const createSupplier = useCreateSupplier(storeId);
  const deleteSupplier = useDeleteSupplier(storeId);
  const notification = useNotification();

  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formCompany, setFormCompany] = useState("");

  const handleCreate = async () => {
    if (!formName.trim()) return;
    try {
      await createSupplier.mutateAsync({
        name: formName,
        email: formEmail || undefined,
        phone: formPhone || undefined,
        company: formCompany || undefined,
      });
      notification.success("Created", "Supplier added successfully");
      setShowForm(false);
      setFormName(""); setFormEmail(""); setFormPhone(""); setFormCompany("");
    } catch {
      notification.error("Error", "Failed to create supplier");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSupplier.mutateAsync(id);
      notification.success("Deleted", "Supplier removed successfully");
    } catch {
      notification.error("Error", "Failed to delete supplier");
    }
  };

  const columns: Column<SupplierItem>[] = [
    {
      key: "name",
      label: "Supplier",
      sortable: true,
      required: true,
      render: (s) => (
        <div>
          <p className="text-sm font-medium text-zinc-900">{s.name}</p>
          {s.company && (
            <div className="flex items-center gap-1 mt-0.5">
              <Building2 className="w-3 h-3 text-zinc-400" />
              <span className="text-xs text-zinc-500">{s.company}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "email",
      label: "Contact",
      render: (s) => (
        <div className="space-y-0.5">
          {s.email && (
            <div className="flex items-center gap-1.5">
              <Mail className="w-3 h-3 text-zinc-400" />
              <span className="text-sm text-zinc-600">{s.email}</span>
            </div>
          )}
          {s.phone && (
            <div className="flex items-center gap-1.5">
              <Phone className="w-3 h-3 text-zinc-400" />
              <span className="text-sm text-zinc-600">{s.phone}</span>
            </div>
          )}
          {!s.email && !s.phone && <span className="text-sm text-zinc-400">—</span>}
        </div>
      ),
    },
    {
      key: "is_active",
      label: "Status",
      render: (s) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
          s.is_active
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-zinc-100 text-zinc-600 border-zinc-200"
        }`}>
          {s.is_active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          {s.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "created_at",
      label: "Added",
      sortable: true,
      render: (s) => {
        const date = new Date(s.created_at);
        return <span className="text-sm text-zinc-500">{date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>;
      },
    },
    {
      key: "actions" as keyof SupplierItem,
      label: "",
      render: (s) => (
        <button onClick={() => handleDelete(s.id)} className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Suppliers</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{suppliers.length} supplier{suppliers.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add supplier
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900">New Supplier</h2>
          <div className="grid grid-cols-2 gap-4">
            <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Supplier name *" className="px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500" />
            <input value={formCompany} onChange={(e) => setFormCompany(e.target.value)} placeholder="Company" className="px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500" />
            <input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="Email" type="email" className="px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500" />
            <input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="Phone" className="px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={createSupplier.isPending} className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors">
              {createSupplier.isPending ? "Adding..." : "Add Supplier"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      <DataTable
        data={suppliers}
        columns={columns}
        loading={isLoading}
        searchPlaceholder="Search suppliers..."
        getRowId={(item) => String((item as SupplierItem).id)}
        emptyState={
          <div className="flex flex-col items-center gap-3 py-12">
            <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-zinc-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-700">No suppliers yet</p>
              <p className="text-xs text-zinc-400 mt-1">Add suppliers to track your vendor relationships</p>
            </div>
          </div>
        }
      />
    </div>
  );
}
