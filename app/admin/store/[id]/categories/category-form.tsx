"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Save, Check, AlertCircle, ImageIcon } from "lucide-react";
import { useCreateCategory, useUpdateCategory, useCategory, useCategories, categoryKeys } from "@/lib/queries";
import { useNotification } from "@/lib/stores";

interface CategoryFormProps {
  storeId: string;
  categoryId?: string;
  mode: "create" | "edit";
}

interface FormData {
  name: string;
  slug: string;
  description: string;
  image: string;
  parentId: string;
  isActive: boolean;
}

const EMPTY_FORM: FormData = {
  name: "",
  slug: "",
  description: "",
  image: "",
  parentId: "",
  isActive: true,
};

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function CategoryForm({ storeId, categoryId, mode }: CategoryFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createCategory = useCreateCategory(storeId);
  const updateCategory = useUpdateCategory(storeId);
  const notification = useNotification();

  // React Query — load existing category and all categories for parent selector
  const { data: existingCategory, isLoading } = useCategory(storeId, categoryId ?? "");
  const { data: allCategories = [] } = useCategories(storeId);

  // Filter out current category from parent options
  const parentOptions = allCategories.filter((c) => c.id !== categoryId);

  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [savedOk, setSavedOk] = useState(false);
  const [error, setError] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [formInitialized, setFormInitialized] = useState(false);

  // Populate form when category data loads
  useEffect(() => {
    if (mode === "edit" && existingCategory && !formInitialized) {
      setForm({
        name: existingCategory.name ?? "",
        slug: existingCategory.slug ?? "",
        description: existingCategory.description ?? "",
        image: existingCategory.image ?? "",
        parentId: existingCategory.parent_id ?? "",
        isActive: existingCategory.is_active ?? true,
      });
      setSlugEdited(true);
      setFormInitialized(true);
    }
  }, [mode, existingCategory, formInitialized]);

  const handleNameChange = (name: string) => {
    setForm((prev) => ({ ...prev, name }));
    if (!slugEdited) {
      setForm((prev) => ({ ...prev, slug: slugify(name) }));
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError("Category name is required");
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
      parentId: form.parentId || undefined,
      isActive: form.isActive,
    };

    try {
      if (mode === "edit" && categoryId) {
        await updateCategory.mutateAsync({ categoryId, ...payload });
      } else {
        const newCategory = await createCategory.mutateAsync(payload);
        
        // Immediately update cache with new category
        queryClient.setQueryData(categoryKeys.detail(newCategory.id), newCategory);
        
        // Small delay to ensure cache is updated before redirect
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2000);
      
      notification.success(
        mode === "edit" ? "Category updated" : "Category created",
        mode === "edit" ? "The category has been updated successfully" : "The category has been created successfully"
      );

      if (mode === "create") {
        router.push(`/store/${storeId}/categories`);
      }
    } catch (error: any) {
      setError(error.message ?? "Failed to save");
      notification.error("Failed to save", error.message ?? "An error occurred while saving the category");
    }
  };

  const isSaving = createCategory.isPending || updateCategory.isPending;

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
          <Link href={`/store/${storeId}/categories`} className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Categories
          </Link>
          <span className="text-zinc-300">/</span>
          <span className="text-sm font-medium text-zinc-900">
            {mode === "create" ? "New category" : "Edit category"}
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
              placeholder="Electronics"
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
              placeholder="electronics"
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <p className="text-xs text-zinc-400 mt-1">URL: /categories/{form.slug || "slug"}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Parent Category</label>
            <select
              value={form.parentId}
              onChange={(e) => setForm((prev) => ({ ...prev, parentId: e.target.value }))}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">None (Root category)</option>
              {parentOptions.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Describe this category..."
              rows={4}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            />
          </div>
        </div>

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
