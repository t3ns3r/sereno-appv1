import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
import { notificationService } from '../services/notificationService';

const router = express.Router();

// Get notification preferences
router.get('/preferences', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
          timestamp: new Date().toISOString()
        }
      });
    }

    const preferences = await notificationService.getNotificationPreferences(userId);
    
    res.json({
      success: true,
      data: preferences,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting notification preferences:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get notification preferences',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Update notification preferences
router.put('/preferences', 
  authenticateToken,
  [
    body('emergencyAlerts').optional().isBoolean(),
    body('dailyReminders').optional().isBoolean(),
    body('activityUpdates').optional().isBoolean(),
    body('serenoResponses').optional().isBoolean(),
    body('pushEnabled').optional().isBoolean(),
    body('emailEnabled').optional().isBoolean()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array(),
            timestamp: new Date().toISOString()
          }
        });
      }

      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
            timestamp: new Date().toISOString()
          }
        });
      }

      const preferences = await notificationService.updateNotificationPreferences(
        userId,
        req.body
      );

      res.json({
        success: true,
        data: preferences,
        message: 'Notification preferences updated successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error updating notification preferences:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update notification preferences',
          timestamp: new Date().toISOString()
        }
      });
    }
  }
);

// Subscribe to push notifications
router.post('/subscribe',
  authenticateToken,
  [
    body('endpoint').notEmpty().withMessage('Endpoint is required'),
    body('keys.p256dh').notEmpty().withMessage('p256dh key is required'),
    body('keys.auth').notEmpty().withMessage('auth key is required'),
    body('fcmToken').optional().isString(),
    body('deviceInfo.userAgent').optional().isString(),
    body('deviceInfo.platform').optional().isString()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid subscription data',
            details: errors.array(),
            timestamp: new Date().toISOString()
          }
        });
      }

      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
            timestamp: new Date().toISOString()
          }
        });
      }

      const { endpoint, keys, fcmToken, deviceInfo } = req.body;

      await notificationService.subscribeToPushNotifications(
        userId,
        { endpoint, keys, fcmToken },
        deviceInfo
      );

      res.status(201).json({
        success: true,
        message: 'Successfully subscribed to push notifications',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to subscribe to push notifications',
          timestamp: new Date().toISOString()
        }
      });
    }
  }
);

// Unsubscribe from push notifications
router.delete('/unsubscribe',
  authenticateToken,
  [
    body('endpoint').notEmpty().withMessage('Endpoint is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid unsubscribe data',
            details: errors.array(),
            timestamp: new Date().toISOString()
          }
        });
      }

      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
            timestamp: new Date().toISOString()
          }
        });
      }

      const { endpoint } = req.body;

      await notificationService.unsubscribeFromPushNotifications(userId, endpoint);

      res.json({
        success: true,
        message: 'Successfully unsubscribed from push notifications',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to unsubscribe from push notifications',
          timestamp: new Date().toISOString()
        }
      });
    }
  }
);

// Test notification endpoint (for development/testing)
router.post('/test',
  authenticateToken,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('body').notEmpty().withMessage('Body is required'),
    body('type').optional().isString()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid notification data',
            details: errors.array(),
            timestamp: new Date().toISOString()
          }
        });
      }

      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
            timestamp: new Date().toISOString()
          }
        });
      }

      const { title, body, type = 'test' } = req.body;

      await notificationService.sendPushNotification(userId, {
        title,
        body,
        data: { type, action: 'test' },
        icon: '/icons/serenito-icon-192.png'
      });

      res.json({
        success: true,
        message: 'Test notification sent successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error sending test notification:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to send test notification',
          timestamp: new Date().toISOString()
        }
      });
    }
  }
);

// Get VAPID public key for client-side subscription
router.get('/vapid-key', (req, res) => {
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  
  if (!vapidPublicKey) {
    return res.status(500).json({
      error: {
        code: 'CONFIGURATION_ERROR',
        message: 'VAPID public key not configured',
        timestamp: new Date().toISOString()
      }
    });
  }

  res.json({
    success: true,
    data: { publicKey: vapidPublicKey },
    timestamp: new Date().toISOString()
  });
});

export default router;