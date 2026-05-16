import { z } from "zod";

// ── Valid template types — must match TYPE_META in templates-client.tsx ────────
export const TEMPLATE_TYPES = [
  "header",
  "footer",
  "single-product",
  "archive-products",
  "single-post",
  "archive-blog",
  "cart",
  "search",
  "not-found",
  "popup",
] as const;

export type TemplateType = (typeof TEMPLATE_TYPES)[number];

// ── Shared Puck JSON schema ───────────────────────────────────────────────────
const puckContentSchema = z.object({
  content: z.array(z.record(z.string(), z.unknown())),
  root: z
    .object({ props: z.record(z.string(), z.unknown()).optional() })
    .optional(),
});

const MAX_TEMPLATE_JSON_BYTES = 512 * 1024; // 512KB

// ── Schemas ───────────────────────────────────────────────────────────────────

export const createTemplateSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name must be under 200 characters")
    .transform((val) => val.trim().replace(/[<>"'&]/g, "")),

  type: z.enum(TEMPLATE_TYPES, {
    errorMap: () => ({
      message: `Type must be one of: ${TEMPLATE_TYPES.join(", ")}`,
    }),
  }),
});

export const updateTemplateSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name must be under 200 characters")
    .transform((val) => val.trim().replace(/[<>"'&]/g, ""))
    .optional(),

  content: z
    .record(z.string(), z.unknown())
    .refine(
      (val) => {
        try {
          const json = JSON.stringify(val);
          if (json.length > MAX_TEMPLATE_JSON_BYTES) return false;
          return puckContentSchema.safeParse(val).success;
        } catch {
          return false;
        }
      },
      "Content must be valid Puck JSON under 512KB"
    )
    .optional(),

  isActive: z.boolean().optional(),

  conditions: z.record(z.string(), z.unknown()).optional(),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
