export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin mx-auto" />
        <p className="text-sm text-zinc-500 font-medium">Loading admin panel...</p>
      </div>
    </div>
  );
}
