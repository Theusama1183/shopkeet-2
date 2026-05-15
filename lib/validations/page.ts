import { z } from "zod";

// Slug must be URL-safe: lowercase letters, numbers, hyphens only
export const slugSchema = z
  .string()
  .min(1, "Slug is required")
  .max(100, "Slug must be under 100 characters")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug can only contain lowercase letters, numbers, and hyphens (no leading/trailing hyphens)")
  .refine((val) => !["api", "admin", "auth", "static", "_next"].includes(val), {
    message: "This slug is reserved",
  });

// Puck editor content schema — validates the structure before storing
// Prevents malformed JSON from breaking the storefront renderer
const puckContentSchema = z.object({
  content: z.array(z.record(z.string(), z.unknown())),
  root: z.object({
    props: z.record(z.string(), z.unknown()).optional(),
  }).optional(),
});

// Max Puck JSON size: 512KB — prevents huge payloads slowing queries/rendering
const MAX_PUCK_JSON_BYTES = 512 * 1024;

function validatePuckContent(val: unknown): boolean {
  try {
    const json = JSON.stringify(val);
    if (json.length > MAX_PUCK_JSON_BYTES) return false;
    return puckContentSchema.safeParse(val).success;
  } catch {
    return false;
  }
}

export const createPageSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be under 200 characters")
    .transform((val) => val.trim()),
  slug: slugSchema,
  content: z.record(z.string(), z.unknown()).refine(
    (val) => {
      const result = puckContentSchema.safeParse(val);
      return result.success;
    },
    "Content must be a valid Puck page structure with 'content' array and 'root' object"
  ),
  layoutId: z
    .string()
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Invalid layout ID")
    .optional()
    .default("default"),
  isHome: z.boolean().optional().default(false),
  metaTitle: z
    .string()
    .max(60, "Meta title must be under 60 characters")
    .transform((val) => val.trim())
    .nullable()
    .optional(),
  metaDescription: z
    .string()
    .max(160, "Meta description must be under 160 characters")
    .transform((val) => val.trim())
    .nullable()
    .optional(),
  isPublished: z.boolean().optional().default(false),
});

export const updatePageSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be under 200 characters")
    .transform((val) => val.trim())
    .optional(),
  slug: slugSchema.optional(),
  content: z
    .record(z.string(), z.unknown())
    .refine(
      validatePuckContent,
      "Content must be a valid Puck page structure (max 512KB) with 'content' array and 'root' object"
    )
    .optional(),
  layoutId: z
    .string()
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Invalid layout ID")
    .optional(),
  isHome: z.boolean().optional(),
  metaTitle: z
    .string()
    .max(60, "Meta title must be under 60 characters")
    .transform((val) => val.trim())
    .nullable()
    .optional(),
  metaDescription: z
    .string()
    .max(160, "Meta description must be under 160 characters")
    .transform((val) => val.trim())
    .nullable()
    .optional(),
  isPublished: z.boolean().optional(),
});

export type CreatePageInput = z.infer<typeof createPageSchema>;
export type UpdatePageInput = z.infer<typeof updatePageSchema>;
