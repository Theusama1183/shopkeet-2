"use client";

import { useState, useRef, useCallback, useId } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  Upload, X, ImageIcon, Video, File, GripVertical,
  Plus, Loader2, AlertCircle, Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MediaFile {
  id: string;
  url: string;
  name: string;
  type: string;
  size?: number;
  altText?: string;
  isPrimary?: boolean;
}

interface MediaUploaderProps {
  /** Allow multiple files */
  multiple?: boolean;
  /** Accepted MIME types */
  accept?: string;
  /** Max file size in MB */
  maxSizeMb?: number;
  /** Current files */
  value?: MediaFile[];
  /** Called when files change */
  onChange?: (files: MediaFile[]) => void;
  /** Upload folder prefix */
  folder?: string;
  /** Show alt text input per file */
  showAltText?: boolean;
  /** Show primary image selector */
  showPrimary?: boolean;
  /** Compact single-image mode */
  compact?: boolean;
  className?: string;
  disabled?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isImage(type: string) {
  return type.startsWith("image/");
}

function isVideo(type: string) {
  return type.startsWith("video/");
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Thumbnail ─────────────────────────────────────────────────────────────────

function Thumbnail({ file, size = 56 }: { file: MediaFile; size?: number }) {
  if (isImage(file.type)) {
    return (
      <img
        src={file.url}
        alt={file.altText || file.name}
        className="w-full h-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  if (isVideo(file.type)) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-800">
        <Video className="w-5 h-5 text-zinc-400" />
      </div>
    );
  }
  return (
    <div className="w-full h-full flex items-center justify-center bg-zinc-100">
      <File className="w-5 h-5 text-zinc-400" />
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function MediaUploader({
  multiple = true,
  accept = "image/*,video/*",
  maxSizeMb = 50,
  value = [],
  onChange,
  folder = "products",
  showAltText = false,
  showPrimary = false,
  compact = false,
  className,
  disabled = false,
}: MediaUploaderProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [editingAlt, setEditingAlt] = useState<string | null>(null);

  // ── Upload ────────────────────────────────────────────────────────────────

  const uploadFiles = useCallback(
    async (fileList: FileList) => {
      if (disabled) return;
      setUploadError(null);

      const files = Array.from(fileList);
      if (!multiple && files.length > 1) {
        setUploadError("Only one file allowed");
        return;
      }

      // Validate
      for (const f of files) {
        if (f.size > maxSizeMb * 1024 * 1024) {
          setUploadError(`${f.name} exceeds ${maxSizeMb}MB`);
          return;
        }
      }

      setUploading(true);
      try {
        const fd = new FormData();
        files.forEach((f) => fd.append("files", f));
        fd.append("folder", folder);

        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? "Upload failed");
        }
        const { files: uploaded } = await res.json() as {
          files: { url: string; key: string; name: string; size: number; type: string }[];
        };

        const newFiles: MediaFile[] = uploaded.map((u) => ({
          id: u.key,
          url: u.url,
          name: u.name,
          type: u.type,
          size: u.size,
          altText: "",
          isPrimary: value.length === 0 && uploaded.indexOf(u) === 0,
        }));

        const next = multiple ? [...value, ...newFiles] : newFiles;
        onChange?.(next);
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [disabled, multiple, maxSizeMb, folder, value, onChange]
  );

  // ── Drag & drop ───────────────────────────────────────────────────────────

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
    },
    [uploadFiles]
  );

  // ── File actions ──────────────────────────────────────────────────────────

  const removeFile = (id: string) => {
    const next = value.filter((f) => f.id !== id);
    // If removed was primary, make first remaining primary
    if (showPrimary && next.length > 0 && !next.some((f) => f.isPrimary)) {
      next[0] = { ...next[0], isPrimary: true };
    }
    onChange?.(next);
  };

  const setPrimary = (id: string) => {
    onChange?.(value.map((f) => ({ ...f, isPrimary: f.id === id })));
  };

  const updateAlt = (id: string, altText: string) => {
    onChange?.(value.map((f) => (f.id === id ? { ...f, altText } : f)));
  };

  // ── Compact single-image mode ─────────────────────────────────────────────

  if (compact) {
    const file = value[0];
    return (
      <div className={cn("relative", className)}>
        <div
          className={cn(
            "relative w-full aspect-square rounded-xl border-2 border-dashed overflow-hidden transition-colors cursor-pointer",
            isDragging ? "border-violet-500 bg-violet-50" : "border-zinc-200 hover:border-violet-400",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => !disabled && inputRef.current?.click()}
        >
          {file ? (
            <>
              <Thumbnail file={file} size={200} />
              <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-zinc-400">
              {uploading ? (
                <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
              ) : (
                <>
                  <ImageIcon className="w-8 h-8" />
                  <span className="text-xs">Click or drop</span>
                </>
              )}
            </div>
          )}
        </div>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept}
          multiple={false}
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
          disabled={disabled}
        />
        {uploadError && (
          <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {uploadError}
          </p>
        )}
      </div>
    );
  }

  // ── Full gallery mode ─────────────────────────────────────────────────────

  return (
    <div className={cn("space-y-3", className)}>
      {/* Drop zone */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-xl transition-all cursor-pointer",
          isDragging
            ? "border-violet-500 bg-violet-50 scale-[1.01]"
            : uploadError
            ? "border-red-300 bg-red-50"
            : "border-zinc-200 hover:border-violet-400 hover:bg-zinc-50",
          disabled && "opacity-50 cursor-not-allowed",
          value.length > 0 ? "p-3" : "p-8"
        )}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
          disabled={disabled}
        />

        {value.length === 0 ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center transition-colors",
              isDragging ? "bg-violet-100" : "bg-zinc-100"
            )}>
              {uploading
                ? <Loader2 className="w-7 h-7 text-violet-500 animate-spin" />
                : <Upload className={cn("w-7 h-7", isDragging ? "text-violet-600" : "text-zinc-400")} />
              }
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-700">
                {isDragging ? "Drop files here" : "Drag & drop or click to upload"}
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">
                {accept.replace(/\*/g, "all")} · Max {maxSizeMb}MB each
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            {uploading
              ? <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
              : <Plus className="w-4 h-4" />
            }
            <span>{uploading ? "Uploading..." : "Add more files"}</span>
          </div>
        )}
      </div>

      {/* Error */}
      <AnimatePresence>
        {uploadError && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-red-500 flex items-center gap-1.5"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {uploadError}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Gallery grid */}
      {value.length > 0 && (
        <Reorder.Group
          axis="x"
          values={value}
          onReorder={onChange ?? (() => {})}
          className="flex flex-wrap gap-2"
        >
          <AnimatePresence>
            {value.map((file) => (
              <Reorder.Item
                key={file.id}
                value={file}
                className="relative group"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <div className={cn(
                  "relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors",
                  file.isPrimary && showPrimary
                    ? "border-violet-500"
                    : "border-zinc-200 group-hover:border-zinc-300"
                )}>
                  <Thumbnail file={file} size={80} />

                  {/* Drag handle */}
                  <div className="absolute top-0.5 left-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                    <GripVertical className="w-3.5 h-3.5 text-white drop-shadow" />
                  </div>

                  {/* Primary badge */}
                  {file.isPrimary && showPrimary && (
                    <div className="absolute bottom-0.5 left-0.5 bg-violet-600 rounded px-1 py-px">
                      <Star className="w-2.5 h-2.5 text-white fill-white" />
                    </div>
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                    {showPrimary && !file.isPrimary && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setPrimary(file.id); }}
                        className="w-6 h-6 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                        title="Set as primary"
                      >
                        <Star className="w-3 h-3 text-zinc-700" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}
                      className="w-6 h-6 bg-white/90 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"
                      title="Remove"
                    >
                      <X className="w-3 h-3 text-zinc-700" />
                    </button>
                  </div>
                </div>

                {/* Alt text */}
                {showAltText && (
                  <div className="mt-1 w-20">
                    {editingAlt === file.id ? (
                      <input
                        autoFocus
                        type="text"
                        value={file.altText ?? ""}
                        onChange={(e) => updateAlt(file.id, e.target.value)}
                        onBlur={() => setEditingAlt(null)}
                        placeholder="Alt text"
                        className="w-full text-[10px] px-1.5 py-0.5 border border-violet-400 rounded focus:outline-none"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditingAlt(file.id)}
                        className="w-full text-[10px] text-zinc-400 hover:text-zinc-600 truncate text-left"
                        title={file.altText || "Add alt text"}
                      >
                        {file.altText || "Alt text"}
                      </button>
                    )}
                  </div>
                )}
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>
      )}

      {/* File count */}
      {value.length > 0 && (
        <p className="text-xs text-zinc-400">
          {value.length} file{value.length !== 1 ? "s" : ""}
          {value.reduce((a, f) => a + (f.size ?? 0), 0) > 0 &&
            ` · ${formatBytes(value.reduce((a, f) => a + (f.size ?? 0), 0))}`}
        </p>
      )}
    </div>
  );
}
