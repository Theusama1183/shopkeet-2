"use client";

import Link from "next/link";
import { ArrowLeft, ChevronDown, ImagePlus, MoreHorizontal, Search, Sparkles, Upload } from "lucide-react";

type ProductEditorPageProps = {
  mode: "new" | "edit";
  productId?: string;
};

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

function Field({ labelText, children }: { labelText: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={label}>{labelText}</span>
      {children}
    </label>
  );
}

export function ProductEditorPage({ mode, productId }: ProductEditorPageProps) {
  const isEdit = mode === "edit";

  return (
    <div className="min-h-screen bg-[#f6f6f7] text-zinc-950">
      <div className="sticky top-0 z-30 border-b border-zinc-200 bg-[#f6f6f7]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/dashboard/products"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-700 transition hover:bg-zinc-50"
              aria-label="Back to products"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="min-w-0">
              <p className="text-xs font-medium text-zinc-500">Products</p>
              <h1 className="truncate text-xl font-semibold normal-case tracking-normal text-zinc-950 sm:text-2xl">
                {isEdit ? "Edit product" : "Add product"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEdit ? (
              <button className="hidden rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 sm:inline-flex">
                Preview
              </button>
            ) : null}
            <button className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50">
              Discard
            </button>
            <button className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800">
              {isEdit ? "Save changes" : "Save product"}
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
        <div className="space-y-5">
          <section className={card}>
            <div className="space-y-4 p-5">
              <Field labelText="Title">
                <input className={input} placeholder="Short sleeve t-shirt" defaultValue={isEdit ? "Premium cotton t-shirt" : ""} />
              </Field>
              <Field labelText="Description">
                <textarea
                  className={`${input} min-h-44 resize-y leading-6`}
                  placeholder="Describe material, fit, key benefits, and care instructions."
                  defaultValue={isEdit ? "Soft premium cotton t-shirt with a clean everyday fit." : ""}
                />
              </Field>
            </div>
          </section>

          <section className={card}>
            <SectionTitle title="Media" description="Add product photos, videos, or 3D models." />
            <div className="p-5">
              <div className="rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 text-center transition hover:border-zinc-400 hover:bg-white">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                  <ImagePlus className="text-zinc-700" size={22} />
                </div>
                <p className="mt-4 text-sm font-medium text-zinc-900">Drop files here or click to upload</p>
                <p className="mt-1 text-sm text-zinc-500">Recommended: square images, 1200 × 1200px or larger.</p>
                <button className="mt-4 inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
                  <Upload size={16} /> Upload media
                </button>
              </div>
            </div>
          </section>

          <section className={card}>
            <SectionTitle title="Pricing" />
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Field labelText="Price">
                <input className={input} placeholder="0.00" inputMode="decimal" />
              </Field>
              <Field labelText="Compare-at price">
                <input className={input} placeholder="0.00" inputMode="decimal" />
              </Field>
              <Field labelText="Cost per item">
                <input className={input} placeholder="0.00" inputMode="decimal" />
              </Field>
              <div className="rounded-lg bg-zinc-50 p-3">
                <p className="text-sm font-medium text-zinc-900">Margin</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">—</p>
                <p className={muted}>Enter price and cost to calculate profit.</p>
              </div>
            </div>
          </section>

          <section className={card}>
            <SectionTitle title="Inventory" />
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Field labelText="SKU">
                <input className={input} placeholder="SKU-001" />
              </Field>
              <Field labelText="Barcode">
                <input className={input} placeholder="ISBN, UPC, GTIN, etc." />
              </Field>
              <label className="flex items-start gap-3 rounded-lg border border-zinc-200 p-3 sm:col-span-2">
                <input type="checkbox" className="mt-1 h-4 w-4 rounded border-zinc-300" defaultChecked />
                <span>
                  <span className="block text-sm font-medium text-zinc-900">Track quantity</span>
                  <span className="block text-sm text-zinc-500">Shopkeet will track stock and show low inventory warnings.</span>
                </span>
              </label>
              <Field labelText="Quantity">
                <input className={input} placeholder="0" inputMode="numeric" />
              </Field>
              <Field labelText="Low stock alert">
                <input className={input} placeholder="5" inputMode="numeric" />
              </Field>
            </div>
          </section>

          <section className={card}>
            <SectionTitle title="Shipping" />
            <div className="grid gap-4 p-5 sm:grid-cols-3">
              <Field labelText="Weight">
                <input className={input} placeholder="0.0" inputMode="decimal" />
              </Field>
              <Field labelText="Unit">
                <select className={input} defaultValue="kg">
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="lb">lb</option>
                  <option value="oz">oz</option>
                </select>
              </Field>
              <Field labelText="Requires shipping">
                <select className={input} defaultValue="yes">
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </Field>
            </div>
          </section>

          <section className={card}>
            <SectionTitle title="Variants" description="Add options like size, color, or material." />
            <div className="p-5">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="grid gap-3 sm:grid-cols-[180px_1fr_auto]">
                  <input className={input} placeholder="Option name" defaultValue="Size" />
                  <input className={input} placeholder="Values separated by comma" defaultValue="Small, Medium, Large" />
                  <button className="mt-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50">Add</button>
                </div>
              </div>
            </div>
          </section>

          <section className={card}>
            <SectionTitle title="Search engine listing" description="Control how this product appears in search results." />
            <div className="space-y-4 p-5">
              <Field labelText="Page title">
                <input className={input} placeholder="Premium cotton t-shirt" />
              </Field>
              <Field labelText="Meta description">
                <textarea className={`${input} min-h-24 resize-y`} placeholder="Write a short SEO description." />
              </Field>
              <Field labelText="URL handle">
                <div className="mt-1.5 flex overflow-hidden rounded-lg border border-zinc-300 bg-white focus-within:border-zinc-900 focus-within:ring-2 focus-within:ring-zinc-900/10">
                  <span className="border-r border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-500">/products/</span>
                  <input className="w-full px-3 py-2.5 text-sm outline-none" placeholder="premium-cotton-t-shirt" />
                </div>
              </Field>
            </div>
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <section className={card}>
            <SectionTitle title="Status" />
            <div className="space-y-3 p-5">
              <select className={input} defaultValue={isEdit ? "active" : "draft"}>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
              <p className={muted}>Only active products are visible on the storefront.</p>
            </div>
          </section>

          <section className={card}>
            <SectionTitle title="Publishing" />
            <div className="space-y-3 p-5">
              <label className="flex items-center justify-between rounded-lg border border-zinc-200 p-3">
                <span className="text-sm font-medium text-zinc-900">Online store</span>
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-zinc-300" />
              </label>
              <label className="flex items-center justify-between rounded-lg border border-zinc-200 p-3">
                <span className="text-sm font-medium text-zinc-900">POS</span>
                <input type="checkbox" className="h-4 w-4 rounded border-zinc-300" />
              </label>
            </div>
          </section>

          <section className={card}>
            <SectionTitle title="Product organization" />
            <div className="space-y-4 p-5">
              <Field labelText="Product type">
                <input className={input} placeholder="T-shirt" />
              </Field>
              <Field labelText="Vendor">
                <input className={input} placeholder="Shopkeet" />
              </Field>
              <Field labelText="Collection">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                  <input className={`${input} pl-9`} placeholder="Search collections" />
                </div>
              </Field>
              <Field labelText="Category">
                <button className="mt-1.5 flex w-full items-center justify-between rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-left text-sm text-zinc-700 hover:bg-zinc-50">
                  Select category <ChevronDown size={16} />
                </button>
              </Field>
            </div>
          </section>

          <section className={card}>
            <SectionTitle title="Tags" />
            <div className="p-5">
              <input className={input} placeholder="Summer, cotton, new arrival" />
              <div className="mt-3 flex flex-wrap gap-2">
                {['new', 'featured', 'cotton'].map((tag) => (
                  <span key={tag} className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">{tag}</span>
                ))}
              </div>
            </div>
          </section>

          <section className={card}>
            <div className="flex items-start gap-3 p-5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="text-sm font-semibold normal-case tracking-normal text-zinc-950">AI product helper</h3>
                <p className="mt-1 text-sm text-zinc-500">Generate SEO title, description, and product tags from your product details.</p>
                <button className="mt-3 inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50">
                  Generate content
                </button>
              </div>
              <button className="ml-auto text-zinc-400 hover:text-zinc-700">
                <MoreHorizontal size={18} />
              </button>
            </div>
          </section>

          {isEdit && productId ? <p className="px-1 text-xs text-zinc-400">Editing product ID: {productId}</p> : null}
        </aside>
      </main>
    </div>
  );
}
