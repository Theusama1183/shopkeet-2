"use client";

import { useState } from "react";
import { signupAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, ShoppingBag, Rocket, Star, Zap, Check, X } from "lucide-react";
import { Logo } from "@/components/ui/logo";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Password strength validation
  const passwordChecks = {
    length: password.length >= 12,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^a-zA-Z0-9]/.test(password),
  };

  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Client-side validation
    if (!email || !password) {
      setError("Email and password are required");
      setLoading(false);
      return;
    }

    if (!isPasswordValid) {
      setError("Password does not meet security requirements");
      setLoading(false);
      return;
    }

    try {
      // Call server action with rate limiting
      const result = await signupAction(
        email.trim().toLowerCase(),
        password
      );

      if (result.error) {
        setError(result.error);
        setLoading(false);
      } else if (result.success) {
        setSuccess(true);
        setLoading(false);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg text-center space-y-4"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900">Check your email!</h2>
          <p className="text-zinc-600">
            We've sent a confirmation link to <strong>{email}</strong>. 
            Please verify your email to continue.
          </p>
          <Link href="/login">
            <Button className="w-full bg-violet-500 hover:bg-violet-600">
              Go to Login
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-white">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-8"
        >
          {/* Logo */}
          <Logo size="lg" variant="full" iconColor="#8E52FF" textColor="black" />

          {/* Header */}
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold text-zinc-900 leading-tight">
              Create account.
            </h1>
            <p className="text-lg text-zinc-500 mt-2">
              Start your 7-day free trial. No credit card required.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSignup} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 text-base"
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 text-base"
                  autoComplete="new-password"
                />
                
                {/* Password strength indicators */}
                {password && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-medium text-zinc-700">Password must contain:</p>
                    <div className="space-y-1">
                      <PasswordCheck met={passwordChecks.length} text="At least 12 characters" />
                      <PasswordCheck met={passwordChecks.lowercase} text="One lowercase letter" />
                      <PasswordCheck met={passwordChecks.uppercase} text="One uppercase letter" />
                      <PasswordCheck met={passwordChecks.number} text="One number" />
                      <PasswordCheck met={passwordChecks.special} text="One special character" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-violet-500 hover:bg-violet-600 text-lg h-12"
              disabled={loading || (password.length > 0 && !isPasswordValid)}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </Button>

            <p className="text-xs text-zinc-400 text-center">
              By signing up, you agree to our{" "}
              <Link href="#" className="text-violet-600 hover:underline">Terms</Link>
              {" "}and{" "}
              <Link href="#" className="text-violet-600 hover:underline">Privacy Policy</Link>
            </p>
          </form>

          {/* Footer */}
          <p className="text-center text-zinc-600">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-violet-600 hover:text-violet-500">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right: Visual */}
      <div className="hidden lg:flex w-1/2 bg-linear-to-br from-violet-600 via-violet-500 to-purple-600 items-center justify-center relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-violet-400/10 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center text-white px-12 max-w-lg">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Floating Cards */}
            <div className="relative mb-8">
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-16 -left-8 bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/30"
              >
                <Rocket className="w-6 h-6" />
              </motion.div>
              <motion.div 
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-8 -right-4 bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/30"
              >
                <Star className="w-6 h-6" />
              </motion.div>
              <motion.div 
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-20 -right-12 bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/30"
              >
                <Zap className="w-6 h-6" />
              </motion.div>

              <div className="w-32 h-32 mx-auto bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center border border-white/30">
                <ShoppingBag className="w-16 h-16" />
              </div>
            </div>

            <h2 className="text-3xl font-bold mb-4">
              Start selling today
            </h2>
            <p className="text-white/80 text-lg">
              Create your online store in minutes and reach customers worldwide with powerful tools.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-10">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-2xl font-bold">10K+</div>
                <div className="text-white/70 text-sm">Stores</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-2xl font-bold">$2M+</div>
                <div className="text-white/70 text-sm">Sales</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-2xl font-bold">99%</div>
                <div className="text-white/70 text-sm">Uptime</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function PasswordCheck({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {met ? (
        <Check className="w-3 h-3 text-green-600" />
      ) : (
        <X className="w-3 h-3 text-zinc-400" />
      )}
      <span className={met ? "text-green-600" : "text-zinc-500"}>{text}</span>
    </div>
  );
}
