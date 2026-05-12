"use client";

import { Plus, X, GripVertical, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionCard, Field, Toggle, Input, Select, TagInput } from "@/components/products/SectionCard";
import type {
  ProductFormData, ProductStatus, WeightUnit,
} from "@/lib/types/product";

// Lazy-load MediaUploader — framer-motion Reorder is heavy
import dynamic from "next/dynamic";
const MediaUploader = dynamic(
  () => import("@/components/ui/media-uploader").then((m) => ({ default: m.MediaUploader })),
  { ssr: false, loading: () => <div className="h-32 bg-zinc-50 rounded-xl border-2 border-dashed border-zinc-200 animate-pulse" /> }
);

type Setter = <K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) => void;

// ── 1. Basic Info ─────────────────────────────────────────────────────────────

export function BasicTab({
  form, set, onNameChange,
}: { form: ProductFormData; set: Setter; onNameChange: (v: string) => void }) {
  return (
    <>
      <SectionCard title="Basic Information">
        <Field label="Product Title" required>
          <Input
            value={form.name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="e.g. Classic White T-Shirt"
            autoFocus
          />
        </Field>

        <Field label="Description">
          <div className="relative">
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={6}
              placeholder="Describe your product in detail..."
              className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            />
            <button
              type="button"
              className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-violet-600 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              AI Write
            </button>
          </div>
        </Field>

        <Field label="Short Description" hint="Shown in product cards and search results">
          <textarea
            value={form.shortDescription}
            onChange={(e) => set("shortDescription", e.target.value)}
            rows={2}
            placeholder="One-line summary..."
            className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Product Type">
            <Input
              value={form.productType}
              onChange={(e) => set("productType", e.target.value)}
              placeholder="e.g. Apparel, Electronics"
            />
          </Field>
          <Field label="Vendor / Brand">
            <Input
              value={form.vendor}
              onChange={(e) => set("vendor", e.target.value)}
              placeholder="e.g. Nike, Apple"
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Status & Visibility">
        <Field label="Product Status">
          <div className="grid grid-cols-2 gap-2">
            {(["active", "draft", "archived", "scheduled"] as ProductStatus[]).map((s) => {
              const colors: Record<ProductStatus, string> = {
                active:    "border-emerald-400 bg-emerald-50 text-emerald-700",
                draft:     "border-zinc-300 bg-zinc-50 text-zinc-600",
                archived:  "border-amber-400 bg-amber-50 text-amber-700",
                scheduled: "border-blue-400 bg-blue-50 text-blue-700",
              };
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => set("status", s)}
                  className={cn(
                    "px-3 py-2 rounded-lg border-2 text-sm font-medium capitalize transition-all",
                    form.status === s ? colors[s] : "border-zinc-200 text-zinc-500 hover:border-zinc-300"
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </Field>

        {form.status === "scheduled" && (
          <Field label="Publish Date & Time">
            <Input
              type="datetime-local"
              value={form.publishedAt}
              onChange={(e) => set("publishedAt", e.target.value)}
            />
          </Field>
        )}

        <Field label="Tags" hint="Press Enter or comma to add">
          <TagInput
            value={form.tags}
            onChange={(tags) => set("tags", tags)}
            placeholder="Add tags..."
          />
        </Field>
      </SectionCard>
    </>
  );
}

// ── 2. Media ──────────────────────────────────────────────────────────────────

export function MediaTab({
  form, set, storeId,
}: { form: ProductFormData; set: Setter; storeId: string }) {
  return (
    <SectionCard title="Product Media" description="Drag to reorder. First image is the primary.">
      <MediaUploader
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4"
        maxSizeMb={50}
        value={form.images}
        onChange={(files) => set("images", files)}
        folder={`products/${storeId}`}
        showAltText
        showPrimary
      />
    </SectionCard>
  );
}

// ── 3. Pricing ────────────────────────────────────────────────────────────────

export function PricingTab({ form, set }: { form: ProductFormData; set: Setter }) {
  const price = parseFloat(form.price) || 0;
  const cost = parseFloat(form.costPerItem) || 0;
  const margin = price > 0 && cost > 0 ? (((price - cost) / price) * 100).toFixed(1) : null;
  const profit = price > 0 && cost > 0 ? (price - cost).toFixed(2) : null;

  return (
    <>
      <SectionCard title="Pricing">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Price" required>
            <Input prefix="$" type="number" min="0" step="0.01"
              value={form.price} onChange={(e) => set("price", e.target.value)}
              placeholder="0.00" />
          </Field>
          <Field label="Compare-at Price" hint="Strike-through sale price">
            <Input prefix="$" type="number" min="0" step="0.01"
              value={form.compareAtPrice} onChange={(e) => set("compareAtPrice", e.target.value)}
              placeholder="0.00" />
          </Field>
        </div>

        <Field label="Cost per Item" hint="Used to calculate profit margin">
          <Input prefix="$" type="number" min="0" step="0.01"
            value={form.costPerItem} onChange={(e) => set("costPerItem", e.target.value)}
            placeholder="0.00" />
        </Field>

        {(margin || profit) && (
          <div className="grid grid-cols-2 gap-3">
            <div className="px-4 py-3 bg-zinc-50 rounded-xl border border-zinc-200">
              <p className="text-xs text-zinc-500 mb-0.5">Profit</p>
              <p className="text-sm font-semibold text-zinc-900">${profit}</p>
            </div>
            <div className="px-4 py-3 bg-zinc-50 rounded-xl border border-zinc-200">
              <p className="text-xs text-zinc-500 mb-0.5">Margin</p>
              <p className="text-sm font-semibold text-zinc-900">{margin}%</p>
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Tax">
        <Toggle
          checked={form.taxable}
          onChange={(v) => set("taxable", v)}
          label="Charge tax on this product"
          description="Tax will be calculated at checkout"
        />
        {form.taxable && (
          <Field label="Tax Class">
            <Select
              value={form.taxClass}
              onChange={(e) => set("taxClass", e.target.value)}
              options={[
                { value: "standard", label: "Standard Rate" },
                { value: "reduced", label: "Reduced Rate" },
                { value: "zero", label: "Zero Rate" },
                { value: "exempt", label: "Tax Exempt" },
              ]}
              placeholder="Select tax class..."
            />
          </Field>
        )}
      </SectionCard>
    </>
  );
}

// ── 4. Inventory ──────────────────────────────────────────────────────────────

export function InventoryTab({ form, set }: { form: ProductFormData; set: Setter }) {
  return (
    <>
      <SectionCard title="Identification">
        <div className="grid grid-cols-2 gap-4">
          <Field label="SKU" hint="Stock Keeping Unit">
            <Input value={form.sku} onChange={(e) => set("sku", e.target.value)} placeholder="e.g. SHIRT-WHT-M" />
          </Field>
          <Field label="Barcode" hint="UPC, EAN, ISBN, GTIN">
            <Input value={form.barcode} onChange={(e) => set("barcode", e.target.value)} placeholder="e.g. 012345678901" />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Stock">
        <Toggle
          checked={form.trackQuantity}
          onChange={(v) => set("trackQuantity", v)}
          label="Track quantity"
          description="Monitor stock levels for this product"
        />

        {form.trackQuantity && (
          <>
            <Field label="Quantity">
              <Input type="number" min="0"
                value={form.quantity} onChange={(e) => set("quantity", e.target.value)}
                placeholder="0" />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Low Stock Alert" hint="Notify when stock falls below">
                <Input type="number" min="0"
                  value={form.lowStockThreshold}
                  onChange={(e) => set("lowStockThreshold", e.target.value)}
                  placeholder="e.g. 5" />
              </Field>
            </div>

            <Toggle
              checked={form.allowOverselling}
              onChange={(v) => set("allowOverselling", v)}
              label="Allow overselling"
              description="Continue selling when out of stock"
            />
          </>
        )}
      </SectionCard>
    </>
  );
}

// ── 5. Variants ───────────────────────────────────────────────────────────────

export function VariantsTab({ form, set }: { form: ProductFormData; set: Setter }) {
  const addOption = () => {
    set("variantOptions", [...form.variantOptions, { name: "", values: [] }]);
  };

  const removeOption = (i: number) => {
    set("variantOptions", form.variantOptions.filter((_, idx) => idx !== i));
  };

  const updateOptionName = (i: number, name: string) => {
    set("variantOptions", form.variantOptions.map((o, idx) => idx === i ? { ...o, name } : o));
  };

  const updateOptionValues = (i: number, values: string[]) => {
    set("variantOptions", form.variantOptions.map((o, idx) => idx === i ? { ...o, values } : o));
  };

  return (
    <SectionCard title="Variants" description="Add options like Size, Color, Material">
      {form.variantOptions.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-zinc-200 rounded-xl">
          <p className="text-sm text-zinc-500 mb-3">No variants yet</p>
          <button
            type="button"
            onClick={addOption}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-violet-600 border border-violet-200 rounded-lg hover:bg-violet-50 transition-colors mx-auto"
          >
            <Plus className="w-4 h-4" />
            Add option
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {form.variantOptions.map((opt, i) => (
            <div key={i} className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-3">
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-zinc-300 shrink-0" />
                <Input
                  value={opt.name}
                  onChange={(e) => updateOptionName(i, e.target.value)}
                  placeholder="Option name (e.g. Size)"
                  className="flex-1"
                />
                <button type="button" onClick={() => removeOption(i)}
                  className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <TagInput
                value={opt.values}
                onChange={(vals) => updateOptionValues(i, vals)}
                placeholder="Add values (e.g. S, M, L)..."
              />
            </div>
          ))}
          <button
            type="button"
            onClick={addOption}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add another option
          </button>
        </div>
      )}
    </SectionCard>
  );
}

// ── 6. Shipping ───────────────────────────────────────────────────────────────

export function ShippingTab({ form, set }: { form: ProductFormData; set: Setter }) {
  return (
    <>
      <SectionCard title="Shipping">
        <Toggle
          checked={form.isPhysical}
          onChange={(v) => set("isPhysical", v)}
          label="Physical product"
          description="This product requires shipping"
        />
        {form.isPhysical && (
          <>
            <Toggle
              checked={form.requiresShipping}
              onChange={(v) => set("requiresShipping", v)}
              label="Requires shipping"
            />
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Field label="Weight">
                  <Input type="number" min="0" step="0.001"
                    value={form.weight} onChange={(e) => set("weight", e.target.value)}
                    placeholder="0.000" />
                </Field>
              </div>
              <Field label="Unit">
                <Select
                  value={form.weightUnit}
                  onChange={(e) => set("weightUnit", e.target.value as WeightUnit)}
                  options={[
                    { value: "kg", label: "kg" },
                    { value: "g",  label: "g"  },
                    { value: "lb", label: "lb" },
                    { value: "oz", label: "oz" },
                  ]}
                />
              </Field>
            </div>

            <Field label="Dimensions (L × W × H)">
              <div className="grid grid-cols-4 gap-2">
                {(["length", "width", "height"] as const).map((dim) => (
                  <Input key={dim} type="number" min="0" step="0.1"
                    placeholder={dim.charAt(0).toUpperCase()}
                    value={form.dimensions[dim] ?? ""}
                    onChange={(e) => set("dimensions", { ...form.dimensions, [dim]: parseFloat(e.target.value) || undefined })}
                  />
                ))}
                <Select
                  value={form.dimensions.unit}
                  onChange={(e) => set("dimensions", { ...form.dimensions, unit: e.target.value as "cm" | "in" })}
                  options={[{ value: "cm", label: "cm" }, { value: "in", label: "in" }]}
                />
              </div>
            </Field>
          </>
        )}
      </SectionCard>

      <SectionCard title="Customs" collapsible defaultOpen={false}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="HS Tariff Code">
            <Input value={form.customsHsCode} onChange={(e) => set("customsHsCode", e.target.value)} placeholder="e.g. 6109.10" />
          </Field>
          <Field label="Country of Origin">
            <Input value={form.countryOfOrigin} onChange={(e) => set("countryOfOrigin", e.target.value)} placeholder="e.g. CN, US, DE" />
          </Field>
        </div>
      </SectionCard>
    </>
  );
}

// ── 7. SEO ────────────────────────────────────────────────────────────────────

export function SeoTab({
  form, set, slugEdited: _slugEdited, setSlugEdited,
}: { form: ProductFormData; set: Setter; slugEdited: boolean; setSlugEdited: (v: boolean) => void }) {
  return (
    <SectionCard title="Search Engine Optimization">
      {/* Preview */}
      <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200">
        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-2">Search Preview</p>
        <p className="text-blue-600 text-sm font-medium truncate">{form.seoTitle || form.name || "Product Title"}</p>
        <p className="text-green-700 text-xs truncate">yourstore.com/products/{form.seoSlug || "product-url"}</p>
        <p className="text-zinc-500 text-xs mt-1 line-clamp-2">{form.seoDescription || "Add a meta description..."}</p>
      </div>

      <Field label="SEO Title" counter={{ current: form.seoTitle.length, max: 60 }}>
        <Input
          value={form.seoTitle}
          onChange={(e) => set("seoTitle", e.target.value)}
          maxLength={60}
          placeholder={form.name || "Product title for search engines"}
        />
      </Field>

      <Field label="Meta Description" counter={{ current: form.seoDescription.length, max: 160 }}>
        <textarea
          value={form.seoDescription}
          onChange={(e) => set("seoDescription", e.target.value)}
          maxLength={160}
          rows={3}
          placeholder="Brief description for search engines..."
          className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
        />
        <div className="mt-1 h-1 bg-zinc-100 rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all",
              form.seoDescription.length > 145 ? "bg-amber-500" : "bg-violet-500"
            )}
            style={{ width: `${Math.min((form.seoDescription.length / 160) * 100, 100)}%` }}
          />
        </div>
      </Field>

      <Field label="URL Slug" hint="Auto-generated from title. Edit to customize.">
        <div className="flex items-center border border-zinc-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-violet-500">
          <span className="px-3 py-2 text-sm text-zinc-400 bg-zinc-50 border-r border-zinc-200 shrink-0 whitespace-nowrap">
            /products/
          </span>
          <input
            type="text"
            value={form.seoSlug}
            onChange={(e) => { set("seoSlug", e.target.value); setSlugEdited(true); }}
            placeholder="product-url-slug"
            className="flex-1 px-3 py-2 text-sm focus:outline-none"
          />
        </div>
      </Field>
    </SectionCard>
  );
}

// ── 8. Organize ───────────────────────────────────────────────────────────────

export function OrganizeTab({ form, set }: { form: ProductFormData; set: Setter }) {
  return (
    <>
      <SectionCard title="Collections">
        <TagInput
          value={form.collections}
          onChange={(v) => set("collections", v)}
          placeholder="Add collection..."
        />
      </SectionCard>

      <SectionCard title="Categories">
        <TagInput
          value={form.categories}
          onChange={(v) => set("categories", v)}
          placeholder="Add category..."
        />
      </SectionCard>
    </>
  );
}

// ── 9. Attributes ─────────────────────────────────────────────────────────────

export function AttributesTab({ form, set }: { form: ProductFormData; set: Setter }) {
  const addAttr = () => set("attributes", [...form.attributes, { key: "", value: "" }]);
  const removeAttr = (i: number) => set("attributes", form.attributes.filter((_, idx) => idx !== i));
  const updateAttr = (i: number, field: "key" | "value", val: string) => {
    set("attributes", form.attributes.map((a, idx) => idx === i ? { ...a, [field]: val } : a));
  };

  return (
    <SectionCard title="Specifications & Attributes" description="Key-value pairs for product specs">
      <div className="space-y-2">
        {form.attributes.map((attr, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              value={attr.key}
              onChange={(e) => updateAttr(i, "key", e.target.value)}
              placeholder="Attribute (e.g. Material)"
              className="flex-1"
            />
            <Input
              value={attr.value}
              onChange={(e) => updateAttr(i, "value", e.target.value)}
              placeholder="Value (e.g. Cotton)"
              className="flex-1"
            />
            <button type="button" onClick={() => removeAttr(i)}
              className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addAttr}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add attribute
        </button>
      </div>
    </SectionCard>
  );
}

// ── 10. Activity ──────────────────────────────────────────────────────────────

export function ActivityTab({ productId }: { productId?: string }) {
  if (!productId) {
    return (
      <SectionCard title="Activity Log">
        <p className="text-sm text-zinc-500 text-center py-6">Save the product first to see activity.</p>
      </SectionCard>
    );
  }
  return (
    <SectionCard title="Activity Log" description="Change history for this product">
      <div className="space-y-3">
        {[
          { action: "Product created", time: "Just now", user: "You" },
        ].map((entry, i) => (
          <div key={i} className="flex items-start gap-3 text-sm">
            <div className="w-2 h-2 rounded-full bg-violet-400 mt-1.5 shrink-0" />
            <div>
              <p className="text-zinc-800 font-medium">{entry.action}</p>
              <p className="text-xs text-zinc-400">{entry.time} · {entry.user}</p>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
