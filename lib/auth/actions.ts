"use server";

import { createClient } from "@/lib/supabase/server";
import { rateLimits, checkRateLimit } from "@/lib/redis/rate-limit";
import { loginSchema, signupSchema } from "@/lib/validations/auth";
import { headers } from "next/headers";

interface AuthResult {
  success?: boolean;
  error?: string;
  retryAfter?: number;
}

/**
 * Server action for login with rate limiting
 */
export async function loginAction(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    // Validate input
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      return {
        error: validation.error.issues[0]?.message ?? "Invalid input",
      };
    }

    const { email: validEmail, password: validPassword } = validation.data;

    // Rate limiting by email
    const rl = await checkRateLimit(
      rateLimits.auth,
      "auth",
      `login:${validEmail.toLowerCase()}`
    );

    if (!rl.success) {
      const retryAfter = Math.ceil((rl.reset - Date.now()) / 1000);
      return {
        error: `Too many login attempts. Please try again in ${retryAfter} seconds.`,
        retryAfter,
      };
    }

    // Additional rate limiting by IP
    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      "unknown";

    const ipRl = await checkRateLimit(
      rateLimits.auth,
      "auth",
      `login-ip:${ip}`
    );

    if (!ipRl.success) {
      const retryAfter = Math.ceil((ipRl.reset - Date.now()) / 1000);
      return {
        error: `Too many login attempts from this IP. Please try again in ${retryAfter} seconds.`,
        retryAfter,
      };
    }

    // Attempt login
    const supabase = await createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: validEmail,
      password: validPassword,
    });

    if (authError) {
      // Don't expose detailed auth errors to prevent user enumeration
      if (authError.message.includes("Invalid login credentials")) {
        return { error: "Invalid email or password" };
      }
      return { error: "Authentication failed. Please try again." };
    }

    return { success: true };
  } catch (error) {
    console.error("[auth] Login error:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}

/**
 * Server action for signup with rate limiting
 */
export async function signupAction(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    // Validate input
    const validation = signupSchema.safeParse({ email, password });
    if (!validation.success) {
      return {
        error: validation.error.issues[0]?.message ?? "Invalid input",
      };
    }

    const { email: validEmail, password: validPassword } = validation.data;

    // Rate limiting by email
    const rl = await checkRateLimit(
      rateLimits.auth,
      "auth",
      `signup:${validEmail.toLowerCase()}`
    );

    if (!rl.success) {
      const retryAfter = Math.ceil((rl.reset - Date.now()) / 1000);
      return {
        error: `Too many signup attempts. Please try again in ${retryAfter} seconds.`,
        retryAfter,
      };
    }

    // Additional rate limiting by IP
    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      "unknown";

    const ipRl = await checkRateLimit(
      rateLimits.auth,
      "auth",
      `signup-ip:${ip}`
    );

    if (!ipRl.success) {
      const retryAfter = Math.ceil((ipRl.reset - Date.now()) / 1000);
      return {
        error: `Too many signup attempts from this IP. Please try again in ${retryAfter} seconds.`,
        retryAfter,
      };
    }

    // Attempt signup
    const supabase = await createClient();
    const { error: authError } = await supabase.auth.signUp({
      email: validEmail,
      password: validPassword,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    if (authError) {
      // Don't expose whether email exists to prevent enumeration
      if (authError.message.includes("already registered")) {
        return { error: "This email is already registered. Please login instead." };
      }
      return { error: "Signup failed. Please try again." };
    }

    return { success: true };
  } catch (error) {
    console.error("[auth] Signup error:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}

/**
 * Server action for logout
 */
export async function logoutAction(): Promise<AuthResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { error: "Logout failed. Please try again." };
    }

    return { success: true };
  } catch (error) {
    console.error("[auth] Logout error:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}
