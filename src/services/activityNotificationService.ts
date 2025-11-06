import { PrismaClient } from '@prisma/client';
import { NotificationService } from './notificationService';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();
const notificationService = new NotificationService();

export class ActivityNotificationService {
  /**
   * Send notification to all registered participants when activity is updated
   */
  async notifyActivityUpdate(activityId: string, updateMessage: string) {
    try {
      const activity = await prisma.activity.findUnique({
        where: { id: activityId },
        include: {
          registeredUsers: {
            include: {
              notificationPreferences: true
            }
          }
        }
      });

      if (!activity) {
        throw new Error('Activity not found');
      }

      // Send notifications to all registered users
      const notifications = activity.registeredUsers
        .filter(user => user.notificationPreferences?.activityUpdates !== false)
        .map(user => ({
          userId: user.id,
          title: 'Actividad Actualizada',
          body: `La actividad "${activity.title}" ha sido actualizada: ${updateMessage}`,
          data: {
            type: 'activity_update',
            activityId: activity.id,
            activityTitle: activity.title
          }
        }));

      await Promise.all(
        notifications.map(notification =>
          notificationService.sendPushNotification(
            notification.userId,
            {
              title: notification.title,
              body: notification.body,
              data: notification.data
            }
          )
        )
      );

      logger.info(`Activity update notifications sent for activity ${activityId} to ${notifications.length} users`);
    } catch (error) {
      logger.error('Error sending activity update notifications:', error);
      throw error;
    }
  }

  /**
   * Send notification when activity is cancelled
   */
  async notifyActivityCancellation(activityId: string, reason?: string) {
    try {
      const activity = await prisma.activity.findUnique({
        where: { id: activityId },
        include: {
          registeredUsers: {
            include: {
              notificationPreferences: true
            }
          }
        }
      });

      if (!activity) {
        throw new Error('Activity not found');
      }

      const message = reason 
        ? `La actividad "${activity.title}" ha sido cancelada. Motivo: ${reason}`
        : `La actividad "${activity.title}" ha sido cancelada.`;

      // Send notifications to all registered users
      const notifications = activity.registeredUsers
        .filter(user => user.notificationPreferences?.activityUpdates !== false)
        .map(user => ({
          userId: user.id,
          title: 'Actividad Cancelada',
          body: message,
          data: {
            type: 'activity_cancelled',
            activityId: activity.id,
            activityTitle: activity.title
          }
        }));

      await Promise.all(
        notifications.map(notification =>
          notificationService.sendPushNotification(
            notification.userId,
            {
              title: notification.title,
              body: notification.body,
              data: notification.data
            }
          )
        )
      );

      logger.info(`Activity cancellation notifications sent for activity ${activityId} to ${notifications.length} users`);
    } catch (error) {
      logger.error('Error sending activity cancellation notifications:', error);
      throw error;
    }
  }

  /**
   * Send reminder notification before activity starts
   */
  async sendActivityReminder(activityId: string, hoursBeforeEvent: number = 24) {
    try {
      const activity = await prisma.activity.findUnique({
        where: { id: activityId },
        include: {
          registeredUsers: {
            include: {
              notificationPreferences: true
            }
          }
        }
      });

      if (!activity) {
        throw new Error('Activity not found');
      }

      const eventDate = new Date(activity.eventDate);
      const now = new Date();
      const hoursUntilEvent = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Only send reminder if event is within the specified hours
      if (hoursUntilEvent <= hoursBeforeEvent && hoursUntilEvent > 0) {
        const timeText = hoursUntilEvent < 1 
          ? `en ${Math.round(hoursUntilEvent * 60)} minutos`
          : `en ${Math.round(hoursUntilEvent)} horas`;

        const notifications = activity.registeredUsers
          .filter(user => user.notificationPreferences?.activityUpdates !== false)
          .map(user => ({
            userId: user.id,
            title: 'Recordatorio de Actividad',
            body: `La actividad "${activity.title}" comenzará ${timeText}. ¡No olvides asistir!`,
            data: {
              type: 'activity_reminder',
              activityId: activity.id,
              activityTitle: activity.title,
              eventDate: activity.eventDate.toISOString()
            }
          }));

        await Promise.all(
          notifications.map(notification =>
            notificationService.sendPushNotification(
              notification.userId,
              {
                title: notification.title,
                body: notification.body,
                data: notification.data
              }
            )
          )
        );

        logger.info(`Activity reminder notifications sent for activity ${activityId} to ${notifications.length} users`);
      }
    } catch (error) {
      logger.error('Error sending activity reminder notifications:', error);
      throw error;
    }
  }

  /**
   * Send notification when new user registers for activity
   */
  async notifyNewRegistration(activityId: string, newUserId: string) {
    try {
      const activity = await prisma.activity.findUnique({
        where: { id: activityId },
        include: {
          organizer: {
            include: {
              notificationPreferences: true
            }
          },
          registeredUsers: {
            where: { id: newUserId },
            include: {
              profile: true
            }
          }
        }
      });

      if (!activity) {
        throw new Error('Activity not found');
      }

      const newUser = activity.registeredUsers[0];
      if (!newUser) {
        throw new Error('New user not found');
      }

      // Notify organizer about new registration
      if (activity.organizer.notificationPreferences?.activityUpdates !== false) {
        const userName = newUser.profile?.firstName || newUser.username;
        await notificationService.sendPushNotification(
          activity.organizerId,
          {
            title: 'Nueva Inscripción',
            body: `${userName} se ha registrado para tu actividad "${activity.title}"`,
            data: {
              type: 'new_registration',
              activityId: activity.id,
              activityTitle: activity.title,
              newUserId: newUser.id
            }
          }
        );
      }

      logger.info(`New registration notification sent to organizer for activity ${activityId}`);
    } catch (error) {
      logger.error('Error sending new registration notification:', error);
      throw error;
    }
  }

  /**
   * Send notification when user unregisters from activity
   */
  async notifyUnregistration(activityId: string, userId: string, userName: string) {
    try {
      const activity = await prisma.activity.findUnique({
        where: { id: activityId },
        include: {
          organizer: {
            include: {
              notificationPreferences: true
            }
          }
        }
      });

      if (!activity) {
        throw new Error('Activity not found');
      }

      // Notify organizer about unregistration
      if (activity.organizer.notificationPreferences?.activityUpdates !== false) {
        await notificationService.sendPushNotification(
          activity.organizerId,
          {
            title: 'Cancelación de Inscripción',
            body: `${userName} ha cancelado su inscripción para la actividad "${activity.title}"`,
            data: {
              type: 'unregistration',
              activityId: activity.id,
              activityTitle: activity.title,
              userId: userId
            }
          }
        );
      }

      logger.info(`Unregistration notification sent to organizer for activity ${activityId}`);
    } catch (error) {
      logger.error('Error sending unregistration notification:', error);
      throw error;
    }
  }

  /**
   * Schedule automatic reminders for upcoming activities
   */
  async scheduleActivityReminders() {
    try {
      const upcomingActivities = await prisma.activity.findMany({
        where: {
          eventDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 25 * 60 * 60 * 1000) // Next 25 hours
          }
        },
        include: {
          registeredUsers: true
        }
      });

      for (const activity of upcomingActivities) {
        if (activity.registeredUsers.length > 0) {
          await this.sendActivityReminder(activity.id, 24);
        }
      }

      logger.info(`Processed ${upcomingActivities.length} activities for reminder notifications`);
    } catch (error) {
      logger.error('Error scheduling activity reminders:', error);
      throw error;
    }
  }
}

export const activityNotificationService = new ActivityNotificationService();