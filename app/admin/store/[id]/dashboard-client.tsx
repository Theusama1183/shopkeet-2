"use client";

import { lazy, Suspense } from "react";

const Sparkline = lazy(() => import("@/components/ui/sparkline"));

interface StatCard {
  title: string;
  value: string;
  change: string;
  changeType: "neutral" | "positive" | "negative";
  color: string;
  data: number[];
}

export function StatsCards({ cards }: { cards: StatCard[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {cards.map((card) => (
        <div
          key={card.title}
          className="relative overflow-hidden bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          {/* Subtle background glow */}
          <div
            className="absolute top-0 right-0 w-32 h-32 opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"
            style={{ backgroundColor: card.color }}
          />

          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-500">{card.title}</p>
              <p className="text-3xl font-bold text-zinc-900 mt-2">{card.value}</p>
              <p className="text-sm text-zinc-400 mt-1">{card.change}</p>
            </div>
            {/* Sparkline Graph */}
            <div className="flex items-center justify-center pt-2">
              <Suspense fallback={<div className="w-20 h-10 bg-gray-100 rounded animate-pulse" />}>
                <Sparkline data={card.data} color={card.color} width={80} height={40} />
              </Suspense>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
