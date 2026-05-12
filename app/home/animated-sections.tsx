"use client";

import { LazyMotion, domAnimation, m } from "framer-motion";
import Link from "next/link";
import { Check, Zap, Globe, BarChart3, Palette, Shield, Package } from "lucide-react";

const stats = [
  { value: "10K+", label: "Active Stores" },
  { value: "$2M+", label: "GMV Processed" },
  { value: "99.9%", label: "Uptime SLA" },
  { value: "4.9★", label: "Merchant Rating" },
];

const features = [
  { icon: Palette, title: "Visual Page Builder", desc: "Drag-and-drop editor powered by Puck. Build stunning pages without code." },
  { icon: Globe, title: "Custom Domains", desc: "Your store on your domain. Full subdomain and custom domain support." },
  { icon: Zap, title: "Lightning Fast", desc: "Built on Next.js 16 with edge caching. Your store loads in milliseconds." },
  { icon: BarChart3, title: "Analytics", desc: "Track revenue, orders, and customer behavior in real time." },
  { icon: Shield, title: "Secure by Default", desc: "Rate limiting, audit logs, and enterprise-grade security built in." },
  { icon: Package, title: "Product Management", desc: "Add, edit, and organize your products with ease." },
];

const plans = [
  {
    name: "Starter",
    price: "$5.99",
    desc: "Perfect for new merchants",
    features: ["1 Store", "50 Products", "Custom subdomain", "Page builder", "Basic analytics"],
    cta: "Start Free Trial",
    highlight: false,
  },
  {
    name: "Growth",
    price: "$19.99",
    desc: "For growing businesses",
    features: ["3 Stores", "Unlimited products", "Custom domain", "Advanced analytics", "Priority support", "Remove branding"],
    cta: "Start Free Trial",
    highlight: true,
  },
  {
    name: "Pro",
    price: "$49.99",
    desc: "For serious merchants",
    features: ["Unlimited stores", "Unlimited products", "Multiple domains", "Full analytics suite", "Dedicated support", "API access"],
    cta: "Contact Sales",
    highlight: false,
  },
];

export function AnimatedStats() {
  return (
    <LazyMotion features={domAnimation}>
      <section className="py-16 border-y border-zinc-100 bg-zinc-50">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <m.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-3xl font-heading font-bold text-zinc-900">{s.value}</div>
              <div className="text-sm text-zinc-500 mt-1">{s.label}</div>
            </m.div>
          ))}
        </div>
      </section>
    </LazyMotion>
  );
}

export function AnimatedFeatures() {
  return (
    <LazyMotion features={domAnimation}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <m.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="p-6 rounded-2xl border border-zinc-100 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-50 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center mb-4 group-hover:bg-violet-200 transition-colors">
                <Icon className="w-6 h-6 text-violet-600" />
              </div>
              <h3 className="font-heading font-semibold text-zinc-900 mb-2">{f.title}</h3>
              <p className="text-sm text-zinc-500">{f.desc}</p>
            </m.div>
          );
        })}
      </div>
    </LazyMotion>
  );
}

export function AnimatedPricing() {
  return (
    <LazyMotion features={domAnimation}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p, i) => (
          <m.div
            key={p.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className={`p-8 rounded-2xl border ${
              p.highlight
                ? "border-violet-200 bg-violet-50 shadow-xl shadow-violet-100 scale-105"
                : "border-zinc-100 bg-white"
            }`}
          >
            <div className="text-sm font-medium text-violet-600 mb-2">{p.name}</div>
            <div className="text-4xl font-heading font-bold text-zinc-900 mb-1">{p.price}</div>
            <div className="text-sm text-zinc-500 mb-6">{p.desc}</div>
            <ul className="space-y-3 mb-8">
              {p.features.map((feat) => (
                <li key={feat} className="flex items-start gap-2 text-sm text-zinc-600">
                  <Check className="w-4 h-4 text-violet-600 mt-0.5 shrink-0" />
                  {feat}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className={`block text-center py-3 rounded-lg font-medium transition-colors ${
                p.highlight
                  ? "bg-violet-600 hover:bg-violet-700 text-white"
                  : "bg-zinc-100 hover:bg-zinc-200 text-zinc-900"
              }`}
            >
              {p.cta}
            </Link>
          </m.div>
        ))}
      </div>
    </LazyMotion>
  );
}

export function AnimatedCTA() {
  return (
    <LazyMotion features={domAnimation}>
      <m.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="space-y-6"
      >
        <h2 className="text-4xl font-heading font-bold text-zinc-900">
          Ready to start selling?
        </h2>
        <p className="text-lg text-zinc-500 max-w-xl mx-auto">
          Join thousands of merchants building their online stores with ShopKeet.
          Start your free 7-day trial today.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/signup"
            className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors"
          >
            Start Free Trial
          </Link>
          <Link
            href="#"
            className="px-6 py-3 border border-zinc-200 hover:border-zinc-300 text-zinc-900 rounded-lg font-medium transition-colors"
          >
            View Demo
          </Link>
        </div>
      </m.div>
    </LazyMotion>
  );
}
