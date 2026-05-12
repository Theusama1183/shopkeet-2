"use client";

import { useEffect, useState } from 'react';
import { initWebVitals, performanceTracker } from '@/lib/utils/performance';

/**
 * Performance monitoring component that initializes Web Vitals tracking
 * and provides performance insights in development mode
 */
export function PerformanceMonitor() {
  useEffect(() => {
    // Initialize Web Vitals tracking
    initWebVitals();

    // In development, log performance summary periodically
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        const summary = performanceTracker.getSummary();
        if (Object.keys(summary).length > 0) {
          console.group('🚀 Performance Summary');
          Object.entries(summary).forEach(([metric, stats]) => {
            const rating = getMetricRating(metric, stats.avg);
            const emoji = rating === 'good' ? '✅' : rating === 'needs-improvement' ? '⚠️' : '❌';
            console.log(`${emoji} ${metric}: ${stats.avg.toFixed(2)}ms (min: ${stats.min.toFixed(2)}, max: ${stats.max.toFixed(2)}, count: ${stats.count})`);
          });
          console.groupEnd();
        }
      }, 30000); // Log every 30 seconds

      return () => clearInterval(interval);
    }

    // Cleanup on unmount
    return () => {
      performanceTracker.destroy();
    };
  }, []);

  // This component doesn't render anything
  return null;
}

/**
 * Get performance rating for display purposes
 */
function getMetricRating(metric: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds: Record<string, { good: number; poor: number }> = {
    LCP: { good: 2500, poor: 4000 },
    FID: { good: 100, poor: 300 },
    CLS: { good: 0.1, poor: 0.25 },
    FCP: { good: 1800, poor: 3000 },
    TTFB: { good: 800, poor: 1800 },
    INP: { good: 200, poor: 500 },
  };

  const threshold = thresholds[metric];
  if (!threshold) return 'good'; // Unknown metric, assume good

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Development-only performance dashboard component
 */
export function PerformanceDashboard() {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <details className="bg-black/90 text-white text-xs rounded-lg p-3 max-w-sm">
        <summary className="cursor-pointer font-medium">
          📊 Performance Monitor
        </summary>
        <div className="mt-2 space-y-1">
          <PerformanceMetrics />
        </div>
      </details>
    </div>
  );
}

/**
 * Real-time performance metrics display
 */
function PerformanceMetrics() {
  const [metrics, setMetrics] = useState<Record<string, any>>({});

  useEffect(() => {
    const updateMetrics = () => {
      const summary = performanceTracker.getSummary();
      setMetrics(summary);
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);

    return () => clearInterval(interval);
  }, []);

  if (Object.keys(metrics).length === 0) {
    return <div className="text-gray-400">No metrics yet...</div>;
  }

  return (
    <div className="space-y-1">
      {Object.entries(metrics).map(([metric, stats]) => {
        const rating = getMetricRating(metric, stats.avg);
        const emoji = rating === 'good' ? '✅' : rating === 'needs-improvement' ? '⚠️' : '❌';
        
        return (
          <div key={metric} className="flex justify-between items-center">
            <span className="flex items-center gap-1">
              <span>{emoji}</span>
              <span>{metric}</span>
            </span>
            <span className="font-mono">
              {stats.avg.toFixed(0)}ms
            </span>
          </div>
        );
      })}
    </div>
  );
}