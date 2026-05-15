"use client";

import { useState, useCallback, useRef } from "react";
import {
  X, Upload, FileSpreadsheet, ArrowRight, ArrowLeft,
  Check, AlertCircle, Loader2, Sparkles, ChevronDown,
} from "lucide-react";
import {
  parseCSV, PLATFORM_PRESETS, SHOPKEET_FIELDS,
  type Platform, type ColumnMapping,
} from "@/lib/utils/csv-parser";

interface Props {
  storeId: string;
  open: boolean;
  onClose: () => void;
  onComplete: (result: { imported: number; skipped: number }) => void;
}

type Step = "upload" | "mapping" | "preview" | "importing" | "done";

export function CSVImportModal({ storeId, open, onClose, onComplete }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [platform, setPlatform] = useState<Platform>("shopify");
  const [fileName, setFileName] = useState("");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({ ...PLATFORM_PRESETS.shopify.mappings });
  const [result, setResult] = useState<{ queued?: boolean; totalRows?: number; validRows?: number; imported?: number; skipped?: number; errors?: string[]; message?: string } | null>(null);
  const [error, setError] = useState("");

  const reset = () => {
    setStep("upload");
    setPlatform("shopify");
    setFileName("");
    setCsvHeaders([]);
    setCsvRows([]);
    setMapping({ ...PLATFORM_PRESETS.shopify.mappings });
    setResult(null);
    setError("");
  };

  const handleClose = () => { reset(); onClose(); };

  // ── Step 1: File Upload ─────────────────────────────────────────────────
  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith(".csv")) {
      setError("Please upload a .csv file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File must be under 10MB");
      return;
    }
    setError("");
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers, rows } = parseCSV(text);
      if (headers.length === 0 || rows.length === 0) {
        setError("CSV file is empty or invalid");
        return;
      }
      setCsvHeaders(headers);
      setCsvRows(rows);
      // Auto-detect platform from headers
      autoDetectPlatform(headers);
      setStep("mapping");
    };
    reader.readAsText(file);
  }, []);

  const autoDetectPlatform = (headers: string[]) => {
    const headerSet = new Set(headers.map(h => h.toLowerCase()));
    if (headerSet.has("title") && headerSet.has("variant price")) {
      setPlatform("shopify");
      setMapping({ ...PLATFORM_PRESETS.shopify.mappings });
    } else if (headerSet.has("name") && headerSet.has("regular price")) {
      setPlatform("woocommerce");
      setMapping({ ...PLATFORM_PRESETS.woocommerce.mappings });
    } else {
      setPlatform("custom");
      // Try to auto-match by similarity
      const autoMap = { ...PLATFORM_PRESETS.custom.mappings };
      for (const field of SHOPKEET_FIELDS) {
        const match = headers.find(h => h.toLowerCase().includes(field.key));
        if (match) autoMap[field.key] = match;
      }
      setMapping(autoMap);
    }
  };

  // ── Step 2: Column Mapping ──────────────────────────────────────────────
  const handlePlatformChange = (p: Platform) => {
    setPlatform(p);
    if (p !== "custom") {
      setMapping({ ...PLATFORM_PRESETS[p].mappings });
    }
  };

  const updateMapping = (field: keyof ColumnMapping, value: string) => {
    setMapping((prev) => ({ ...prev, [field]: value }));
  };

  const isMappingValid = mapping.name !== "" && csvHeaders.includes(mapping.name);

  // ── Step 3: Map CSV data to products ────────────────────────────────────
  const getMappedProducts = () => {
    return csvRows.map((row) => ({
      name: row[mapping.name] || "",
      description: mapping.description ? row[mapping.description] || "" : "",
      price: mapping.price ? row[mapping.price] || "" : "",
      sku: mapping.sku ? row[mapping.sku] || "" : "",
      image: mapping.image ? (row[mapping.image] || "").split(",")[0]?.trim() : "",
      quantity: mapping.quantity ? row[mapping.quantity] || "0" : "0",
      status: mapping.status ? row[mapping.status] || "" : "",
    })).filter((p) => p.name.trim().length > 0);
  };

  // ── Step 4: Import ─────────────────────────────────────────────────────
  const handleImport = async () => {
    setStep("importing");
    setError("");
    const products = getMappedProducts();

    try {
      const res = await fetch(`/api/stores/${storeId}/products/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");

      setResult(data);
      setStep("done");
      // For queued imports, pass the valid count as "imported" for notification
      onComplete({ imported: data.validRows ?? data.imported ?? products.length, skipped: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
      setStep("preview");
    }
  };

  if (!open) return null;

  const previewProducts = step === "preview" || step === "done" ? getMappedProducts() : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col mx-4 overflow-hidden border border-zinc-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900">Import Products</h2>
              <p className="text-xs text-zinc-500">
                {step === "upload" && "Upload a CSV file"}
                {step === "mapping" && "Map columns to product fields"}
                {step === "preview" && `Preview ${previewProducts.length} products`}
                {step === "importing" && "Importing products..."}
                {step === "done" && "Import complete"}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="px-6 py-3 bg-zinc-50 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            {(["upload", "mapping", "preview"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  step === s ? "bg-violet-600 text-white" :
                  (["upload","mapping","preview","importing","done"].indexOf(step) > i) ? "bg-emerald-500 text-white" :
                  "bg-zinc-200 text-zinc-500"
                }`}>
                  {["upload","mapping","preview","importing","done"].indexOf(step) > i ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span className={`text-xs font-medium ${step === s ? "text-zinc-900" : "text-zinc-400"}`}>
                  {s === "upload" ? "Upload" : s === "mapping" ? "Map Columns" : "Preview"}
                </span>
                {i < 2 && <div className="w-8 h-px bg-zinc-200" />}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {error && (
            <div className="mb-4 flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* ── STEP 1: Upload ──────────────────────────────────────── */}
          {step === "upload" && (
            <div className="space-y-5">
              {/* Platform selector */}
              <div>
                <label className="text-sm font-medium text-zinc-700 mb-2 block">Import from</label>
                <div className="grid grid-cols-3 gap-3">
                  {(Object.entries(PLATFORM_PRESETS) as [Platform, typeof PLATFORM_PRESETS.shopify][]).map(([key, preset]) => (
                    <button
                      key={key}
                      onClick={() => handlePlatformChange(key)}
                      className={`px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                        platform === key
                          ? "border-violet-500 bg-violet-50 text-violet-700"
                          : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Drop zone */}
              <div
                className="relative border-2 border-dashed border-zinc-300 rounded-xl p-10 text-center hover:border-violet-400 hover:bg-violet-50/30 transition-all cursor-pointer group"
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) handleFile(file);
                }}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center group-hover:bg-violet-100 transition-colors">
                    <Upload className="w-7 h-7 text-zinc-400 group-hover:text-violet-500 transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-700">Drop your CSV file here</p>
                    <p className="text-xs text-zinc-400 mt-1">or click to browse · Max 10MB</p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-zinc-400 text-center">
                Export products from {PLATFORM_PRESETS[platform].label} as CSV, then upload here
              </p>
            </div>
          )}

          {/* ── STEP 2: Column Mapping ─────────────────────────────── */}
          {step === "mapping" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-700">
                    <Sparkles className="w-4 h-4 inline text-amber-500 mr-1" />
                    Auto-detected: <span className="text-violet-600">{PLATFORM_PRESETS[platform].label}</span>
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {csvRows.length} rows found in {fileName}
                  </p>
                </div>
                <div className="flex gap-1">
                  {(Object.entries(PLATFORM_PRESETS) as [Platform, typeof PLATFORM_PRESETS.shopify][]).map(([key, preset]) => (
                    <button
                      key={key}
                      onClick={() => handlePlatformChange(key)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                        platform === key ? "bg-violet-100 text-violet-700" : "text-zinc-500 hover:bg-zinc-100"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                {SHOPKEET_FIELDS.map((field) => (
                  <div key={field.key} className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl">
                    <div className="w-36 shrink-0">
                      <p className="text-sm font-medium text-zinc-700">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-0.5">*</span>}
                      </p>
                    </div>
                    <ArrowLeft className="w-4 h-4 text-zinc-300 shrink-0" />
                    <div className="relative flex-1">
                      <select
                        value={mapping[field.key]}
                        onChange={(e) => updateMapping(field.key, e.target.value)}
                        className={`w-full px-3 py-2 pr-8 text-sm rounded-lg border appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                          mapping[field.key] && csvHeaders.includes(mapping[field.key])
                            ? "border-emerald-300 text-zinc-900"
                            : field.required ? "border-red-300 text-zinc-400" : "border-zinc-200 text-zinc-400"
                        }`}
                      >
                        <option value="">— Skip this field —</option>
                        {csvHeaders.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    {mapping[field.key] && csvHeaders.includes(mapping[field.key]) && (
                      <div className="flex items-center gap-1.5 shrink-0 px-2 py-1 bg-emerald-50 rounded-md border border-emerald-200">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-xs text-emerald-700 font-medium">Matched</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Sample data preview */}
              {csvRows.length > 0 && mapping.name && csvHeaders.includes(mapping.name) && (
                <div className="mt-4 p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                  <p className="text-xs font-medium text-zinc-500 mb-2">Sample from first row:</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {SHOPKEET_FIELDS.filter(f => mapping[f.key] && csvHeaders.includes(mapping[f.key])).map(f => (
                      <div key={f.key} className="text-xs">
                        <span className="text-zinc-400">{f.label}: </span>
                        <span className="text-zinc-700 font-medium">
                          {(csvRows[0]?.[mapping[f.key]] || "—").slice(0, 60)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: Preview ────────────────────────────────────── */}
          {step === "preview" && (
            <div className="space-y-4">
              <p className="text-sm text-zinc-600">
                <span className="font-semibold text-zinc-900">{previewProducts.length}</span> products ready to import
              </p>
              <div className="border border-zinc-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-sm">
                    <thead className="bg-zinc-50 border-b border-zinc-200 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500 w-8">#</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">Name</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">Price</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">SKU</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {previewProducts.slice(0, 50).map((p, i) => (
                        <tr key={i} className="hover:bg-zinc-50">
                          <td className="px-3 py-2 text-xs text-zinc-400">{i + 1}</td>
                          <td className="px-3 py-2 text-zinc-900 font-medium">{p.name.slice(0, 50)}</td>
                          <td className="px-3 py-2 text-zinc-600">{p.price || "—"}</td>
                          <td className="px-3 py-2 text-zinc-500 font-mono text-xs">{p.sku || "—"}</td>
                          <td className="px-3 py-2 text-zinc-600">{p.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {previewProducts.length > 50 && (
                  <div className="px-3 py-2 bg-zinc-50 border-t border-zinc-200 text-xs text-zinc-500 text-center">
                    Showing 50 of {previewProducts.length} products
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 4: Importing ──────────────────────────────────── */}
          {step === "importing" && (
            <div className="flex flex-col items-center gap-4 py-12">
              <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
              <div className="text-center">
                <p className="text-sm font-medium text-zinc-900">Importing products...</p>
                <p className="text-xs text-zinc-400 mt-1">This may take a moment</p>
              </div>
            </div>
          )}

          {/* ── STEP 5: Done ───────────────────────────────────────── */}
          {step === "done" && result && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center">
                <Check className="w-7 h-7 text-emerald-600" />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-zinc-900">
                  {result.queued ? "Import Queued!" : "Import Complete!"}
                </p>
                <p className="text-sm text-zinc-500 mt-1">
                  {result.queued ? (
                    <>
                      <span className="text-violet-600 font-semibold">{result.validRows}</span> products are being processed in the background.
                      <br />
                      <span className="text-xs">Products will appear shortly — you can close this and keep working.</span>
                    </>
                  ) : (
                    <>
                      <span className="text-emerald-600 font-semibold">{result.imported}</span> imported
                      {(result.skipped ?? 0) > 0 && <> · <span className="text-amber-600 font-semibold">{result.skipped}</span> skipped</>}
                    </>
                  )}
                </p>
              </div>
              {(result.errors?.length ?? 0) > 0 && (
                <div className="w-full mt-2 p-3 bg-amber-50 rounded-xl border border-amber-200 max-h-32 overflow-y-auto">
                  {result.errors!.slice(0, 10).map((e, i) => (
                    <p key={i} className="text-xs text-amber-700">{e}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 bg-zinc-50">
          <div>
            {step === "mapping" && (
              <button onClick={() => { setStep("upload"); setCsvHeaders([]); setCsvRows([]); }} className="flex items-center gap-1.5 px-3 py-2 text-sm text-zinc-600 hover:text-zinc-900 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            )}
            {step === "preview" && (
              <button onClick={() => setStep("mapping")} className="flex items-center gap-1.5 px-3 py-2 text-sm text-zinc-600 hover:text-zinc-900 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {step !== "done" && step !== "importing" && (
              <button onClick={handleClose} className="px-4 py-2 text-sm text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-100 transition-colors">
                Cancel
              </button>
            )}
            {step === "mapping" && (
              <button
                onClick={() => setStep("preview")}
                disabled={!isMappingValid}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Preview <ArrowRight className="w-4 h-4" />
              </button>
            )}
            {step === "preview" && (
              <button
                onClick={handleImport}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Import {previewProducts.length} products
              </button>
            )}
            {step === "done" && (
              <button onClick={handleClose} className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors">
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
