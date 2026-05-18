/**
 * Builds the login redirect URL respecting single-domain vs subdomain mode.
 *
 * Single-domain mode (NEXT_PUBLIC_SINGLE_DOMAIN=true):
 *   → /auth/login  (path-based, same origin)
 *
 * Subdomain mode:
 *   → https://auth.yourdomain.com/login
 */
export function getLoginUrl(returnPath = "/login"): string {
  const singleDomain = process.env.NEXT_PUBLIC_SINGLE_DOMAIN === "true";

  if (singleDomain) {
    // Path-based — no cross-origin redirect needed
    const safePath = returnPath.startsWith("/") ? returnPath : `/${returnPath}`;
    return `/auth${safePath}`;
  }

  // Subdomain mode
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const domain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";
  return `${protocol}://auth.${domain}${returnPath}`;
}

/**
 * Builds the admin URL respecting single-domain vs subdomain mode.
 *
 * Single-domain mode: /admin/...
 * Subdomain mode:     https://admin.yourdomain.com/...
 */
export function getAdminUrl(path = "/"): string {
  const singleDomain = process.env.NEXT_PUBLIC_SINGLE_DOMAIN === "true";
  const safePath = path.startsWith("/") ? path : `/${path}`;

  if (singleDomain) {
    return `/admin${safePath === "/" ? "" : safePath}`;
  }

  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const domain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";
  return `${protocol}://admin.${domain}${safePath}`;
}

/**
 * Builds a storefront URL respecting single-domain vs subdomain mode.
 *
 * Single-domain mode: /store/:subdomain/...
 * Subdomain mode:     https://:subdomain.yourdomain.com/...
 */
export function getStorefrontUrl(subdomain: string, path = "/"): string {
  const singleDomain = process.env.NEXT_PUBLIC_SINGLE_DOMAIN === "true";
  const safePath = path.startsWith("/") ? path : `/${path}`;

  if (singleDomain) {
    return `/store/${subdomain}${safePath === "/" ? "" : safePath}`;
  }

  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const domain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";
  return `${protocol}://${subdomain}.${domain}${safePath}`;
}
