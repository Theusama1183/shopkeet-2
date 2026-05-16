"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, ChevronDown, MoreHorizontal, Search,
  Sparkles, X, Check, AlertCircle, Loader2,
} from "lucide-react";
import { MediaUploader } from "@/components/ui/media-uploader";
import type { MediaFile } from "@/components/ui/media-uploader";
import {
  useCreateProduct, useUpdateProduct, productKeys,
  useCollections, useCategories, useTags,
} from "@/lib/queries";

// ── Types ─────────────────────────────────────────────────────────────────────

type ProductStatus = "active" | "draft" | "archived";

interface FormState {
  name: string;
  description: string;
  images: MediaFile[];
  // Pricing (display in dollars, stored in cents)
  price: string;
  compareAtPrice: string;
  costPerItem: string;
  // Inventory
  sku: string;
  barcode: string;
  trackQuantity: boolean;
  quantity: string;
  lowStockThreshold: string;
  // Shipping
  weight: string;
  weightUnit: "kg" | "g" | "lb" | "oz";
  requiresShipping: boolean;
  // SEO
  seoTitle: string;
  seoDescription: string;
  seoSlug: string;
  // Organization
  status: ProductStatus;
  productType: string;
  vendor: string;
  collectionId: string;
  categoryId: string;
  tags: string[];
  // Tags input buffer
  tagInput: string;
}

