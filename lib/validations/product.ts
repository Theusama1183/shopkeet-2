import { z } from "zod";

// Product creation schema
export const createProductSchema = z.object({
  name: z
    .string()
    .min(2, "Product name must be at least 2 characters")
    .max(200, "Product name must be at most 200 characters")
    .regex(/^[a-zA-Z0-9\s\-_'&.,()]+$/, "Product name contains invalid characters"),
  description: z
    .string()
    .max(2000, "Description must be at most 2000 characters")
    .optional()
    .nullable(),
  price: z
    .number()
    .int("Price must be an integer (in cents)")
    .min(0, "Price must be at least 0")
    .max(99999999, "Price is too high"),
  image: z.string().url("Invalid image URL").optional().nullable(),
  images: z
    .array(
      z.union([
        z.string().url("Invalid image URL"),
        // Accept MediaFile objects from the product form — extract the URL
        z.object({
          url: z.string().url("Invalid image URL"),
          id: z.string().optional(),
          name: z.string().optional(),
          type: z.string().optional(),
          size: z.number().optional(),
        }).transform((obj) => obj.url),
      ])
    )
    .max(10, "Maximum 10 images allowed")
    .optional()
    .default([]),
  sku: z
    .string()
    .max(100, "SKU must be under 100 characters")
    .regex(/^[a-zA-Z0-9\-_]+$/, "SKU can only contain letters, numbers, hyphens, underscores")
    .optional()
    .nullable(),
  isActive: z.boolean().optional().default(true),
  storeId: z.string().uuid("Invalid store ID"),
});

// Product update schema
export const updateProductSchema = z.object({
  name: z
    .string()
    .min(2, "Product name must be at least 2 characters")
    .max(200, "Product name must be at most 200 characters")
    .regex(/^[a-zA-Z0-9\s\-_'&.,()]+$/, "Product name contains invalid characters")
    .optional(),
  description: z
    .string()
    .max(2000, "Description must be at most 2000 characters")
    .optional()
    .nullable(),
  price: z
    .number()
    .int("Price must be an integer (in cents)")
    .min(0, "Price must be at least 0")
    .max(99999999, "Price is too high")
    .optional(),
  image: z.string().url("Invalid image URL").optional().nullable(),
  images: z
    .array(
      z.union([
        z.string().url("Invalid image URL"),
        // Accept MediaFile objects from the product form — extract the URL
        z.object({
          url: z.string().url("Invalid image URL"),
          id: z.string().optional(),
          name: z.string().optional(),
          type: z.string().optional(),
          size: z.number().optional(),
        }).transform((obj) => obj.url),
      ])
    )
    .max(10, "Maximum 10 images allowed")
    .optional()
    .nullable(),
  is_active: z.boolean().optional(),
  status: z.enum(["active", "draft", "archived", "scheduled"]).optional(),
  sku: z
    .string()
    .max(100, "SKU must be under 100 characters")
    .regex(/^[a-zA-Z0-9\-_]+$/, "SKU can only contain letters, numbers, hyphens, underscores")
    .optional()
    .nullable(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
