"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Save, Check, AlertCircle, ImageIcon } from "lucide-react";
import { useCreateCollection, useUpdateCollection, collectionKeys } from "@/lib/queries";
import { useNotification } from "@/lib/stores";

interface CollectionFormProps {
  storeId: string;
  collectionId?: string;
  mode: "create" | "edit";
}

interface FormData {
  name: string;
  slug: string;
  description: string;
  image: string;
  isActive: boolean;
}

const EMPTY_FORM: FormData = {
  name: "",
  slug: "",
  description: "",
  image: "",
  isActive: true,
};

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function CollectionForm({ storeId, collectionId, mode }: CollectionFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createCollection = useCreateCollection(storeId);
  const updateCollection = useUpdateCollection(storeId);
  const notification = useNotification();
  
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [savedOk, setSavedOk] = useState(false);
  const [error, setError] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);

  // Load existing collection
  useEffect(() => {
    if (mode !== "edit" || !collectionId) return;
    fetch(`/api/stores/${storeId}/collections/${collectionId}`)
      .then((r) => r.json())
      .then((data) => {
        setForm({
          name: data.name ?? "",
          slug: data.slug ?? "",
          description: data.description ?? "",
          image: data.image ?? "",
          isActive: data.is_active ?? true,
        });
        setSlugEdited(!!data.slug);
      })
      .catch(() => router.push(`/store/${storeId}/collections`))
      .finally(() => setIsLoading(false));
  }, [mode, collectionId, storeId, router]);

  const handleNameChange = (name: string) => {
    setForm((prev) => ({ ...prev, name }));
    if (!slugEdited) {
      setForm((prev) => ({ ...prev, slug: slugify(name) }));
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError("Collection name is required");
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
      image: form.image || undefined,
      isActive: form.isActive,
    };

    try {
      if (mode === "edit" && collectionId) {
        await updateCollection.mutateAsync({ collectionId, ...payload });
      } else {
        const newCollection = await createCollection.mutateAsync(payload);
        
        // Immediately update cache with new collection
        queryClient.setQueryData(collectionKeys.detail(newCollection.id), newCollection);
        
        // Small delay to ensure cache is updated before redirect
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2000);
      
      notification.success(
        mode === "edit" ? "Collection updated" : "Collection created",
        mode === "edit" ? "The collection has been updated successfully" : "The collection has been created successfully"
      );

      if (mode === "create") {
        router.push(`/store/${storeId}/collections`);
      }
    } catch (error: any) {
      setError(error.message ?? "Failed to save");
      notification.error("Failed to save", error.message ?? "An error occurred while saving the collection");
    }
  };

  const isSaving = createCollection.isPending || updateCollection.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-zinc-50 border-b border-zinc-200 -mx-6 px-6 py-3 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/store/${storeId}/collections`}
            className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Collections
          </Link>
          <span className="text-zinc-300">/</span>
          <span className="text-sm font-medium text-zinc-900">
            {mode === "create" ? "New collection" : "Edit collection"}
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

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
          <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600 text-lg">×</button>
        </div>
      )}

      {/* Form */}
      <div className="space-y-5">
        {/* Basic Info */}
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
              placeholder="Summer Sale"
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
              placeholder="summer-sale"
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <p className="text-xs text-zinc-400 mt-1">URL: /collections/{form.slug || "slug"}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Describe this collection..."
              rows={4}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            />
          </div>
        </div>

        {/* Image */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900">Image</h2>
          
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Image URL</label>
            <input
              type="url"
              value={form.image}
              onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.value }))}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {form.image && (
            <div className="relative w-full h-48 bg-zinc-100 rounded-lg overflow-hidden border border-zinc-200">
              <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}

          {!form.image && (
            <div className="flex flex-col items-center justify-center h-48 bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-lg">
              <ImageIcon className="w-8 h-8 text-zinc-300 mb-2" />
              <p className="text-sm text-zinc-400">No image</p>
            </div>
          )}
        </div>

        {/* Status */}
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
