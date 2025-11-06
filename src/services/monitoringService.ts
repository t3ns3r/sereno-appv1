import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { performanceService } from './performanceService';

interface ErrorMetrics {
  count: number;
  lastOccurrence: Date;
  errorType: string;
  endpoint: string;
}

interface PerformanceMetrics {
  averageResponseTime: number;
  slowestEndpoints: Array<{
    endpoint: string;
    averageTime: number;
    count: number;
  }>;
  requestCount: number;
  errorRate: number;
}

export class MonitoringService {
  private errorMetrics: Map<string, ErrorMetrics> = new Map();
  private performanceMetrics: Map<string, number[]> = new Map();
  private requestCount = 0;
  private errorCount = 0;

  /**
   * Middleware to track request metrics
   */
  trackRequest(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const endpoint = `${req.method} ${req.route?.path || req.path}`;
    
    this.requestCount++;
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      // Track performance metrics
      if (!this.performanceMetrics.has(endpoint)) {
        this.performanceMetrics.set(endpoint, []);
      }
      
      const times = this.performanceMetrics.get(endpoint)!;
      times.push(duration);
      
      // Keep only last 100 measurements
      if (times.length > 100) {
        times.shift();
      }
      
      // Log slow requests
      if (duration > 2000) {
        logger.warn('Slow request detected', {
          endpoint,
          duration: `${duration}ms`,
          method: req.method,
          url: req.url,
          userAgent: req.get('User-Agent'),
          ip: req.ip
        });
      }
      
      // Track errors
      if (res.statusCode >= 400) {
        this.trackError(endpoint, res.statusCode.toString(), req);
      }
    });
    
    next();
  }

  /**
   * Track application errors
   */
  trackError(endpoint: string, errorType: string, req?: Request) {
    this.errorCount++;
    
    const key = `${endpoint}:${errorType}`;
    const existing = this.errorMetrics.get(key);
    
    if (existing) {
      existing.count++;
      existing.lastOccurrence = new Date();
    } else {
      this.errorMetrics.set(key, {
        count: 1,
        lastOccurrence: new Date(),
        errorType,
        endpoint
      });
    }
    
    // Log critical errors
    if (errorType.startsWith('5')) {
      logger.error('Server error tracked', {
        endpoint,
        errorType,
        userAgent: req?.get('User-Agent'),
        ip: req?.ip,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    const slowestEndpoints: Array<{
      endpoint: string;
      averageTime: number;
      count: number;
    }> = [];
    
    let totalTime = 0;
    let totalRequests = 0;
    
    for (const [endpoint, times] of this.performanceMetrics.entries()) {
      const average = times.reduce((sum, time) => sum + time, 0) / times.length;
      const count = times.length;
      
      totalTime += times.reduce((sum, time) => sum + time, 0);
      totalRequests += count;
      
      slowestEndpoints.push({
        endpoint,
        averageTime: Math.round(average),
        count
      });
    }
    
    // Sort by average time and take top 10
    slowestEndpoints.sort((a, b) => b.averageTime - a.averageTime);
    
    return {
      averageResponseTime: totalRequests > 0 ? Math.round(totalTime / totalRequests) : 0,
      slowestEndpoints: slowestEndpoints.slice(0, 10),
      requestCount: this.requestCount,
      errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0
    };
  }

  /**
   * Get error metrics
   */
  getErrorMetrics(): ErrorMetrics[] {
    return Array.from(this.errorMetrics.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }

  /**
   * Get system health metrics
   */
  getSystemHealth() {
    const performance = performanceService.getPerformanceMetrics();
    const errors = this.getErrorMetrics();
    const performanceStats = this.getPerformanceMetrics();
    
    // Determine health status
    let healthStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (performanceStats.errorRate > 10 || performanceStats.averageResponseTime > 3000) {
      healthStatus = 'warning';
    }
    
    if (performanceStats.errorRate > 25 || performanceStats.averageResponseTime > 5000) {
      healthStatus = 'critical';
    }
    
    return {
      status: healthStatus,
      timestamp: new Date().toISOString(),
      performance,
      errors: errors.slice(0, 5),
      metrics: performanceStats,
      recommendations: this.getHealthRecommendations(performanceStats, errors)
    };
  }

  /**
   * Get health recommendations based on metrics
   */
  private getHealthRecommendations(
    performance: PerformanceMetrics, 
    errors: ErrorMetrics[]
  ): string[] {
    const recommendations: string[] = [];
    
    if (performance.averageResponseTime > 2000) {
      recommendations.push('Consider optimizing slow endpoints or adding caching');
    }
    
    if (performance.errorRate > 5) {
      recommendations.push('High error rate detected - investigate error patterns');
    }
    
    if (errors.some(e => e.errorType.startsWith('5') && e.count > 10)) {
      recommendations.push('Server errors detected - check application logs');
    }
    
    if (performance.slowestEndpoints.some(e => e.averageTime > 3000)) {
      recommendations.push('Some endpoints are very slow - consider database optimization');
    }
    
    return recommendations;
  }

  /**
   * Reset metrics (useful for testing or periodic cleanup)
   */
  resetMetrics() {
    this.errorMetrics.clear();
    this.performanceMetrics.clear();
    this.requestCount = 0;
    this.errorCount = 0;
    
    logger.info('Monitoring metrics reset');
  }

  /**
   * Export metrics for external monitoring systems
   */
  exportMetrics() {
    return {
      timestamp: new Date().toISOString(),
      system: performanceService.getPerformanceMetrics(),
      application: {
        requests: this.requestCount,
        errors: this.errorCount,
        errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0
      },
      performance: this.getPerformanceMetrics(),
      topErrors: this.getErrorMetrics().slice(0, 10)
    };
  }

  /**
   * Check if system needs attention
   */
  needsAttention(): boolean {
    const health = this.getSystemHealth();
    return health.status === 'warning' || health.status === 'critical';
  }

  /**
   * Get alerts that should be sent
   */
  getAlerts(): Array<{
    level: 'warning' | 'critical';
    message: string;
    timestamp: Date;
  }> {
    const alerts: Array<{
      level: 'warning' | 'critical';
      message: string;
      timestamp: Date;
    }> = [];
    
    const performance = this.getPerformanceMetrics();
    const errors = this.getErrorMetrics();
    
    // Performance alerts
    if (performance.averageResponseTime > 5000) {
      alerts.push({
        level: 'critical',
        message: `Average response time is ${performance.averageResponseTime}ms`,
        timestamp: new Date()
      });
    } else if (performance.averageResponseTime > 3000) {
      alerts.push({
        level: 'warning',
        message: `Average response time is ${performance.averageResponseTime}ms`,
        timestamp: new Date()
      });
    }
    
    // Error rate alerts
    if (performance.errorRate > 25) {
      alerts.push({
        level: 'critical',
        message: `Error rate is ${performance.errorRate.toFixed(1)}%`,
        timestamp: new Date()
      });
    } else if (performance.errorRate > 10) {
      alerts.push({
        level: 'warning',
        message: `Error rate is ${performance.errorRate.toFixed(1)}%`,
        timestamp: new Date()
      });
    }
    
    // Specific error alerts
    const criticalErrors = errors.filter(e => 
      e.errorType.startsWith('5') && e.count > 20
    );
    
    for (const error of criticalErrors) {
      alerts.push({
        level: 'critical',
        message: `High frequency of ${error.errorType} errors on ${error.endpoint}`,
        timestamp: error.lastOccurrence
      });
    }
    
    return alerts;
  }
}

export const monitoringService = new MonitoringService();