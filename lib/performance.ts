// Performance monitoring utilities

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  url: string;
}

interface LayoutShiftEntry extends PerformanceEntry {
  hadRecentInput: boolean;
  value: number;
}

interface FirstInputEntry extends PerformanceEntry {
  processingStart: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Record a custom metric
  recordMetric(name: string, value: number, url: string = window.location.href) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      url,
    };

    this.metrics.push(metric);

    // Keep only the last 100 metrics to prevent memory issues
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    console.log(`Performance: ${name} = ${value}ms`);
  }

  // Measure API call performance
  async measureApiCall<T>(
    name: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const endTime = performance.now();
      
      this.recordMetric(`api_${name}`, endTime - startTime);
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      this.recordMetric(`api_${name}_error`, endTime - startTime);
      throw error;
    }
  }

  // Measure component render time
  measureRenderTime(componentName: string, renderFn: () => void) {
    const startTime = performance.now();
    renderFn();
    const endTime = performance.now();
    
    this.recordMetric(`render_${componentName}`, endTime - startTime);
  }

  // Get Web Vitals
  recordWebVitals() {
    if (typeof window === 'undefined') return;

    // Record FCP (First Contentful Paint)
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.recordMetric('fcp', entry.startTime);
        }
      }
    }).observe({ entryTypes: ['paint'] });

    // Record LCP (Largest Contentful Paint)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        this.recordMetric('lcp', lastEntry.startTime);
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // Record CLS (Cumulative Layout Shift)
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        const layoutShiftEntry = entry as LayoutShiftEntry;
        if (!layoutShiftEntry.hadRecentInput) {
          this.recordMetric('cls', layoutShiftEntry.value * 1000); // Convert to ms equivalent
        }
      }
    }).observe({ entryTypes: ['layout-shift'] });

    // Record FID (First Input Delay)
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        const firstInputEntry = entry as FirstInputEntry;
        this.recordMetric('fid', firstInputEntry.processingStart - firstInputEntry.startTime);
      }
    }).observe({ entryTypes: ['first-input'] });
  }

  // Get performance summary
  getSummary(): { [key: string]: number } {
    const summary: { [key: string]: number } = {};
    
    // Group metrics by name and calculate averages
    const grouped = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = [];
      }
      acc[metric.name].push(metric.value);
      return acc;
    }, {} as { [key: string]: number[] });

    // Calculate averages
    Object.keys(grouped).forEach(name => {
      const values = grouped[name];
      summary[`${name}_avg`] = values.reduce((a, b) => a + b, 0) / values.length;
      summary[`${name}_min`] = Math.min(...values);
      summary[`${name}_max`] = Math.max(...values);
    });

    return summary;
  }

  // Clear all metrics
  clear() {
    this.metrics = [];
  }
}

// Utility functions for common performance patterns

export function withPerformanceTracking<T extends (...args: never[]) => unknown>(
  name: string,
  fn: T
): T {
  return ((...args: Parameters<T>) => {
    const monitor = PerformanceMonitor.getInstance();
    const startTime = performance.now();
    
    try {
      const result = fn(...args);
      
      // Handle async functions
      if (result instanceof Promise) {
        return result.finally(() => {
          const endTime = performance.now();
          monitor.recordMetric(name, endTime - startTime);
        });
      }
      
      const endTime = performance.now();
      monitor.recordMetric(name, endTime - startTime);
      return result;
    } catch (error) {
      const endTime = performance.now();
      monitor.recordMetric(`${name}_error`, endTime - startTime);
      throw error;
    }
  }) as T;
}

// Debounced performance logger to avoid spamming
let performanceLogTimeout: NodeJS.Timeout;

export function logPerformanceSummary() {
  clearTimeout(performanceLogTimeout);
  
  performanceLogTimeout = setTimeout(() => {
    const monitor = PerformanceMonitor.getInstance();
    const summary = monitor.getSummary();
    
    if (Object.keys(summary).length > 0) {
      console.group('📊 Performance Summary');
      console.table(summary);
      console.groupEnd();
    }
  }, 5000); // Log every 5 seconds at most
}

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  const monitor = PerformanceMonitor.getInstance();
  monitor.recordWebVitals();
}

export default PerformanceMonitor;