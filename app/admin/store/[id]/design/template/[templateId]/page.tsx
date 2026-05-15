"use client";

import { use, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Data } from "@puckeditor/core";
import {
  ArrowLeft, Save, Check, Globe, Clock,
  Settings, X, Search, Trash2, Plus, ChevronDown,
  Timer, MousePointer, TrendingUp, LogOut, RefreshCw,
} from "lucide-react";
import {
  type TemplateConditions,
  type ConditionRule,
  type ConditionLocationType,
  type ConditionOperator,
  type PopupTrigger,
  LOCATION_TYPE_META,
  LOCATION_TYPE_GROUPS,
  summariseConditions,
} from "@/lib/templates/conditions";

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

interface TemplateData {
  id: string;
  name: string;
  type: string;
  content: Data;
  isActive: boolean;
  conditions: TemplateConditions;
  storeId: string;
}

interface PageOption {
  id: string;
  title: string;
  slug: string;
}

interface ProductOption {
  id: string;
  name: string;
}

const TYPE_LABELS: Record<string, string> = {
  header: "Header",
  footer: "Footer",
  "single-product": "Single Product",
  "archive-products": "Products Archive",
  "single-post": "Single Post",
  "archive-blog": "Blog Archive",
  cart: "Cart",
  search: "Search Results",
  "not-found": "404 Page",
  popup: "Popup",
};

const POPUP_TRIGGER_LABELS: Record<string, string> = {
  "on-load": "On Page Load",
  "on-scroll": "On Scroll",
  "on-exit-intent": "On Exit Intent",
  "on-click": "On Element Click",
};

const POPUP_FREQUENCY_LABELS: Record<string, string> = {
  always: "Every visit",
  "once-per-session": "Once per session",
  "once-per-user": "Once per user",
};

