import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Tracing: 100% in dev, 10% in production
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  // Debug only when explicitly opted in
  debug: process.env.SENTRY_DEBUG === "true",

  beforeSend(event, hint) {
    const error = hint.originalException;

    // Ignore client-disconnect aborts — these are not real errors.
    // They happen when the browser closes the connection before the
    // server finishes (navigation, tab close, network drop, etc.)
    if (
      error instanceof Error &&
      (error.message === "aborted" ||
        error.message?.includes("aborted") ||
        (error as NodeJS.ErrnoException).code === "ECONNRESET" ||
        (error as NodeJS.ErrnoException).code === "ECONNABORTED")
    ) {
      return null; // Drop the event — don't send to Sentry
    }

    return event;
  },
});
