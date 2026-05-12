// @ts-nocheck
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Package, DollarSign, BarChart3, Truck, Search, Tag,
  ImageIcon, Layers, Settings2, Activity,
} from "lucide-react";
import { MediaUploader, type MediaFile } from "@/components/ui/media-uploader";
import {
  SectionCard, Field, Toggle, Input, Select, TagInput,
} from "@/components/products/SectionCard";
import type {
  ProductFormData, ProductStatus,
} from "@/lib/types/product";

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

const STATUS_OPTIONS: { 
  value: ProductStatus; label: string; color: string }[] = [
  { value: "active",    label: "Active",    color: "bg-emerald-100 text-emerald-700" },
  { value: "draft",     label: "Draft",     color: "bg-zinc-100 text-zinc-600"       },
  { value: "archived",  label: "Archived",  color: "bg-amber-100 text-amber-700"     },
  { value: "scheduled", label: "Scheduled", color: "bg-blue-100 text-blue-700"       },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function centsToDisplay(v: number | null | undefined) {
  if (v == null) return "";
  return (v / 100).toFixed(2);
}
function displayToCents(v: string) {
  const n = parseFloat(v.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : Math.round(n * 100);
}
function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface ProductFormProps {
  storeId: string;
  productId?: string;
  mode: "create" | "edit";
}

export { TABS, STATUS_OPTIONS, centsToDisplay, displayToCents, slugify };
export type { ProductFormProps, TabId };
