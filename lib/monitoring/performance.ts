/**
 * Performance monitoring utilities
 */

// Performance metrics collection
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start timing an operation
   */
  startTimer(operation: string): () => void {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(operation, duration);
    };
  }

  /**
   * Record a performance metric
   */
  recordMetric(operation: string, duration: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    
    const metrics = this.metrics.get(operation)!;
    metrics.push(duration);
    
    // Keep only last 100 measurements
    if (metrics.length > 100) {
      metrics.shift();
    }
  }

  /**
   * Get performance statistics for an operation
   */
  getStats(operation: string): {
    count: number;
    avg: number;
    min: number;
    max: number;
    p95: number;
  } | null {
    const metrics = this.metrics.get(operation);
    if (!metrics || metrics.length === 0) {
      return null;
    }

    const sorted = [...metrics].sort((a, b) => a - b);
    const count = sorted.length;
    const sum = sorted.reduce((a, b) => a + b, 0);
    
    return {
      count,
      avg: sum / count,
      min: sorted[0],
      max: sorted[count - 1],
      p95: sorted[Math.floor(count * 0.95)],
    };
  }

  /**
   * Get all performance metrics
   */
  getAllStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [operation] of this.metrics) {
      stats[operation] = this.getStats(operation);
    }
    
    return stats;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
  }
}

// Decorator for timing functions
export function timed(_operation: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const monitor = PerformanceMonitor.getInstance();
      const endTimer = monitor.startTimer(`${target.constructor.name}.${propertyName}`);
      
      try {
        const result = await method.apply(this, args);
        return result;
      } finally {
        endTimer();
      }
    };
  };
}

// Web Vitals tracking (client-side)
export function trackWebVitals() {
  if (typeof window === 'undefined') return;

  import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
    onCLS((m) => console.debug('[vitals] CLS', m.value));
    onFID((m) => console.debug('[vitals] FID', m.value));
    onFCP((m) => console.debug('[vitals] FCP', m.value));
    onLCP((m) => console.debug('[vitals] LCP', m.value));
    onTTFB((m) => console.debug('[vitals] TTFB', m.value));
  }).catch(() => {});
}

// Database query performance wrapper
export async function withQueryTiming<T>(
  operation: string,
  query: () => Promise<T>
): Promise<T> {
  const monitor = PerformanceMonitor.getInstance();
  const endTimer = monitor.startTimer(`db.${operation}`);
  
  try {
    return await query();
  } finally {
    endTimer();
  }
}

// API endpoint performance monitoring
export function withPerformanceMonitoring(
  handler: (req: Request, context?: any) => Promise<Response>
) {
  return async (req: Request, context?: any): Promise<Response> => {
    const monitor = PerformanceMonitor.getInstance();
    const url = new URL(req.url);
    const operation = `api.${req.method}.${url.pathname}`;
    const endTimer = monitor.startTimer(operation);
    
    try {
      return await handler(req, context);
    } finally {
      endTimer();
    }
  };
}