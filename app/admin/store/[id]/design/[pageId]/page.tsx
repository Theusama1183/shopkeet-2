"use client";

import { useState, useEffect, useCallback, useRef, use } from "react";
import dynamic from "next/dynamic";
import { Data } from "@puckeditor/core";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Eye, Globe, Clock, ExternalLink, Settings } from "lucide-react";
import Link from "next/link";
import { ErrorBoundary } from "@/components/error-boundary";
import { VersionHistoryButton } from "@/components/puck/version-history";

// PERF-006: Dynamic import Puck Editor (~180KB lazy-loaded)
const PuckEditor = dynamic(
  () => import("@/components/puck/editor").then((mod) => ({ default: mod.PuckEditor })),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-zinc-500">Loading editor...</p>
        </div>
      </div>
    ),
  }
);

interface PageData {
  id: string;
  title: string;
  slug: string;
  content: Data;
  layoutId: string;
  isHome: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  isPublished: boolean;
  storeId: string;
  store?: { subdomain: string };
}

function DesignPageContent({ storeId, pageId }: { storeId: string; pageId: string }) {
  const [page, setPage]           = useState<PageData | null>(null);
  const [isSaving, setIsSaving]   = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [retryKey, setRetryKey]   = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isDirty, setIsDirty]     = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  // SEO panel state
  const [showSeo, setShowSeo]     = useState(false);
  const [seoTitle, setSeoTitle]   = useState("");
  const [seoDesc, setSeoDesc]     = useState("");
  const [seoSaving, setSeoSaving] = useState(false);

  // Latest content ref — updated by Puck's onChange without causing re-renders
  const latestData = useRef<Data | null>(null);

  // ── Load page + store ──────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const loadPage = async () => {
      try {
        const [pageRes, storeRes] = await Promise.all([
          fetch(`/api/stores/${storeId}/pages/${pageId}`),
          fetch(`/api/stores/${storeId}`),
        ]);
        if (pageRes.ok) {
          const data = await pageRes.json();
          const storeData = storeRes.ok ? await storeRes.json() : null;
          if (!cancelled) {
            setPage({ ...data, store: storeData });
            latestData.current = data.content;
            setSeoTitle(data.metaTitle ?? "");
            setSeoDesc(data.metaDescription ?? "");
          }
        } else if (!cancelled) {
          setFetchError(true);
        }
      } catch {
        if (!cancelled) setFetchError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    loadPage();
    return () => { cancelled = true; };
  }, [storeId, pageId, retryKey]);

  // ── Unsaved changes warning ────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // ── Puck onChange — ref only, no state update ──────────────────────────────
  const handleChange = useCallback(async (data: Data) => {
    latestData.current = data;
    setIsDirty(true);
  }, []);

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = useCallback(
    async (data: Data, publish?: boolean) => {
      setIsSaving(true);
      try {
        const response = await fetch(`/api/stores/${storeId}/pages/${pageId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: data,
            isPublished: publish !== undefined ? publish : page?.isPublished,
          }),
        });
        if (response.ok) {
          const updated = await response.json();
          setPage((prev) =>
            prev ? { ...prev, isPublished: updated.isPublished, title: updated.title } : updated
          );
          setSaveError(null);
          setIsDirty(false);
        } else {
          const err = await response.json().catch(() => ({}));
          setSaveError(err.error || "Failed to save. Please try again.");
        }
      } catch (err) {
        console.error("Save failed:", err);
        setSaveError("Network error. Please check your connection.");
      } finally {
        setIsSaving(false);
      }
    },
    [storeId, pageId, page?.isPublished]
  );

  const handleManualSave = useCallback(() => {
    if (latestData.current) handleSave(latestData.current, false);
  }, [handleSave]);

  // ── SEO save ───────────────────────────────────────────────────────────────
  const handleSeoSave = useCallback(async () => {
    setSeoSaving(true);
    try {
      const res = await fetch(`/api/stores/${storeId}/pages/${pageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metaTitle: seoTitle.trim() || null,
          metaDescription: seoDesc.trim() || null,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPage((prev) =>
          prev
            ? { ...prev, metaTitle: updated.metaTitle, metaDescription: updated.metaDescription }
            : prev
        );
        setShowSeo(false);
      }
    } catch (err) {
      console.error("SEO save failed:", err);
    } finally {
      setSeoSaving(false);
    }
  }, [storeId, pageId, seoTitle, seoDesc]);

  // ── Version restore ────────────────────────────────────────────────────────
  // When a version is restored, update page content and remount the editor
  const handleVersionRestore = useCallback((restoredContent: unknown) => {
    setPage((prev) => {
      if (!prev) return prev;
      const newPage = { ...prev, content: restoredContent as Data };
      latestData.current = restoredContent as Data;
      return newPage;
    });
    setIsDirty(true);
    // Increment key to force PuckEditor remount with new content
    setEditorKey((k) => k + 1);
  }, []);

  // ── Preview URLs — respect single-domain vs subdomain mode ──────────────
  const singleDomain = process.env.NEXT_PUBLIC_SINGLE_DOMAIN === "true";

  const livePreviewUrl = page?.store?.subdomain
    ? singleDomain
      ? `/store/${page.store.subdomain}/${page.slug}`
      : `https://${page.store.subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}/${page.slug}`
    : null;

  const draftPreviewUrl = page?.store?.subdomain
    ? singleDomain
      ? `/store/${page.store.subdomain}/${page.slug}?preview=${pageId}`
      : `https://${page.store.subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}/${page.slug}?preview=${pageId}`
    : null;

  // ── Loading / error / not found ──────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-zinc-500">Loading editor...</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-zinc-900 font-semibold mb-2">Failed to load page</p>
          <p className="text-sm text-zinc-500 mb-4">There was an error loading the editor. Please try again.</p>
          <div className="flex items-center justify-center gap-2">
            <Button size="sm" variant="outline" onClick={() => { setFetchError(false); setIsLoading(true); setRetryKey(k => k + 1); }}>
              Retry
            </Button>
            <Link href={`/admin/store/${storeId}/pages`}>
              <Button size="sm" variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Pages
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-zinc-900 font-semibold mb-2">Page not found</p>
          <Link href={`/admin/store/${storeId}/pages`}>
            <Button size="sm" variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Pages
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* ── Topbar ── */}
      <header className="h-12 bg-white border-b border-zinc-200 flex items-center justify-between px-4 shrink-0 z-50">
        {/* Left */}
        <div className="flex items-center gap-3">
          <Link href={`/admin/store/${storeId}/pages`}>
            <button className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Pages
            </button>
          </Link>
          <span className="text-zinc-300">/</span>
          <span className="text-sm font-medium text-zinc-900 truncate max-w-48">
            {page.title}
          </span>

          {/* Status badge */}
          {isDirty ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
              Unsaved
            </span>
          ) : (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
              page.isPublished
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-zinc-100 text-zinc-600 border border-zinc-200"
            }`}>
              {page.isPublished
                ? <><Globe className="w-3 h-3" /> Published</>
                : <><Clock className="w-3 h-3" /> Draft</>
              }
            </span>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {saveError && (
            <span
              className="text-xs text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded-lg max-w-48 truncate"
              title={saveError}
            >
              {saveError}
            </span>
          )}

          {/* Version history */}
          <VersionHistoryButton
            storeId={storeId}
            pageId={pageId}
            onRestore={handleVersionRestore}
          />

          {/* SEO settings */}
          <button
            onClick={() => setShowSeo(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
            title="SEO settings"
          >
            <Settings className="w-3.5 h-3.5" />
            SEO
          </button>

          {/* Draft preview — always available */}
          {draftPreviewUrl && (
            <a href={draftPreviewUrl} target="_blank" rel="noopener noreferrer">
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
                <Eye className="w-3.5 h-3.5" />
                Preview
              </button>
            </a>
          )}

          {/* Live link — only when published */}
          {page.isPublished && livePreviewUrl && (
            <a href={livePreviewUrl} target="_blank" rel="noopener noreferrer">
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 border border-emerald-200 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors">
                <ExternalLink className="w-3.5 h-3.5" />
                Live
              </button>
            </a>
          )}

          {/* Save */}
          <button
            onClick={handleManualSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? "Saving..." : "Save"}
          </button>

          {/* Publish / Unpublish */}
          {page.isPublished ? (
            <button
              onClick={() => latestData.current && handleSave(latestData.current, false)}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors disabled:opacity-50"
            >
              Unpublish
            </button>
          ) : (
            <button
              onClick={() => latestData.current && handleSave(latestData.current, true)}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50"
            >
              Publish
            </button>
          )}
        </div>
      </header>

      {/* ── SEO Panel ── */}
      {showSeo && (
        <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowSeo(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div>
              <h2 className="text-base font-semibold text-zinc-900">SEO Settings</h2>
              <p className="text-sm text-zinc-500 mt-1">
                Customize how this page appears in search results.
              </p>
            </div>

            {/* Meta Title */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Meta Title
                </label>
                <span className={`text-xs ${seoTitle.length > 60 ? "text-red-500" : "text-zinc-400"}`}>
                  {seoTitle.length}/60
                </span>
              </div>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder={page?.title ?? "Page title"}
                maxLength={60}
                className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
              <p className="text-xs text-zinc-400 mt-1">
                Leave blank to use the page title. Recommended: 50–60 characters.
              </p>
            </div>

            {/* Meta Description */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Meta Description
                </label>
                <span className={`text-xs ${seoDesc.length > 160 ? "text-red-500" : "text-zinc-400"}`}>
                  {seoDesc.length}/160
                </span>
              </div>
              <textarea
                value={seoDesc}
                onChange={(e) => setSeoDesc(e.target.value)}
                placeholder="Brief description of this page for search engines..."
                maxLength={160}
                rows={3}
                className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-zinc-400 mt-1">
                Recommended: 120–160 characters.
              </p>
            </div>

            {/* Search preview */}
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
              <p className="text-xs font-medium text-zinc-500 mb-2">Search Preview</p>
              <p className="text-sm font-medium text-blue-700 truncate">
                {seoTitle || page?.title || "Page Title"}
              </p>
              <p className="text-xs text-green-700 truncate">
                {page?.store?.subdomain
                  ? singleDomain
                    ? `/store/${page.store.subdomain}/${page?.slug}`
                    : `https://${page.store.subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}/${page?.slug}`
                  : `yourstore.com/${page?.slug}`}
              </p>
              <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                {seoDesc || "No description set. Add a meta description to improve click-through rates."}
              </p>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowSeo(false)}
                className="flex-1 py-2.5 text-sm font-medium text-zinc-700 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSeoSave}
                disabled={seoSaving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50"
              >
                {seoSaving ? (
                  <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</>
                ) : (
                  "Save SEO"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Editor ── */}
      <div className="flex-1 overflow-hidden">
        <PuckEditor
          key={editorKey}
          data={page.content}
          onPublish={(data) => handleSave(data, true)}
          onSave={handleChange}
          layoutId={page.layoutId}
          storeId={storeId}
        />
      </div>
    </div>
  );
}

export default function DesignPage({
  params,
}: {
  params: Promise<{ id: string; pageId: string }>;
}) {
  const { id: storeId, pageId } = use(params);
  return (
    <ErrorBoundary>
      <DesignPageContent storeId={storeId} pageId={pageId} />
    </ErrorBoundary>
  );
}
