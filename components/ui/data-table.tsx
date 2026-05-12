"use client";

/**
 * Advanced DataTable
 * Features: search, filters (text/select/multi-select/date-range/number-range),
 * sorting, row selection, bulk actions, column visibility, density toggle,
 * CSV/JSON export, CSV import, pagination, loading skeleton, server-side mode.
 *
 * What else you can add:
 *  - Drag-and-drop row reordering (dnd-kit)
 *  - Inline cell editing (double-click)
 *  - Pinned/frozen columns
 *  - Row grouping & expandable sub-rows
 *  - Virtual scrolling for 10k+ rows (react-virtual)
 *  - Saved filter presets (localStorage)
 *  - Column reordering (drag headers)
 *  - Aggregation footer row (sum/avg/count)
 *  - Conditional row styling
 *  - Right-click context menu
 *  - Keyboard navigation
 *  - Print view
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { format } from "date-fns";
import { DayPicker } from "react-day-picker";
import type { DateRange } from "react-day-picker";
import {
  Search, ChevronLeft, ChevronRight, ChevronUp, ChevronDown,
  ChevronsLeft, ChevronsRight, SlidersHorizontal, X, Check,
  Download, Upload, Calendar, RefreshCw, Settings2, List,
  Trash2, Edit, Copy, ToggleLeft, ToggleRight, AlertTriangle,
  CheckSquare, ChevronDown as ChevronDownSm,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SortDirection = "asc" | "desc";
export type RowDensity = "compact" | "default" | "comfortable";

export interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
  hidden?: boolean;
  /** Prevent user from hiding this column */
  required?: boolean;
}

export interface FilterField {
  key: string;
  label: string;
  type: "text" | "select" | "multi-select" | "date-range" | "number-range";
  options?: { label: string; value: string }[];
  placeholder?: string;
}

export interface FilterValues {
  [key: string]: string | string[] | DateRangeVal | NumberRangeVal | undefined;
}
export interface DateRangeVal { from?: string; to?: string; }
export interface NumberRangeVal { min?: number; max?: number; }

export interface BulkAction<T> {
  label: string;
  icon?: React.ReactNode;
  variant?: "default" | "danger" | "warning" | "success";
  /** Show a confirmation dialog before executing */
  confirm?: string;
  onClick: (items: T[]) => void | Promise<void>;
}

/** Built-in bulk actions you can pass directly */
export interface BuiltinBulkActions<T> {
  onBulkDelete?: (items: T[]) => void | Promise<void>;
  onBulkEdit?: (items: T[]) => void;
  onBulkDuplicate?: (items: T[]) => void | Promise<void>;
  onBulkActivate?: (items: T[]) => void | Promise<void>;
  onBulkDeactivate?: (items: T[]) => void | Promise<void>;
  onBulkExport?: (items: T[]) => void;
}

