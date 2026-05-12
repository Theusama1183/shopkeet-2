'use client';

import { useEffect } from 'react';
import { Store, RefreshCw } from 'lucide-react';

export default function StorefrontError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Storefront error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto">
          <Store className="w-10 h-10 text-zinc-400" />
        </div>
        
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 mb-3">
            Oops! Something went wrong
          </h1>
          <p className="text-zinc-600">
            We're having trouble loading this page. Please try again.
          </p>
        </div>

        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    </div>
  );
}
