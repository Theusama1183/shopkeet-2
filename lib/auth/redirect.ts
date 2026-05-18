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
    const safePath = returnPath.startsWith("/") ? returnPath : `/${returnPath}`;
    return `/auth${safePath}`;
  }

  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const domain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";
  return `${protocol}://auth.${domain}${returnPath}`;
}

/**
 * Builds the admin URL respecting single-domain vs subdomain mode.
 *
 * Single-domain mode: /admin/...
 * Subdomain mode:     https://admin.yourdomain.com/...
 *
 * NOTE: In single-domain mode, store paths must include /admin prefix:
 *   getAdminUrl("/store/abc123") → /admin/store/abc123
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
 * Builds the admin store URL — always uses /admin/store/:id prefix in
 * single-domain mode, and the root /store/:id path in subdomain mode
 * (because the admin subdomain already scopes it).
 */
export function getAdminStoreUrl(storeId: string, subPath = ""): string {
  const singleDomain = process.env.NEXT_PUBLIC_SINGLE_DOMAIN === "true";
  const safeSub = subPath ? (subPath.startsWith("/") ? subPath : `/${subPath}`) : "";

  if (singleDomain) {
    return `/admin/store/${storeId}${safeSub}`;
  }

  // In subdomain mode the admin subdomain is already scoped — use /store/:id
  return `/store/${storeId}${safeSub}`;
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
