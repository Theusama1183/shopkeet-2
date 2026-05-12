/**
 * Performance monitoring utilities for tracking Web Vitals and custom metrics
 */

// Web Vitals types
export interface WebVital {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  url: string;
  userAgent?: string;
  connectionType?: string;
}

/**
 * Performance thresholds based on Web Vitals recommendations
 */
export const PERFORMANCE_THRESHOLDS = {
  // Core Web Vitals
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint (ms)
  FID: { good: 100, poor: 300 },   // First Input Delay (ms)
  CLS: { good: 0.1, poor: 0.25 },  // Cumulative Layout Shift
  
  // Other important metrics
  FCP: { good: 1800, poor: 3000 },  // First Contentful Paint (ms)
  TTFB: { good: 800, poor: 1800 },  // Time to First Byte (ms)
  INP: { good: 200, poor: 500 },    // Interaction to Next Paint (ms)
} as const;

/**
 * Get performance rating based on value and thresholds
 */
export function getPerformanceRating(
  metric: keyof typeof PERFORMANCE_THRESHOLDS,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = PERFORMANCE_THRESHOLDS[metric];
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Custom performance observer for tracking metrics
 */
export class PerformanceTracker {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private observers: PerformanceObserver[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers();
      // Cleanup on page unload to prevent memory leaks
      window.addEventListener('beforeunload', () => {
        this.destroy();
      });
    }
  }

  private initializeObservers() {
    // Observe navigation timing
    if ('PerformanceObserver' in window) {
      try {
        const navObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              this.trackNavigationMetrics(entry as PerformanceNavigationTiming);
            }
          }
        });
        navObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navObserver);
      } catch (error) {
        console.warn('Navigation timing observer not supported:', error);
      }

      // Observe resource timing
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'resource') {
              this.trackResourceMetrics(entry as PerformanceResourceTiming);
            }
          }
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);
      } catch (error) {
        console.warn('Resource timing observer not supported:', error);
      }

      // Observe layout shifts
      try {
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
              this.trackMetric('CLS', (entry as any).value);
            }
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (error) {
        console.warn('Layout shift observer not supported:', error);
      }
    }
  }

  private trackNavigationMetrics(entry: PerformanceNavigationTiming) {
    const metrics = {
      TTFB: entry.responseStart - entry.requestStart,
      DOMContentLoaded: entry.domContentLoadedEventEnd - entry.fetchStart,
      LoadComplete: entry.loadEventEnd - entry.fetchStart,
      DNSLookup: entry.domainLookupEnd - entry.domainLookupStart,
      TCPConnect: entry.connectEnd - entry.connectStart,
      ServerResponse: entry.responseEnd - entry.responseStart,
    };

    Object.entries(metrics).forEach(([name, value]) => {
      if (value > 0) {
        this.trackMetric(name, value);
      }
    });
  }

  private trackResourceMetrics(entry: PerformanceResourceTiming) {
    // Track slow resources (> 1 second)
    const duration = entry.responseEnd - entry.startTime;
    if (duration > 1000) {
      this.trackMetric('SlowResource', duration, {
        url: entry.name,
        type: this.getResourceType(entry.name),
      });
    }
  }

  private getResourceType(url: string): string {
    if (url.match(/\.(js|mjs)$/)) return 'script';
    if (url.match(/\.css$/)) return 'stylesheet';
    if (url.match(/\.(png|jpg|jpeg|gif|webp|svg)$/)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|otf)$/)) return 'font';
    return 'other';
  }

  /**
   * Track a custom performance metric
   */
  public trackMetric(name: string, value: number, metadata?: Record<string, any>) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      connectionType: this.getConnectionType(),
      ...metadata,
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(metric);

    // Log performance issues
    this.checkPerformanceThresholds(name, value);

    // Send to analytics (implement based on your analytics provider)
    this.sendToAnalytics(metric);
  }

  private getConnectionType(): string | undefined {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      return connection?.effectiveType || connection?.type;
    }
    return undefined;
  }

  private checkPerformanceThresholds(name: string, value: number) {
    if (name in PERFORMANCE_THRESHOLDS) {
      const rating = getPerformanceRating(name as keyof typeof PERFORMANCE_THRESHOLDS, value);
      if (rating === 'poor') {
        console.warn(`Poor ${name} performance: ${value}ms`);
      }
    }
  }

  private sendToAnalytics(metric: PerformanceMetric) {
    // Implement based on your analytics provider
    // Examples: Google Analytics, Mixpanel, custom endpoint
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Performance metric:', metric);
    }

    // Example: Send to custom analytics endpoint
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric),
      }).catch(error => {
        console.warn('Failed to send performance metric:', error);
      });
    }
  }

  /**
   * Get all tracked metrics
   */
  public getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.get(name) || [];
    }
    return Array.from(this.metrics.values()).flat();
  }

  /**
   * Get performance summary
   */
  public getSummary(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const summary: Record<string, { avg: number; min: number; max: number; count: number }> = {};

    for (const [name, metrics] of this.metrics.entries()) {
      const values = metrics.map(m => m.value);
      summary[name] = {
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length,
      };
    }

    return summary;
  }

  /**
   * Clear all metrics
   */
  public clear() {
    this.metrics.clear();
  }

  /**
   * Cleanup observers
   */
  public destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
  }
}

/**
 * Global performance tracker instance
 */
export const performanceTracker = new PerformanceTracker();

/**
 * Hook for tracking component render performance
 */
export function usePerformanceTracking(componentName: string) {
  if (typeof window === 'undefined') return;

  const startTime = performance.now();

  return {
    trackRender: () => {
      const renderTime = performance.now() - startTime;
      performanceTracker.trackMetric(`${componentName}Render`, renderTime);
    },
    trackInteraction: (interactionName: string) => {
      const interactionStart = performance.now();
      return () => {
        const interactionTime = performance.now() - interactionStart;
        performanceTracker.trackMetric(`${componentName}${interactionName}`, interactionTime);
      };
    },
  };
}

/**
 * Measure function execution time
 */
export function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  return fn().finally(() => {
    const duration = performance.now() - start;
    performanceTracker.trackMetric(name, duration);
  });
}

/**
 * Measure synchronous function execution time
 */
export function measure<T>(name: string, fn: () => T): T {
  const start = performance.now();
  try {
    return fn();
  } finally {
    const duration = performance.now() - start;
    performanceTracker.trackMetric(name, duration);
  }
}

/**
 * Initialize Web Vitals tracking
 */
export function initWebVitals() {
  if (typeof window === 'undefined') return;

  // Dynamic import to avoid SSR issues
  import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
    onCLS((metric) => {
      performanceTracker.trackMetric('CLS', metric.value);
    });

    onFID((metric) => {
      performanceTracker.trackMetric('FID', metric.value);
    });

    onFCP((metric) => {
      performanceTracker.trackMetric('FCP', metric.value);
    });

    onLCP((metric) => {
      performanceTracker.trackMetric('LCP', metric.value);
    });

    onTTFB((metric) => {
      performanceTracker.trackMetric('TTFB', metric.value);
    });
  }).catch(error => {
    console.warn('Failed to load web-vitals package:', error);
  });
}

/**
 * Performance monitoring middleware for API routes
 */
export function withPerformanceMonitoring<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
  name: string
) {
  return async (...args: T): Promise<R> => {
    return measureAsync(name, () => handler(...args));
  };
}