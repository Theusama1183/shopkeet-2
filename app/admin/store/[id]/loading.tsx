export default function StoreAdminLoading() {
  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header Skeleton */}
      <div className="border-b border-zinc-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="h-8 w-48 bg-zinc-200 rounded animate-pulse" />
            <div className="h-10 w-32 bg-zinc-200 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-4">
          <div className="h-6 w-64 bg-zinc-200 rounded animate-pulse" />
          <div className="h-4 w-96 bg-zinc-200 rounded animate-pulse" />
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-white border border-zinc-200 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
