import { z } from "zod";

// ── Shared Puck JSON schema ───────────────────────────────────────────────────
const puckContentSchema = z.object({
  content: z.array(z.record(z.string(), z.unknown())),
  root: z
    .object({ props: z.record(z.string(), z.unknown()).optional() })
    .optional(),
});

const MAX_POPUP_JSON_BYTES = 256 * 1024; // 256KB

// ── Trigger schema — matches PopupTrigger in lib/popups/types.ts ──────────────
const popupTriggerSchema = z.object({
  event: z.enum(["on-load", "on-scroll", "on-exit-intent", "on-click"]),
  delay: z.number().int().min(0).max(60).optional(),
  scrollPercent: z.number().int().min(0).max(100).optional(),
  clickSelector: z.string().max(500).optional(),
  frequency: z.enum(["always", "once-per-session", "once-per-user"]),
});

// ── Conditions schema ─────────────────────────────────────────────────────────
const popupConditionsSchema = z.object({
  rules: z
    .array(z.record(z.string(), z.unknown()))
    .max(10, "Maximum 10 display rules allowed")
    .optional(),
});

// ── Schemas ───────────────────────────────────────────────────────────────────

export const createPopupSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name must be under 200 characters")
    .transform((val) => val.trim().replace(/[<>"'&]/g, "")),
});

export const updatePopupSchema = z.object({
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
          if (json.length > MAX_POPUP_JSON_BYTES) return false;
          return puckContentSchema.safeParse(val).success;
        } catch {
          return false;
        }
      },
      "Content must be valid Puck JSON under 256KB"
    )
    .optional(),

  trigger: popupTriggerSchema.optional(),
  conditions: popupConditionsSchema.optional(),
  isActive: z.boolean().optional(),
});

export type CreatePopupInput = z.infer<typeof createPopupSchema>;
export type UpdatePopupInput = z.infer<typeof updatePopupSchema>;
