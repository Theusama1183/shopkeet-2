'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Admin error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-zinc-200 p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">
            Admin Error
          </h1>
          <p className="text-zinc-600 text-sm">
            Something went wrong in the admin panel. Please try again.
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
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors font-medium text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/admin"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-zinc-200 text-zinc-700 rounded-lg hover:bg-zinc-50 transition-colors font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
