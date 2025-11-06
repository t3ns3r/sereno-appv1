import * as cron from 'node-cron';
import { notificationService } from './notificationService';
import { logger } from '../utils/logger';

export class SchedulerService {
  private static instance: SchedulerService;
  private scheduledTasks: Map<string, any> = new Map();

  private constructor() {}

  static getInstance(): SchedulerService {
    if (!SchedulerService.instance) {
      SchedulerService.instance = new SchedulerService();
    }
    return SchedulerService.instance;
  }

  /**
   * Initialize all scheduled tasks
   */
  initializeScheduledTasks(): void {
    this.scheduleDailyReminders();
    logger.info('Scheduler service initialized with all tasks');
  }

  /**
   * Schedule daily reminders at specific times
   */
  private scheduleDailyReminders(): void {
    // Morning reminder at 9:00 AM
    const morningTask = cron.schedule('0 9 * * *', async () => {
      logger.info('Sending morning daily reminders');
      try {
        await notificationService.sendDailyRemindersToAllUsers();
        logger.info('Morning daily reminders sent successfully');
      } catch (error) {
        logger.error('Error sending morning daily reminders:', error);
      }
    }, {
      timezone: 'America/Mexico_City' // Adjust timezone as needed
    });

    // Afternoon reminder at 2:00 PM
    const afternoonTask = cron.schedule('0 14 * * *', async () => {
      logger.info('Sending afternoon daily reminders');
      try {
        await notificationService.sendDailyRemindersToAllUsers();
        logger.info('Afternoon daily reminders sent successfully');
      } catch (error) {
        logger.error('Error sending afternoon daily reminders:', error);
      }
    }, {
      timezone: 'America/Mexico_City'
    });

    // Evening reminder at 7:00 PM
    const eveningTask = cron.schedule('0 19 * * *', async () => {
      logger.info('Sending evening daily reminders');
      try {
        await notificationService.sendDailyRemindersToAllUsers();
        logger.info('Evening daily reminders sent successfully');
      } catch (error) {
        logger.error('Error sending evening daily reminders:', error);
      }
    }, {
      timezone: 'America/Mexico_City'
    });

    // Tasks are started by default, no need to call start()

    // Store tasks for management
    this.scheduledTasks.set('morning-reminders', morningTask);
    this.scheduledTasks.set('afternoon-reminders', afternoonTask);
    this.scheduledTasks.set('evening-reminders', eveningTask);

    logger.info('Daily reminder tasks scheduled for 9:00 AM, 2:00 PM, and 7:00 PM');
  }

  /**
   * Schedule activity reminders
   */
  scheduleActivityReminder(activityId: string, reminderTime: Date, userIds: string[]): void {
    const taskId = `activity-reminder-${activityId}`;
    
    // Calculate cron expression from date
    const cronExpression = this.dateToCronExpression(reminderTime);
    
    const task = cron.schedule(cronExpression, async () => {
      logger.info(`Sending activity reminder for activity ${activityId}`);
      try {
        // Send reminders to all registered users
        const promises = userIds.map(userId => 
          notificationService.sendActivityNotification(
            userId, 
            'Actividad programada', 
            activityId, 
            'activity_reminder'
          )
        );
        
        await Promise.allSettled(promises);
        logger.info(`Activity reminder sent to ${userIds.length} users`);
        
        // Remove the task after execution
        this.removeScheduledTask(taskId);
        
      } catch (error) {
        logger.error(`Error sending activity reminder for ${activityId}:`, error);
      }
    });
    this.scheduledTasks.set(taskId, task);
    
    logger.info(`Activity reminder scheduled for ${reminderTime.toISOString()}`);
  }

  /**
   * Schedule emergency alert cleanup (auto-resolve old alerts)
   */
  scheduleEmergencyCleanup(): void {
    // Run every hour to check for old emergency alerts
    const cleanupTask = cron.schedule('0 * * * *', async () => {
      logger.info('Running emergency alert cleanup');
      try {
        // This would be implemented in the emergency service
        // For now, just log the cleanup attempt
        logger.info('Emergency cleanup completed');
      } catch (error) {
        logger.error('Error during emergency cleanup:', error);
      }
    });
    this.scheduledTasks.set('emergency-cleanup', cleanupTask);
    
    logger.info('Emergency cleanup task scheduled to run every hour');
  }

  /**
   * Remove a scheduled task
   */
  removeScheduledTask(taskId: string): void {
    const task = this.scheduledTasks.get(taskId);
    if (task) {
      task.stop();
      task.destroy();
      this.scheduledTasks.delete(taskId);
      logger.info(`Scheduled task ${taskId} removed`);
    }
  }

  /**
   * Stop all scheduled tasks
   */
  stopAllTasks(): void {
    this.scheduledTasks.forEach((task, taskId) => {
      task.stop();
      task.destroy();
      logger.info(`Stopped scheduled task: ${taskId}`);
    });
    this.scheduledTasks.clear();
    logger.info('All scheduled tasks stopped');
  }

  /**
   * Get status of all scheduled tasks
   */
  getTasksStatus(): Array<{ id: string; running: boolean }> {
    return Array.from(this.scheduledTasks.entries()).map(([id, task]) => ({
      id,
      running: true // Assume running since node-cron doesn't expose running status easily
    }));
  }

  /**
   * Convert Date to cron expression
   */
  private dateToCronExpression(date: Date): string {
    const minute = date.getMinutes();
    const hour = date.getHours();
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    
    // For one-time execution, we use specific date
    return `${minute} ${hour} ${day} ${month} *`;
  }
}

export const schedulerService = SchedulerService.getInstance();