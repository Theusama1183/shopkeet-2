"use client";

import { useState, useEffect, useCallback } from "react";
import { History, RotateCcw, X, Clock, AlertTriangle } from "lucide-react";

interface Version {
  id: string;
  title: string;
  created_at: string;
  created_by: string | null;
}

interface VersionHistoryProps {
  storeId: string;
  pageId: string;
  /** Called after a successful restore so the editor can reload the page */
  onRestore: (restoredContent: unknown) => void;
}

export function VersionHistoryButton({
  storeId,
  pageId,
  onRestore,
}: VersionHistoryProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
        title="Version history"
      >
        <History className="w-3.5 h-3.5" />
        History
      </button>

      {open && (
        <VersionHistoryPanel
          storeId={storeId}
          pageId={pageId}
          onRestore={(content) => {
            setOpen(false);
            onRestore(content);
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function VersionHistoryPanel({
  storeId,
  pageId,
  onRestore,
  onClose,
}: VersionHistoryProps & { onClose: () => void }) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchVersions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/stores/${storeId}/pages/${pageId}/versions`);
      if (!res.ok) throw new Error("Failed to load versions");
      const data = await res.json();
      setVersions(Array.isArray(data) ? data : []);
    } catch {
      setError("Could not load version history.");
    } finally {
      setIsLoading(false);
    }
  }, [storeId, pageId]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const handleRestore = async (versionId: string) => {
    setRestoring(versionId);
    setError(null);
    try {
      const res = await fetch(`/api/stores/${storeId}/pages/${pageId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Restore failed");
      }
      const restored = await res.json();
      onRestore(restored.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Restore failed");
    } finally {
      setRestoring(null);
      setConfirmId(null);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="fixed inset-0 z-200 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel — slides in from right */}
      <div className="relative ml-auto w-full max-w-sm bg-white h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 shrink-0">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-zinc-500" />
            <h2 className="text-sm font-semibold text-zinc-900">Version History</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info banner */}
        <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 shrink-0">
          <p className="text-xs text-amber-700">
            Last 20 saves are kept. Restoring replaces the current content.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-5 mt-4 flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 shrink-0">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </div>
        )}

        {/* Version list */}
        <div className="flex-1 overflow-y-auto py-3">
          {isLoading ? (
            <div className="flex flex-col gap-2 px-5 py-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 bg-zinc-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : versions.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-zinc-400">
              <Clock className="w-8 h-8 opacity-30" />
              <p className="text-sm">No saved versions yet</p>
              <p className="text-xs">Versions are saved automatically when you save the page</p>
            </div>
          ) : (
            <ul className="px-3 space-y-1">
              {versions.map((v, idx) => (
                <li key={v.id}>
                  <div className={`flex items-start justify-between gap-3 px-3 py-3 rounded-xl transition-colors ${
                    confirmId === v.id ? "bg-amber-50 border border-amber-200" : "hover:bg-zinc-50"
                  }`}>
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${idx === 0 ? "bg-emerald-500" : "bg-zinc-300"}`} />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-zinc-900 truncate">
                          {idx === 0 ? "Latest save" : v.title}
                        </p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          {formatDate(v.created_at)}
                          <span className="ml-1.5 text-zinc-300">·</span>
                          <span className="ml-1.5">{timeAgo(v.created_at)}</span>
                        </p>
                      </div>
                    </div>

                    {/* Restore button / confirm */}
                    {confirmId === v.id ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setConfirmId(null)}
                          className="px-2 py-1 text-[11px] font-medium text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-100 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleRestore(v.id)}
                          disabled={restoring === v.id}
                          className="px-2 py-1 text-[11px] font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
                        >
                          {restoring === v.id ? "Restoring…" : "Confirm"}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmId(v.id)}
                        disabled={!!restoring}
                        className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-zinc-500 border border-zinc-200 rounded-lg hover:text-violet-600 hover:border-violet-300 hover:bg-violet-50 transition-colors disabled:opacity-40 shrink-0"
                        title="Restore this version"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Restore
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-zinc-100 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 text-sm font-medium text-zinc-700 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
