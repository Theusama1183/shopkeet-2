"use client";

import { useState, useEffect, useCallback, useRef, use } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Data } from "@puckeditor/core";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Eye, Globe, Clock } from "lucide-react";
import Link from "next/link";
import { ErrorBoundary } from "@/components/error-boundary";

// PERF-006: Dynamic import Puck Editor (~180KB lazy-loaded)
const PuckEditor = dynamic(() => import("@/components/puck/editor").then(mod => ({ default: mod.PuckEditor })), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-zinc-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-zinc-500">Loading editor...</p>
      </div>
    </div>
  ),
});

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

function DesignPageContent({
  storeId,
  pageId,
}: {
  storeId: string;
  pageId: string;
}) {
  const router = useRouter();
  const [page, setPage] = useState<PageData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  // M-1: Track unsaved changes to warn before leaving
  const [isDirty, setIsDirty] = useState(false);

  // Latest content ref — updated by Puck's onChange without causing re-renders
  const latestData = useRef<Data | null>(null);

  useEffect(() => {
    const loadPage = async () => {
      try {
        // Fetch page data and store subdomain in one go
        const [pageRes, storeRes] = await Promise.all([
          fetch(`/api/stores/${storeId}/pages/${pageId}`),
          fetch(`/api/stores/${storeId}`),
        ]);
        if (pageRes.ok) {
          const data = await pageRes.json();
          const storeData = storeRes.ok ? await storeRes.json() : null;
          setPage({ ...data, store: storeData });
          latestData.current = data.content;
        } else {
          router.push(`/admin/store/${storeId}/pages`);
        }
      } catch {
        router.push(`/admin/store/${storeId}/pages`);
      } finally {
        setIsLoading(false);
      }
    };
    loadPage();
  }, [storeId, pageId, router]);

  // M-1: Warn before leaving with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // Called by Puck's onChange — store latest data in ref, NO state update
  // This is the key fix: state update here caused parent re-render → Puck remount
  const handleChange = useCallback(async (data: Data) => {
    latestData.current = data;
    setIsDirty(true); // M-1: Mark as having unsaved changes
  }, []);

  // Called by Save button or Puck's onPublish
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
          // Only update page metadata (title, isPublished, etc.) — NOT content
          // Updating content here would cause Puck to remount
          setPage((prev) =>
            prev
              ? { ...prev, isPublished: updated.isPublished, title: updated.title }
              : updated
          );
          setSaveError(null);
          setIsDirty(false); // M-1: Reset dirty flag after successful save
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

  // Manual save button — uses latest data from ref
  const handleManualSave = useCallback(() => {
    if (latestData.current) {
      handleSave(latestData.current, false);
    }
  }, [handleSave]);

  // M-2: Build correct storefront preview URL using store subdomain
  const previewUrl = page?.store?.subdomain
    ? `https://${page.store.subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}/${page.slug}`
    : null;

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
      {/* Topbar */}
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
          <span className="text-sm font-medium text-zinc-900 truncate max-w-50">
            {page.title}
          </span>
          {/* M-1: Show unsaved indicator */}
          {isDirty && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
              Unsaved
            </span>
          )}
          {!isDirty && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                page.isPublished
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              {page.isPublished ? (
                <><Globe className="w-3 h-3" /> Published</>
              ) : (
                <><Clock className="w-3 h-3" /> Draft</>
              )}
            </span>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {saveError && (
            <span className="text-xs text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded-lg max-w-48 truncate" title={saveError}>
              {saveError}
            </span>
          )}
          {/* M-2: Preview opens the actual storefront URL */}
          {page.isPublished && previewUrl && (
            <a href={previewUrl} target="_blank" rel="noopener noreferrer">
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
                <Eye className="w-3.5 h-3.5" />
                Preview
              </button>
            </a>
          )}
          <button
            onClick={handleManualSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={() => latestData.current && handleSave(latestData.current, true)}
            disabled={isSaving || page.isPublished}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50"
          >
            Publish
          </button>
        </div>
      </header>

      {/* Full-height editor — stable props prevent remount */}
      <div className="flex-1 overflow-hidden">
        <PuckEditor
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
