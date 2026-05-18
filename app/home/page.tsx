import { Logo } from "@/components/ui/logo";
import Link from "next/link";
import { AnimatedHero } from "./animated-hero";
import { AnimatedStats, AnimatedFeatures, AnimatedPricing, AnimatedCTA } from "./animated-sections";
import { getLoginUrl } from "@/lib/auth/redirect";

export default function HomePage() {
  const loginUrl = getLoginUrl("/login");
  const signupUrl = getLoginUrl("/signup");

  return (
    <div className="min-h-screen bg-white font-body">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo variant="full" size="md" iconColor="#8E52FF" textColor="#18181b" />
          <div className="hidden md:flex items-center gap-8 text-sm text-zinc-600">
            <a href="#features" className="hover:text-zinc-900 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-zinc-900 transition-colors">Pricing</a>
            <a href="#" className="hover:text-zinc-900 transition-colors">Docs</a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={loginUrl}
              className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors px-4 py-2"
            >
              Sign in
            </Link>
            <Link
              href={signupUrl}
              className="text-sm bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero - Client Component with animations */}
      <AnimatedHero />

      {/* Stats - Client Component with animations */}
      <AnimatedStats />

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-heading font-bold text-zinc-900 mb-4">Everything you need to sell</h2>
            <p className="text-zinc-500 text-lg max-w-xl mx-auto">
              From your first product to your thousandth order — ShopKeet scales with you.
            </p>
          </div>
          <AnimatedFeatures />
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 bg-zinc-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-heading font-bold text-zinc-900 mb-4">Simple, honest pricing</h2>
            <p className="text-zinc-500 text-lg">Start free. Upgrade when you're ready.</p>
          </div>
          <AnimatedPricing />
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <AnimatedCTA />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-100 py-12 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo variant="full" size="sm" iconColor="#8E52FF" textColor="#71717a" />
          <p className="text-sm text-zinc-400">© 2026 ShopKeet. All rights reserved.</p>
          <div className="flex items-center gap-6 text-sm text-zinc-400">
            <a href="#" className="hover:text-zinc-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-zinc-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-zinc-600 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
