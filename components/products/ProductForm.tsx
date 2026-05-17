"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowLeft, Save, Eye, Globe, AlertCircle, Check,
  Package, DollarSign, BarChart3, Truck, Search, Tag,
  ImageIcon, Layers, Settings2, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductFormData, ProductStatus } from "@/lib/types/product";
import type { MediaFile } from "@/components/ui/media-uploader";
import { EMPTY_FORM } from "@/lib/types/product";
import { useCreateProduct, useUpdateProduct, productKeys } from "@/lib/queries";
import {
  BasicTab, MediaTab, PricingTab, InventoryTab,
  VariantsTab, ShippingTab, SeoTab, OrganizeTab,
  AttributesTab, ActivityTab,
} from "@/components/products/_form_tabs";

// ── Tabs ──────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "basic",     label: "Basic Info",  icon: Package    },
  { id: "media",     label: "Media",       icon: ImageIcon  },
  { id: "pricing",   label: "Pricing",     icon: DollarSign },
  { id: "inventory", label: "Inventory",   icon: BarChart3  },
  { id: "variants",  label: "Variants",    icon: Layers     },
  { id: "shipping",  label: "Shipping",    icon: Truck      },
  { id: "seo",       label: "SEO",         icon: Search     },
  { id: "organize",  label: "Organize",    icon: Tag        },
  { id: "attrs",     label: "Attributes",  icon: Settings2  },
  { id: "activity",  label: "Activity",    icon: Activity   },
] as const;
type TabId = typeof TABS[number]["id"];

