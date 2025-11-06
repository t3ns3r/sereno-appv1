import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';

import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
// import { schedulerService } from './services/schedulerService';
// import { activitySchedulerService } from './services/activitySchedulerService';

// Import routes
import authRoutes from './routes/auth';
// import moodRoutes from './routes/mood';
// import breathingRoutes from './routes/breathing';
// import emergencyRoutes from './routes/emergency';
// import chatRoutes from './routes/chat';
// import activityRoutes from './routes/activities';
// import fakeCallRoutes from './routes/fakeCalls';
// import serenitoRoutes from './routes/serenito';
// import dailyTrackingRoutes from './routes/dailyTracking';
// import notificationRoutes from './routes/notifications';
// import dataManagementRoutes from './routes/dataManagement';
// import educationalContentRoutes from './routes/educationalContent';
// import healthRoutes from './routes/health';
// import monitoringRoutes from './routes/monitoring';
// import { monitoringService } from './services/monitoringService';
// import { PerformanceService } from './services/performanceService';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// Performance and monitoring middleware
// app.use(PerformanceService.addResponseTime);
// app.use(PerformanceService.logSlowRequests(2000));
// app.use(monitoringService.trackRequest.bind(monitoringService));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'SERENO API'
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
// app.use('/api/v1/mood', moodRoutes);
// app.use('/api/v1/breathing', breathingRoutes);
// app.use('/api/v1/emergency', emergencyRoutes);
// app.use('/api/v1/chat', chatRoutes);
// app.use('/api/v1/activities', activityRoutes);
// app.use('/api/v1/fake-calls', fakeCallRoutes);
// app.use('/api/v1/serenito', serenitoRoutes);
// app.use('/api/v1/daily-tracking', dailyTrackingRoutes);
// app.use('/api/v1/notifications', notificationRoutes);
// app.use('/api/v1/data-management', dataManagementRoutes);
// app.use('/api/v1/educational-content', educationalContentRoutes);

// Health check routes (no /api/v1 prefix for simplicity)
// app.use('/health', healthRoutes);

// Monitoring routes (admin only)
// app.use('/api/v1/monitoring', monitoringRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.id}`);

  // Handle user authentication for socket
  socket.on('authenticate', (data: { userId: string, token: string }) => {
    // In production, verify the JWT token here
    socket.join(`user-${data.userId}`);
    logger.info(`User ${data.userId} authenticated on socket ${socket.id}`);
  });

  // Handle joining chat channels
  socket.on('join-channel', (channelId: string) => {
    socket.join(`channel-${channelId}`);
    logger.info(`Socket ${socket.id} joined channel ${channelId}`);
  });

  socket.on('leave-channel', (channelId: string) => {
    socket.leave(`channel-${channelId}`);
    logger.info(`Socket ${socket.id} left channel ${channelId}`);
  });

  // Handle joining emergency channels
  socket.on('join-emergency-channel', (data: { channelId: string, alertId: string, userId: string }) => {
    socket.join(`emergency-${data.alertId}`);
    socket.join(`channel-${data.channelId}`);
    socket.join(`user-${data.userId}`);
    logger.info(`Socket ${socket.id} joined emergency channel ${data.channelId} for alert ${data.alertId}`);
    
    // Notify other participants that someone joined
    socket.to(`channel-${data.channelId}`).emit('participant-joined', {
      userId: data.userId,
      channelId: data.channelId,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('leave-emergency-channel', (data: { channelId: string, alertId: string, userId: string }) => {
    socket.leave(`emergency-${data.alertId}`);
    socket.leave(`channel-${data.channelId}`);
    logger.info(`Socket ${socket.id} left emergency channel ${data.channelId}`);
    
    // Notify other participants that someone left
    socket.to(`channel-${data.channelId}`).emit('participant-left', {
      userId: data.userId,
      channelId: data.channelId,
      timestamp: new Date().toISOString()
    });
  });

  // Handle typing indicators
  socket.on('typing-start', (data: { channelId: string, userId: string }) => {
    socket.to(`channel-${data.channelId}`).emit('user-typing', {
      userId: data.userId,
      channelId: data.channelId
    });
  });

  socket.on('typing-stop', (data: { channelId: string, userId: string }) => {
    socket.to(`channel-${data.channelId}`).emit('user-stopped-typing', {
      userId: data.userId,
      channelId: data.channelId
    });
  });

  // Handle SERENO availability updates
  socket.on('sereno-availability-update', (data: { serenoId: string, isAvailable: boolean, location?: any }) => {
    // Join SERENO to availability channel
    if (data.isAvailable) {
      socket.join('available-serenos');
    } else {
      socket.leave('available-serenos');
    }
    
    // Broadcast to emergency management system
    socket.broadcast.emit('sereno-availability-changed', data);
    logger.info(`SERENO ${data.serenoId} availability updated: ${data.isAvailable}`);
  });

  // Handle emergency chat events
  socket.on('emergency-message-sent', (data: { channelId: string, alertId: string, messageId: string }) => {
    // Broadcast to emergency monitoring systems
    socket.to(`emergency-${data.alertId}`).emit('emergency-activity', {
      type: 'message',
      channelId: data.channelId,
      alertId: data.alertId,
      messageId: data.messageId,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('emergency-escalation-request', (data: { alertId: string, escalationType: string, requestedBy: string }) => {
    // Notify all SERENOS in the emergency
    socket.to(`emergency-${data.alertId}`).emit('escalation-requested', {
      alertId: data.alertId,
      escalationType: data.escalationType,
      requestedBy: data.requestedBy,
      timestamp: new Date().toISOString()
    });
    
    logger.info(`Emergency escalation (${data.escalationType}) requested for alert ${data.alertId}`);
  });

  socket.on('sereno-status-update', (data: { serenoId: string, status: 'responding' | 'busy' | 'available', alertId?: string }) => {
    // Update SERENO status in real-time
    socket.broadcast.emit('sereno-status-changed', data);
    
    if (data.alertId) {
      socket.to(`emergency-${data.alertId}`).emit('sereno-status-update', data);
    }
    
    logger.info(`SERENO ${data.serenoId} status updated to ${data.status}`);
  });

  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.id}`);
  });
});

// Make io available to routes
app.set('io', io);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
      timestamp: new Date().toISOString()
    }
  });
});

async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Database connected successfully');

    // Connect to Redis
    await connectRedis();
    logger.info('Redis connected successfully');

    // Initialize scheduled tasks
    // schedulerService.initializeScheduledTasks();
    logger.info('Scheduled tasks initialized (disabled for now)');

    // Start activity scheduler
    // activitySchedulerService.startScheduler();
    logger.info('Activity scheduler started (disabled for now)');

    // Start server
    server.listen(PORT, () => {
      logger.info(`SERENO API server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  // schedulerService.stopAllTasks();
  // activitySchedulerService.stopScheduler();
  server.close(() => {
    logger.info('Process terminated');
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  // schedulerService.stopAllTasks();
  server.close(() => {
    logger.info('Process terminated');
  });
});

startServer();

export { app, io };