export interface DataTableProps<T> {
  data?: T[]; // Made optional to handle undefined during loading
  columns: Column<T>[];
  // Filters
  filters?: FilterField[];
  filterValues?: FilterValues;
  onFilterChange?: (f: FilterValues) => void;
  // Search
  searchable?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearch?: (q: string) => void;
  // Selection
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  getRowId?: (item: T) => string;
  // Bulk actions
  bulkActions?: BulkAction<T>[];
  /** Built-in Shopify/WordPress-style bulk actions */
  builtinBulkActions?: BuiltinBulkActions<T>;
  // Pagination
  pageSize?: number;
  pageSizeOptions?: number[];
  totalCount?: number;
  currentPage?: number;
  onPageChange?: (p: number) => void;
  onPageSizeChange?: (s: number) => void;
  // Sorting
  sortKey?: string;
  sortDir?: SortDirection;
  onSortChange?: (key: string, dir: SortDirection) => void;
  // Import / Export (JSON only)
  exportFilename?: string;
  /** Called with parsed JSON array after user imports a .json file */
  onImport?: (rows: Record<string, unknown>[]) => void;
  /** Show import button */
  showImport?: boolean;
  /** Show export button */
  showExport?: boolean;
  // Misc
  loading?: boolean;
  emptyState?: React.ReactNode;
  actions?: (item: T) => React.ReactNode;
  headerActions?: React.ReactNode;
  onRowClick?: (item: T) => void;
  title?: string;
  subtitle?: string;
  columnToggle?: boolean;
  densityToggle?: boolean;
  onRefresh?: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function cn(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

/** Download data as a .json file */
function downloadJSON(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${filename}.json`; a.click();
  URL.revokeObjectURL(url);
}

/** Parse uploaded .json file */
async function readJSONFile(file: File): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        resolve(Array.isArray(parsed) ? parsed : [parsed]);
      } catch {
        reject(new Error("Invalid JSON file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

const densityPad: Record<RowDensity, string> = {
  compact: "px-3 py-1.5",
  default: "px-4 py-3",
  comfortable: "px-4 py-5",
};

// ─── DateRangePicker sub-component ───────────────────────────────────────────

function DateRangePicker({
  value,
  onChange,
  placeholder = "Pick date range",
}: {
  value: DateRangeVal;
  onChange: (v: DateRangeVal) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const range: DateRange = {
    from: value.from ? new Date(value.from) : undefined,
    to: value.to ? new Date(value.to) : undefined,
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const label = range.from
    ? range.to
      ? `${format(range.from, "MMM d")} – ${format(range.to, "MMM d, yyyy")}`
      : format(range.from, "MMM d, yyyy")
    : placeholder;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg border transition-colors",
          open || range.from
            ? "border-violet-400 bg-violet-50 text-violet-700"
            : "border-zinc-200 bg-zinc-50 text-zinc-500 hover:border-zinc-300"
        )}
      >
        <Calendar className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">{label}</span>
        {range.from && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange({}); }}
            className="ml-auto text-zinc-400 hover:text-zinc-600"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </button>

      {open && (
        <div className="absolute z-50 mt-1 bg-white border border-zinc-200 rounded-xl shadow-xl p-3">
          <DayPicker
            mode="range"
            selected={range}
            onSelect={(r) => {
              onChange({
                from: r?.from ? format(r.from, "yyyy-MM-dd") : undefined,
                to: r?.to ? format(r.to, "yyyy-MM-dd") : undefined,
              });
              if (r?.from && r?.to) setOpen(false);
            }}
            numberOfMonths={2}
            className="text-sm"
          />
        </div>
      )}
    </div>
  );
}

// ─── Checkbox sub-component ──────────────────────────────────────────────────

function Checkbox({
  checked,
  indeterminate,
  onChange,
  label,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  label?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate;
  }, [indeterminate]);

  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input ref={ref} type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      <div className={cn(
        "w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0",
        checked || indeterminate
          ? "bg-violet-600 border-violet-600"
          : "bg-white border-zinc-300 hover:border-violet-400"
      )}>
        {checked && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
        {!checked && indeterminate && <div className="w-2 h-0.5 bg-white rounded" />}
      </div>
      {label && <span className="text-sm text-zinc-700">{label}</span>}
    </label>
  );
}

// ─── PaginationBtn sub-component ─────────────────────────────────────────────

function PBtn({ children, onClick, disabled, title }: {
  children: React.ReactNode; onClick: () => void; disabled: boolean; title?: string;
}) {
  return (
    <button
      onClick={onClick} disabled={disabled} title={title}
      className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
    >
      {children}
    </button>
  );
}

// ─── Main DataTable ───────────────────────────────────────────────────────────

export function DataTable<T extends object>({
  data = [], columns, filters, filterValues: ctrlFilters, onFilterChange,
  searchable = true, searchPlaceholder = "Search...", searchValue: ctrlSearch, onSearch,
  selectable = false, selectedIds: ctrlSelected, onSelectionChange, getRowId,
  bulkActions, builtinBulkActions,
  pageSize: initPageSize = 10, pageSizeOptions = [10, 25, 50, 100],
  totalCount, currentPage: ctrlPage, onPageChange, onPageSizeChange,
  sortKey: ctrlSortKey, sortDir: ctrlSortDir, onSortChange,
  exportFilename = "export", onImport, showImport = !!onImport, showExport = true,
  loading = false, emptyState, actions, headerActions, onRowClick,
  title, subtitle, columnToggle = true, densityToggle = true, onRefresh,
}: DataTableProps<T>) {

  // ── Local state ──
  const [localSearch, setLocalSearch] = useState("");
  const [localPage, setLocalPage] = useState(1);
  const [localPageSize, setLocalPageSize] = useState(initPageSize);
  const [localSortKey, setLocalSortKey] = useState<string | null>(null);
  const [localSortDir, setLocalSortDir] = useState<SortDirection>("asc");
  const [localSelected, setLocalSelected] = useState<string[]>([]);
  const [localFilters, setLocalFilters] = useState<FilterValues>({});
  const [showFilters, setShowFilters] = useState(false);
  const [hiddenCols, setHiddenCols] = useState<string[]>(
    columns.filter((c) => c.hidden).map((c) => c.key)
  );
  const [density, setDensity] = useState<RowDensity>("default");
  const [showColMenu, setShowColMenu] = useState(false);
  const [showDensityMenu, setShowDensityMenu] = useState(false);
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ label: string; msg: string; onConfirm: () => void } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<Record<string, unknown>[] | null>(null);
  const colMenuRef = useRef<HTMLDivElement>(null);
  const densityMenuRef = useRef<HTMLDivElement>(null);
  const bulkMenuRef = useRef<HTMLDivElement>(null);
  const importRef = useRef<HTMLInputElement>(null);

  // ── Resolve controlled vs local ──
  const search = ctrlSearch ?? localSearch;
  const page = ctrlPage ?? localPage;
  const pageSize = localPageSize;
  const sortKey = ctrlSortKey ?? localSortKey;
  const sortDir = ctrlSortDir ?? localSortDir;
  const selected = ctrlSelected ?? localSelected;
  const activeFilters = ctrlFilters ?? localFilters;
  const isServer = !!onPageChange;

  // ── Close menus on outside click ──
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (colMenuRef.current && !colMenuRef.current.contains(e.target as Node)) setShowColMenu(false);
      if (densityMenuRef.current && !densityMenuRef.current.contains(e.target as Node)) setShowDensityMenu(false);
      if (bulkMenuRef.current && !bulkMenuRef.current.contains(e.target as Node)) setShowBulkMenu(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // ── Handlers ──
  const handleSearch = useCallback((q: string) => {
    if (onSearch) onSearch(q); else { setLocalSearch(q); setLocalPage(1); }
  }, [onSearch]);

  const handleSort = useCallback((key: string) => {
    const dir: SortDirection = sortKey === key && sortDir === "asc" ? "desc" : "asc";
    if (onSortChange) onSortChange(key, dir); else { setLocalSortKey(key); setLocalSortDir(dir); }
  }, [sortKey, sortDir, onSortChange]);

  const handlePage = useCallback((p: number) => {
    if (onPageChange) onPageChange(p); else setLocalPage(p);
  }, [onPageChange]);

  const handlePageSize = useCallback((s: number) => {
    setLocalPageSize(s); handlePage(1); onPageSizeChange?.(s);
  }, [handlePage, onPageSizeChange]);

  const handleFilter = useCallback((key: string, val: FilterValues[string]) => {
    const next = { ...activeFilters, [key]: val };
    if (onFilterChange) onFilterChange(next); else { setLocalFilters(next); setLocalPage(1); }
  }, [activeFilters, onFilterChange]);

  const clearFilter = useCallback((key: string) => {
    const next = { ...activeFilters }; delete next[key];
    if (onFilterChange) onFilterChange(next); else setLocalFilters(next);
  }, [activeFilters, onFilterChange]);

  const clearAll = useCallback(() => {
    if (onFilterChange) onFilterChange({}); else setLocalFilters({});
    handleSearch("");
  }, [onFilterChange, handleSearch]);

  // ── Row ID ──
  const getId = useCallback((item: T): string => {
    if (getRowId) return getRowId(item);
    const r = item as Record<string, unknown>;
    return String(r.id ?? r._id ?? "");
  }, [getRowId]);

  // ── Selection ──
  const toggleRow = useCallback((item: T) => {
    const id = getId(item);
    const next = selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id];
    if (onSelectionChange) onSelectionChange(next); else setLocalSelected(next);
  }, [selected, getId, onSelectionChange]);

  // ── Client-side processing ──
  const processed = useMemo(() => {
    if (isServer) return data || [];
    let r = [...(data || [])];

    if (search) {
      const q = search.toLowerCase();
      r = r.filter((item) =>
        columns.some((col) => {
          const v = (item as Record<string, unknown>)[col.key];
          return v != null && String(v).toLowerCase().includes(q);
        })
      );
    }

    Object.entries(activeFilters).forEach(([key, val]) => {
      if (!val) return;
      if (typeof val === "string" && val) {
        r = r.filter((item) =>
          String((item as Record<string, unknown>)[key] ?? "").toLowerCase().includes(val.toLowerCase())
        );
      } else if (Array.isArray(val) && val.length > 0) {
        r = r.filter((item) => val.includes(String((item as Record<string, unknown>)[key])));
      } else if (typeof val === "object" && "from" in val) {
        const dr = val as DateRangeVal;
        r = r.filter((item) => {
          const raw = String((item as Record<string, unknown>)[key] ?? "");
          if (!raw) return true;
          const d = raw.slice(0, 10);
          if (dr.from && d < dr.from) return false;
          if (dr.to && d > dr.to) return false;
          return true;
        });
      } else if (typeof val === "object" && "min" in val) {
        const nr = val as NumberRangeVal;
        r = r.filter((item) => {
          const n = Number((item as Record<string, unknown>)[key]);
          if (nr.min != null && n < nr.min) return false;
          if (nr.max != null && n > nr.max) return false;
          return true;
        });
      }
    });

    if (sortKey) {
      r.sort((a, b) => {
        const av = (a as Record<string, unknown>)[sortKey];
        const bv = (b as Record<string, unknown>)[sortKey];
        const mod = sortDir === "asc" ? 1 : -1;
        if (av == null) return 1; if (bv == null) return -1;
        return av < bv ? -mod : av > bv ? mod : 0;
      });
    }
    return r;
  }, [data, search, activeFilters, sortKey, sortDir, columns, isServer]);

  const total = totalCount ?? processed.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIdx = (page - 1) * pageSize;
  const pageData = isServer ? (data || []) : processed.slice(startIdx, startIdx + pageSize);
  const visibleCols = columns.filter((c) => !hiddenCols.includes(c.key));
  const activeFilterCount = Object.values(activeFilters).filter(Boolean).length + (search ? 1 : 0);
  const selectedItems = (data || []).filter((item) => selected.includes(getId(item)));

  // ── Toggle all on current page ──
  const allPageSelected = pageData.length > 0 && pageData.every((item) => selected.includes(getId(item)));
  const somePageSelected = pageData.some((item) => selected.includes(getId(item)));

  const toggleAll = useCallback(() => {
    const ids = pageData.map(getId);
    const next = allPageSelected
      ? selected.filter((id) => !ids.includes(id))
      : [...new Set([...selected, ...ids])];
    if (onSelectionChange) onSelectionChange(next); else setLocalSelected(next);
  }, [pageData, getId, allPageSelected, selected, onSelectionChange]);

  // ── Page numbers ──
  const pageNums = useMemo(() => {
    const nums: (number | "...")[] = [];
    if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) nums.push(i); }
    else {
      nums.push(1);
      if (page > 3) nums.push("...");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) nums.push(i);
      if (page < totalPages - 2) nums.push("...");
      nums.push(totalPages);
    }
    return nums;
  }, [page, totalPages]);

  // ── Export JSON ──
  const handleExport = () => {
    const rows = (isServer ? (data || []) : processed) as Record<string, unknown>[];
    downloadJSON(rows, exportFilename);
  };

  const handleExportSelected = () => {
    downloadJSON(selectedItems as Record<string, unknown>[], `${exportFilename}-selected`);
  };

  // ── Import JSON ──
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setImportError(null);
    try {
      const rows = await readJSONFile(file);
      setImportPreview(rows);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Failed to read file");
    }
  };

  const confirmImport = () => {
    if (importPreview) {
      onImport?.(importPreview);
      setImportPreview(null);
    }
  };

  // ── Confirm action helper ──
  const runWithConfirm = (label: string, msg: string, fn: () => void) => {
    setConfirmAction({ label, msg, onConfirm: () => { fn(); setConfirmAction(null); } });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">

      {/* ── Toolbar ── */}
      <div className="px-4 py-3 border-b border-zinc-100 flex flex-col gap-2.5">

        {/* Row 1: title + header actions */}
        {(title || headerActions || onRefresh || showImport || showExport || columnToggle || densityToggle) && (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              {title && <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>}
              {subtitle && <p className="text-xs text-zinc-500">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">

              {/* Refresh */}
              {onRefresh && (
                <button onClick={onRefresh} title="Refresh"
                  className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 transition-colors">
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}

              {/* Import JSON */}
              {showImport && (
                <>
                  <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImportFile} />
                  <button onClick={() => importRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    Import JSON
                  </button>
                </>
              )}

              {/* Export JSON */}
              {showExport && (
                <div className="relative group">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
                    <Download className="w-3.5 h-3.5" />
                    Export
                    <ChevronDownSm className="w-3 h-3 text-zinc-400" />
                  </button>
                  <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-zinc-200 rounded-xl shadow-lg z-50 hidden group-hover:block py-1">
                    <button onClick={handleExport}
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50 transition-colors">
                      <Download className="w-3.5 h-3.5 text-zinc-400" />
                      Export all ({(isServer ? (data || []) : processed).length})
                    </button>
                    {selected.length > 0 && (
                      <button onClick={handleExportSelected}
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50 transition-colors">
                        <Download className="w-3.5 h-3.5 text-violet-500" />
                        Export selected ({selected.length})
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Column visibility */}
              {columnToggle && (
                <div ref={colMenuRef} className="relative">
                  <button onClick={() => setShowColMenu(!showColMenu)}
                    className={cn("flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors",
                      showColMenu ? "bg-violet-50 border-violet-200 text-violet-700" : "text-zinc-600 border-zinc-200 hover:bg-zinc-50")}>
                    <Settings2 className="w-3.5 h-3.5" />
                    Columns
                  </button>
                  {showColMenu && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-zinc-200 rounded-xl shadow-lg z-50 p-2">
                      <p className="text-[10px] font-semibold text-zinc-400 uppercase px-2 pb-1.5">Toggle Columns</p>
                      {columns.map((col) => (
                        <label key={col.key} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-50 cursor-pointer">
                          <div className={cn("w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0",
                            !hiddenCols.includes(col.key) ? "bg-violet-600 border-violet-600" : "bg-white border-zinc-300")}>
                            {!hiddenCols.includes(col.key) && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                          </div>
                          <input type="checkbox" className="sr-only"
                            checked={!hiddenCols.includes(col.key)}
                            disabled={col.required}
                            onChange={() => {
                              if (col.required) return;
                              setHiddenCols((prev) =>
                                prev.includes(col.key) ? prev.filter((k) => k !== col.key) : [...prev, col.key]
                              );
                            }}
                          />
                          <span className="text-xs text-zinc-700">{col.label}</span>
                          {col.required && <span className="ml-auto text-[10px] text-zinc-400">Required</span>}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Density */}
              {densityToggle && (
                <div ref={densityMenuRef} className="relative">
                  <button onClick={() => setShowDensityMenu(!showDensityMenu)}
                    className={cn("flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors",
                      showDensityMenu ? "bg-violet-50 border-violet-200 text-violet-700" : "text-zinc-600 border-zinc-200 hover:bg-zinc-50")}>
                    <List className="w-3.5 h-3.5" />
                    Density
                  </button>
                  {showDensityMenu && (
                    <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-zinc-200 rounded-xl shadow-lg z-50 p-1.5">
                      {(["compact", "default", "comfortable"] as RowDensity[]).map((d) => (
                        <button key={d} onClick={() => { setDensity(d); setShowDensityMenu(false); }}
                          className={cn("flex items-center justify-between w-full px-3 py-2 text-xs rounded-lg transition-colors capitalize",
                            density === d ? "bg-violet-50 text-violet-700 font-medium" : "text-zinc-700 hover:bg-zinc-50")}>
                          {d}
                          {density === d && <Check className="w-3 h-3" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Custom header actions */}
              {headerActions}
            </div>
          </div>
        )}

        {/* Row 2: search + filter toggle + active chips */}
        {(searchable || (filters && filters.length > 0)) && (
          <div className="flex items-center gap-2 flex-wrap">
            {searchable && (
              <div className="relative flex-1 min-w-40 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                <input type="text" value={search} onChange={(e) => handleSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-9 pr-8 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent placeholder-zinc-400" />
                {search && (
                  <button onClick={() => handleSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {filters && filters.length > 0 && (
              <button onClick={() => setShowFilters(!showFilters)}
                className={cn("flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition-colors",
                  showFilters || activeFilterCount > 0
                    ? "bg-violet-50 border-violet-200 text-violet-700"
                    : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100")}>
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            )}

            {/* Active filter chips */}
            {Object.entries(activeFilters).map(([key, val]) => {
              if (!val) return null;
              const field = filters?.find((f) => f.key === key);
              let display = "";
              if (typeof val === "string") display = val;
              else if (Array.isArray(val)) display = val.join(", ");
              else if ("from" in val) {
                const dr = val as DateRangeVal;
                display = [dr.from, dr.to].filter(Boolean).join(" – ");
              } else if ("min" in val) {
                const nr = val as NumberRangeVal;
                display = [nr.min != null ? `≥${nr.min}` : "", nr.max != null ? `≤${nr.max}` : ""].filter(Boolean).join(" ");
              }
              if (!display) return null;
              return (
                <span key={key} className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-50 border border-violet-200 text-violet-700 text-xs rounded-full">
                  <span className="font-medium">{field?.label ?? key}:</span> {display}
                  <button onClick={() => clearFilter(key)} className="ml-0.5 hover:text-violet-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}

            {activeFilterCount > 1 && (
              <button onClick={clearAll} className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors">
                Clear all
              </button>
            )}
          </div>
        )}

        {/* Row 3: filter panel */}
        {showFilters && filters && filters.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-2 border-t border-zinc-100">
            {filters.map((field) => (
              <div key={field.key}>
                <label className="block text-xs font-medium text-zinc-500 mb-1">{field.label}</label>

                {field.type === "select" && (
                  <select value={String(activeFilters[field.key] ?? "")}
                    onChange={(e) => handleFilter(field.key, e.target.value || undefined)}
                    className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400 text-zinc-700">
                    <option value="">All</option>
                    {field.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                )}

                {field.type === "multi-select" && (
                  <div className="flex flex-wrap gap-1">
                    {field.options?.map((o) => {
                      const arr = (activeFilters[field.key] as string[]) ?? [];
                      const active = arr.includes(o.value);
                      return (
                        <button key={o.value} onClick={() => {
                          const next = active ? arr.filter((v) => v !== o.value) : [...arr, o.value];
                          handleFilter(field.key, next.length ? next : undefined);
                        }}
                          className={cn("px-2.5 py-1 text-xs rounded-full border transition-colors",
                            active ? "bg-violet-600 border-violet-600 text-white" : "bg-white border-zinc-200 text-zinc-600 hover:border-violet-300")}>
                          {o.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {field.type === "date-range" && (
                  <DateRangePicker
                    value={(activeFilters[field.key] as DateRangeVal) ?? {}}
                    onChange={(v) => handleFilter(field.key, v.from || v.to ? v : undefined)}
                    placeholder={field.placeholder ?? "Pick date range"}
                  />
                )}

                {field.type === "number-range" && (
                  <div className="flex gap-1.5">
                    <input type="number" placeholder="Min"
                      value={String((activeFilters[field.key] as NumberRangeVal)?.min ?? "")}
                      onChange={(e) => {
                        const prev = (activeFilters[field.key] as NumberRangeVal) ?? {};
                        const val = e.target.value !== "" ? Number(e.target.value) : undefined;
                        handleFilter(field.key, val != null || prev.max != null ? { ...prev, min: val } : undefined);
                      }}
                      className="flex-1 px-2 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400" />
                    <input type="number" placeholder="Max"
                      value={String((activeFilters[field.key] as NumberRangeVal)?.max ?? "")}
                      onChange={(e) => {
                        const prev = (activeFilters[field.key] as NumberRangeVal) ?? {};
                        const val = e.target.value !== "" ? Number(e.target.value) : undefined;
                        handleFilter(field.key, val != null || prev.min != null ? { ...prev, max: val } : undefined);
                      }}
                      className="flex-1 px-2 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400" />
                  </div>
                )}

                {field.type === "text" && (
                  <input type="text" value={String(activeFilters[field.key] ?? "")}
                    onChange={(e) => handleFilter(field.key, e.target.value || undefined)}
                    placeholder={field.placeholder ?? `Filter by ${field.label}...`}
                    className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400 placeholder-zinc-400" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Bulk actions bar — Shopify/WordPress style ── */}
      {selectable && selected.length > 0 && (
        <div className="px-4 py-2.5 bg-violet-600 flex items-center gap-3 flex-wrap">
          {/* Selection count */}
          <div className="flex items-center gap-2 text-white">
            <CheckSquare className="w-4 h-4" />
            <span className="text-sm font-medium">
              {selected.length} of {total} selected
            </span>
          </div>

          <div className="w-px h-4 bg-violet-400" />

          {/* Built-in actions */}
          {builtinBulkActions?.onBulkEdit && (
            <button
              onClick={() => builtinBulkActions.onBulkEdit!(selectedItems)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
              <Edit className="w-3.5 h-3.5" />
              Edit
            </button>
          )}

          {builtinBulkActions?.onBulkDuplicate && (
            <button
              onClick={() => builtinBulkActions.onBulkDuplicate!(selectedItems)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
              <Copy className="w-3.5 h-3.5" />
              Duplicate
            </button>
          )}

          {builtinBulkActions?.onBulkActivate && (
            <button
              onClick={() => builtinBulkActions.onBulkActivate!(selectedItems)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
              <ToggleRight className="w-3.5 h-3.5" />
              Activate
            </button>
          )}

          {builtinBulkActions?.onBulkDeactivate && (
            <button
              onClick={() => builtinBulkActions.onBulkDeactivate!(selectedItems)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
              <ToggleLeft className="w-3.5 h-3.5" />
              Deactivate
            </button>
          )}

          {builtinBulkActions?.onBulkExport && (
            <button
              onClick={() => builtinBulkActions.onBulkExport!(selectedItems)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          )}

          {/* Custom bulk actions */}
          {bulkActions && bulkActions.length > 0 && (
            <div ref={bulkMenuRef} className="relative">
              <button
                onClick={() => setShowBulkMenu(!showBulkMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                Actions
                <ChevronDownSm className="w-3 h-3" />
              </button>
              {showBulkMenu && (
                <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 py-1">
                  {bulkActions.map((action, i) => (
                    <button key={i}
                      onClick={() => {
                        setShowBulkMenu(false);
                        if (action.confirm) {
                          runWithConfirm(action.label, action.confirm, () => action.onClick(selectedItems));
                        } else {
                          action.onClick(selectedItems);
                        }
                      }}
                      className={cn(
                        "flex items-center gap-2 w-full px-3 py-2 text-xs transition-colors",
                        action.variant === "danger"
                          ? "text-red-600 hover:bg-red-50"
                          : action.variant === "warning"
                          ? "text-amber-600 hover:bg-amber-50"
                          : action.variant === "success"
                          ? "text-emerald-600 hover:bg-emerald-50"
                          : "text-zinc-700 hover:bg-zinc-50"
                      )}>
                      {action.icon}
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Delete — always last, always danger */}
          {builtinBulkActions?.onBulkDelete && (
            <button
              onClick={() => runWithConfirm(
                "Delete",
                `Delete ${selected.length} item${selected.length !== 1 ? "s" : ""}? This cannot be undone.`,
                () => builtinBulkActions.onBulkDelete!(selectedItems)
              )}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors ml-auto">
              <Trash2 className="w-3.5 h-3.5" />
              Delete ({selected.length})
            </button>
          )}

          {/* Clear selection */}
          <button
            onClick={() => { if (onSelectionChange) onSelectionChange([]); else setLocalSelected([]); }}
            className={cn(
              "flex items-center gap-1 text-xs text-white/70 hover:text-white transition-colors",
              builtinBulkActions?.onBulkDelete ? "" : "ml-auto"
            )}>
            <X className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      )}

      {/* ── Table ── */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-zinc-100 bg-zinc-50/80 backdrop-blur-sm">
              {selectable && (
                <th className="w-10 px-4 py-3">
                  <Checkbox checked={allPageSelected} indeterminate={somePageSelected && !allPageSelected} onChange={toggleAll} />
                </th>
              )}
              {visibleCols.map((col) => (
                <th key={col.key} style={{ width: col.width }}
                  className={cn("py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide whitespace-nowrap select-none",
                    densityPad[density].split(" ")[0],
                    col.align === "center" ? "text-center" : col.align === "right" ? "text-right" : "text-left",
                    col.sortable && "cursor-pointer hover:text-zinc-800 transition-colors")}
                  onClick={() => col.sortable && handleSort(col.key)}>
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      <span className="flex flex-col -space-y-1">
                        <ChevronUp className={cn("w-3 h-3", sortKey === col.key && sortDir === "asc" ? "text-violet-600" : "text-zinc-300")} />
                        <ChevronDown className={cn("w-3 h-3", sortKey === col.key && sortDir === "desc" ? "text-violet-600" : "text-zinc-300")} />
                      </span>
                    )}
                  </span>
                </th>
              ))}
              {actions && (
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide text-right">
                  Action
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-100">
            {loading ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <tr key={i}>
                  {selectable && <td className="px-4 py-3"><div className="w-4 h-4 bg-zinc-100 rounded animate-pulse" /></td>}
                  {visibleCols.map((col) => (
                    <td key={col.key} className={cn(densityPad[density])}>
                      <div className="h-4 bg-zinc-100 rounded animate-pulse" style={{ width: `${50 + (i * 13) % 40}%` }} />
                    </td>
                  ))}
                  {actions && <td className="px-4 py-3"><div className="h-4 w-16 bg-zinc-100 rounded animate-pulse ml-auto" /></td>}
                </tr>
              ))
            ) : pageData.length === 0 ? (
              <tr>
                <td colSpan={visibleCols.length + (selectable ? 1 : 0) + (actions ? 1 : 0)} className="px-6 py-16 text-center">
                  {emptyState ?? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center">
                        <Search className="w-5 h-5 text-zinc-300" />
                      </div>
                      <p className="text-sm font-medium text-zinc-500">No results found</p>
                      <p className="text-xs text-zinc-400">Try adjusting your search or filters</p>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              pageData.map((item, idx) => {
                const id = getId(item);
                const isSel = selected.includes(id);
                return (
                  <tr key={id || idx} onClick={() => onRowClick?.(item)}
                    className={cn("transition-colors",
                      onRowClick && "cursor-pointer",
                      isSel ? "bg-violet-50/60" : "hover:bg-zinc-50/70")}>
                    {selectable && (
                      <td className="px-4 py-3" onClick={(e) => { e.stopPropagation(); toggleRow(item); }}>
                        <Checkbox checked={isSel} onChange={() => toggleRow(item)} />
                      </td>
                    )}
                    {visibleCols.map((col) => (
                      <td key={col.key}
                        className={cn(densityPad[density], "text-zinc-700",
                          col.align === "center" ? "text-center" : col.align === "right" ? "text-right" : "text-left")}>
                        {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? "")}
                      </td>
                    ))}
                    {actions && (
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">{actions(item)}</div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Footer / Pagination ── */}
      <div className="px-4 py-3 border-t border-zinc-100 flex items-center justify-between gap-4 flex-wrap bg-zinc-50/40">
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span>
            {total === 0 ? "No results" : `Result ${startIdx + 1}–${Math.min(startIdx + pageSize, total)} of ${total}`}
          </span>
          <div className="flex items-center gap-1.5">
            <span>Show</span>
            <select value={pageSize} onChange={(e) => handlePageSize(Number(e.target.value))}
              className="px-2 py-1 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400 text-zinc-700">
              {pageSizeOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <PBtn onClick={() => handlePage(1)} disabled={page === 1} title="First"><ChevronsLeft className="w-3.5 h-3.5" /></PBtn>
          <PBtn onClick={() => handlePage(page - 1)} disabled={page === 1} title="Previous">
            <span className="flex items-center gap-1 text-xs px-1"><ChevronLeft className="w-3.5 h-3.5" />Previous</span>
          </PBtn>

          {pageNums.map((p, i) =>
            p === "..." ? (
              <span key={`e${i}`} className="px-1 text-zinc-400 text-xs">…</span>
            ) : (
              <button key={p} onClick={() => handlePage(p as number)}
                className={cn("w-7 h-7 rounded-lg text-xs font-medium transition-colors",
                  page === p ? "bg-violet-600 text-white shadow-sm" : "text-zinc-600 hover:bg-zinc-100")}>
                {p}
              </button>
            )
          )}

          <PBtn onClick={() => handlePage(page + 1)} disabled={page >= totalPages} title="Next">
            <span className="flex items-center gap-1 text-xs px-1">Next<ChevronRight className="w-3.5 h-3.5" /></span>
          </PBtn>
          <PBtn onClick={() => handlePage(totalPages)} disabled={page >= totalPages} title="Last"><ChevronsRight className="w-3.5 h-3.5" /></PBtn>
        </div>
      </div>

      {/* ── Confirm Dialog ── */}
      {confirmAction && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmAction(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">{confirmAction.label}</h3>
                <p className="text-sm text-zinc-500 mt-1">{confirmAction.msg}</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 text-sm font-medium text-zinc-700 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={confirmAction.onConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">
                {confirmAction.label}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Import Preview Modal ── */}
      {(importPreview || importError) && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setImportPreview(null); setImportError(null); }} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">Import JSON</h3>
                {importPreview && (
                  <p className="text-xs text-zinc-500 mt-0.5">{importPreview.length} records found</p>
                )}
              </div>
              <button onClick={() => { setImportPreview(null); setImportError(null); }}
                className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error state */}
            {importError && (
              <div className="px-6 py-8 flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <p className="text-sm font-medium text-zinc-900">Import Failed</p>
                <p className="text-xs text-zinc-500">{importError}</p>
                <button
                  onClick={() => { setImportError(null); importRef.current?.click(); }}
                  className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors">
                  Try Again
                </button>
              </div>
            )}

            {/* Preview table */}
            {importPreview && importPreview.length > 0 && (
              <>
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-zinc-50 border-b border-zinc-100">
                      <tr>
                        {Object.keys(importPreview[0]).slice(0, 8).map((key) => (
                          <th key={key} className="px-4 py-2.5 text-left font-semibold text-zinc-500 uppercase tracking-wide whitespace-nowrap">
                            {key}
                          </th>
                        ))}
                        {Object.keys(importPreview[0]).length > 8 && (
                          <th className="px-4 py-2.5 text-zinc-400">+{Object.keys(importPreview[0]).length - 8} more</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {importPreview.slice(0, 10).map((row, i) => (
                        <tr key={i} className="hover:bg-zinc-50">
                          {Object.keys(importPreview[0]).slice(0, 8).map((key) => (
                            <td key={key} className="px-4 py-2.5 text-zinc-700 max-w-[160px] truncate">
                              {String(row[key] ?? "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {importPreview.length > 10 && (
                    <p className="px-4 py-2 text-xs text-zinc-400 border-t border-zinc-100">
                      Showing 10 of {importPreview.length} records
                    </p>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 bg-zinc-50/50">
                  <p className="text-xs text-zinc-500">
                    This will import <span className="font-semibold text-zinc-900">{importPreview.length} records</span>
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setImportPreview(null)}
                      className="px-4 py-2 text-sm font-medium text-zinc-700 border border-zinc-200 rounded-lg hover:bg-zinc-100 transition-colors">
                      Cancel
                    </button>
                    <button
                      onClick={confirmImport}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors">
                      <Upload className="w-4 h-4" />
                      Import {importPreview.length} Records
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export { Download };
