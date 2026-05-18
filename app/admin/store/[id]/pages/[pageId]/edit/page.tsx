"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Save, Trash2,
  ChevronDown, ChevronUp, AlertCircle, Check,
  ExternalLink, Palette, Search,
} from "lucide-react";

interface PageData {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  isHome: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  layoutId: string;
  updatedAt: string;
  createdAt: string;
}

export default function EditPagePage({
  params,
}: {
  params: Promise<{ id: string; pageId: string }>;
}) {
  const { id: storeId, pageId } = use(params);
  const router = useRouter();
  const [page, setPage] = useState<PageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showSeoSection, setShowSeoSection] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [isHome, setIsHome] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);

  useEffect(() => {
    if (!storeId || !pageId) return;
    let cancelled = false;
    const load = async () => {
      try {
        const pRes = await fetch(`/api/stores/${storeId}/pages/${pageId}`);
        if (pRes.ok) {
          const data: PageData = await pRes.json();
          if (!cancelled) {
            setPage(data);
            setTitle(data.title);
            setSlug(data.slug);
            setIsHome(data.isHome);
            setIsPublished(data.isPublished);
            setMetaTitle(data.metaTitle ?? "");
            setMetaDescription(data.metaDescription ?? "");
          }
        } else if (!cancelled) {
          setFetchError(true);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [storeId, pageId]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slugEdited) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim());
    }
  };

  const handleSave = async (publishOverride?: boolean) => {
    if (!title.trim() || !slug.trim()) { setError("Title and slug are required"); return; }
    setIsSaving(true); setError(""); setSaved(false);
    try {
      const res = await fetch(`/api/stores/${storeId}/pages/${pageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim(),
          isHome,
          isPublished: publishOverride !== undefined ? publishOverride : isPublished,
          metaTitle: metaTitle.trim() || null,
          metaDescription: metaDescription.trim() || null,
        }),
      });
      if (!res.ok) { const e = await res.json(); setError(e.message || "Failed to save"); return; }
      const updated: PageData = await res.json();
      setPage(updated);
      setIsPublished(updated.isPublished);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Something went wrong");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await fetch(`/api/stores/${storeId}/pages/${pageId}`, { method: "DELETE" });
      router.push(`/store/${storeId}/pages`);
    } catch {
      setIsDeleting(false);
      setShowDelete(false);
    }
  };

  const liveUrl = `http://${process.env.NEXT_PUBLIC_ROOT_DOMAIN || "lvh.me:3000"}`;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-3 text-red-400" />
          <p className="text-zinc-900 font-semibold mb-2">Failed to load page</p>
          <p className="text-sm text-zinc-500">There was an error loading this page. Please try again.</p>
        </div>
      </div>
    );
  }

  if (!page) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-0">

      {/* ── Breadcrumb + top actions ── */}
      <div className="flex items-center justify-between pb-5">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href={`/store/${storeId}/pages`} className="hover:text-zinc-900 transition-colors flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Pages
          </Link>
          <span>/</span>
          <span className="text-zinc-900 font-medium truncate max-w-48">{page.title}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* View live */}
          {isPublished && (
            <a href={liveUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
              <ExternalLink className="w-3.5 h-3.5" />
              View
            </a>
          )}

          {/* Design editor */}
          <Link href={`/store/${storeId}/design/${pageId}`}>
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
              <Palette className="w-3.5 h-3.5" />
              Design
            </button>
          </Link>

          {/* Save */}
          <button
            onClick={() => handleSave()}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</>
            ) : saved ? (
              <><Check className="w-3.5 h-3.5" />Saved</>
            ) : (
              <><Save className="w-3.5 h-3.5" />Save</>
            )}
          </button>
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-4">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
          <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600"><span>×</span></button>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── Left: Main content ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Title */}
          <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">
                Page Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. About Us"
                className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">
                URL Handle
              </label>
              <div className="flex items-center gap-0 border border-zinc-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-violet-500">
                <span className="px-3 py-2.5 text-sm text-zinc-400 bg-zinc-50 border-r border-zinc-200 whitespace-nowrap shrink-0">
                  /{" "}
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => { setSlug(e.target.value); setSlugEdited(true); }}
                  placeholder="page-url-handle"
                  className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
                />
              </div>
              <p className="text-xs text-zinc-400 mt-1.5">
                yourstore.lvh.me/{slug || "page-url-handle"}
              </p>
            </div>
          </div>

          {/* SEO — collapsible */}
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <button
              onClick={() => setShowSeoSection(!showSeoSection)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-zinc-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-zinc-400" />
                <span className="text-sm font-semibold text-zinc-900">Search Engine Optimization</span>
              </div>
              {showSeoSection
                ? <ChevronUp className="w-4 h-4 text-zinc-400" />
                : <ChevronDown className="w-4 h-4 text-zinc-400" />
              }
            </button>

            {showSeoSection && (
              <div className="px-5 pb-5 space-y-4 border-t border-zinc-100">
                {/* SEO preview */}
                <div className="mt-4 p-4 bg-zinc-50 rounded-xl border border-zinc-200">
                  <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-2">Search Preview</p>
                  <p className="text-blue-600 text-sm font-medium truncate">
                    {metaTitle || title || "Page Title"}
                  </p>
                  <p className="text-green-700 text-xs truncate">
                    yourstore.lvh.me/{slug}
                  </p>
                  <p className="text-zinc-500 text-xs mt-1 line-clamp-2">
                    {metaDescription || "Add a meta description to improve your search engine ranking."}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">
                    Meta Title
                    <span className="ml-2 font-normal normal-case text-zinc-400">
                      {metaTitle.length}/60
                    </span>
                  </label>
                  <input
                    type="text"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    maxLength={60}
                    placeholder={title || "Page title for search engines"}
                    className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">
                    Meta Description
                    <span className="ml-2 font-normal normal-case text-zinc-400">
                      {metaDescription.length}/160
                    </span>
                  </label>
                  <textarea
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    maxLength={160}
                    rows={3}
                    placeholder="Brief description for search engines (150–160 characters recommended)"
                    className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                  />
                  <div className="mt-1 h-1 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        metaDescription.length > 160 ? "bg-red-500" :
                        metaDescription.length > 130 ? "bg-emerald-500" :
                        "bg-violet-500"
                      }`}
                      style={{ width: `${Math.min((metaDescription.length / 160) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Sidebar ── */}
        <div className="space-y-5">

          {/* Visibility / Status */}
          <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-zinc-900">Visibility</h3>

            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <p className="text-sm font-medium text-zinc-900">Published</p>
                  <p className="text-xs text-zinc-500">Visible to store visitors</p>
                </div>
                <button
                  onClick={() => setIsPublished(!isPublished)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isPublished ? "bg-emerald-500" : "bg-zinc-200"
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    isPublished ? "translate-x-6" : "translate-x-1"
                  }`} />
                </button>
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <p className="text-sm font-medium text-zinc-900">Homepage</p>
                  <p className="text-xs text-zinc-500">Set as store home page</p>
                </div>
                <button
                  onClick={() => setIsHome(!isHome)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isHome ? "bg-violet-600" : "bg-zinc-200"
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    isHome ? "translate-x-6" : "translate-x-1"
                  }`} />
                </button>
              </label>
            </div>

            {/* Status badge */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
              isPublished
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-zinc-100 text-zinc-600 border border-zinc-200"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? "bg-emerald-500" : "bg-zinc-400"}`} />
              {isPublished ? "Published" : "Draft — not visible to visitors"}
            </div>

            {/* Publish / Unpublish button */}
            <button
              onClick={() => handleSave(!isPublished)}
              disabled={isSaving}
              className={`w-full py-2 text-sm font-medium rounded-lg transition-colors ${
                isPublished
                  ? "border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                  : "bg-violet-600 text-white hover:bg-violet-700"
              }`}
            >
              {isPublished ? "Unpublish" : "Publish page"}
            </button>
          </div>

          {/* Page info */}
          <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-zinc-900">Page Info</h3>
            <div className="space-y-2 text-xs text-zinc-500">
              <div className="flex justify-between">
                <span>Created</span>
                <span className="text-zinc-700">
                  {new Date(page.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Last updated</span>
                <span className="text-zinc-700">
                  {new Date(page.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Template</span>
                <span className="text-zinc-700 capitalize">{page.layoutId}</span>
              </div>
            </div>
          </div>

          {/* Design editor shortcut */}
          <Link href={`/store/${storeId}/design/${pageId}`}>
            <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 hover:bg-violet-100 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-violet-600 rounded-lg flex items-center justify-center shrink-0">
                  <Palette className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-violet-900">Open Design Editor</p>
                  <p className="text-xs text-violet-600">Drag & drop page builder</p>
                </div>
                <ExternalLink className="w-4 h-4 text-violet-400 group-hover:text-violet-600 transition-colors" />
              </div>
            </div>
          </Link>

          {/* Danger zone */}
          <div className="bg-white rounded-xl border border-zinc-200 p-5">
            <h3 className="text-sm font-semibold text-zinc-900 mb-3">Danger Zone</h3>
            {!showDelete ? (
              <button
                onClick={() => setShowDelete(true)}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete this page
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-zinc-600">
                  Are you sure? This will permanently delete <strong>{page.title}</strong> and cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDelete(false)}
                    className="flex-1 py-2 text-xs font-medium text-zinc-700 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex-1 py-2 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
