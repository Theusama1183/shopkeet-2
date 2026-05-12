import { Activity } from "lucide-react";
import { StatsCards } from "./dashboard-client";

export default function AdminPage() {
  // Sample data for sparklines (7-day trends)
  // TODO: Replace with real data from analytics
  const statsCards = [
    {
      title: "Total Revenue",
      value: "$0.00",
      change: "+0%",
      changeType: "neutral" as const,
      color: "#8B5CF6", // violet
      data: [120, 180, 150, 220, 190, 280, 320],
    },
    {
      title: "Active Sales",
      value: "0",
      change: "+0",
      changeType: "neutral" as const,
      color: "#10B981", // emerald
      data: [5, 8, 12, 9, 15, 18, 22],
    },
    {
      title: "Products",
      value: "0",
      change: "0 active",
      changeType: "neutral" as const,
      color: "#F59E0B", // amber
      data: [10, 10, 12, 12, 14, 15, 15],
    },
  ];

  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
        <p className="text-zinc-500 mt-1">Welcome back! Here's what's happening with your store.</p>
      </div>

      {/* Stats Cards - Client Component */}
      <StatsCards cards={statsCards} />

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-zinc-400" />
            <h2 className="text-lg font-semibold text-zinc-900">Recent Activity</h2>
          </div>
          <button className="text-sm text-violet-500 hover:text-violet-600 font-medium">
            View all
          </button>
        </div>
        <div className="p-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
              <Activity className="w-8 h-8 text-zinc-300" />
            </div>
            <p className="text-zinc-500 font-medium">No recent activity</p>
            <p className="text-zinc-400 text-sm mt-1">Activity from your store will appear here</p>
          </div>
        </div>
      </div>
    </>
  );
}
