"use client";

import { use, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Data } from "@puckeditor/core";
import {
  ArrowLeft, Save, Check, Globe, Clock, Settings, X,
  Search, Trash2, Plus, ChevronDown, Timer, TrendingUp,
  LogOut, MousePointer, RefreshCw,
} from "lucide-react";
import {
  type PopupTrigger,
  type PopupTriggerEvent,
  type PopupFrequency,
  DEFAULT_TRIGGER,
  TRIGGER_EVENT_LABELS,
  TRIGGER_FREQUENCY_LABELS,
} from "@/lib/popups/types";

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
import {
  type ConditionRule,
  type ConditionLocationType,
  type ConditionOperator,
  LOCATION_TYPE_META,
  LOCATION_TYPE_GROUPS,
  summariseConditions,
} from "@/lib/templates/conditions";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PopupData {
  id: string;
  name: string;
  content: Data;
  trigger: PopupTrigger;
  conditions: { rules?: ConditionRule[] };
  isActive: boolean;
  storeId: string;
}

interface PageOption    { id: string; title: string; slug: string; }
interface ProductOption { id: string; name: string; }

const TRIGGER_ICONS: Record<PopupTriggerEvent, React.ElementType> = {
  "on-load":        Timer,
  "on-scroll":      TrendingUp,
  "on-exit-intent": LogOut,
  "on-click":       MousePointer,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function PopupDesignPage({
  params,
}: {
  params: Promise<{ id: string; popupId: string }>;
}) {
  const { id: storeId, popupId } = use(params);
  const router = useRouter();
  const [popup, setPopup]           = useState<PopupData | null>(null);
  const [content, setContent]       = useState<Data | null>(null);
  const [isSaving, setIsSaving]     = useState(false);
  const [isLoading, setIsLoading]   = useState(true);
  const [saved, setSaved]           = useState(false);

  // Latest content ref — updated by Puck onChange without causing re-renders
  const latestContent = useRef<Data | null>(null);

  // Settings panel
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab]       = useState<"trigger" | "conditions">("trigger");

  // Trigger state
  const [trigger, setTrigger] = useState<PopupTrigger>(DEFAULT_TRIGGER);

  // Conditions state
  const [pages, setPages]       = useState<PageOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [rules, setRules]       = useState<ConditionRule[]>([]);
  const [subSearch, setSubSearch]     = useState<string[]>([]);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Bootstrap ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!storeId || !popupId) return;
    Promise.all([
      fetch(`/api/stores/${storeId}/popups/${popupId}`).then(r => r.json()),
      fetch(`/api/stores/${storeId}/pages?includeUnpublished=true`).then(r => r.json()),
      fetch(`/api/stores/${storeId}/products`).then(r => r.json()),
    ]).then(([pData, pageData, prodData]) => {
      setPopup(pData);
      const initialContent = pData.content || { content: [], root: { props: {} } };
      setContent(initialContent);
      latestContent.current = initialContent;
      setTrigger({ ...DEFAULT_TRIGGER, ...(pData.trigger || {}) });
      const loadedRules: ConditionRule[] = pData.conditions?.rules ?? [];
      setRules(loadedRules);
      setSubSearch(loadedRules.map(() => ""));
      setPages(Array.isArray(pageData) ? pageData : (pageData.items ?? []));
      setProducts(Array.isArray(prodData) ? prodData : (prodData.items ?? []));
      setIsLoading(false);
    }).catch(() => router.push(`/admin/store/${storeId}/popups`));
  }, [storeId, popupId, router]);

  // Close sub-selector dropdown on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setOpenDropdown(null);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // ── Persist helpers ────────────────────────────────────────────────────────

  const patch = async (body: Record<string, unknown>) => {
    const res = await fetch(`/api/stores/${storeId}/popups/${popupId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) setPopup(await res.json());
  };

  const handleSave = useCallback(async (data: Data) => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/stores/${storeId}/popups/${popupId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: data }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPopup(updated);
        // Do NOT call setContent here — it would remount Puck
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) { console.error("Save failed:", err); }
    finally { setIsSaving(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, popupId]);

  const handleActivate = () => patch({ isActive: !popup?.isActive });

  // ── Trigger ────────────────────────────────────────────────────────────────

  const updateTrigger = (patch2: Partial<PopupTrigger>) => {
    const next = { ...trigger, ...patch2 };
    setTrigger(next);
    patch({ trigger: next });
  };

  // ── Conditions ─────────────────────────────────────────────────────────────

  const persistRules = (newRules: ConditionRule[]) =>
    patch({ conditions: { rules: newRules } });

  const addRule = () => {
    const next: ConditionRule[] = [...rules, { operator: "include", locationType: "entire-site" }];
    setRules(next); setSubSearch([...subSearch, ""]); persistRules(next);
  };

  const removeRule = (idx: number) => {
    const next = rules.filter((_, i) => i !== idx);
    setRules(next); setSubSearch(subSearch.filter((_, i) => i !== idx)); persistRules(next);
  };

  const updateRuleOperator = (idx: number, operator: ConditionOperator) => {
    const next = rules.map((r, i) => i === idx ? { ...r, operator } : r);
    setRules(next); persistRules(next);
  };

  const updateRuleLocationType = (idx: number, locationType: ConditionLocationType) => {
    const meta = LOCATION_TYPE_META[locationType];
    const next = rules.map((r, i) =>
      i === idx ? { operator: r.operator, locationType, subType: meta.hasSubSelector ? "all" : undefined } : r
    );
    setRules(next); setSubSearch(subSearch.map((s, i) => i === idx ? "" : s)); persistRules(next);
  };

  const updateRuleSubType = (idx: number, subType: string) => {
    const next = rules.map((r, i) => i === idx ? { ...r, subType } : r);
    setRules(next); setSubSearch(subSearch.map((s, i) => i === idx ? "" : s));
    setOpenDropdown(null); persistRules(next);
  };

  const getSubOptions = (lt: ConditionLocationType): { id: string; label: string; sub?: string }[] => {
    const meta = LOCATION_TYPE_META[lt];
    if (!meta.hasSubSelector) return [];
    if (meta.subSelectorType === "pages")    return pages.map(p => ({ id: p.id, label: p.title, sub: `/${p.slug}` }));
    if (meta.subSelectorType === "products") return products.map(p => ({ id: p.id, label: p.name }));
    return [];
  };

  const getSubLabel = (rule: ConditionRule) => {
    if (!rule.subType || rule.subType === "all") return "All";
    return getSubOptions(rule.locationType).find(o => o.id === rule.subType)?.label ?? rule.subType;
  };

  // ── Loading / error ────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-zinc-500">Loading popup editor...</p>
        </div>
      </div>
    );
  }

  if (!popup || !content) return null;

  const condSummary = rules.length === 0
    ? "Entire site"
    : summariseConditions({ rules });

  return (
    <div className="h-screen flex flex-col">

      {/* ── Topbar ── */}
      <header className="h-12 bg-white border-b border-zinc-200 flex items-center justify-between px-4 shrink-0 z-50">
        <div className="flex items-center gap-3">
          <Link href={`/admin/store/${storeId}/popups`}>
            <button className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Popups
            </button>
          </Link>
          <span className="text-zinc-300">/</span>
          <span className="text-sm font-medium text-zinc-900 truncate max-w-48">{popup.name}</span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
            popup.isActive
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-zinc-100 text-zinc-600 border border-zinc-200"
          }`}>
            {popup.isActive
              ? <><Globe className="w-3 h-3" />Active</>
              : <><Clock className="w-3 h-3" />Inactive</>}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Settings button */}
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            Popup Settings
            <span className="text-[10px] text-zinc-400">{condSummary}</span>
          </button>

          {/* Activate / Deactivate */}
          <button
            onClick={handleActivate}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              popup.isActive
                ? "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                : "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700"
            }`}
          >
            {popup.isActive ? "Deactivate" : "Activate"}
          </button>

          {/* Save */}
          <button
            onClick={() => latestContent.current && handleSave(latestContent.current)}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {isSaving
              ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</>
              : saved
              ? <><Check className="w-3.5 h-3.5" />Saved</>
              : <><Save className="w-3.5 h-3.5" />Save</>}
          </button>
        </div>
      </header>

      {/* ── Puck editor ── */}
      <div className="flex-1 overflow-hidden">
      <PuckEditor
          data={content}
          onPublish={handleSave}
          onSave={async (data) => { latestContent.current = data; }}
          layoutId="default"
          storeId={storeId}
        />
      </div>

      {/* ── Settings panel (shadcn Dialog-style slide-over) ── */}
      {showSettings && (
        <div className="fixed inset-0 z-200 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowSettings(false)}
          />

          {/* Panel — slides in from the right */}
          <div className="relative ml-auto w-full max-w-md bg-white h-full flex flex-col shadow-2xl">

            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 shrink-0">
              <div>
                <h2 className="text-sm font-semibold text-zinc-900">Popup Settings</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Configure trigger and display conditions.</p>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-zinc-100 shrink-0">
              {(["trigger", "conditions"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2.5 text-xs font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? "text-violet-700 border-b-2 border-violet-600"
                      : "text-zinc-500 hover:text-zinc-700"
                  }`}
                >
                  {tab === "trigger" ? "Trigger" : "Display Conditions"}
                </button>
              ))}
            </div>

            {/* Panel body */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

              {/* ── Trigger tab ── */}
              {activeTab === "trigger" && (
                <>
                  {/* Event type */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                      Trigger event
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["on-load", "on-scroll", "on-exit-intent", "on-click"] as PopupTriggerEvent[]).map(ev => {
                        const Icon = TRIGGER_ICONS[ev];
                        const active = trigger.event === ev;
                        return (
                          <button
                            key={ev}
                            onClick={() => updateTrigger({ event: ev })}
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-left transition-all ${
                              active ? "border-violet-500 bg-violet-50" : "border-zinc-200 hover:border-zinc-300"
                            }`}
                          >
                            <Icon className={`w-4 h-4 shrink-0 ${active ? "text-violet-600" : "text-zinc-400"}`} />
                            <span className={`text-xs font-medium leading-tight ${active ? "text-violet-900" : "text-zinc-700"}`}>
                              {TRIGGER_EVENT_LABELS[ev]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Event-specific options */}
                  {trigger.event === "on-load" && (
                    <div className="flex items-center gap-3">
                      <label className="text-xs text-zinc-600 shrink-0">Delay (seconds)</label>
                      <input
                        type="number" min={0} max={60}
                        value={trigger.delay ?? 0}
                        onChange={e => updateTrigger({ delay: Number(e.target.value) })}
                        className="w-20 px-3 py-1.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                  )}

                  {trigger.event === "on-scroll" && (
                    <div className="flex items-center gap-3">
                      <label className="text-xs text-zinc-600 shrink-0">Scroll depth (%)</label>
                      <input
                        type="number" min={1} max={100}
                        value={trigger.scrollPercent ?? 50}
                        onChange={e => updateTrigger({ scrollPercent: Number(e.target.value) })}
                        className="w-20 px-3 py-1.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                  )}

                  {trigger.event === "on-click" && (
                    <div className="space-y-1.5">
                      <label className="block text-xs text-zinc-600">
                        CSS selector <span className="text-zinc-400">(element that opens the popup)</span>
                      </label>
                      <input
                        type="text"
                        value={trigger.clickSelector ?? ""}
                        onChange={e => updateTrigger({ clickSelector: e.target.value })}
                        placeholder="#open-popup, .subscribe-btn, [data-popup]"
                        className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono"
                      />
                      <p className="text-[11px] text-zinc-400">
                        Any element matching this selector will open the popup on click.
                      </p>
                    </div>
                  )}

                  {/* Frequency */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                      Show frequency
                    </label>
                    <div className="flex flex-col gap-2">
                      {(["always", "once-per-session", "once-per-user"] as PopupFrequency[]).map(freq => (
                        <button
                          key={freq}
                          onClick={() => updateTrigger({ frequency: freq })}
                          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-left transition-all ${
                            trigger.frequency === freq
                              ? "border-violet-500 bg-violet-50"
                              : "border-zinc-200 hover:border-zinc-300"
                          }`}
                        >
                          <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${trigger.frequency === freq ? "text-violet-600" : "text-zinc-400"}`} />
                          <span className={`text-xs font-medium ${trigger.frequency === freq ? "text-violet-900" : "text-zinc-700"}`}>
                            {TRIGGER_FREQUENCY_LABELS[freq]}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* ── Conditions tab ── */}
              {activeTab === "conditions" && (
                <div className="space-y-3">
                  <p className="text-xs text-zinc-500">
                    Control which pages this popup appears on. No rules = entire site.
                  </p>

                  {rules.length === 0 && (
                    <div className="text-center py-6 border border-dashed border-zinc-200 rounded-xl text-zinc-400">
                      <Settings className="w-7 h-7 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No conditions — shows on entire site.</p>
                      <p className="text-xs mt-1">Add a rule to restrict visibility.</p>
                    </div>
                  )}

                  {rules.map((rule, idx) => {
                    const meta = LOCATION_TYPE_META[rule.locationType];
                    const subOptions = getSubOptions(rule.locationType);
                    const search = subSearch[idx] ?? "";
                    const filteredOpts = subOptions.filter(o =>
                      o.label.toLowerCase().includes(search.toLowerCase())
                    );

                    return (
                      <div
                        key={idx}
                        className="space-y-2 p-3 bg-zinc-50 rounded-xl border border-zinc-200"
                        ref={idx === openDropdown ? dropdownRef : undefined}
                      >
                        {/* Row: operator + location type */}
                        <div className="flex items-center gap-2">
                          <select
                            value={rule.operator}
                            onChange={e => updateRuleOperator(idx, e.target.value as ConditionOperator)}
                            className="w-24 shrink-0 px-2 py-1.5 text-xs border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 text-zinc-700"
                          >
                            <option value="include">Include</option>
                            <option value="exclude">Exclude</option>
                          </select>

                          <select
                            value={rule.locationType}
                            onChange={e => updateRuleLocationType(idx, e.target.value as ConditionLocationType)}
                            className="flex-1 px-2 py-1.5 text-xs border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 text-zinc-700"
                          >
                            {LOCATION_TYPE_GROUPS.map(group => {
                              const items = (Object.entries(LOCATION_TYPE_META) as [ConditionLocationType, typeof LOCATION_TYPE_META[ConditionLocationType]][])
                                .filter(([, m]) => m.group === group);
                              if (!items.length) return null;
                              return (
                                <optgroup key={group} label={group}>
                                  {items.map(([type, m]) => (
                                    <option key={type} value={type}>{m.label}</option>
                                  ))}
                                </optgroup>
                              );
                            })}
                          </select>

                          <button
                            onClick={() => removeRule(idx)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Sub-selector */}
                        {meta.hasSubSelector && (
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setOpenDropdown(openDropdown === idx ? null : idx)}
                              className="w-full flex items-center justify-between gap-1.5 px-2.5 py-1.5 text-xs border border-zinc-200 rounded-lg bg-white hover:border-violet-400 transition-colors text-left"
                            >
                              <span className={rule.subType && rule.subType !== "all" ? "text-zinc-900" : "text-zinc-400"}>
                                {getSubLabel(rule)}
                              </span>
                              <ChevronDown className="w-3 h-3 text-zinc-400 shrink-0" />
                            </button>

                            {openDropdown === idx && (
                              <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-zinc-200 rounded-xl shadow-xl overflow-hidden">
                                <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-100">
                                  <Search className="w-3 h-3 text-zinc-400 shrink-0" />
                                  <input
                                    autoFocus
                                    type="text"
                                    value={search}
                                    onChange={e => { const s = [...subSearch]; s[idx] = e.target.value; setSubSearch(s); }}
                                    placeholder={`Search ${meta.subSelectorLabel?.toLowerCase() ?? ""}...`}
                                    className="flex-1 text-xs text-zinc-700 placeholder-zinc-400 focus:outline-none bg-transparent"
                                  />
                                </div>
                                <ul className="max-h-40 overflow-y-auto py-1">
                                  <li>
                                    <button type="button" onClick={() => updateRuleSubType(idx, "all")}
                                      className={`w-full flex items-center px-3 py-1.5 text-xs transition-colors ${(rule.subType ?? "all") === "all" ? "bg-violet-50 text-violet-700 font-medium" : "text-zinc-700 hover:bg-zinc-50"}`}>
                                      All
                                    </button>
                                  </li>
                                  {filteredOpts.length === 0
                                    ? <li className="px-3 py-2 text-xs text-zinc-400">No results</li>
                                    : filteredOpts.map(opt => (
                                      <li key={opt.id}>
                                        <button type="button" onClick={() => updateRuleSubType(idx, opt.id)}
                                          className={`w-full flex items-center justify-between px-3 py-1.5 text-xs transition-colors ${rule.subType === opt.id ? "bg-violet-50 text-violet-700 font-medium" : "text-zinc-700 hover:bg-zinc-50"}`}>
                                          <span className="truncate">{opt.label}</span>
                                          {opt.sub && <span className="text-zinc-400 font-mono ml-2 shrink-0">{opt.sub}</span>}
                                        </button>
                                      </li>
                                    ))
                                  }
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <button
                    onClick={addRule}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-violet-600 border border-violet-200 rounded-lg hover:bg-violet-50 transition-colors w-full justify-center"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add condition
                  </button>

                  {rules.length > 0 && (
                    <button
                      onClick={() => { setRules([]); setSubSearch([]); persistRules([]); }}
                      className="w-full text-xs text-zinc-400 hover:text-zinc-600 transition-colors py-1"
                    >
                      Clear all conditions
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Panel footer */}
            <div className="px-5 py-4 border-t border-zinc-100 shrink-0">
              <button
                onClick={() => setShowSettings(false)}
                className="w-full py-2.5 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
