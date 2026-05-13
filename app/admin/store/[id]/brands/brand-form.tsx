"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Save, Check, AlertCircle, ImageIcon } from "lucide-react";
import { useCreateBrand, useUpdateBrand, useBrand, brandKeys } from "@/lib/queries";
import { useNotification } from "@/lib/stores";

interface BrandFormProps {
  storeId: string;
  brandId?: string;
  mode: "create" | "edit";
}

interface FormData {
  name: string;
  slug: string;
  description: string;
  logo: string;
  website: string;
  isActive: boolean;
}

const EMPTY_FORM: FormData = {
  name: "",
  slug: "",
  description: "",
  logo: "",
  website: "",
  isActive: true,
};

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function BrandForm({ storeId, brandId, mode }: BrandFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createBrand = useCreateBrand(storeId);
  const updateBrand = useUpdateBrand(storeId);
  const notification = useNotification();

  // Use React Query to load existing brand in edit mode
  const { data: existingBrand, isLoading } = useBrand(
    storeId,
    brandId ?? "",
  );

  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [savedOk, setSavedOk] = useState(false);
  const [error, setError] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [formInitialized, setFormInitialized] = useState(false);

  // Populate form when brand data loads
  useEffect(() => {
    if (mode === "edit" && existingBrand && !formInitialized) {
      setForm({
        name: existingBrand.name ?? "",
        slug: existingBrand.slug ?? "",
        description: existingBrand.description ?? "",
        logo: existingBrand.logo ?? "",
        website: existingBrand.website ?? "",
        isActive: existingBrand.is_active ?? true,
      });
      setSlugEdited(true);
      setFormInitialized(true);
    }
  }, [mode, existingBrand, formInitialized]);

  const handleNameChange = (name: string) => {
    setForm((prev) => ({ ...prev, name }));
    if (!slugEdited) {
      setForm((prev) => ({ ...prev, slug: slugify(name) }));
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError("Brand name is required");
      return;
    }
    if (!form.slug.trim()) {
      setError("Slug is required");
      return;
    }

    setError("");
    setSavedOk(false);

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description || undefined,
      logo: form.logo || undefined,
      website: form.website || undefined,
      isActive: form.isActive,
    };

    try {
      if (mode === "edit" && brandId) {
        await updateBrand.mutateAsync({ brandId, ...payload });
      } else {
        const newBrand = await createBrand.mutateAsync(payload);
        
        // Immediately update cache with new brand
        queryClient.setQueryData(brandKeys.detail(newBrand.id), newBrand);
        
        // Small delay to ensure cache is updated before redirect
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2000);
      
      notification.success(
        mode === "edit" ? "Brand updated" : "Brand created",
        mode === "edit" ? "The brand has been updated successfully" : "The brand has been created successfully"
      );

      if (mode === "create") {
        router.push(`/store/${storeId}/brands`);
      }
    } catch (error: any) {
      setError(error.message ?? "Failed to save");
      notification.error("Failed to save", error.message ?? "An error occurred while saving the brand");
    }
  };

  const isSaving = createBrand.isPending || updateBrand.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="sticky top-0 z-10 bg-zinc-50 border-b border-zinc-200 -mx-6 px-6 py-3 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/store/${storeId}/brands`} className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Brands
          </Link>
          <span className="text-zinc-300">/</span>
          <span className="text-sm font-medium text-zinc-900">
            {mode === "create" ? "New brand" : "Edit brand"}
          </span>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : savedOk ? (
            <><Check className="w-3.5 h-3.5" />Saved</>
          ) : (
            <><Save className="w-3.5 h-3.5" />Save</>
          )}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
          <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600 text-lg">×</button>
        </div>
      )}

      <div className="space-y-5">
        <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900">Basic Information</h2>
          
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Apple"
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, slug: e.target.value }));
                setSlugEdited(true);
              }}
              placeholder="apple"
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <p className="text-xs text-zinc-400 mt-1">URL: /brands/{form.slug || "slug"}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Describe this brand..."
              rows={4}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Website</label>
            <input
              type="url"
              value={form.website}
              onChange={(e) => setForm((prev) => ({ ...prev, website: e.target.value }))}
              placeholder="https://apple.com"
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900">Logo</h2>
          
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Logo URL</label>
            <input
              type="url"
              value={form.logo}
              onChange={(e) => setForm((prev) => ({ ...prev, logo: e.target.value }))}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {form.logo && (
            <div className="relative w-32 h-32 bg-zinc-100 rounded-lg overflow-hidden border border-zinc-200">
              <img src={form.logo} alt="Preview" className="w-full h-full object-contain p-2" />
            </div>
          )}

          {!form.logo && (
            <div className="flex flex-col items-center justify-center h-32 w-32 bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-lg">
              <ImageIcon className="w-6 h-6 text-zinc-300 mb-1" />
              <p className="text-xs text-zinc-400">No logo</p>
            </div>
          )}
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900">Status</h2>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
              className="w-4 h-4 text-violet-600 border-zinc-300 rounded focus:ring-violet-500"
            />
            <span className="text-sm text-zinc-700">Active (visible on storefront)</span>
          </label>
        </div>
      </div>
    </div>
  );
}
