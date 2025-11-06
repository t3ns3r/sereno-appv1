import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class PerformanceService {
  /**
   * Middleware to add performance headers for senior-friendly optimization
   */
  static addPerformanceHeaders(req: Request, res: Response, next: NextFunction) {
    // Add headers to optimize for slower connections and older devices
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Preload critical resources
    res.setHeader('Link', [
      '</api/v1/auth/profile>; rel=prefetch',
      '</api/v1/mood>; rel=prefetch',
      '</api/v1/emergency/contacts>; rel=prefetch'
    ].join(', '));

    next();
  }

  /**
   * Middleware to log slow requests for optimization
   */
  static logSlowRequests(threshold: number = 1000) {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        
        if (duration > threshold) {
          logger.warn('Slow request detected', {
            method: req.method,
            url: req.url,
            duration: `${duration}ms`,
            userAgent: req.get('User-Agent'),
            ip: req.ip
          });
        }
      });
      
      next();
    };
  }

  /**
   * Optimize response for senior users
   */
  static optimizeForSeniors(data: any): any {
    if (Array.isArray(data)) {
      // Limit array responses to prevent overwhelming seniors
      return data.slice(0, 20).map(item => this.simplifyObject(item));
    }
    
    if (typeof data === 'object' && data !== null) {
      return this.simplifyObject(data);
    }
    
    return data;
  }

  /**
   * Simplify object structure for better comprehension
   */
  private static simplifyObject(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    
    const simplified: any = {};
    
    // Keep only essential fields for senior users
    const essentialFields = [
      'id', 'title', 'description', 'name', 'date', 'time', 'location',
      'category', 'status', 'message', 'type', 'createdAt', 'eventDate',
      'firstName', 'lastName', 'username', 'email', 'country'
    ];
    
    for (const [key, value] of Object.entries(obj)) {
      if (essentialFields.includes(key) || key.startsWith('is') || key.startsWith('has')) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          simplified[key] = this.simplifyObject(value);
        } else if (Array.isArray(value)) {
          simplified[key] = value.slice(0, 10).map(item => 
            typeof item === 'object' ? this.simplifyObject(item) : item
          );
        } else {
          simplified[key] = value;
        }
      }
    }
    
    return simplified;
  }

  /**
   * Add response time header
   */
  static addResponseTime(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      res.setHeader('X-Response-Time', `${duration}ms`);
    });
    
    next();
  }

  /**
   * Compress large responses for better performance
   */
  static shouldCompress(req: Request, res: Response): boolean {
    // Don't compress if client doesn't support it
    if (!req.headers['accept-encoding']?.includes('gzip')) {
      return false;
    }
    
    // Always compress for senior users to improve load times
    return true;
  }

  /**
   * Get performance metrics for monitoring
   */
  static getPerformanceMetrics() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      memory: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024), // MB
        rss: Math.round(memoryUsage.rss / 1024 / 1024) // MB
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: process.platform
    };
  }

  /**
   * Optimize database queries for senior-friendly responses
   */
  static optimizeQuery(query: any): any {
    // Add default limits to prevent overwhelming responses
    if (!query.take && !query.limit) {
      query.take = 20;
    }
    
    // Ensure we're not fetching too much data
    if (query.take > 50) {
      query.take = 50;
    }
    
    // Add default ordering for consistency
    if (!query.orderBy) {
      query.orderBy = { createdAt: 'desc' };
    }
    
    return query;
  }

  /**
   * Format dates for senior-friendly display
   */
  static formatDateForSeniors(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return dateObj.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Simplify error messages for seniors
   */
  static simplifyErrorMessage(error: string): string {
    const errorMappings: { [key: string]: string } = {
      'VALIDATION_ERROR': 'Por favor, revisa la información ingresada',
      'AUTHENTICATION_ERROR': 'Necesitas iniciar sesión nuevamente',
      'AUTHORIZATION_ERROR': 'No tienes permisos para esta acción',
      'NOT_FOUND': 'No se encontró la información solicitada',
      'SERVER_ERROR': 'Ocurrió un problema. Intenta nuevamente en unos minutos',
      'NETWORK_ERROR': 'Problema de conexión. Verifica tu internet',
      'TIMEOUT_ERROR': 'La operación tardó demasiado. Intenta nuevamente'
    };
    
    for (const [key, message] of Object.entries(errorMappings)) {
      if (error.includes(key)) {
        return message;
      }
    }
    
    return 'Ocurrió un problema inesperado. Contacta al soporte si persiste.';
  }
}

export const performanceService = new PerformanceService();