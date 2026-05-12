'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 mb-2">
                Something went wrong
              </h1>
              <p className="text-zinc-600 text-sm">
                We encountered an unexpected error. Please try again or contact support if the problem persists.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && error.message && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
                <p className="text-xs font-mono text-red-800 break-all">
                  {error.message}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={reset}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <Link
                href="/"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-zinc-200 text-zinc-700 rounded-lg hover:bg-zinc-50 transition-colors font-medium"
              >
                <Home className="w-4 h-4" />
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
