import { PrismaClient } from '@prisma/client';
import { messaging } from '../config/firebase';
import webpush from 'web-push';

const prisma = new PrismaClient();

// Configure web-push with VAPID keys (only if valid keys are provided)
if (process.env.VAPID_PUBLIC_KEY && 
    process.env.VAPID_PRIVATE_KEY && 
    process.env.VAPID_PUBLIC_KEY !== 'your-vapid-public-key' &&
    process.env.VAPID_PRIVATE_KEY !== 'your-vapid-private-key') {
  try {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:support@sereno.app',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    console.log('VAPID details configured successfully');
  } catch (error) {
    console.warn('Failed to configure VAPID details:', error);
  }
} else {
  console.warn('VAPID keys not configured - push notifications will be disabled');
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  icon?: string;
  badge?: string;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export interface NotificationPreferences {
  emergencyAlerts: boolean;
  dailyReminders: boolean;
  activityUpdates: boolean;
  serenoResponses: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
}

export class NotificationService {
  async sendPushNotification(userId: string, payload: PushNotificationPayload): Promise<void> {
    try {
      // Get user's notification preferences and push subscription
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          notificationPreferences: true,
          pushSubscriptions: true
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Check if user has push notifications enabled
      const preferences = user.notificationPreferences;
      if (!preferences?.pushEnabled) {
        console.log(`Push notifications disabled for user ${userId}`);
        return;
      }

      // Check specific notification type preferences
      const notificationType = this.getNotificationType(payload.data?.type);
      if (!this.isNotificationTypeEnabled(preferences, notificationType)) {
        console.log(`Notification type ${notificationType} disabled for user ${userId}`);
        return;
      }

      // Send to all user's devices
      const subscriptions = user.pushSubscriptions;
      if (subscriptions.length === 0) {
        console.log(`No push subscriptions found for user ${userId}`);
        return;
      }

      const notificationPromises = subscriptions.map(async (subscription) => {
        try {
          // In a real implementation, you would use a service like Firebase Cloud Messaging
          // or Web Push Protocol to send the actual push notification
          await this.sendWebPushNotification(subscription.endpoint, subscription.keys, payload);
          
          // Log successful notification
          await this.logNotification(userId, payload, 'SENT');
          
        } catch (error) {
          console.error(`Failed to send push notification to subscription ${subscription.id}:`, error);
          
          // If subscription is invalid, remove it
          if (this.isInvalidSubscriptionError(error)) {
            await prisma.pushSubscription.delete({
              where: { id: subscription.id }
            });
          }
          
          await this.logNotification(userId, payload, 'FAILED', (error as Error).message);
        }
      });

      await Promise.allSettled(notificationPromises);

    } catch (error) {
      console.error('Error sending push notification:', error);
      await this.logNotification(userId, payload, 'ERROR', (error as Error).message);
    }
  }

  async subscribeToPushNotifications(
    userId: string, 
    subscription: {
      endpoint: string;
      keys: {
        p256dh: string;
        auth: string;
      };
      fcmToken?: string;
    },
    deviceInfo?: {
      userAgent: string;
      platform: string;
    }
  ): Promise<void> {
    try {
      // Check if subscription already exists
      const existing = await prisma.pushSubscription.findFirst({
        where: {
          userId,
          endpoint: subscription.endpoint
        }
      });

      if (existing) {
        // Update existing subscription
        await prisma.pushSubscription.update({
          where: { id: existing.id },
          data: {
            keys: JSON.stringify({
              ...subscription.keys,
              fcmToken: subscription.fcmToken
            }),
            deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : null,
            updatedAt: new Date()
          }
        });
      } else {
        // Create new subscription
        await prisma.pushSubscription.create({
          data: {
            userId,
            endpoint: subscription.endpoint,
            keys: JSON.stringify({
              ...subscription.keys,
              fcmToken: subscription.fcmToken
            }),
            deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : null
          }
        });
      }

      console.log(`Push subscription registered for user ${userId}`);

    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      throw new Error('Failed to register push subscription');
    }
  }

  async unsubscribeFromPushNotifications(userId: string, endpoint: string): Promise<void> {
    try {
      await prisma.pushSubscription.deleteMany({
        where: {
          userId,
          endpoint
        }
      });

      console.log(`Push subscription removed for user ${userId}`);

    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      throw new Error('Failed to remove push subscription');
    }
  }

  async updateNotificationPreferences(
    userId: string, 
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    try {
      const updated = await prisma.notificationPreferences.upsert({
        where: { userId },
        update: preferences,
        create: {
          userId,
          emergencyAlerts: preferences.emergencyAlerts ?? true,
          dailyReminders: preferences.dailyReminders ?? true,
          activityUpdates: preferences.activityUpdates ?? true,
          serenoResponses: preferences.serenoResponses ?? true,
          pushEnabled: preferences.pushEnabled ?? true,
          emailEnabled: preferences.emailEnabled ?? false
        }
      });

      return {
        emergencyAlerts: updated.emergencyAlerts,
        dailyReminders: updated.dailyReminders,
        activityUpdates: updated.activityUpdates,
        serenoResponses: updated.serenoResponses,
        pushEnabled: updated.pushEnabled,
        emailEnabled: updated.emailEnabled
      };

    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw new Error('Failed to update notification preferences');
    }
  }

  async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const preferences = await prisma.notificationPreferences.findUnique({
        where: { userId }
      });

      if (!preferences) {
        // Return default preferences
        return {
          emergencyAlerts: true,
          dailyReminders: true,
          activityUpdates: true,
          serenoResponses: true,
          pushEnabled: true,
          emailEnabled: false
        };
      }

      return {
        emergencyAlerts: preferences.emergencyAlerts,
        dailyReminders: preferences.dailyReminders,
        activityUpdates: preferences.activityUpdates,
        serenoResponses: preferences.serenoResponses,
        pushEnabled: preferences.pushEnabled,
        emailEnabled: preferences.emailEnabled
      };

    } catch (error) {
      console.error('Error getting notification preferences:', error);
      throw new Error('Failed to get notification preferences');
    }
  }

  async sendDailyReminder(userId: string): Promise<void> {
    const payload: PushNotificationPayload = {
      title: '🌟 SERENITO te recuerda',
      body: '¿Cómo te sientes hoy? Registra tu estado de ánimo y bienestar',
      data: {
        type: 'daily_reminder',
        action: 'mood_assessment'
      },
      icon: '/icons/serenito-icon-192.png',
      actions: [
        {
          action: 'open_mood',
          title: 'Registrar Estado'
        },
        {
          action: 'open_tracking',
          title: 'Seguimiento Diario'
        }
      ]
    };

    await this.sendPushNotification(userId, payload);
  }

  async sendDailyRemindersToAllUsers(): Promise<void> {
    try {
      // Get all users who have daily reminders enabled
      const users = await prisma.user.findMany({
        where: {
          notificationPreferences: {
            dailyReminders: true,
            pushEnabled: true
          }
        },
        select: { id: true }
      });

      console.log(`Sending daily reminders to ${users.length} users`);

      // Send reminders in batches to avoid overwhelming the system
      const batchSize = 50;
      for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize);
        const promises = batch.map(user => this.sendDailyReminder(user.id));
        
        await Promise.allSettled(promises);
        
        // Small delay between batches
        if (i + batchSize < users.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log('Daily reminders sent successfully');

    } catch (error) {
      console.error('Error sending daily reminders:', error);
      throw new Error('Failed to send daily reminders');
    }
  }

  async sendActivityNotification(
    userId: string, 
    activityTitle: string, 
    activityId: string,
    type: 'new_activity' | 'activity_reminder' | 'activity_update'
  ): Promise<void> {
    const messages = {
      new_activity: {
        title: '🎯 Nueva Actividad Disponible',
        body: `Se ha publicado una nueva actividad: ${activityTitle}`
      },
      activity_reminder: {
        title: '⏰ Recordatorio de Actividad',
        body: `Tu actividad "${activityTitle}" comienza pronto`
      },
      activity_update: {
        title: '📝 Actualización de Actividad',
        body: `Hay cambios en la actividad: ${activityTitle}`
      }
    };

    const message = messages[type];
    
    const payload: PushNotificationPayload = {
      title: message.title,
      body: message.body,
      data: {
        type: 'activity_update',
        activityId,
        action: 'view_activity'
      },
      icon: '/icons/activity-icon-192.png',
      actions: [
        {
          action: 'view_activity',
          title: 'Ver Actividad'
        },
        {
          action: 'view_board',
          title: 'Ver Todas'
        }
      ]
    };

    await this.sendPushNotification(userId, payload);
  }

  async sendEmergencyAlert(userId: string, alertId: string): Promise<void> {
    const payload: PushNotificationPayload = {
      title: '🚨 Emergencia de Salud Mental',
      body: 'Un usuario necesita ayuda inmediata. ¿Puedes responder?',
      data: {
        type: 'emergency_alert',
        alertId,
        action: 'respond_emergency'
      },
      icon: '/icons/emergency-icon-192.png',
      badge: '/icons/emergency-badge.png',
      actions: [
        {
          action: 'respond',
          title: 'Responder',
          icon: '/icons/respond-icon.png'
        },
        {
          action: 'view_details',
          title: 'Ver Detalles'
        }
      ]
    };

    await this.sendPushNotification(userId, payload);
  }

  async sendEmergencyAlertToSerenos(
    alertId: string, 
    userLocation?: { latitude: number; longitude: number; country: string }
  ): Promise<void> {
    try {
      // Get all available SERENOS in the same country or nearby
      const serenos = await prisma.user.findMany({
        where: {
          role: 'SERENO',
          country: userLocation?.country || 'ALL'
        },
        include: {
          notificationPreferences: true,
          pushSubscriptions: true
        }
      });

      const payload: PushNotificationPayload = {
        title: '🚨 Alerta de Emergencia',
        body: 'Un usuario necesita ayuda inmediata en tu área. ¿Puedes responder?',
        data: {
          type: 'emergency_alert',
          alertId,
          action: 'respond_emergency',
          location: userLocation ? JSON.stringify(userLocation) : undefined
        },
        icon: '/icons/emergency-icon-192.png',
        badge: '/icons/emergency-badge.png',
        actions: [
          {
            action: 'respond',
            title: 'Responder Ahora',
            icon: '/icons/respond-icon.png'
          },
          {
            action: 'view_location',
            title: 'Ver Ubicación'
          }
        ]
      };

      // Send notifications to all available SERENOS
      const notificationPromises = serenos.map(sereno => 
        this.sendPushNotification(sereno.id, payload)
      );

      await Promise.allSettled(notificationPromises);
      
      console.log(`Emergency alert sent to ${serenos.length} SERENOS for alert ${alertId}`);

    } catch (error) {
      console.error('Error sending emergency alert to SERENOS:', error);
      throw new Error('Failed to send emergency alert to SERENOS');
    }
  }

  async sendSerenoResponseNotification(userId: string, serenoName: string, alertId: string): Promise<void> {
    const payload: PushNotificationPayload = {
      title: '💙 SERENO Respondiendo',
      body: `${serenoName} está respondiendo a tu emergencia. Te contactará pronto.`,
      data: {
        type: 'sereno_response',
        alertId,
        action: 'open_chat'
      },
      icon: '/icons/sereno-response-icon-192.png',
      actions: [
        {
          action: 'open_chat',
          title: 'Abrir Chat'
        },
        {
          action: 'view_help',
          title: 'Ver Ayuda'
        }
      ]
    };

    await this.sendPushNotification(userId, payload);
  }

  private async sendWebPushNotification(
    endpoint: string, 
    keys: string, 
    payload: PushNotificationPayload
  ): Promise<void> {
    try {
      const parsedKeys = JSON.parse(keys);
      const subscription = {
        endpoint,
        keys: parsedKeys
      };

      const notificationPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/icons/icon-192x192.png',
        badge: payload.badge || '/icons/icon-72x72.png',
        data: payload.data || {},
        actions: payload.actions || [],
        tag: payload.data?.type || 'sereno-notification',
        requireInteraction: payload.data?.type === 'emergency_alert'
      });

      // Try Firebase Cloud Messaging first
      if (messaging && payload.data?.fcmToken) {
        await this.sendFirebaseNotification(payload.data.fcmToken, payload);
        return;
      }

      // Fallback to Web Push Protocol
      await webpush.sendNotification(subscription, notificationPayload);
      console.log(`Push notification sent successfully to ${endpoint}`);

    } catch (error) {
      console.error(`Failed to send push notification to ${endpoint}:`, error);
      throw error;
    }
  }

  private async sendFirebaseNotification(
    fcmToken: string,
    payload: PushNotificationPayload
  ): Promise<void> {
    if (!messaging) {
      throw new Error('Firebase messaging not initialized');
    }

    const message = {
      token: fcmToken,
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.icon
      },
      data: payload.data ? Object.fromEntries(
        Object.entries(payload.data).map(([key, value]) => [key, String(value)])
      ) : {},
      webpush: {
        notification: {
          icon: payload.icon || '/icons/icon-192x192.png',
          badge: payload.badge || '/icons/icon-72x72.png',
          actions: payload.actions || [],
          tag: payload.data?.type || 'sereno-notification',
          requireInteraction: payload.data?.type === 'emergency_alert'
        }
      }
    };

    await messaging.send(message);
    console.log(`Firebase notification sent successfully to token: ${fcmToken.substring(0, 20)}...`);
  }

  private async logNotification(
    userId: string, 
    payload: PushNotificationPayload, 
    status: 'SENT' | 'FAILED' | 'ERROR',
    error?: string
  ): Promise<void> {
    try {
      await prisma.notificationLog.create({
        data: {
          userId,
          type: payload.data?.type || 'unknown',
          title: payload.title,
          body: payload.body,
          status,
          error,
          payload: JSON.stringify(payload)
        }
      });
    } catch (logError) {
      console.error('Error logging notification:', logError);
    }
  }

  private getNotificationType(dataType?: string): keyof NotificationPreferences {
    switch (dataType) {
      case 'emergency_alert':
      case 'sereno_response':
        return 'emergencyAlerts';
      case 'daily_reminder':
        return 'dailyReminders';
      case 'activity_update':
        return 'activityUpdates';
      case 'sereno_responded':
        return 'serenoResponses';
      default:
        return 'pushEnabled';
    }
  }

  private isNotificationTypeEnabled(
    preferences: any, 
    type: keyof NotificationPreferences
  ): boolean {
    return preferences?.[type] ?? true;
  }

  private isInvalidSubscriptionError(error: any): boolean {
    // Check if the error indicates an invalid subscription
    // This would depend on the specific push service being used
    return error.message?.includes('invalid subscription') || 
           error.statusCode === 410;
  }
}

export const notificationService = new NotificationService();
export const sendPushNotification = (userId: string, payload: PushNotificationPayload) =>
  notificationService.sendPushNotification(userId, payload);