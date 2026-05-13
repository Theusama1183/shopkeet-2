import { NextRequest, NextResponse } from "next/server";
import { rateLimits, checkRateLimit } from "@/lib/redis/rate-limit";

export const config = {
  matcher: [
    "/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)",
  ],
};

// Rate limit timeout configuration
const RATE_LIMIT_TIMEOUT_MS = parseInt(process.env.RATE_LIMIT_TIMEOUT_MS ?? '300', 10);

export default async function proxy(req: NextRequest) {
  const url = req.nextUrl;

  const host = req.headers.get("host");
  if (!host) {
    return NextResponse.next();
  }

  const hostname = host.replace(".localhost:3000", `.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`);

  const searchParams = req.nextUrl.searchParams.toString();
  const path = `${url.pathname}${searchParams.length > 0 ? `?${searchParams}` : ""}`;

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;

  // ── Admin routes — no rate limiting, fast rewrite ─────────────────────────
  if (hostname === `admin.${rootDomain}`) {
    return NextResponse.rewrite(
      new URL(`/admin${path === "/" ? "" : path}`, req.url)
    );
  }

  // ── Auth routes — no rate limiting ────────────────────────────────────────
  if (hostname === `auth.${rootDomain}`) {
    return NextResponse.rewrite(
      new URL(`/auth${path === "/" ? "" : path}`, req.url)
    );
  }

  // ── Root domain /auth/* redirect ──────────────────────────────────────────
  if (
    (hostname === "localhost:3000" || hostname === rootDomain) &&
    path.startsWith("/auth")
  ) {
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const authHost =
      hostname === "localhost:3000"
        ? "auth.localhost:3000"
        : `auth.${rootDomain}`;
    const redirectPath = path.replace(/^\/auth/, "") || "/";
    return NextResponse.redirect(new URL(`${protocol}://${authHost}${redirectPath}`));
  }

  // ── Root domain → /home ───────────────────────────────────────────────────
  if (hostname === "localhost:3000" || hostname === rootDomain) {
    return NextResponse.rewrite(
      new URL(`/home${path === "/" ? "" : path}`, req.url)
    );
  }

  // ── Storefront — apply rate limiting only here ────────────────────────────
  // Rate limiting only on public storefront, not admin/auth

  // ── Home slug redirect — instant, no DB call ─────────────────────────────
  // If a storefront visitor hits /home or /index, redirect to / immediately.
  // This avoids a full server render + DB lookup just to issue a redirect.
  if (url.pathname === "/home" || url.pathname === "/index") {
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    return NextResponse.redirect(new URL(`${protocol}://${host}/`), { status: 301 });
  }
  if (rateLimits.global) {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    try {
      // 300ms timeout — if Redis is slow, skip rate limiting
      const rl = await Promise.race([
        checkRateLimit(rateLimits.global, `global:${ip}`),
        new Promise<{ success: boolean; remaining: number; reset: number }>(
          (resolve) => setTimeout(() => resolve({ success: true, remaining: 999, reset: Date.now() + 60_000 }), RATE_LIMIT_TIMEOUT_MS)
        ),
      ]);

      if (!rl.success) {
        return new NextResponse(
          JSON.stringify({ error: "Too many requests" }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": Math.ceil((rl.reset - Date.now()) / 1000).toString(),
            },
          }
        );
      }
    } catch {
      // Fail open — never block storefront due to Redis issues
    }
  }

  // Rewrite to storefront dynamic route
  const response = NextResponse.rewrite(new URL(`/${hostname}${path}`, req.url));
  response.headers.set("x-pathname", url.pathname);
  return response;
}
