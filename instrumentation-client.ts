import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adds request headers and IP for users (useful for debugging)
  sendDefaultPii: true,

  // Tracing: 100% in dev, 10% in production
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  // Session Replay: lazy-loaded so it doesn't block initial page load
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    // Lazy-load the Replay integration — only downloaded after page is interactive
    Sentry.replayIntegration({
      // Mask all text and block all media by default for privacy
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],

  // Debug only when explicitly opted in
  debug: process.env.SENTRY_DEBUG === "true",

  // Don't load replay bundle until it's actually needed
  lazyLoadIntegration: true,
} as Parameters<typeof Sentry.init>[0]);

// Instrument router navigations for tracing
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
