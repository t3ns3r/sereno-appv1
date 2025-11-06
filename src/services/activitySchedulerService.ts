import * as cron from 'node-cron';
import { activityNotificationService } from './activityNotificationService';
import { logger } from '../utils/logger';

export class ActivitySchedulerService {
  private reminderJob: any = null;

  /**
   * Start the activity reminder scheduler
   * Runs every hour to check for activities that need reminders
   */
  startScheduler() {
    if (this.reminderJob) {
      logger.info('Activity scheduler is already running');
      return;
    }

    // Run every hour at minute 0
    this.reminderJob = cron.schedule('0 * * * *', async () => {
      try {
        logger.info('Running activity reminder scheduler');
        await activityNotificationService.scheduleActivityReminders();
      } catch (error) {
        logger.error('Error in activity reminder scheduler:', error);
      }
    }, {
      timezone: 'UTC'
    });

    logger.info('Activity reminder scheduler started');
  }

  /**
   * Stop the activity reminder scheduler
   */
  stopScheduler() {
    if (this.reminderJob) {
      this.reminderJob.stop();
      this.reminderJob = null;
      logger.info('Activity reminder scheduler stopped');
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.reminderJob !== null,
      nextRun: this.reminderJob ? 'Next hour at minute 0' : null
    };
  }

  /**
   * Manually trigger reminder check (for testing)
   */
  async triggerReminderCheck() {
    try {
      logger.info('Manually triggering activity reminder check');
      await activityNotificationService.scheduleActivityReminders();
      return { success: true, message: 'Reminder check completed' };
    } catch (error) {
      logger.error('Error in manual reminder check:', error);
      throw error;
    }
  }
}

export const activitySchedulerService = new ActivitySchedulerService();