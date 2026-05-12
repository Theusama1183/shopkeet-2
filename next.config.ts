import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // ── React Strict Mode ───────────────────────────────────────────────────────
  // Disabled to prevent double-rendering in development which can cause refresh loops
  reactStrictMode: false,

  // ── Compression ─────────────────────────────────────────────────────────────
  compress: true,

  // ── Turbopack ───────────────────────────────────────────────────────────────
  turbopack: {},

  devIndicators: {
    position: "bottom-right",
  },

  // ── Image optimization ───────────────────────────────────────────────────────
  images: {
    // Serve WebP/AVIF automatically
    formats: ["image/avif", "image/webp"],
    // Aggressive CDN caching for images
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days
    remotePatterns: [
      { hostname: "public.blob.vercel-storage.com" },
      { hostname: "res.cloudinary.com" },
      { hostname: "abs.twimg.com" },
      { hostname: "pbs.twimg.com" },
      { hostname: "avatars.githubusercontent.com" },
      { hostname: "www.google.com" },
      { hostname: "flag.vercel.app" },
      { hostname: "illustrations.popsy.co" },
    ],
  },

  experimental: {
    serverActions: {
      allowedOrigins: [
        "lvh.me:3000",
        "*.lvh.me:3000",
        "admin.lvh.me:3000",
        "auth.lvh.me:3000",
        "teststore.lvh.me:3000",
      ],
    },
  },

  // Allow HMR and _next/* assets from subdomains in dev
  allowedDevOrigins: [
    "*.lvh.me:3000",
    "lvh.me:3000",
  ],

  // Allow HMR from subdomains
  assetPrefix: undefined,

  // Fix cross-origin requests from subdomains
  // This allows /_next/* resources to be loaded from any subdomain
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [],
    };
  },

  // ── Bundle analysis ──────────────────────────────────────────────────────────
  webpack: (config, { isServer }) => {
    if (process.env.ANALYZE === "true") {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: "static",
          reportFilename: isServer
            ? "../analyze/server.html"
            : "./analyze/client.html",
          openAnalyzer: false,
        })
      );
    }
    return config;
  },

  async headers() {
    const isProduction = process.env.NODE_ENV === "production";

    return [
      // ── Security headers for all routes ──────────────────────────────────
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Strict-Transport-Security",
            value: isProduction
              ? "max-age=63072000; includeSubDomains; preload"
              : "max-age=0",
          },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.upstash.io https://*.sentry.io https://o4509680710582272.ingest.us.sentry.io",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },

      // ── CDN cache headers for storefront pages ────────────────────────────
      // s-maxage=300 → CDN caches for 5 min; stale-while-revalidate=60 → serve
      // stale while revalidating in background (zero-downtime cache refresh)
      {
        source: "/:domain([^/]+)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=300, stale-while-revalidate=60",
          },
          { key: "Vary", value: "Accept-Encoding" },
        ],
      },
      {
        source: "/:domain([^/]+)/:slug([^/]+)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=300, stale-while-revalidate=60",
          },
          { key: "Vary", value: "Accept-Encoding" },
        ],
      },

      // ── Long-lived cache for static assets ───────────────────────────────
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/favicon.ico",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400",
          },
        ],
      },

      // ── No cache for API routes ───────────────────────────────────────────
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // Sentry organization and project slugs (set via env or hardcode)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Auth token for source map uploads (set in CI / .env.sentry-build-plugin)
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Route Sentry requests through your server to avoid ad-blockers
  tunnelRoute: "/sentry-tunnel",

  // Suppress non-CI output
  silent: !process.env.CI,
});
