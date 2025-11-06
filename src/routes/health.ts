import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { logger } from '../utils/logger';

const router = Router();

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: 'connected' | 'disconnected' | 'error';
    redis: 'connected' | 'disconnected' | 'error';
    scheduler: 'running' | 'stopped' | 'error';
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  environment: string;
}

// Basic health check
router.get('/', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    
    // Check database connection
    let databaseStatus: 'connected' | 'disconnected' | 'error' = 'disconnected';
    try {
      await prisma.$queryRaw`SELECT 1`;
      databaseStatus = 'connected';
    } catch (error) {
      logger.error('Database health check failed:', error);
      databaseStatus = 'error';
    }

    // Check Redis connection
    let redisStatus: 'connected' | 'disconnected' | 'error' = 'disconnected';
    try {
      await redis.ping();
      redisStatus = 'connected';
    } catch (error) {
      logger.error('Redis health check failed:', error);
      redisStatus = 'error';
    }

    // Check scheduler status
    let schedulerStatus: 'running' | 'stopped' | 'error' = 'stopped';
    try {
      const { schedulerService } = await import('../services/schedulerService');
      const { activitySchedulerService } = await import('../services/activitySchedulerService');
      
      const mainSchedulerStatus = schedulerService.getStatus();
      const activitySchedulerStatus = activitySchedulerService.getStatus();
      
      if (mainSchedulerStatus.isRunning && activitySchedulerStatus.isRunning) {
        schedulerStatus = 'running';
      } else {
        schedulerStatus = 'stopped';
      }
    } catch (error) {
      logger.error('Scheduler health check failed:', error);
      schedulerStatus = 'error';
    }

    // Memory usage
    const memoryUsage = process.memoryUsage();
    const totalMemory = memoryUsage.heapTotal;
    const usedMemory = memoryUsage.heapUsed;
    const memoryPercentage = (usedMemory / totalMemory) * 100;

    // Determine overall health
    const isHealthy = databaseStatus === 'connected' && 
                     redisStatus === 'connected' && 
                     schedulerStatus === 'running';

    const healthStatus: HealthStatus = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      services: {
        database: databaseStatus,
        redis: redisStatus,
        scheduler: schedulerStatus
      },
      memory: {
        used: Math.round(usedMemory / 1024 / 1024), // MB
        total: Math.round(totalMemory / 1024 / 1024), // MB
        percentage: Math.round(memoryPercentage)
      },
      environment: process.env.NODE_ENV || 'development'
    };

    const responseTime = Date.now() - startTime;
    
    // Set appropriate status code
    const statusCode = isHealthy ? 200 : 503;
    
    res.status(statusCode).json({
      ...healthStatus,
      responseTime: `${responseTime}ms`
    });

  } catch (error) {
    logger.error('Health check failed:', error);
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      environment: process.env.NODE_ENV || 'development'
    });
  }
});

// Detailed health check for monitoring systems
router.get('/detailed', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    
    // Database detailed check
    const databaseChecks = {
      connection: false,
      userCount: 0,
      activityCount: 0,
      lastActivity: null as Date | null
    };

    try {
      await prisma.$queryRaw`SELECT 1`;
      databaseChecks.connection = true;
      
      databaseChecks.userCount = await prisma.user.count();
      databaseChecks.activityCount = await prisma.activity.count();
      
      const lastActivity = await prisma.activity.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true }
      });
      databaseChecks.lastActivity = lastActivity?.createdAt || null;
    } catch (error) {
      logger.error('Detailed database check failed:', error);
    }

    // Redis detailed check
    const redisChecks = {
      connection: false,
      keyCount: 0,
      memory: '0B'
    };

    try {
      await redis.ping();
      redisChecks.connection = true;
      
      const info = await redis.info('keyspace');
      const keyspaceMatch = info.match(/keys=(\d+)/);
      redisChecks.keyCount = keyspaceMatch ? parseInt(keyspaceMatch[1]) : 0;
      
      const memoryInfo = await redis.info('memory');
      const memoryMatch = memoryInfo.match(/used_memory_human:(.+)/);
      redisChecks.memory = memoryMatch ? memoryMatch[1].trim() : '0B';
    } catch (error) {
      logger.error('Detailed Redis check failed:', error);
    }

    // System metrics
    const systemMetrics = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      cpuUsage: process.cpuUsage(),
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    };

    const responseTime = Date.now() - startTime;

    res.json({
      status: 'detailed_health_check',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      database: databaseChecks,
      redis: redisChecks,
      system: systemMetrics,
      environment: process.env.NODE_ENV || 'development'
    });

  } catch (error) {
    logger.error('Detailed health check failed:', error);
    
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Detailed health check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Readiness probe (for Kubernetes)
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check if all critical services are ready
    await prisma.$queryRaw`SELECT 1`;
    await redis.ping();
    
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Service not ready'
    });
  }
});

// Liveness probe (for Kubernetes)
router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export default router;