"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Plus, ChevronDown, ChevronUp, Search, AlertCircle,
} from "lucide-react";
import { getLayoutTemplate } from "@/lib/puck/layouts";
import { useCreatePage } from "@/lib/queries/pages";
import { useQueryClient } from "@tanstack/react-query";
import { pageKeys } from "@/lib/queries/pages";

export default function NewPagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: storeId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const createPage = useCreatePage(storeId);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [isHome, setIsHome] = useState(false);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [showSeo, setShowSeo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slugEdited) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim());
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) { setError("Page title is required"); return; }
    if (!slug.trim()) { setError("URL handle is required"); return; }
    setIsSaving(true); setError("");
    try {
      const newPage = await createPage.mutateAsync({
        title: title.trim(),
        slug: slug.trim(),
        content: getLayoutTemplate("default"),
        metaTitle: metaTitle.trim() || undefined,
        metaDescription: metaDescription.trim() || undefined,
        isPublished: false,
        isHome,
        layoutId: "default",
      });
      
      // Set the new page in cache immediately so it's available on the design page
      queryClient.setQueryData(pageKeys.detail(newPage.id), newPage);
      
      // Wait a moment for cache to propagate
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Now redirect to design page
      router.push(`/admin/store/${storeId}/design/${newPage.id}`);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const isValid = title.trim().length > 0 && slug.trim().length > 0;

  return (
    <div className="max-w-3xl mx-auto space-y-0">

      {/* Header */}
      <div className="flex items-center justify-between pb-5">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href={`/admin/store/${storeId}/pages`} className="hover:text-zinc-900 transition-colors flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Pages
          </Link>
          <span>/</span>
          <span className="text-zinc-900 font-medium">Add page</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/admin/store/${storeId}/pages`}>
            <button className="px-4 py-2 text-sm font-medium text-zinc-700 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
              Discard
            </button>
          </Link>
          <button
            onClick={handleCreate}
            disabled={isSaving || !isValid}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating...</>
            ) : (
              <><Plus className="w-3.5 h-3.5" />Create page</>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-4">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
          <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600">×</button>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">

        {/* Left: Main */}
        <div className="lg:col-span-2 space-y-5">

          {/* Title + Slug */}
          <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">
                Page Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. About Us, Contact, FAQ"
                autoFocus
                className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">
                URL Handle <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center border border-zinc-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-violet-500">
                <span className="px-3 py-2.5 text-sm text-zinc-400 bg-zinc-50 border-r border-zinc-200 shrink-0">/ </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => { setSlug(e.target.value); setSlugEdited(true); }}
                  placeholder="page-url-handle"
                  className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
                />
              </div>
              <p className="text-xs text-zinc-400 mt-1.5">
                This is the URL path customers will use to visit this page.
              </p>
            </div>
          </div>

          {/* SEO — collapsible */}
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <button
              onClick={() => setShowSeo(!showSeo)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-zinc-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-zinc-400" />
                <span className="text-sm font-semibold text-zinc-900">Search Engine Optimization</span>
                <span className="text-xs text-zinc-400">(optional)</span>
              </div>
              {showSeo ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
            </button>
            {showSeo && (
              <div className="px-5 pb-5 space-y-4 border-t border-zinc-100">
                <div className="mt-4 p-4 bg-zinc-50 rounded-xl border border-zinc-200">
                  <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-2">Search Preview</p>
                  <p className="text-blue-600 text-sm font-medium truncate">{metaTitle || title || "Page Title"}</p>
                  <p className="text-green-700 text-xs truncate">yourstore.com/{slug}</p>
                  <p className="text-zinc-500 text-xs mt-1 line-clamp-2">
                    {metaDescription || "Add a meta description to improve your search engine ranking."}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">
                    Meta Title <span className="ml-1 font-normal normal-case text-zinc-400">{metaTitle.length}/60</span>
                  </label>
                  <input type="text" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} maxLength={60}
                    placeholder={title || "Page title for search engines"}
                    className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">
                    Meta Description <span className="ml-1 font-normal normal-case text-zinc-400">{metaDescription.length}/160</span>
                  </label>
                  <textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} maxLength={160} rows={3}
                    placeholder="Brief description for search engines (150–160 characters recommended)"
                    className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none" />
                  <div className="mt-1 h-1 bg-zinc-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${metaDescription.length > 160 ? "bg-red-500" : metaDescription.length > 130 ? "bg-emerald-500" : "bg-violet-500"}`}
                      style={{ width: `${Math.min((metaDescription.length / 160) * 100, 100)}%` }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Sidebar */}
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-zinc-900">Visibility</h3>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-medium text-zinc-900">Homepage</p>
                <p className="text-xs text-zinc-500">Set as store home page</p>
              </div>
              <button onClick={() => setIsHome(!isHome)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isHome ? "bg-violet-600" : "bg-zinc-200"}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isHome ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </label>
            <div className="flex items-center gap-2 px-3 py-2 bg-zinc-100 rounded-lg text-xs text-zinc-600">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
              Page will be saved as Draft
            </div>
          </div>

          <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-violet-900">What happens next?</h3>
            <ol className="space-y-2">
              {["Page is created as a draft", "Visual editor opens automatically", "Drag & drop to design your page", "Publish when you're ready"].map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-violet-700">
                  <span className="w-4 h-4 rounded-full bg-violet-200 text-violet-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}