import type { MediaFile } from "@/components/ui/media-uploader";

export type ProductStatus = "active" | "draft" | "archived" | "scheduled";
export type WeightUnit = "kg" | "g" | "lb" | "oz";

export interface ProductVariantOption {
  name: string;   // e.g. "Size"
  values: string[]; // e.g. ["S", "M", "L"]
}

export interface ProductVariant {
  id: string;
  title: string;  // e.g. "S / Red"
  options: Record<string, string>; // { Size: "S", Color: "Red" }
  price: number;  // cents
  compareAtPrice?: number;
  costPerItem?: number;
  sku?: string;
  barcode?: string;
  quantity: number;
  weight?: number;
  imageId?: string; // MediaFile.id
  isActive: boolean;
}

export interface ProductDimensions {
  length?: number;
  width?: number;
  height?: number;
  unit: "cm" | "in";
}

export interface ProductAttribute {
  key: string;
  value: string;
}

export interface ProductFormData {
  // Basic
  name: string;
  description: string;
  shortDescription: string;
  productType: string;
  vendor: string;
  status: ProductStatus;
  publishedAt: string;
  tags: string[];

  // Media
  images: MediaFile[];

  // Pricing
  price: string;           // display value (dollars)
  compareAtPrice: string;
  costPerItem: string;
  taxable: boolean;
  taxClass: string;

  // Inventory
  sku: string;
  barcode: string;
  trackQuantity: boolean;
  quantity: string;
  lowStockThreshold: string;
  allowOverselling: boolean;

  // Variants
  variantOptions: ProductVariantOption[];
  variants: ProductVariant[];

  // Shipping
  isPhysical: boolean;
  requiresShipping: boolean;
  weight: string;
  weightUnit: WeightUnit;
  dimensions: ProductDimensions;
  customsHsCode: string;
  countryOfOrigin: string;

  // SEO
  seoTitle: string;
  seoDescription: string;
  seoSlug: string;

  // Organization
  collections: string[];
  categories: string[];

  // Attributes
  attributes: ProductAttribute[];
}

export const EMPTY_FORM: ProductFormData = {
  name: "",
  description: "",
  shortDescription: "",
  productType: "",
  vendor: "",
  status: "draft",
  publishedAt: "",
  tags: [],
  images: [],
  price: "",
  compareAtPrice: "",
  costPerItem: "",
  taxable: true,
  taxClass: "",
  sku: "",
  barcode: "",
  trackQuantity: true,
  quantity: "0",
  lowStockThreshold: "",
  allowOverselling: false,
  isPhysical: true,
  requiresShipping: true,
  weight: "",
  weightUnit: "kg",
  dimensions: { unit: "cm" },
  customsHsCode: "",
  countryOfOrigin: "",
  seoTitle: "",
  seoDescription: "",
  seoSlug: "",
  collections: [],
  categories: [],
  variantOptions: [],
  variants: [],
  attributes: [],
};