const EMPTY: FormState = {
  name: "", description: "", images: [],
  price: "", compareAtPrice: "", costPerItem: "",
  sku: "", barcode: "", trackQuantity: true,
  quantity: "0", lowStockThreshold: "",
  weight: "", weightUnit: "kg", requiresShipping: true,
  seoTitle: "", seoDescription: "", seoSlug: "",
  status: "active", productType: "", vendor: "",
  collectionId: "", categoryId: "", tags: [], tagInput: "",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function centsToDisplay(v: number | null | undefined): string {
  if (v == null) return "";
  return (v / 100).toFixed(2);
}
function displayToCents(v: string): number {
  const n = parseFloat(v.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : Math.round(n * 100);
}
function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function calcMargin(price: string, cost: string): string {
  const p = displayToCents(price);
  const c = displayToCents(cost);
  if (!p || !c || c >= p) return "—";
  return `${Math.round(((p - c) / p) * 100)}%`;
}

// ── Searchable select ─────────────────────────────────────────────────────────

interface SearchableSelectProps {
  label: string;
  placeholder: string;
  options: { id: string; name: string }[];
  value: string;
  onChange: (id: string) => void;
  inputCls: string;
}

function SearchableSelect({ label: _label, placeholder, options, value, onChange, inputCls }: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.id === value);
  const filtered = options.filter((o) => o.name.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`${inputCls} flex items-center justify-between text-left`}
      >
        <span className={selected ? "text-zinc-900" : "text-zinc-400"}>
          {selected?.name ?? placeholder}
        </span>
        <ChevronDown size={14} className="text-zinc-400 shrink-0" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-zinc-200 bg-white shadow-xl">
          <div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2">
            <Search size={14} className="text-zinc-400 shrink-0" />
            <input
              autoFocus
              className="w-full text-sm outline-none placeholder:text-zinc-400"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <ul className="max-h-48 overflow-y-auto py-1">
            <li>
              <button
                type="button"
                onClick={() => { onChange(""); setOpen(false); setSearch(""); }}
                className={`w-full px-3 py-2 text-left text-sm transition hover:bg-zinc-50 ${!value ? "font-medium text-zinc-900" : "text-zinc-500"}`}
              >
                None
              </button>
            </li>
            {filtered.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => { onChange(o.id); setOpen(false); setSearch(""); }}
                  className={`w-full px-3 py-2 text-left text-sm transition hover:bg-zinc-50 ${o.id === value ? "font-medium text-violet-700 bg-violet-50" : "text-zinc-700"}`}
                >
                  {o.name}
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-zinc-400">No results</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

type ProductEditorPageProps = {
  mode: "new" | "edit";
  storeId: string;
  productId?: string;
};

// ── Style constants ───────────────────────────────────────────────────────────

const card = "rounded-xl border border-zinc-200 bg-white shadow-sm";
const label = "text-sm font-medium text-zinc-800";
const input = "mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10";
const muted = "text-sm text-zinc-500";

function SectionTitle({ title, description }: { title: string; description?: string }) {
  return (
    <div className="border-b border-zinc-200 px-5 py-4">
      <h2 className="text-base font-semibold normal-case tracking-normal text-zinc-950">{title}</h2>
      {description ? <p className="mt-1 text-sm text-zinc-500">{description}</p> : null}
    </div>
  );
}

function Field({ labelText, children, hint }: { labelText: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className={label}>{labelText}</span>
      {children}
      {hint && <p className="mt-1 text-xs text-zinc-400">{hint}</p>}
    </label>
  );
}

export function ProductEditorPage({ mode, storeId, productId }: ProductEditorPageProps) {
  const isEdit = mode === "edit";
  const router = useRouter();
  const queryClient = useQueryClient();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct(storeId);

  const [form, setForm] = useState<FormState>(EMPTY);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedOk, setSavedOk] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);

  const { data: collections = [] } = useCollections(storeId);
  const { data: categories = [] } = useCategories(storeId);
  const { data: tags = [] } = useTags(storeId);

  // ── Load existing product ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isEdit || !productId) return;
    fetch(`/api/products/${productId}`)
      .then((r) => r.json())
      .then((data) => {
        let images: MediaFile[] = [];
        if (Array.isArray(data.images) && data.images.length > 0) {
          images = data.images.map((img: string | { url: string }, i: number) => ({
            id: `img-${i}`, url: typeof img === "string" ? img : img.url,
            name: `Image ${i + 1}`, type: "image/jpeg",
          }));
        } else if (data.image) {
          images = [{ id: "img-0", url: data.image, name: "Product image", type: "image/jpeg" }];
        }
        const productTags: string[] = Array.isArray(data.tags)
          ? data.tags.map((t: string | { name: string }) => typeof t === "string" ? t : t.name)
          : [];
        setForm({
          name: data.name ?? "", description: data.description ?? "", images,
          price: centsToDisplay(data.price),
          compareAtPrice: centsToDisplay(data.compare_at_price ?? data.compareAtPrice),
          costPerItem: centsToDisplay(data.cost_per_item ?? data.costPerItem),
          sku: data.sku ?? "", barcode: data.barcode ?? "",
          trackQuantity: data.track_quantity ?? data.trackQuantity ?? true,
          quantity: String(data.quantity ?? 0),
          lowStockThreshold: data.low_stock_threshold ? String(data.low_stock_threshold) : "",
          weight: data.weight ? String(data.weight) : "",
          weightUnit: data.weight_unit ?? data.weightUnit ?? "kg",
          requiresShipping: data.requires_shipping ?? data.requiresShipping ?? true,
          seoTitle: data.seo_title ?? data.seoTitle ?? "",
          seoDescription: data.seo_description ?? data.seoDescription ?? "",
          seoSlug: data.seo_slug ?? data.seoSlug ?? "",
          status: (data.status as ProductStatus) ?? (data.is_active ? "active" : "draft"),
          productType: data.product_type ?? data.productType ?? "",
          vendor: data.vendor ?? "",
          collectionId: data.collection_id ?? data.collectionId ?? "",
          categoryId: data.category_id ?? data.categoryId ?? "",
          tags: productTags, tagInput: "",
        });
        setSlugEdited(!!data.seo_slug);
      })
      .catch(() => router.push(`/store/${storeId}/products`))
      .finally(() => setIsLoading(false));
  }, [isEdit, productId, storeId, router]);

  const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleNameChange = (name: string) => {
    set("name", name);
    if (!slugEdited) set("seoSlug", slugify(name));
  };

  const addTag = (tag: string) => {
    const t = tag.trim().toLowerCase();
    if (t && !form.tags.includes(t)) set("tags", [...form.tags, t]);
    set("tagInput", "");
  };

  const removeTag = (tag: string) => set("tags", form.tags.filter((t) => t !== tag));

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Product title is required"); return; }
    const price = displayToCents(form.price);
    if (!form.price || price <= 0) { setError("Valid price is required"); return; }
    setError(""); setIsSaving(true);
    const payload = {
      name: form.name.trim(), description: form.description || null, price,
      compare_at_price: form.compareAtPrice ? displayToCents(form.compareAtPrice) : null,
      cost_per_item: form.costPerItem ? displayToCents(form.costPerItem) : null,
      image: form.images[0]?.url ?? null,
      images: form.images.map((f) => f.url),
      status: form.status, is_active: form.status === "active",
      sku: form.sku || null, barcode: form.barcode || null,
      track_quantity: form.trackQuantity, quantity: parseInt(form.quantity) || 0,
      low_stock_threshold: form.lowStockThreshold ? parseInt(form.lowStockThreshold) : null,
      weight: form.weight ? parseFloat(form.weight) : null,
      weight_unit: form.weightUnit, requires_shipping: form.requiresShipping,
      seo_title: form.seoTitle || null, seo_description: form.seoDescription || null,
      seo_slug: form.seoSlug || null, product_type: form.productType || null,
      vendor: form.vendor || null,
      collection_id: form.collectionId || null, category_id: form.categoryId || null,
      tags: form.tags,
    };
    try {
      if (isEdit && productId) {
        await updateProduct.mutateAsync({ id: productId, ...payload } as any);
        setSavedOk(true); setTimeout(() => setSavedOk(false), 3000);
      } else {
        const newProduct = await createProduct.mutateAsync({ ...payload, storeId, description: payload.description ?? undefined } as any);
        queryClient.setQueryData(productKeys.detail((newProduct as any).id), newProduct);
        router.push(`/store/${storeId}/products/${(newProduct as any).id}/edit`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally { setIsSaving(false); }
  };

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-violet-500" /></div>;
  }

  const margin = calcMargin(form.price, form.costPerItem);

  return (
    <div className="min-h-screen bg-[#f6f6f7] text-zinc-950">
      <div className="sticky top-0 z-30 border-b border-zinc-200 bg-[#f6f6f7]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href={`/store/${storeId}/products`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-700 transition hover:bg-zinc-50"
              aria-label="Back to products"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="min-w-0">
              <p className="text-xs font-medium text-zinc-500">Products</p>
              <h1 className="truncate text-xl font-semibold normal-case tracking-normal text-zinc-950 sm:text-2xl">
                {isEdit ? (form.name || "Edit product") : "Add product"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push(`/store/${storeId}/products`)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-60"
            >
              {isSaving ? <><Loader2 size={14} className="animate-spin" />Saving…</>
               : savedOk ? <><Check size={14} />Saved</>
               : isEdit ? "Save changes" : "Save product"}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={16} className="shrink-0" />{error}
            <button type="button" onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600"><X size={16} /></button>
          </div>
        </div>
      )}

      <main className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
        <div className="space-y-5">
          {/* Basic info */}
          <section className={card}>
            <div className="space-y-4 p-5">
              <Field labelText="Title">
                <input className={input} placeholder="Short sleeve t-shirt" value={form.name} onChange={(e) => handleNameChange(e.target.value)} />
              </Field>
              <Field labelText="Description">
                <textarea className={`${input} min-h-44 resize-y leading-6`} placeholder="Describe material, fit, key benefits, and care instructions." value={form.description} onChange={(e) => set("description", e.target.value)} />
              </Field>
            </div>
          </section>

          {/* Media */}
          <section className={card}>
            <SectionTitle title="Media" description="Add product photos, videos, or 3D models." />
            <div className="p-5">
              <MediaUploader multiple accept="image/*,video/*" maxSizeMb={50} folder="products" value={form.images} onChange={(files) => set("images", files)} showPrimary showAltText />
            </div>
          </section>

          {/* Pricing */}
          <section className={card}>
            <SectionTitle title="Pricing" />
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Field labelText="Price">
                <input className={input} placeholder="0.00" inputMode="decimal" value={form.price} onChange={(e) => set("price", e.target.value)} />
              </Field>
              <Field labelText="Compare-at price">
                <input className={input} placeholder="0.00" inputMode="decimal" value={form.compareAtPrice} onChange={(e) => set("compareAtPrice", e.target.value)} />
              </Field>
              <Field labelText="Cost per item">
                <input className={input} placeholder="0.00" inputMode="decimal" value={form.costPerItem} onChange={(e) => set("costPerItem", e.target.value)} />
              </Field>
              <div className="rounded-lg bg-zinc-50 p-3">
                <p className="text-sm font-medium text-zinc-900">Margin</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">{margin}</p>
                <p className={muted}>Enter price and cost to calculate profit.</p>
              </div>
            </div>
          </section>

          {/* Inventory */}
          <section className={card}>
            <SectionTitle title="Inventory" />
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Field labelText="SKU">
                <input className={input} placeholder="SKU-001" value={form.sku} onChange={(e) => set("sku", e.target.value)} />
              </Field>
              <Field labelText="Barcode">
                <input className={input} placeholder="ISBN, UPC, GTIN, etc." value={form.barcode} onChange={(e) => set("barcode", e.target.value)} />
              </Field>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-200 p-3 sm:col-span-2">
                <input type="checkbox" className="mt-1 h-4 w-4 rounded border-zinc-300 accent-zinc-900" checked={form.trackQuantity} onChange={(e) => set("trackQuantity", e.target.checked)} />
                <span>
                  <span className="block text-sm font-medium text-zinc-900">Track quantity</span>
                  <span className="block text-sm text-zinc-500">Shopkeet will track stock and show low inventory warnings.</span>
                </span>
              </label>
              {form.trackQuantity && (
                <>
                  <Field labelText="Quantity">
                    <input className={input} placeholder="0" inputMode="numeric" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} />
                  </Field>
                  <Field labelText="Low stock alert">
                    <input className={input} placeholder="5" inputMode="numeric" value={form.lowStockThreshold} onChange={(e) => set("lowStockThreshold", e.target.value)} />
                  </Field>
                </>
              )}
            </div>
          </section>

          {/* Shipping */}
          <section className={card}>
            <SectionTitle title="Shipping" />
            <div className="grid gap-4 p-5 sm:grid-cols-3">
              <Field labelText="Weight">
                <input className={input} placeholder="0.0" inputMode="decimal" value={form.weight} onChange={(e) => set("weight", e.target.value)} />
              </Field>
              <Field labelText="Unit">
                <select className={input} value={form.weightUnit} onChange={(e) => set("weightUnit", e.target.value as FormState["weightUnit"])}>
                  <option value="kg">kg</option><option value="g">g</option>
                  <option value="lb">lb</option><option value="oz">oz</option>
                </select>
              </Field>
              <Field labelText="Requires shipping">
                <select className={input} value={form.requiresShipping ? "yes" : "no"} onChange={(e) => set("requiresShipping", e.target.value === "yes")}>
                  <option value="yes">Yes</option><option value="no">No</option>
                </select>
              </Field>
            </div>
          </section>

          {/* SEO */}
          <section className={card}>
            <SectionTitle title="Search engine listing" description="Control how this product appears in search results." />
            <div className="space-y-4 p-5">
              <Field labelText="Page title" hint="Recommended: 50–60 characters">
                <input className={input} placeholder="Premium cotton t-shirt" value={form.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} maxLength={60} />
              </Field>
              <Field labelText="Meta description" hint="Recommended: 120–160 characters">
                <textarea className={`${input} min-h-24 resize-y`} placeholder="Write a short SEO description." value={form.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} maxLength={160} />
              </Field>
              <Field labelText="URL handle">
                <div className="mt-1.5 flex overflow-hidden rounded-lg border border-zinc-300 bg-white focus-within:border-zinc-900 focus-within:ring-2 focus-within:ring-zinc-900/10">
                  <span className="border-r border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-500">/products/</span>
                  <input className="w-full px-3 py-2.5 text-sm outline-none" placeholder="premium-cotton-t-shirt" value={form.seoSlug} onChange={(e) => { set("seoSlug", e.target.value); setSlugEdited(true); }} />
                </div>
              </Field>
            </div>
          </section>
        </div>

        {/* ── Sidebar ── */}
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          {/* Status */}
          <section className={card}>
            <SectionTitle title="Status" />
            <div className="space-y-3 p-5">
              <select className={input} value={form.status} onChange={(e) => set("status", e.target.value as ProductStatus)}>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
              <p className={muted}>Only active products are visible on the storefront.</p>
            </div>
          </section>

          {/* Organization */}
          <section className={card}>
            <SectionTitle title="Product organization" />
            <div className="space-y-4 p-5">
              <Field labelText="Product type">
                <input className={input} placeholder="T-shirt" value={form.productType} onChange={(e) => set("productType", e.target.value)} />
              </Field>
              <Field labelText="Vendor">
                <input className={input} placeholder="Brand name" value={form.vendor} onChange={(e) => set("vendor", e.target.value)} />
              </Field>
              <div className="block">
                <span className={label}>Collection</span>
                <SearchableSelect label="Collection" placeholder="Select collection" options={collections as { id: string; name: string }[]} value={form.collectionId} onChange={(id) => set("collectionId", id)} inputCls={input} />
              </div>
              <div className="block">
                <span className={label}>Category</span>
                <SearchableSelect label="Category" placeholder="Select category" options={categories as { id: string; name: string }[]} value={form.categoryId} onChange={(id) => set("categoryId", id)} inputCls={input} />
              </div>
            </div>
          </section>

          {/* Tags */}
          <section className={card}>
            <SectionTitle title="Tags" />
            <div className="p-5">
              <div className="flex gap-2">
                <input
                  className={`${input} flex-1`}
                  placeholder="Add tag, press Enter"
                  value={form.tagInput}
                  onChange={(e) => set("tagInput", e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(form.tagInput); } }}
                />
                <button type="button" onClick={() => addTag(form.tagInput)} className="mt-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50">Add</button>
              </div>
              {/* Tag suggestions from store */}
              {tags.length > 0 && form.tagInput && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(tags as { id: string; name: string }[])
                    .filter((t) => t.name.toLowerCase().includes(form.tagInput.toLowerCase()) && !form.tags.includes(t.name))
                    .slice(0, 6)
                    .map((t) => (
                      <button key={t.id} type="button" onClick={() => addTag(t.name)} className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs text-zinc-600 hover:bg-zinc-100">
                        + {t.name}
                      </button>
                    ))}
                </div>
              )}
              {form.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {form.tags.map((tag) => (
                    <span key={tag} className="flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="text-zinc-400 hover:text-zinc-700"><X size={10} /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* AI helper */}
          <section className={card}>
            <div className="flex items-start gap-3 p-5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="text-sm font-semibold normal-case tracking-normal text-zinc-950">AI product helper</h3>
                <p className="mt-1 text-sm text-zinc-500">Auto-fill SEO fields from your product title.</p>
                <button type="button" onClick={() => { if (!form.name) return; if (!form.seoTitle) set("seoTitle", form.name); if (!form.seoSlug) { set("seoSlug", slugify(form.name)); setSlugEdited(true); } }} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50">
                  Auto-fill SEO
                </button>
              </div>
              <button type="button" className="ml-auto text-zinc-400 hover:text-zinc-700"><MoreHorizontal size={18} /></button>
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}
