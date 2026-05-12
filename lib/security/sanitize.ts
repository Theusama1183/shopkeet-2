/**
 * Input Sanitization Utilities
 * Prevents XSS attacks by removing dangerous characters
 */

/**
 * Sanitize text input by removing HTML tags and dangerous characters
 */
export function sanitizeText(input: string | null | undefined): string | null {
  if (!input) return null;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers like onclick=
}

/**
 * Sanitize name fields (store names, product names, etc.)
 */
export function sanitizeName(input: string): string {
  return sanitizeText(input) || '';
}

/**
 * Sanitize description/content fields
 */
export function sanitizeDescription(input: string | null | undefined): string | null {
  return sanitizeText(input);
}

/**
 * Sanitize URL input
 */
export function sanitizeUrl(input: string | null | undefined): string | null {
  if (!input) return null;
  
  const trimmed = input.trim();
  
  // Only allow http:// and https:// protocols
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return null;
  }
  
  try {
    const url = new URL(trimmed);
    // Prevent javascript: and data: URLs
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Sanitize slug (URL-safe string)
 */
export function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}
