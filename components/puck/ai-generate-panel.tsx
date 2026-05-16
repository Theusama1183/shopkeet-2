"use client";

import { useState } from "react";
import { Sparkles, X, ChevronDown, Loader2, AlertCircle, CheckCircle2, Zap } from "lucide-react";
import { Data } from "@puckeditor/core";
import { useAiGeneratePage, type AiModelKey, type AiPageType } from "@/lib/queries";

// ── Model definitions ─────────────────────────────────────────────────────────

const MODELS: {
  key: AiModelKey;
  label: string;
  badge: string;
  badgeColor: string;
  description: string;
  neurons: string;
}[] = [
  {
    key: "llama-3.2-1b-instruct",
    label: "Llama 3.2 1B",
    badge: "Fastest · Free",
    badgeColor: "bg-emerald-100 text-emerald-700",
    description: "~44 free generations/day. Good for testing.",
    neurons: "~223 neurons/page",
  },
  {
    key: "llama-3.1-8b-fp8-fast",
    label: "Llama 3.1 8B FP8",
    badge: "Fast · Cheap",
    badgeColor: "bg-blue-100 text-blue-700",
    description: "Good balance of speed and quality.",
    neurons: "~424 neurons/page",
  },
  {
    key: "qwen3-30b-a3b-fp8",
    label: "Qwen3 30B A3B",
    badge: "Smart · Cheap",
    badgeColor: "bg-violet-100 text-violet-700",
    description: "MoE model — high quality at low neuron cost.",
    neurons: "~373 neurons/page",
  },
  {
    key: "llama-3.3-70b-fp8-fast",
    label: "Llama 3.3 70B FP8",
    badge: "Best Quality",
    badgeColor: "bg-amber-100 text-amber-700",
    description: "Recommended for production. ~4 free/day.",
    neurons: "~2,498 neurons/page",
  },
  {
    key: "gemma-4-26b",
    label: "Gemma 4 26B",
    badge: "Google · Balanced",
    badgeColor: "bg-sky-100 text-sky-700",
    description: "Google's latest, great JSON adherence.",
    neurons: "~1,200 neurons/page",
  },
];

const PAGE_TYPES: { value: AiPageType; label: string }[] = [
  { value: "home", label: "🏠 Home Page" },
  { value: "about", label: "ℹ️ About Page" },
  { value: "products", label: "🛍️ Products Page" },
  { value: "contact", label: "📬 Contact Page" },
  { value: "custom", label: "✨ Custom" },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface AiGeneratePanelProps {
  storeId: string;
  onApply: (data: Data) => void;
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AiGeneratePanel({ storeId, onApply, onClose }: AiGeneratePanelProps) {
  const [selectedModel, setSelectedModel] = useState<AiModelKey>("llama-3.3-70b-fp8-fast");
  const [pageType, setPageType] = useState<AiPageType>("home");
  const [prompt, setPrompt] = useState("");
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  // ── React Query mutation (per project patterns — no raw fetch in client components)
  const { mutate: generate, isPending, error, isSuccess, data: result } = useAiGeneratePage(storeId);

  const selectedModelInfo = MODELS.find((m) => m.key === selectedModel)!;

  function handleGenerate() {
    if (!prompt.trim()) return;

    generate(
      { prompt: prompt.trim(), model: selectedModel, pageType },
      {
        onSuccess: (res) => {
          // Brief delay so user sees the success state before panel closes
          setTimeout(() => {
            onApply(res.data);
            onClose();
          }, 700);
        },
      }
    );
  }

  const errorMessage = error instanceof Error ? error.message : null;

  return (
    // Backdrop + centering wrapper — onMouseDown on backdrop closes, stopPropagation on card prevents it
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 bg-linear-to-r from-violet-50 to-indigo-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">AI Page Generator</h2>
              <p className="text-xs text-zinc-500">Powered by Cloudflare Workers AI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Page Type */}
          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
              Page Type
            </label>
            <div className="flex flex-wrap gap-2">
              {PAGE_TYPES.map((pt) => (
                <button
                  key={pt.value}
                  onClick={() => setPageType(pt.value)}
                  disabled={isPending}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border disabled:opacity-50 ${
                    pageType === pt.value
                      ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                      : "bg-white text-zinc-600 border-zinc-200 hover:border-violet-300 hover:text-violet-700"
                  }`}
                >
                  {pt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt */}
          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
              Describe Your Page
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isPending}
              placeholder={
                pageType === "home"
                  ? "e.g. A modern fashion store with a bold hero, featured products, and customer reviews"
                  : pageType === "about"
                  ? "e.g. Our story, team values, and why customers love us"
                  : pageType === "products"
                  ? "e.g. Showcase our summer collection with filters and a promo banner"
                  : "Describe what you want on this page..."
              }
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none placeholder:text-zinc-400 disabled:opacity-50 disabled:bg-zinc-50"
            />
            <div className="flex justify-end mt-1">
              <span className={`text-xs ${prompt.length > 450 ? "text-amber-500" : "text-zinc-400"}`}>
                {prompt.length}/500
              </span>
            </div>
          </div>

          {/* Model Selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
              AI Model
            </label>
            <div className="relative">
              <button
                onClick={() => setShowModelDropdown((v) => !v)}
                disabled={isPending}
                className="w-full flex items-center justify-between px-3 py-2.5 text-sm border border-zinc-200 rounded-xl hover:border-violet-300 transition-colors bg-white disabled:opacity-50"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Zap className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                  <span className="font-medium text-zinc-900 truncate">
                    {selectedModelInfo.label}
                  </span>
                  <span
                    className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${selectedModelInfo.badgeColor}`}
                  >
                    {selectedModelInfo.badge}
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform ${
                    showModelDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showModelDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-xl shadow-lg z-10 overflow-hidden">
                  {MODELS.map((model) => (
                    <button
                      key={model.key}
                      onClick={() => {
                        setSelectedModel(model.key);
                        setShowModelDropdown(false);
                      }}
                      className={`w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-zinc-50 transition-colors border-b border-zinc-100 last:border-0 ${
                        selectedModel === model.key ? "bg-violet-50" : ""
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-zinc-900">{model.label}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${model.badgeColor}`}>
                            {model.badge}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">{model.description}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">{model.neurons}</p>
                      </div>
                      {selectedModel === model.key && (
                        <CheckCircle2 className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Neuron cost hint */}
            <p className="text-xs text-zinc-400 mt-1.5 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {selectedModelInfo.neurons} · Free tier: 10,000 neurons/day
            </p>
          </div>

          {/* Error state */}
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          )}

          {/* Success state */}
          {isSuccess && result && (
            <div className="flex items-start gap-2.5 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-700">
                Generated {result.componentCount} components using {result.model}
              </p>
            </div>
          )}

          {/* Warning — only shown in idle state */}
          {!errorMessage && !isSuccess && (
            <p className="text-xs text-zinc-400 bg-zinc-50 rounded-lg px-3 py-2 border border-zinc-100">
              ⚠️ This will <strong>replace</strong> the current page content. Save your work first if needed.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={onClose}
            disabled={isPending}
            className="flex-1 py-2.5 text-sm font-medium text-zinc-700 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={isPending || !prompt.trim()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-violet-600 rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-violet-200"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Page
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
