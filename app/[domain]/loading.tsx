export default function StorefrontLoading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header Skeleton */}
      <div className="border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="h-8 w-32 bg-zinc-100 rounded animate-pulse" />
            <div className="flex gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-6 w-16 bg-zinc-100 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="space-y-8">
          <div className="h-12 w-96 bg-zinc-100 rounded animate-pulse mx-auto" />
          <div className="h-6 w-64 bg-zinc-100 rounded animate-pulse mx-auto" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-3">
                <div className="h-64 bg-zinc-100 rounded-lg animate-pulse" />
                <div className="h-4 w-3/4 bg-zinc-100 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-zinc-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
