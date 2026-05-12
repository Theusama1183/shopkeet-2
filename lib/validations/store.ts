import { z } from "zod";

// Consolidated store validation using Zod schemas
const RESERVED_SUBDOMAINS = [
  // Infrastructure
  "admin", "api", "www", "auth", "app", "mail", "ftp",
  "localhost", "staging", "dev", "test", "demo", "blog",
  "shop", "store", "help", "support", "docs", "status",
  // CDN / networking
  "cdn", "static", "assets", "media", "img", "images",
  "api-v2", "api-v1", "graphql", "webhook", "webhooks",
  "socket", "ws", "wss", "realtime",
  // Email / DNS
  "mail-server", "smtp", "imap", "pop3", "dns", "ns1", "ns2",
  "mx", "spf", "dkim",
  // Security
  "security", "abuse", "postmaster", "hostmaster", "webmaster",
  // Common attack vectors
  "login", "signin", "signup", "register", "account", "dashboard",
  "panel", "cpanel", "whm", "plesk",
];

export const subdomainSchema = z
  .string()
  .min(3, "Subdomain must be at least 3 characters")
  .max(63, "Subdomain must be under 63 characters")
  .regex(/^[a-z]/, "Subdomain must start with a letter")
  .regex(/^[a-z0-9-]+$/, "Subdomain can only contain lowercase letters, numbers, and hyphens")
  .regex(/[a-z0-9]$/, "Subdomain must end with a letter or number")
  .refine((val) => !RESERVED_SUBDOMAINS.includes(val), {
    message: "This subdomain is reserved",
  })
  .transform((val) => val.toLowerCase().replace(/[^a-z0-9-]/g, '').substring(0, 63));

export const createStoreSchema = z.object({
  name: z
    .string()
    .min(2, "Store name must be at least 2 characters")
    .max(100, "Store name must be under 100 characters")
    .transform((val) => val.trim().replace(/[<>]/g, '')),
  subdomain: subdomainSchema,
  description: z
    .string()
    .max(500, "Description must be under 500 characters")
    .transform((val) => val.trim().replace(/[<>]/g, ''))
    .nullable()
    .optional(),
});

export const updateStoreSchema = z.object({
  name: z
    .string()
    .min(2, "Store name must be at least 2 characters")
    .max(100, "Store name must be under 100 characters")
    .transform((val) => val.trim().replace(/[<>]/g, ''))
    .optional(),
  description: z
    .string()
    .max(500, "Description must be under 500 characters")
    .transform((val) => val.trim().replace(/[<>]/g, ''))
    .nullable()
    .optional(),
  logo: z.string().url().nullable().optional(),
  customDomain: z.string().nullable().optional(),
});

export type CreateStoreInput = z.infer<typeof createStoreSchema>;
export type UpdateStoreInput = z.infer<typeof updateStoreSchema>;

// Legacy interface for backward compatibility
export interface StoreInput {
  name: string;
  subdomain: string;
  description?: string;
}

export interface ValidationResult {
  success: boolean;
  error?: string;
  data?: {
    name: string;
    subdomain: string;
    description: string | null;
  };
}

/**
 * Validates store input using Zod schema
 * @param input - Store input data
 * @returns Validation result with sanitized data
 */
export function validateStoreInput(input: StoreInput): ValidationResult {
  try {
    const result = createStoreSchema.parse(input);
    return {
      success: true,
      data: {
        name: result.name,
        subdomain: result.subdomain,
        description: result.description || null,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "Validation failed",
      };
    }
    return {
      success: false,
      error: "Validation failed",
    };
  }
}

/**
 * Validates subdomain format and availability
 * @param subdomain - Subdomain to validate
 * @returns Validation result with normalized slug
 */
export function validateSubdomain(subdomain: string): { valid: boolean; error?: string; slug?: string } {
  try {
    const result = subdomainSchema.parse(subdomain);
    return { valid: true, slug: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        error: error.issues[0]?.message || "Invalid subdomain",
      };
    }
    return { valid: false, error: "Invalid subdomain" };
  }
}
