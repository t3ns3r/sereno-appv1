import { Router, Request, Response } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { monitoringService } from '../services/monitoringService';
import { logger } from '../utils/logger';

const router = Router();

// Get system health (admin only)
router.get('/health', 
  authenticateToken, 
  requireRole(['ADMIN']), 
  async (req: Request, res: Response) => {
    try {
      const health = monitoringService.getSystemHealth();
      res.json({
        success: true,
        data: health
      });
    } catch (error) {
      logger.error('Error getting system health:', error);
      res.status(500).json({
        error: {
          code: 'MONITORING_ERROR',
          message: 'Failed to get system health',
          timestamp: new Date().toISOString()
        }
      });
    }
  }
);

// Get performance metrics (admin only)
router.get('/performance', 
  authenticateToken, 
  requireRole(['ADMIN']), 
  async (req: Request, res: Response) => {
    try {
      const metrics = monitoringService.getPerformanceMetrics();
      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      logger.error('Error getting performance metrics:', error);
      res.status(500).json({
        error: {
          code: 'MONITORING_ERROR',
          message: 'Failed to get performance metrics',
          timestamp: new Date().toISOString()
        }
      });
    }
  }
);

// Get error metrics (admin only)
router.get('/errors', 
  authenticateToken, 
  requireRole(['ADMIN']), 
  async (req: Request, res: Response) => {
    try {
      const errors = monitoringService.getErrorMetrics();
      res.json({
        success: true,
        data: errors
      });
    } catch (error) {
      logger.error('Error getting error metrics:', error);
      res.status(500).json({
        error: {
          code: 'MONITORING_ERROR',
          message: 'Failed to get error metrics',
          timestamp: new Date().toISOString()
        }
      });
    }
  }
);

// Get alerts (admin only)
router.get('/alerts', 
  authenticateToken, 
  requireRole(['ADMIN']), 
  async (req: Request, res: Response) => {
    try {
      const alerts = monitoringService.getAlerts();
      res.json({
        success: true,
        data: alerts
      });
    } catch (error) {
      logger.error('Error getting alerts:', error);
      res.status(500).json({
        error: {
          code: 'MONITORING_ERROR',
          message: 'Failed to get alerts',
          timestamp: new Date().toISOString()
        }
      });
    }
  }
);

// Export metrics for external systems (admin only)
router.get('/export', 
  authenticateToken, 
  requireRole(['ADMIN']), 
  async (req: Request, res: Response) => {
    try {
      const metrics = monitoringService.exportMetrics();
      
      // Set headers for file download
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="sereno-metrics-${Date.now()}.json"`);
      
      res.json(metrics);
    } catch (error) {
      logger.error('Error exporting metrics:', error);
      res.status(500).json({
        error: {
          code: 'MONITORING_ERROR',
          message: 'Failed to export metrics',
          timestamp: new Date().toISOString()
        }
      });
    }
  }
);

// Reset metrics (admin only, for testing)
router.post('/reset', 
  authenticateToken, 
  requireRole(['ADMIN']), 
  async (req: Request, res: Response) => {
    try {
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Cannot reset metrics in production',
            timestamp: new Date().toISOString()
          }
        });
      }
      
      monitoringService.resetMetrics();
      
      res.json({
        success: true,
        message: 'Metrics reset successfully'
      });
    } catch (error) {
      logger.error('Error resetting metrics:', error);
      res.status(500).json({
        error: {
          code: 'MONITORING_ERROR',
          message: 'Failed to reset metrics',
          timestamp: new Date().toISOString()
        }
      });
    }
  }
);

export default router;