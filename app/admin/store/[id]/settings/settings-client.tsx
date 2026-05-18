"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Store, Globe, Trash2, Save,
  ExternalLink, AlertTriangle, Check
} from "lucide-react";
import { useUpdateStore } from "@/lib/queries";
import { useNotification } from "@/lib/stores";
import { getStorefrontUrl } from "@/lib/auth/redirect";

interface StoreData {
  id: string;
  name: string;
  description: string | null;
  subdomain: string;
  customDomain: string | null;
  logo: string | null;
  isActive: boolean;
}

interface SettingsClientProps {
  store: StoreData;
}

export function SettingsClient({ store: initialStore }: SettingsClientProps) {
  const [store, setStore] = useState<StoreData>(initialStore);
  const [form, setForm] = useState({
    name: initialStore.name || "",
    description: initialStore.description || "",
    customDomain: initialStore.customDomain || "",
    logo: initialStore.logo || "",
  });
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "domain" | "danger">("general");
  
  // Use React Query hooks
  const updateStore = useUpdateStore();
  const notification = useNotification();

  const handleSave = async () => {
    setSaved(false);
    
    updateStore.mutate(
      {
        id: store.id,
        name: form.name,
        description: form.description || undefined,
        customDomain: form.customDomain || undefined,
        logo: form.logo || undefined,
      },
      {
        onSuccess: (updated) => {
          setStore({
            ...store,
            name: updated.name || store.name,
            description: updated.description,
            customDomain: updated.customDomain,
            logo: updated.logo,
          });
          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
          notification.success("Settings saved", "Your settings have been saved successfully");
        },
        onError: (error: Error) => {
          notification.error("Failed to save", error.message || "An error occurred while saving settings");
        },
      }
    );
  };

  const tabs = [
    { id: "general" as const, label: "General", icon: Store },
    { id: "domain" as const, label: "Domain", icon: Globe },
    { id: "danger" as const, label: "Danger Zone", icon: AlertTriangle },
  ];

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Store Settings</h1>
        <p className="text-zinc-500 text-sm mt-1">Manage your store configuration</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-100 p-1 rounded-xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {saved && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
        >
          <Check className="w-4 h-4" /> Settings saved successfully
        </motion.div>
      )}

      {/* General Tab */}
      {activeTab === "general" && (
        <div className="bg-white rounded-2xl border border-zinc-100 p-6 space-y-5">
          <h2 className="font-semibold text-zinc-900">General Information</h2>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Store Name *</label>
            <input
              className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Description</label>
            <textarea
              className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
              rows={3}
              placeholder="Tell customers about your store..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Logo URL</label>
            <input
              className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              placeholder="https://..."
              value={form.logo}
              onChange={e => setForm(f => ({ ...f, logo: e.target.value }))}
            />
            {form.logo && (
              <div className="mt-2 w-16 h-16 rounded-xl overflow-hidden border border-zinc-100">
                <img src={form.logo} alt="logo" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
          <div className="pt-2">
            <Button onClick={handleSave} disabled={updateStore.isPending} className="gap-2">
              <Save className="w-4 h-4" />
              {updateStore.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      )}
{/* sds */}
      {/* Domain Tab */}
      {activeTab === "domain" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-zinc-100 p-6 space-y-4">
            <h2 className="font-semibold text-zinc-900">Subdomain</h2>
            <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3">
              <span className="text-sm font-mono text-zinc-900">{store.subdomain}</span>
              <span className="text-sm text-zinc-400">
                {process.env.NEXT_PUBLIC_SINGLE_DOMAIN === "true"
                  ? `.${process.env.NEXT_PUBLIC_ROOT_DOMAIN || "shopkeet.vercel.app"}`
                  : `.${process.env.NEXT_PUBLIC_ROOT_DOMAIN || "shopkeet.com"}`}
              </span>
              <a
                href={getStorefrontUrl(store.subdomain)}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-violet-500 hover:text-violet-600"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <p className="text-xs text-zinc-400">Subdomains cannot be changed after creation.</p>
          </div>

          <div className="bg-white rounded-2xl border border-zinc-100 p-6 space-y-4">
            <h2 className="font-semibold text-zinc-900">Custom Domain</h2>
            <p className="text-sm text-zinc-500">Point your own domain to your ShopKeet store.</p>
            <input
              className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              placeholder="shop.yourdomain.com"
              value={form.customDomain}
              onChange={e => setForm(f => ({ ...f, customDomain: e.target.value }))}
            />
            <div className="bg-zinc-50 rounded-xl p-4 text-xs text-zinc-500 space-y-1">
              <p className="font-medium text-zinc-700">DNS Setup Instructions</p>
              <p>Add a CNAME record pointing to: <code className="bg-zinc-200 px-1 rounded">cname.shopkeet.com</code></p>
            </div>
            <Button onClick={handleSave} disabled={updateStore.isPending} className="gap-2">
              <Save className="w-4 h-4" />
              {updateStore.isPending ? "Saving..." : "Save Domain"}
            </Button>
          </div>
        </div>
      )}

      {/* Danger Zone */}
      {activeTab === "danger" && (
        <div className="bg-white rounded-2xl border border-red-200 p-6 space-y-4">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            <h2 className="font-semibold">Danger Zone</h2>
          </div>
          <p className="text-sm text-zinc-500">
            These actions are irreversible. Please be certain before proceeding.
          </p>
          <div className="border border-red-100 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-zinc-900 text-sm">Delete Store</p>
              <p className="text-xs text-zinc-400 mt-0.5">Permanently delete this store and all its data.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50 gap-2"
              onClick={() => confirm("Are you absolutely sure? This cannot be undone.") && alert("Contact support to delete your store.")}
            >
              <Trash2 className="w-4 h-4" />
              Delete Store
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
