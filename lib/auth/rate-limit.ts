import { rateLimits } from "@/lib/redis/rate-limit";

export async function checkAuthRateLimit(identifier: string): Promise<{
  success: boolean;
  remaining: number;
  reset: number;
}> {
  if (!rateLimits.auth) {
    return { success: true, remaining: Infinity, reset: 0 };
  }

  try {
    const result = await rateLimits.auth.limit(`auth:${identifier}`);
    return {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    console.error("Rate limit check error:", error);
    // On error, allow the request but log it
    return { success: true, remaining: 0, reset: 0 };
  }
}

export async function checkSignupRateLimit(identifier: string): Promise<{
  success: boolean;
  remaining: number;
  reset: number;
}> {
  if (!rateLimits.auth) {
    return { success: true, remaining: Infinity, reset: 0 };
  }

  try {
    const result = await rateLimits.auth.limit(`signup:${identifier}`);
    return {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    console.error("Rate limit check error:", error);
    return { success: true, remaining: 0, reset: 0 };
  }
}

export async function checkStoreCreationRateLimit(identifier: string): Promise<{
  success: boolean;
  remaining: number;
  reset: number;
  retryAfter?: number;
}> {
  if (!rateLimits.storeCreation) {
    return { success: true, remaining: Infinity, reset: 0 };
  }

  try {
    const result = await rateLimits.storeCreation.limit(`store:${identifier}`);
    return {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset,
      retryAfter: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000),
    };
  } catch (error) {
    console.error("Rate limit check error:", error);
    return { success: true, remaining: 0, reset: 0 };
  }
}
