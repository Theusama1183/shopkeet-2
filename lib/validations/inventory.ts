import { z } from "zod";

// ─── Warehouses ───────────────────────────────────────────────────────────────

export const createWarehouseSchema = z.object({
  name: z
    .string()
    .min(2, "Warehouse name must be at least 2 characters")
    .max(100, "Warehouse name must be under 100 characters")
    .transform((val) => val.trim().replace(/[<>]/g, "")),
  address: z
    .string()
    .max(500, "Address must be under 500 characters")
    .transform((val) => val.trim())
    .nullable()
    .optional(),
  city: z
    .string()
    .max(100, "City must be under 100 characters")
    .transform((val) => val.trim())
    .nullable()
    .optional(),
  country: z
    .string()
    .max(100, "Country must be under 100 characters")
    .transform((val) => val.trim())
    .nullable()
    .optional(),
  isDefault: z.boolean().optional().default(false),
});

export const updateWarehouseSchema = createWarehouseSchema.partial();

export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>;
export type UpdateWarehouseInput = z.infer<typeof updateWarehouseSchema>;

// ─── Suppliers ────────────────────────────────────────────────────────────────

export const createSupplierSchema = z.object({
  name: z
    .string()
    .min(2, "Supplier name must be at least 2 characters")
    .max(100, "Supplier name must be under 100 characters")
    .transform((val) => val.trim().replace(/[<>]/g, "")),
  email: z
    .string()
    .email("Invalid email address")
    .nullable()
    .optional(),
  phone: z
    .string()
    .max(30, "Phone number must be under 30 characters")
    .nullable()
    .optional(),
  company: z
    .string()
    .max(200, "Company name must be under 200 characters")
    .transform((val) => val.trim())
    .nullable()
    .optional(),
  address: z
    .string()
    .max(500, "Address must be under 500 characters")
    .transform((val) => val.trim())
    .nullable()
    .optional(),
  notes: z
    .string()
    .max(1000, "Notes must be under 1000 characters")
    .nullable()
    .optional(),
});

export const updateSupplierSchema = createSupplierSchema.partial();

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;

// ─── Transfers ────────────────────────────────────────────────────────────────

export const transferItemSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

export const createTransferSchema = z.object({
  fromWarehouseId: z.string().uuid("Invalid source warehouse ID"),
  toWarehouseId: z.string().uuid("Invalid destination warehouse ID"),
  notes: z
    .string()
    .max(1000, "Notes must be under 1000 characters")
    .nullable()
    .optional(),
  items: z
    .array(transferItemSchema)
    .min(1, "Transfer must have at least one item"),
}).refine(
  (data) => data.fromWarehouseId !== data.toWarehouseId,
  { message: "Source and destination warehouses must be different", path: ["toWarehouseId"] }
);

export const updateTransferStatusSchema = z.object({
  status: z.enum(["in_transit", "completed", "cancelled"], {
    message: "Status must be in_transit, completed, or cancelled",
  }),
});

export type CreateTransferInput = z.infer<typeof createTransferSchema>;
export type UpdateTransferStatusInput = z.infer<typeof updateTransferStatusSchema>;

// ─── Sales ────────────────────────────────────────────────────────────────────

export const createSaleSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().int().min(0, "Unit price must be non-negative"), // cents
  warehouseId: z.string().uuid("Invalid warehouse ID").nullable().optional(),
  supplierId: z.string().uuid("Invalid supplier ID").nullable().optional(),
  notes: z
    .string()
    .max(1000, "Notes must be under 1000 characters")
    .nullable()
    .optional(),
  saleDate: z.string().datetime().optional(),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
