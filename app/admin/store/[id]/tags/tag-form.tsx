"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Save, Check, AlertCircle, Bookmark } from "lucide-react";
import { useCreateTag, useUpdateTag, useTag, tagKeys } from "@/lib/queries";
import { useNotification } from "@/lib/stores";

interface TagFormProps {
  storeId: string;
  tagId?: string;
  mode: "create" | "edit";
}

interface FormData {
  name: string;
  slug: string;
  color: string;
}

const EMPTY_FORM: FormData = {
  name: "",
  slug: "",
  color: "#6366f1",
};

const PRESET_COLORS = [
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#f43f5e", // Rose
  "#ef4444", // Red
  "#f97316", // Orange
  "#f59e0b", // Amber
  "#eab308", // Yellow
  "#84cc16", // Lime
  "#22c55e", // Green
  "#10b981", // Emerald
  "#14b8a6", // Teal
  "#06b6d4", // Cyan
  "#0ea5e9", // Sky
  "#3b82f6", // Blue
  "#6366f1", // Indigo
];

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function TagForm({ storeId, tagId, mode }: TagFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createTag = useCreateTag(storeId);
  const updateTag = useUpdateTag(storeId);
  const notification = useNotification();

  // React Query — load existing tag in edit mode
  const { data: existingTag, isLoading } = useTag(storeId, tagId ?? "");

  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [savedOk, setSavedOk] = useState(false);
  const [error, setError] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [formInitialized, setFormInitialized] = useState(false);

  // Populate form when tag data loads
  useEffect(() => {
    if (mode === "edit" && existingTag && !formInitialized) {
      setForm({
        name: existingTag.name ?? "",
        slug: existingTag.slug ?? "",
        color: existingTag.color ?? "#6366f1",
      });
      setSlugEdited(true);
      setFormInitialized(true);
    }
  }, [mode, existingTag, formInitialized]);

  const handleNameChange = (name: string) => {
    setForm((prev) => ({ ...prev, name }));
    if (!slugEdited) {
      setForm((prev) => ({ ...prev, slug: slugify(name) }));
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError("Tag name is required");
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
      color: form.color,
    };

    try {
      if (mode === "edit" && tagId) {
        await updateTag.mutateAsync({ tagId, ...payload });
      } else {
        const newTag = await createTag.mutateAsync(payload);
        
        // Immediately update cache with new tag
        queryClient.setQueryData(tagKeys.detail(newTag.id), newTag);
        
        // Small delay to ensure cache is updated before redirect
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2000);
      
      notification.success(
        mode === "edit" ? "Tag updated" : "Tag created",
        mode === "edit" ? "The tag has been updated successfully" : "The tag has been created successfully"
      );

      if (mode === "create") {
        router.push(`/store/${storeId}/tags`);
      }
    } catch (error: any) {
      setError(error.message ?? "Failed to save");
      notification.error("Failed to save", error.message ?? "An error occurred while saving the tag");
    }
  };

  const isSaving = createTag.isPending || updateTag.isPending;

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
          <Link href={`/store/${storeId}/tags`} className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Tags
          </Link>
          <span className="text-zinc-300">/</span>
          <span className="text-sm font-medium text-zinc-900">
            {mode === "create" ? "New tag" : "Edit tag"}
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
              placeholder="Featured"
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
              placeholder="featured"
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900">Color</h2>
          
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Custom Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))}
                className="w-12 h-12 border border-zinc-200 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={form.color}
                onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))}
                placeholder="#6366f1"
                className="flex-1 px-3 py-2 border border-zinc-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Preset Colors</label>
            <div className="grid grid-cols-8 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, color }))}
                  className="w-10 h-10 rounded-lg border-2 transition-all hover:scale-110"
                  style={{
                    backgroundColor: color,
                    borderColor: form.color === color ? "#18181b" : "transparent",
                  }}
                  title={color}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-lg border border-zinc-200">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: `${form.color}15`,
                borderColor: `${form.color}30`,
                border: "1px solid",
              }}
            >
              <Bookmark className="w-6 h-6" style={{ color: form.color }} />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900">{form.name || "Tag Name"}</p>
              <p className="text-xs text-zinc-400 font-mono">{form.color}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