export default function TemplateDesignPage({
  params,
}: {
  params: Promise<{ id: string; templateId: string }>;
}) {
  const { id: storeId, templateId } = use(params);
  const router = useRouter();
  const [template, setTemplate] = useState<TemplateData | null>(null);
  const [templateContent, setTemplateContent] = useState<Data | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  // Latest content ref — updated by Puck onChange without causing re-renders
  const latestContent = useRef<Data | null>(null);
  // Conditions modal
  const [showConditions, setShowConditions] = useState(false);
  const [pages, setPages] = useState<PageOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [rules, setRules] = useState<ConditionRule[]>([]);
  const [popupTrigger, setPopupTrigger] = useState<PopupTrigger>({
    event: "on-load",
    delay: 3,
    frequency: "once-per-session",
  });
  const [subSearch, setSubSearch] = useState<string[]>([]);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!storeId || !templateId) return;
    Promise.all([
      fetch(`/api/stores/${storeId}/templates/${templateId}`).then(r => r.json()),
      fetch(`/api/stores/${storeId}/pages?includeUnpublished=true`).then(r => r.json()),
      fetch(`/api/stores/${storeId}/products`).then(r => r.json()),
    ]).then(([tData, pData, prodData]) => {
      setTemplate(tData);
      const initialContent = tData.content || { content: [], root: { props: {} } };
      setTemplateContent(initialContent);
      latestContent.current = initialContent;
      const cond = (tData.conditions as TemplateConditions) || {};

      // Load rules — migrate legacy format if needed
      if (cond.rules && cond.rules.length > 0) {
        setRules(cond.rules);
        setSubSearch(cond.rules.map(() => ""));
      } else if (cond.show === "only" && cond.pages) {
        const migrated: ConditionRule[] = cond.pages.map((id: string) => ({
          operator: "include" as ConditionOperator,
          locationType: "single-page" as ConditionLocationType,
          subType: id,
        }));
        setRules(migrated);
        setSubSearch(migrated.map(() => ""));
      } else if (cond.show === "all" && cond.except) {
        const migrated: ConditionRule[] = cond.except.map((id: string) => ({
          operator: "exclude" as ConditionOperator,
          locationType: "single-page" as ConditionLocationType,
          subType: id,
        }));
        setRules(migrated);
        setSubSearch(migrated.map(() => ""));
      }

      if (cond.popup) setPopupTrigger(cond.popup);

      setPages(Array.isArray(pData) ? pData : (pData.items ?? []));
      setProducts(Array.isArray(prodData) ? prodData : (prodData.items ?? []));
      setIsLoading(false);
    }).catch(() => {
      router.push(`/admin/store/${storeId}/templates`);
    });
  }, [storeId, templateId, router]);

  // Close dropdown on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleSave = useCallback(async (data: Data) => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/stores/${storeId}/templates/${templateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: data }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTemplate(updated);
        // Do NOT call setTemplateContent here — it would remount Puck
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setIsSaving(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, templateId]);

  const handleActivate = async () => {
    if (!template) return;
    const res = await fetch(`/api/stores/${storeId}/templates/${templateId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !template.isActive }),
    });
    if (res.ok) setTemplate(await res.json());
  };

  const persistConditions = async (newRules: ConditionRule[], newPopup?: PopupTrigger) => {
    const conditions: TemplateConditions = { rules: newRules };
    if (template?.type === "popup" && newPopup) conditions.popup = newPopup;
    const res = await fetch(`/api/stores/${storeId}/templates/${templateId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conditions }),
    });
    if (res.ok) setTemplate(await res.json());
  };

  const addRule = () => {
    const newRules: ConditionRule[] = [
      ...rules,
      { operator: "include", locationType: "entire-site" },
    ];
    setRules(newRules);
    setSubSearch([...subSearch, ""]);
    persistConditions(newRules, popupTrigger);
  };

  const removeRule = (idx: number) => {
    const newRules = rules.filter((_, i) => i !== idx);
    const newSearch = subSearch.filter((_, i) => i !== idx);
    setRules(newRules);
    setSubSearch(newSearch);
    persistConditions(newRules, popupTrigger);
  };

  const updateRuleOperator = (idx: number, operator: ConditionOperator) => {
    const newRules = rules.map((r, i) => i === idx ? { ...r, operator } : r);
    setRules(newRules);
    persistConditions(newRules, popupTrigger);
  };

  const updateRuleLocationType = (idx: number, locationType: ConditionLocationType) => {
    const meta = LOCATION_TYPE_META[locationType];
    const newRules = rules.map((r, i) =>
      i === idx ? { operator: r.operator, locationType, subType: meta.hasSubSelector ? "all" : undefined } : r
    );
    setRules(newRules);
    setSubSearch(subSearch.map((s, i) => i === idx ? "" : s));
    persistConditions(newRules, popupTrigger);
  };

  const updateRuleSubType = (idx: number, subType: string) => {
    const newRules = rules.map((r, i) => i === idx ? { ...r, subType } : r);
    setRules(newRules);
    setSubSearch(subSearch.map((s, i) => i === idx ? "" : s));
    setOpenDropdown(null);
    persistConditions(newRules, popupTrigger);
  };

  const updatePopupTrigger = (patch: Partial<PopupTrigger>) => {
    const newTrigger = { ...popupTrigger, ...patch };
    setPopupTrigger(newTrigger);
    persistConditions(rules, newTrigger);
  };

  const getSubOptions = (locationType: ConditionLocationType): { id: string; label: string; sub?: string }[] => {
    const meta = LOCATION_TYPE_META[locationType];
    if (!meta.hasSubSelector) return [];
    if (meta.subSelectorType === "pages") return pages.map(p => ({ id: p.id, label: p.title, sub: `/${p.slug}` }));
    if (meta.subSelectorType === "products") return products.map(p => ({ id: p.id, label: p.name }));
    return [];
  };

  const getSubLabel = (rule: ConditionRule): string => {
    if (!rule.subType || rule.subType === "all") return "All";
    const opts = getSubOptions(rule.locationType);
    return opts.find(o => o.id === rule.subType)?.label ?? rule.subType;
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-zinc-500">Loading template editor...</p>
        </div>
      </div>
    );
  }

  if (!template || !templateContent) return null;

  const typeLabel = TYPE_LABELS[template.type] ?? template.type;
  const isPopup = template.type === "popup";
  const conditionSummary = summariseConditions(template.conditions);

  return (
    <div className="h-screen flex flex-col">
      {/* Topbar */}
      <header className="h-12 bg-white border-b border-zinc-200 flex items-center justify-between px-4 shrink-0 z-50">
        <div className="flex items-center gap-3">
          <Link href={`/admin/store/${storeId}/templates`}>
            <button className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Templates
            </button>
          </Link>
          <span className="text-zinc-300">/</span>
          <span className="text-sm font-medium text-zinc-900 truncate max-w-40">{template.name}</span>
          <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 text-xs rounded-full font-medium">{typeLabel}</span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
            template.isActive
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-zinc-100 text-zinc-600 border border-zinc-200"
          }`}>
            {template.isActive ? <><Globe className="w-3 h-3" />Active</> : <><Clock className="w-3 h-3" />Inactive</>}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConditions(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            {isPopup ? "Popup Settings" : "Display Conditions"}
            <span className="text-[10px] text-zinc-400">{conditionSummary}</span>
          </button>

          <button
            onClick={handleActivate}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              template.isActive
                ? "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                : "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700"
            }`}
          >
            {template.isActive ? "Deactivate" : "Activate"}
          </button>

          <button
            onClick={() => latestContent.current && handleSave(latestContent.current)}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</>
            ) : saved ? (
              <><Check className="w-3.5 h-3.5" />Saved</>
            ) : (
              <><Save className="w-3.5 h-3.5" />Save</>
            )}
          </button>
        </div>
      </header>

      {/* Full-height Puck editor */}
      <div className="flex-1 overflow-hidden">
        <PuckEditor
          data={templateContent}
          onPublish={handleSave}
          onSave={async (data) => { latestContent.current = data; }}
          layoutId="default"
          storeId={storeId}
        />
      </div>

      {/* ── Conditions / Popup Settings Modal ── */}
      {showConditions && (
        <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowConditions(false)}
          />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh]">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 shrink-0">
              <div>
                <h2 className="text-sm font-semibold text-zinc-900">
                  {isPopup ? "Popup Settings" : "Display Conditions"}
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {isPopup
                    ? "Configure when and where this popup appears."
                    : "Control which pages this template appears on. No rules = entire site."}
                </p>
              </div>
              <button
                onClick={() => setShowConditions(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">

              {/* ── Popup trigger section ── */}
              {isPopup && (
                <div className="px-6 py-5 border-b border-zinc-100 space-y-4">
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Trigger</h3>

                  <div className="grid grid-cols-2 gap-2">
                    {(["on-load", "on-scroll", "on-exit-intent", "on-click"] as const).map(ev => {
                      const icons = {
                        "on-load": Timer,
                        "on-scroll": TrendingUp,
                        "on-exit-intent": LogOut,
                        "on-click": MousePointer,
                      };
                      const Icon = icons[ev];
                      const active = popupTrigger.event === ev;
                      return (
                        <button
                          key={ev}
                          onClick={() => updatePopupTrigger({ event: ev })}
                          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-left transition-all ${
                            active ? "border-violet-500 bg-violet-50" : "border-zinc-200 hover:border-zinc-300"
                          }`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${active ? "text-violet-600" : "text-zinc-400"}`} />
                          <span className={`text-xs font-medium ${active ? "text-violet-900" : "text-zinc-700"}`}>
                            {POPUP_TRIGGER_LABELS[ev]}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {popupTrigger.event === "on-load" && (
                    <div className="flex items-center gap-3">
                      <label className="text-xs text-zinc-600 shrink-0">Delay (seconds)</label>
                      <input
                        type="number" min={0} max={60}
                        value={popupTrigger.delay ?? 0}
                        onChange={e => updatePopupTrigger({ delay: Number(e.target.value) })}
                        className="w-20 px-3 py-1.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                  )}

                  {popupTrigger.event === "on-scroll" && (
                    <div className="flex items-center gap-3">
                      <label className="text-xs text-zinc-600 shrink-0">Scroll depth (%)</label>
                      <input
                        type="number" min={1} max={100}
                        value={popupTrigger.scrollPercent ?? 50}
                        onChange={e => updatePopupTrigger({ scrollPercent: Number(e.target.value) })}
                        className="w-20 px-3 py-1.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                  )}

                  {popupTrigger.event === "on-click" && (
                    <div className="flex items-center gap-3">
                      <label className="text-xs text-zinc-600 shrink-0">CSS selector</label>
                      <input
                        type="text"
                        value={popupTrigger.clickSelector ?? ""}
                        onChange={e => updatePopupTrigger({ clickSelector: e.target.value })}
                        placeholder="#open-popup, .trigger-btn"
                        className="flex-1 px-3 py-1.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs text-zinc-600 mb-1.5">Show frequency</label>
                    <div className="flex flex-wrap gap-2">
                      {(["always", "once-per-session", "once-per-user"] as const).map(freq => (
                        <button
                          key={freq}
                          onClick={() => updatePopupTrigger({ frequency: freq })}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                            popupTrigger.frequency === freq
                              ? "border-violet-500 bg-violet-50 text-violet-700"
                              : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                          }`}
                        >
                          <RefreshCw className="w-3 h-3" />
                          {POPUP_FREQUENCY_LABELS[freq]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Display condition rules ── */}
              <div className="px-6 py-5 space-y-3">
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  {isPopup ? "Display conditions" : "Where to display"}
                </h3>

                {rules.length === 0 && (
                  <div className="text-center py-6 text-zinc-400 border border-dashed border-zinc-200 rounded-xl">
                    <Settings className="w-7 h-7 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No conditions — shows on entire site.</p>
                    <p className="text-xs mt-1">Add a rule to restrict where it appears.</p>
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
                      className="flex items-start gap-2"
                      ref={idx === openDropdown ? dropdownRef : undefined}
                    >
                      {/* Include / Exclude */}
                      <select
                        value={rule.operator}
                        onChange={e => updateRuleOperator(idx, e.target.value as ConditionOperator)}
                        className="w-28 shrink-0 px-2.5 py-2 text-sm border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 text-zinc-700"
                      >
                        <option value="include">Include</option>
                        <option value="exclude">Exclude</option>
                      </select>

                      {/* Location type grouped select */}
                      <select
                        value={rule.locationType}
                        onChange={e => updateRuleLocationType(idx, e.target.value as ConditionLocationType)}
                        className="flex-1 px-2.5 py-2 text-sm border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 text-zinc-700"
                      >
                        {LOCATION_TYPE_GROUPS.map(group => {
                          const groupItems = (Object.entries(LOCATION_TYPE_META) as [ConditionLocationType, typeof LOCATION_TYPE_META[ConditionLocationType]][])
                            .filter(([, m]) => m.group === group);
                          if (groupItems.length === 0) return null;
                          return (
                            <optgroup key={group} label={group}>
                              {groupItems.map(([type, m]) => (
                                <option key={type} value={type}>{m.label}</option>
                              ))}
                            </optgroup>
                          );
                        })}
                      </select>

                      {/* Sub-selector (specific product / page / post) */}
                      {meta.hasSubSelector && (
                        <div className="w-44 relative shrink-0">
                          <button
                            type="button"
                            onClick={() => setOpenDropdown(openDropdown === idx ? null : idx)}
                            className="w-full flex items-center justify-between gap-1.5 px-2.5 py-2 text-sm border border-zinc-200 rounded-lg bg-white hover:border-violet-400 focus:outline-none transition-colors text-left"
                          >
                            <span className={`truncate ${rule.subType && rule.subType !== "all" ? "text-zinc-900" : "text-zinc-400"}`}>
                              {getSubLabel(rule)}
                            </span>
                            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          </button>

                          {openDropdown === idx && (
                            <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-zinc-200 rounded-xl shadow-xl overflow-hidden min-w-50">
                              <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-100">
                                <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                <input
                                  autoFocus
                                  type="text"
                                  value={search}
                                  onChange={e => {
                                    const s = [...subSearch];
                                    s[idx] = e.target.value;
                                    setSubSearch(s);
                                  }}
                                  placeholder={`Search ${meta.subSelectorLabel?.toLowerCase() ?? ""}...`}
                                  className="flex-1 text-sm text-zinc-700 placeholder-zinc-400 focus:outline-none bg-transparent"
                                />
                              </div>
                              <ul className="max-h-48 overflow-y-auto py-1">
                                <li>
                                  <button
                                    type="button"
                                    onClick={() => updateRuleSubType(idx, "all")}
                                    className={`w-full flex items-center px-3 py-2 text-sm transition-colors ${
                                      (rule.subType ?? "all") === "all"
                                        ? "bg-violet-50 text-violet-700 font-medium"
                                        : "text-zinc-700 hover:bg-zinc-50"
                                    }`}
                                  >
                                    All
                                  </button>
                                </li>
                                {filteredOpts.length === 0 ? (
                                  <li className="px-3 py-2 text-xs text-zinc-400">No results</li>
                                ) : (
                                  filteredOpts.map(opt => (
                                    <li key={opt.id}>
                                      <button
                                        type="button"
                                        onClick={() => updateRuleSubType(idx, opt.id)}
                                        className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                                          rule.subType === opt.id
                                            ? "bg-violet-50 text-violet-700 font-medium"
                                            : "text-zinc-700 hover:bg-zinc-50"
                                        }`}
                                      >
                                        <span className="truncate">{opt.label}</span>
                                        {opt.sub && (
                                          <span className="text-xs text-zinc-400 font-mono ml-2 shrink-0">{opt.sub}</span>
                                        )}
                                      </button>
                                    </li>
                                  ))
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Remove rule */}
                      <button
                        onClick={() => removeRule(idx)}
                        className="p-2 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                        title="Remove rule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-zinc-100 flex items-center justify-between shrink-0">
              <button
                onClick={addRule}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-violet-600 border border-violet-200 rounded-lg hover:bg-violet-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add condition
              </button>

              <div className="flex items-center gap-2">
                {rules.length > 0 && (
                  <button
                    onClick={() => { setRules([]); setSubSearch([]); persistConditions([], popupTrigger); }}
                    className="px-3 py-2 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={() => setShowConditions(false)}
                  className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
