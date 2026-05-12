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

  // Latest content ref — updated by Puck's onChange without causing re-renders
  const latestData = useRef<Data | null>(null);

  useEffect(() => {
    const loadPage = async () => {
      try {
        const response = await fetch(`/api/stores/${storeId}/pages/${pageId}`);
        if (response.ok) {
          const data = await response.json();
          setPage(data);
          latestData.current = data.content;
        } else {
          router.push(`/store/${storeId}/pages`);
        }
      } catch {
        router.push(`/store/${storeId}/pages`);
      } finally {
        setIsLoading(false);
      }
    };
    loadPage();
  }, [storeId, pageId, router]);

  // Called by Puck's onChange — store latest data in ref, NO state update
  // This is the key fix: state update here caused parent re-render → Puck remount
  const handleChange = useCallback(async (data: Data) => {
    latestData.current = data;
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
        }
      } catch (err) {
        console.error("Save failed:", err);
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
          <Link href={`/store/${storeId}/pages`}>
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
          <Link href={`/store/${storeId}/pages`}>
            <button className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Pages
            </button>
          </Link>
          <span className="text-zinc-300">/</span>
          <span className="text-sm font-medium text-zinc-900 truncate max-w-50">
            {page.title}
          </span>
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
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {page.isPublished && (
            <Link href={`/${page.slug}`} target="_blank">
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
                <Eye className="w-3.5 h-3.5" />
                Preview
              </button>
            </Link>
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
