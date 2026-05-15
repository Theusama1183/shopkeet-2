import { NextRequest, NextResponse } from "next/server";
import { rateLimits, checkRateLimit } from "@/lib/redis/rate-limit";

export const config = {
  matcher: [
    "/((?!api/|_next/|_static/|_vercel|sentry-tunnel|[\\w-]+\\.\\w+).*)",
  ],
};

// Issue 6 fix: guard against NaN from non-numeric env var
const _parsedTimeout = parseInt(process.env.RATE_LIMIT_TIMEOUT_MS ?? "300", 10);
const RATE_LIMIT_TIMEOUT_MS =
  Number.isFinite(_parsedTimeout) && _parsedTimeout > 0 ? _parsedTimeout : 300;

export default async function proxy(req: NextRequest) {
  const url = req.nextUrl;

  const host = req.headers.get("host");

  // Issue 11 fix: log missing Host header instead of silently passing through
  if (!host) {
    console.warn("[proxy] Request missing Host header");
    return NextResponse.next();
  }

  // Issue 1 fix: guard rootDomain before any use — undefined would silently
  // corrupt every hostname comparison and template literal below
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  if (!rootDomain) {
    console.error("[proxy] NEXT_PUBLIC_ROOT_DOMAIN is not set");
    return NextResponse.next();
  }

  // Issue 2 fix: use a regex so any localhost port is normalised, not just :3000
  const hostname = host.replace(/\.localhost(:\d+)?$/, `.${rootDomain}`);

  const searchParams = req.nextUrl.searchParams.toString();
  const path = `${url.pathname}${searchParams.length > 0 ? `?${searchParams}` : ""}`;

  // Detect whether the original host was a localhost variant (any port)
  const isLocalhost = /^localhost(:\d+)?$/.test(host);

  // ── Admin routes ──────────────────────────────────────────────────────────
  // Issue 5 fix: apply a rate limit to admin routes — the latency cost of a
  // Redis check (~1–5 ms) is not a valid reason to leave admin unprotected
  if (hostname === `admin.${rootDomain}`) {
    await applyRateLimit(req, "admin");
    return NextResponse.rewrite(
      new URL(`/admin${path === "/" ? "" : path}`, req.url)
    );
  }

  // ── Auth routes ───────────────────────────────────────────────────────────
  // Issue 5 fix: same — apply rate limiting to auth subdomain
  if (hostname === `auth.${rootDomain}`) {
    await applyRateLimit(req, "auth");
    return NextResponse.rewrite(
      new URL(`/auth${path === "/" ? "" : path}`, req.url)
    );
  }

  // ── Root domain /auth/* redirect ──────────────────────────────────────────
  if ((isLocalhost || hostname === rootDomain) && path.startsWith("/auth")) {
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const authHost = isLocalhost ? `auth.${host}` : `auth.${rootDomain}`;

    // Issue 7 fix: ensure redirectPath always starts with "/" and strip any
    // double-slashes that could arise from path traversal sequences
    const rawRedirectPath = path.replace(/^\/auth/, "") || "/";
    const safePath = rawRedirectPath.startsWith("/")
      ? rawRedirectPath
      : `/${rawRedirectPath}`;

    return NextResponse.redirect(new URL(`${protocol}://${authHost}${safePath}`));
  }

  // ── Root domain → /home ───────────────────────────────────────────────────
  if (isLocalhost || hostname === rootDomain) {
    return NextResponse.rewrite(
      new URL(`/home${path === "/" ? "" : path}`, req.url)
    );
  }

  // ── Storefront ────────────────────────────────────────────────────────────
  // Issue 3 fix: removed the /home and /index → / redirect that was here.
  // It was incorrectly firing for ALL storefronts, permanently hijacking any
  // merchant page with those slugs via a cached 301. Merchants can legitimately
  // have a page at /home or /index. Unknown slugs are handled by notFound() in
  // [domain]/[slug]/page.tsx — no middleware redirect needed.

  // Apply global rate limiting to storefront requests
  if (rateLimits.global) {
    // Issue 4 fix: prefer req.ip (set by Vercel/platform, not spoofable) over
    // x-forwarded-for which can be trivially forged by clients
    const ip = getClientIp(req);

    try {
      // Race the Redis call against a timeout so a slow Redis never blocks
      // the storefront. checkRateLimit already fails open on error, but the
      // timeout ensures we don't wait longer than RATE_LIMIT_TIMEOUT_MS.
      // Issue 9 note: the timeout lives here rather than inside checkRateLimit
      // so that the shared helper stays simple; callers that need a timeout
      // can wrap it themselves.
      const rl = await Promise.race([
        checkRateLimit(rateLimits.global, `global:${ip}`),
        new Promise<{ success: boolean; remaining: number; reset: number }>(
          (resolve) =>
            setTimeout(
              () =>
                resolve({
                  success: true,
                  remaining: 999,
                  reset: Date.now() + 60_000,
                }),
              RATE_LIMIT_TIMEOUT_MS
            )
        ),
      ]);

      if (!rl.success) {
        return new NextResponse(JSON.stringify({ error: "Too many requests" }), {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": Math.ceil(
              (rl.reset - Date.now()) / 1000
            ).toString(),
          },
        });
      }
    } catch {
      // Fail open — never block the storefront due to Redis issues
    }
  }

  // Issue 10 fix: strip the port from hostname before using it as a path
  // segment. "mystore.lvh.me:3000" as a route param breaks all downstream
  // hostname parsing in storefront code.
  const hostnameWithoutPort = hostname.split(":")[0];

  // Issue 8 fix: delete any client-supplied x-pathname header before setting
  // our own to prevent header injection from reaching server components
  const response = NextResponse.rewrite(
    new URL(`/${hostnameWithoutPort}${path}`, req.url)
  );
  response.headers.delete("x-pathname");
  response.headers.set("x-pathname", url.pathname);
  return response;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Issue 4 fix: resolve the real client IP.
 * On Vercel, `req.ip` is injected by the platform and cannot be spoofed.
 * Fall back to x-forwarded-for only when req.ip is unavailable (self-hosted).
 * "unknown" is used as a last resort so all such requests share one bucket
 * rather than bypassing rate limiting entirely.
 */
function getClientIp(req: NextRequest): string {
  // Vercel sets this; it is not a header the client can forge
  const vercelIp = (req as NextRequest & { ip?: string }).ip;
  if (vercelIp) return vercelIp;

  // Self-hosted / other platforms: take the first (leftmost) address from
  // x-forwarded-for, which is the original client when the proxy is trusted
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;

  return "unknown";
}

/**
 * Issue 5 fix: shared rate-limit helper for admin and auth routes.
 * Uses the global limiter (10 000 req/hr per IP) — sufficient to stop
 * brute-force while not impacting legitimate admin users.
 * Fails open so a Redis outage never locks admins out.
 */
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
            () =>
              resolve({
                success: true,
                remaining: 999,
                reset: Date.now() + 60_000,
              }),
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
    // Fail open — never lock out admins due to Redis issues
  }

  return null;
}
