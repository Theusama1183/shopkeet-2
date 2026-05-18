import { NextRequest, NextResponse } from "next/server";
import { rateLimits, checkRateLimit } from "@/lib/redis/rate-limit";

export const config = {
  matcher: [
    "/((?!api/|_next/|_static/|_vercel|sentry-tunnel|[\\w-]+\\.\\w+).*)",
  ],
};

const _parsedTimeout = parseInt(process.env.RATE_LIMIT_TIMEOUT_MS ?? "300", 10);
const RATE_LIMIT_TIMEOUT_MS =
  Number.isFinite(_parsedTimeout) && _parsedTimeout > 0 ? _parsedTimeout : 300;

// ── Single-domain mode ────────────────────────────────────────────────────────
// When NEXT_PUBLIC_SINGLE_DOMAIN=true (Vercel Hobby / no wildcard subdomains),
// routing is path-based instead of subdomain-based:
//
//   /auth/*          → app/auth/
//   /admin/*         → app/admin/
//   /store/:domain/* → app/[domain]/  (storefront by subdomain slug)
//   /*               → app/home/
//
// Set NEXT_PUBLIC_SINGLE_DOMAIN=true in your Vercel environment variables.
const SINGLE_DOMAIN = process.env.NEXT_PUBLIC_SINGLE_DOMAIN === "true";

export default async function proxy(req: NextRequest) {
  const url = req.nextUrl;
  const path = `${url.pathname}${url.searchParams.toString() ? `?${url.searchParams.toString()}` : ""}`;

  // ── Single-domain mode (Vercel Hobby / path-based routing) ────────────────
  if (SINGLE_DOMAIN) {
    return handleSingleDomain(req, path);
  }

  // ── Subdomain mode (custom domain / Pro plan) ─────────────────────────────
  return handleSubdomainMode(req, url, path);
}

// ── Single-domain handler ─────────────────────────────────────────────────────
async function handleSingleDomain(req: NextRequest, path: string): Promise<NextResponse> {
  // /auth or /auth/* → app/auth/ (rewrite, not redirect — keeps URL clean)
  if (path === "/auth" || path.startsWith("/auth/") || path.startsWith("/auth?")) {
    await applyRateLimit(req, "auth");
    return NextResponse.rewrite(new URL(path, req.url));
  }

  // /admin or /admin/* → app/admin/
  if (path === "/admin" || path.startsWith("/admin/") || path.startsWith("/admin?")) {
    await applyRateLimit(req, "admin");
    return NextResponse.rewrite(new URL(path, req.url));
  }

  // /store/:subdomain/* → storefront for that subdomain
  // e.g. /store/myshop/products → app/[domain]/products
  const storeMatch = path.match(/^\/store\/([^/?]+)(\/[^?]*)?(\?.*)?$/);
  if (storeMatch) {
    const subdomain = storeMatch[1];
    const subPath = storeMatch[2] || "/";
    const query = storeMatch[3] || "";
    return NextResponse.rewrite(
      new URL(`/${subdomain}${subPath}${query}`, req.url)
    );
  }

  // Everything else → app/home/
  return NextResponse.rewrite(
    new URL(`/home${path === "/" ? "" : path}`, req.url)
  );
}

// ── Subdomain mode handler ────────────────────────────────────────────────────
async function handleSubdomainMode(
  req: NextRequest,
  url: NextRequest["nextUrl"],
  path: string
): Promise<NextResponse> {
  const host = req.headers.get("host");

  if (!host) {
    console.warn("[proxy] Request missing Host header");
    return NextResponse.next();
  }

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  if (!rootDomain) {
    console.error("[proxy] NEXT_PUBLIC_ROOT_DOMAIN is not set");
    return NextResponse.next();
  }

  const hostname = host.replace(/\.localhost(:\d+)?$/, `.${rootDomain}`);
  const isLocalhost = /^localhost(:\d+)?$/.test(host);

  // Admin subdomain
  if (hostname === `admin.${rootDomain}`) {
    await applyRateLimit(req, "admin");
    return NextResponse.rewrite(
      new URL(`/admin${path === "/" ? "" : path}`, req.url)
    );
  }

  // Auth subdomain
  if (hostname === `auth.${rootDomain}`) {
    await applyRateLimit(req, "auth");
    return NextResponse.rewrite(
      new URL(`/auth${path === "/" ? "" : path}`, req.url)
    );
  }

  // Root domain /auth/* redirect → auth subdomain
  if ((isLocalhost || hostname === rootDomain) && path.startsWith("/auth")) {
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const authHost = isLocalhost ? `auth.${host}` : `auth.${rootDomain}`;
    const rawRedirectPath = path.replace(/^\/auth/, "") || "/";
    const safePath = rawRedirectPath.startsWith("/")
      ? rawRedirectPath
      : `/${rawRedirectPath}`;
    return NextResponse.redirect(new URL(`${protocol}://${authHost}${safePath}`));
  }

  // Root domain → /home
  if (isLocalhost || hostname === rootDomain) {
    return NextResponse.rewrite(
      new URL(`/home${path === "/" ? "" : path}`, req.url)
    );
  }

  // Storefront — apply global rate limit
  if (rateLimits.global) {
    const ip = getClientIp(req);
    try {
      const rl = await Promise.race([
        checkRateLimit(rateLimits.global, `global:${ip}`),
        new Promise<{ success: boolean; remaining: number; reset: number }>(
          (resolve) =>
            setTimeout(
              () => resolve({ success: true, remaining: 999, reset: Date.now() + 60_000 }),
              RATE_LIMIT_TIMEOUT_MS
            )
        ),
      ]);
      if (!rl.success) {
        return new NextResponse(JSON.stringify({ error: "Too many requests" }), {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": Math.ceil((rl.reset - Date.now()) / 1000).toString(),
          },
        });
      }
    } catch {
      // Fail open
    }
  }

  const hostnameWithoutPort = hostname.split(":")[0];
  const response = NextResponse.rewrite(
    new URL(`/${hostnameWithoutPort}${path}`, req.url)
  );
  response.headers.delete("x-pathname");
  response.headers.set("x-pathname", url.pathname);
  return response;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getClientIp(req: NextRequest): string {
  const vercelIp = (req as NextRequest & { ip?: string }).ip;
  if (vercelIp) return vercelIp;
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

async function applyRateLimit(
  req: NextRequest,
  _context: "admin" | "auth"
): Promise<NextResponse | null> {
  if (!rateLimits.global) return null;
  const ip = getClientIp(req);
  try {
    const rl = await Promise.race([
      checkRateLimit(rateLimits.global, `${_context}:${ip}`),
      new Promise<{ success: boolean; remaining: number; reset: number }>(
        (resolve) =>
          setTimeout(
            () => resolve({ success: true, remaining: 999, reset: Date.now() + 60_000 }),
            RATE_LIMIT_TIMEOUT_MS
          )
      ),
    ]);
    if (!rl.success) {
      return new NextResponse(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": Math.ceil((rl.reset - Date.now()) / 1000).toString(),
        },
      });
    }
  } catch {
    // Fail open
  }
  return null;
}
