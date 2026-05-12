import { NextResponse } from "next/server";
import { getServiceRoleDatabase } from "@/lib/supabase/database";
import { redis, isRedisConfigured } from "@/lib/redis/client";

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    status: "healthy",
    checks: {
      database: { status: "unknown", responseTime: 0 },
      redis: { status: "unknown", responseTime: 0 },
    },
  };

  // Database health check using Supabase
  try {
    const start = Date.now();
    const db = getServiceRoleDatabase();
    // Simple query to check database connectivity
    await db.from('stores').select('id').limit(1);
    checks.checks.database = {
      status: "healthy",
      responseTime: Date.now() - start,
    };
  } catch (error) {
    checks.checks.database = {
      status: "unhealthy" as const,
      responseTime: 0,
    };
    checks.status = "unhealthy";
  }

  // Redis health check
  if (isRedisConfigured() && redis) {
    try {
      const start = Date.now();
      await redis.ping();
      checks.checks.redis = {
        status: "healthy",
        responseTime: Date.now() - start,
      };
    } catch (error) {
      checks.checks.redis = {
        status: "unhealthy" as const,
        responseTime: 0,
      };
      checks.status = "degraded"; // Redis is optional
    }
  } else {
    checks.checks.redis = {
      status: "disabled" as const,
      responseTime: 0,
    };
  }

  const statusCode = checks.status === "healthy" ? 200 : 
                    checks.status === "degraded" ? 200 : 503;

  return NextResponse.json(checks, { status: statusCode });
}

// Readiness check (for Kubernetes)
export async function HEAD() {
  try {
    const db = getServiceRoleDatabase();
    await db.from('stores').select('id').limit(1);
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}