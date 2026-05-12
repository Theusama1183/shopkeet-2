"use client";

import { LazyMotion, domAnimation, m } from "framer-motion";
import Link from "next/link";
import { Sparkles, ArrowRight, ChevronRight, Store } from "lucide-react";

export function AnimatedHero() {
  return (
    <LazyMotion features={domAnimation}>
      <section className="pt-32 pb-24 px-6 bg-gradient-to-b from-violet-50/60 to-white">
        <div className="max-w-5xl mx-auto text-center">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 px-4 py-1.5 rounded-full text-sm font-medium mb-8"
          >
            <Sparkles className="w-4 h-4" />
            7-Day Free Trial — No credit card required
          </m.div>

          <m.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-6xl md:text-8xl font-heading font-bold text-zinc-900 leading-none tracking-tight mb-6"
          >
            Build Your<br />
            <span className="text-violet-600">Empire.</span>
          </m.h1>

          <m.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-zinc-500 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            The all-in-one platform to launch, design, and grow your online store.
            Beautiful storefronts, powerful tools, zero complexity.
          </m.p>

          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/signup"
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-8 py-4 rounded-xl text-base font-semibold transition-all shadow-lg shadow-violet-200 hover:shadow-violet-300"
            >
              Start for free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="#features"
              className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 px-8 py-4 rounded-xl text-base font-medium transition-colors border border-zinc-200 hover:border-zinc-300"
            >
              See how it works
              <ChevronRight className="w-4 h-4" />
            </Link>
          </m.div>
        </div>

        {/* Hero visual */}
        <m.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="max-w-5xl mx-auto mt-20"
        >
          <div className="relative rounded-2xl overflow-hidden border border-zinc-200 shadow-2xl shadow-zinc-200/60 bg-zinc-50">
            <div className="h-8 bg-zinc-100 border-b border-zinc-200 flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <div className="flex-1 mx-4 h-5 bg-white rounded-md border border-zinc-200 flex items-center px-3">
                <span className="text-xs text-zinc-400">mystore.shopkeet.com</span>
              </div>
            </div>
            <div className="bg-white p-8 min-h-80 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto">
                  <Store className="w-8 h-8 text-violet-600" />
                </div>
                <p className="text-zinc-400 text-sm">Your beautiful storefront, live in minutes</p>
                <div className="grid grid-cols-3 gap-3 mt-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
                      <div className="h-20 bg-zinc-100 rounded-lg mb-2" />
                      <div className="h-3 bg-zinc-200 rounded w-3/4 mb-1" />
                      <div className="h-3 bg-violet-100 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </m.div>
      </section>
    </LazyMotion>
  );
}
