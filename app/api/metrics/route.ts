import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PerformanceMonitor } from "@/lib/monitoring/performance";

export async function GET() {
  // Authentication required - only authenticated users can view metrics
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { error: "Unauthorized - authentication required" },
      { status: 401 }
    );
  }

  // Role-based authorization for admin-only access
  const userRole = user.user_metadata?.role;
  if (userRole !== 'admin') {
    return NextResponse.json(
      { error: "Forbidden - admin access required" },
      { status: 403 }
    );
  }

  const monitor = PerformanceMonitor.getInstance();
  const stats = monitor.getAllStats();
  
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    performance: stats,
    memory: process.memoryUsage(),
    uptime: process.uptime(),
  });
}