const STATUS_COLORS: Record<ProductStatus, string> = {
  active:    "bg-emerald-100 text-emerald-700",
  draft:     "bg-zinc-100 text-zinc-600",
  archived:  "bg-amber-100 text-amber-700",
  scheduled: "bg-blue-100 text-blue-700",
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

// ── Props ─────────────────────────────────────────────────────────────────────

interface ProductFormProps {
  storeId: string;
  productId?: string;
  mode: "create" | "edit";
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ProductForm({ storeId, productId, mode }: ProductFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct(storeId);
  const [activeTab, setActiveTab] = useState<TabId>("basic");
  const [form, setForm] = useState<ProductFormData>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [fetchError, setFetchError] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [error, setError] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);

  // ── Load existing product ─────────────────────────────────────────────────

  useEffect(() => {
    if (mode !== "edit" || !productId) return;
    fetch(`/api/products/${productId}`)
      .then((r) => r.json())
      .then((data) => {
        const meta = (data.meta as Record<string, string>) ?? {};
        const defaults = { ...EMPTY_FORM };

        // Derive status from is_active boolean
        const status: ProductStatus = data.is_active === false ? "draft" : "active";

        // Build images array from image URL if no images array exists
        let images: MediaFile[] = data.images ?? [];
        if (images.length === 0 && data.image) {
          images = [{ id: "imported-0", url: data.image, name: "Product image", type: "image", size: 0 }];
        }

        setForm({
          ...defaults,
          name:             data.name ?? "",
          description:      data.description ?? "",
          shortDescription: meta.shortDescription ?? "",
          productType:      meta.productType ?? "",
          vendor:           meta.vendor ?? "",
          status,
          publishedAt:      data.publishedAt ?? "",
          tags:             data.tags ?? [],
          images,
          price:            centsToDisplay(data.price),
          compareAtPrice:   centsToDisplay(data.compareAtPrice),
          costPerItem:      centsToDisplay(data.costPerItem),
          taxable:          data.taxable ?? true,
          taxClass:         meta.taxClass ?? "",
          sku:              data.sku ?? "",
          barcode:          data.barcode ?? "",
          trackQuantity:    data.trackQuantity ?? true,
          quantity:         String(data.quantity ?? 0),
          lowStockThreshold:data.lowStockThreshold ? String(data.lowStockThreshold) : "",
          allowOverselling: data.allowOverselling ?? false,
          isPhysical:       data.isPhysical ?? true,
          requiresShipping: data.requiresShipping ?? true,
          weight:           data.weight ? String(data.weight) : "",
          weightUnit:       data.weightUnit ?? "kg",
          dimensions:       data.dimensions ?? { unit: "cm" },
          customsHsCode:    data.customsHsCode ?? "",
          countryOfOrigin:  data.countryOfOrigin ?? "",
          seoTitle:         data.seoTitle ?? "",
          seoDescription:   data.seoDescription ?? "",
          seoSlug:          data.seoSlug ?? "",
          collections:      data.collections ?? [],
          categories:       data.categories ?? [],
          variantOptions:   data.variants?.options ?? [],
          variants:         data.variants?.items ?? [],
          attributes:       data.attributes ?? [],
        });
        setSlugEdited(!!data.seoSlug);
      })
      .catch(() => setFetchError(true))
      .finally(() => setIsLoading(false));
  }, [mode, productId, storeId]);

  // ── Field setter ──────────────────────────────────────────────────────────

  const set = useCallback(
    <K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    []
  );

  const handleNameChange = (name: string) => {
    set("name", name);
    if (!slugEdited) set("seoSlug", slugify(name));
  };

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async (statusOverride?: ProductStatus) => {
    if (!form.name.trim()) {
      setError("Product title is required");
      setActiveTab("basic");
      return;
    }
    const price = displayToCents(form.price);
    if (!form.price || price <= 0) {
      setError("Valid price is required");
      setActiveTab("pricing");
      return;
    }

    setError("");
    setSavedOk(false);

    const payload = {
      name:             form.name.trim(),
      description:      form.description || null,
      price,
      compareAtPrice:   form.compareAtPrice ? displayToCents(form.compareAtPrice) : null,
      costPerItem:      form.costPerItem ? displayToCents(form.costPerItem) : null,
      image:            form.images[0]?.url ?? null,
      images:           form.images,
      status:           statusOverride ?? form.status,
      is_active:        (statusOverride ?? form.status) === "active",
      publishedAt:      form.publishedAt || null,
      tags:             form.tags,
      taxable:          form.taxable,
      sku:              form.sku || null,
      barcode:          form.barcode || null,
      trackQuantity:    form.trackQuantity,
      quantity:         parseInt(form.quantity) || 0,
      lowStockThreshold:form.lowStockThreshold ? parseInt(form.lowStockThreshold) : null,
      allowOverselling: form.allowOverselling,
      isPhysical:       form.isPhysical,
      requiresShipping: form.requiresShipping,
      weight:           form.weight ? parseFloat(form.weight) : null,
      weightUnit:       form.weightUnit,
      dimensions:       form.dimensions,
      customsHsCode:    form.customsHsCode || null,
      countryOfOrigin:  form.countryOfOrigin || null,
      seoTitle:         form.seoTitle || null,
      seoDescription:   form.seoDescription || null,
      seoSlug:          form.seoSlug || null,
      collections:      form.collections,
      categories:       form.categories,
      attributes:       form.attributes,
      variants:         { options: form.variantOptions, items: form.variants },
      meta: {
        shortDescription: form.shortDescription,
        productType:      form.productType,
        vendor:           form.vendor,
        taxClass:         form.taxClass,
      },
    };

    try {
      if (mode === "edit" && productId) {
        await updateProduct.mutateAsync({ id: productId, ...payload });
      } else {
        const newProduct = await createProduct.mutateAsync({ 
          ...payload, 
          storeId,
          description: payload.description ?? undefined,
        });
        
        // Immediately update cache with new product
        queryClient.setQueryData(productKeys.detail(newProduct.id), newProduct);
        
        // Small delay to ensure cache is updated before redirect
        await new Promise(resolve => setTimeout(resolve, 100));
        
        router.push(`/store/${storeId}/products/${newProduct.id}/edit`);
      }

      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 3000);
    } catch (error: any) {
      setError(error?.message ?? "Something went wrong. Please try again.");
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-3 text-red-400" />
          <p className="text-zinc-900 font-semibold mb-2">Failed to load product</p>
          <p className="text-sm text-zinc-500">There was an error loading this product. Please try again.</p>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto">
      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-10 bg-zinc-50 border-b border-zinc-200 -mx-6 px-6 py-3 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/store/${storeId}/products`}
            className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            Products
          </Link>
          <span className="text-zinc-300">/</span>
          <span className="text-sm font-medium text-zinc-900 truncate max-w-48">
            {form.name || (mode === "create" ? "New product" : "Edit product")}
          </span>
          <span className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full shrink-0",
            STATUS_COLORS[form.status]
          )}>
            {form.status}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {mode === "edit" && (
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              Preview
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={createProduct.isPending || updateProduct.isPending}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {createProduct.isPending || updateProduct.isPending ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : savedOk ? (
              <><Check className="w-3.5 h-3.5" />Saved</>
            ) : (
              <><Save className="w-3.5 h-3.5" />{mode === "create" ? "Save product" : "Save changes"}</>
            )}
          </button>

          {form.status === "draft" && (
            <button
              type="button"
              onClick={() => handleSave("active")}
              disabled={createProduct.isPending || updateProduct.isPending}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50"
            >
              <Globe className="w-3.5 h-3.5" />
              Publish
            </button>
          )}
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
          <button
            type="button"
            onClick={() => setError("")}
            className="ml-auto text-red-400 hover:text-red-600 text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex gap-6">
        {/* ── Left: Tab nav ── */}
        <nav className="w-44 shrink-0">
          <div className="sticky top-28 space-y-0.5">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                    active
                      ? "bg-violet-50 text-violet-700 font-medium"
                      : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                  )}
                >
                  <Icon className={cn("w-4 h-4 shrink-0", active ? "text-violet-600" : "text-zinc-400")} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* ── Right: Tab content ── */}
        <div className="flex-1 min-w-0 space-y-5 pb-16">
          {activeTab === "basic"     && <BasicTab      form={form} set={set} onNameChange={handleNameChange} />}
          {activeTab === "media"     && <MediaTab      form={form} set={set} storeId={storeId} />}
          {activeTab === "pricing"   && <PricingTab    form={form} set={set} />}
          {activeTab === "inventory" && <InventoryTab  form={form} set={set} />}
          {activeTab === "variants"  && <VariantsTab   form={form} set={set} />}
          {activeTab === "shipping"  && <ShippingTab   form={form} set={set} />}
          {activeTab === "seo"       && (
            <SeoTab
              form={form}
              set={set}
              slugEdited={slugEdited}
              setSlugEdited={setSlugEdited}
            />
          )}
          {activeTab === "organize"  && <OrganizeTab   form={form} set={set} />}
          {activeTab === "attrs"     && <AttributesTab form={form} set={set} />}
          {activeTab === "activity"  && <ActivityTab   productId={productId} />}
        </div>
      </div>
    </div>
  );
}
