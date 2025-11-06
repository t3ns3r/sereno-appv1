import { prisma } from '../config/database';
import { FakeCallFrequency } from '@prisma/client';

export interface FakeCallSettings {
  enabled: boolean;
  frequency: FakeCallFrequency;
  timeRange: {
    start: string;
    end: string;
  };
}

export interface FakeCall {
  id: string;
  userId: string;
  scheduledTime: Date;
  answered: boolean;
  redirectAction: string;
}

export interface FakeCallAnswer {
  answered: boolean;
  redirectAction: string;
  redirectUrl: string;
}

export class FakeCallService {
  async getUserSettings(userId: string): Promise<FakeCallSettings> {
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const settings = await prisma.fakeCallSettings.findUnique({
      where: { userId }
    });

    if (!settings) {
      // Return default settings
      return {
        enabled: true,
        frequency: 'RANDOM',
        timeRange: {
          start: '09:00',
          end: '21:00'
        }
      };
    }

    return {
      enabled: settings.enabled,
      frequency: settings.frequency,
      timeRange: {
        start: settings.timeStart,
        end: settings.timeEnd
      }
    };
  }

  async updateUserSettings(userId: string, settings: FakeCallSettings): Promise<FakeCallSettings> {
    // Validate settings
    this.validateSettings(settings);

    await prisma.fakeCallSettings.upsert({
      where: { userId },
      update: {
        enabled: settings.enabled,
        frequency: settings.frequency,
        timeStart: settings.timeRange.start,
        timeEnd: settings.timeRange.end
      },
      create: {
        userId,
        enabled: settings.enabled,
        frequency: settings.frequency,
        timeStart: settings.timeRange.start,
        timeEnd: settings.timeRange.end
      }
    });

    return settings;
  }

  async scheduleFakeCall(userId: string, redirectAction: string): Promise<FakeCall> {
    // Validate redirect action
    const validActions = ['mood_check', 'breathing_exercise', 'daily_tracking'];
    if (!validActions.includes(redirectAction)) {
      throw new Error('Invalid redirect action');
    }

    // Check if fake calls are enabled
    const settings = await this.getUserSettings(userId);
    if (!settings.enabled) {
      throw new Error('Fake calls are disabled for this user');
    }

    // Generate random call time within user's time range
    const scheduledTime = this.generateRandomCallTime({
      timeStart: settings.timeRange.start,
      timeEnd: settings.timeRange.end
    });

    const fakeCall = await prisma.fakeCall.create({
      data: {
        userId,
        scheduledTime,
        answered: false,
        redirectAction
      }
    });

    return {
      id: fakeCall.id,
      userId: fakeCall.userId,
      scheduledTime: fakeCall.scheduledTime,
      answered: fakeCall.answered,
      redirectAction: fakeCall.redirectAction
    };
  }

  async answerFakeCall(fakeCallId: string, userId: string): Promise<FakeCallAnswer> {
    const fakeCall = await prisma.fakeCall.findUnique({
      where: { id: fakeCallId }
    });

    if (!fakeCall) {
      throw new Error('Fake call not found');
    }

    if (fakeCall.userId !== userId) {
      throw new Error('Unauthorized access to fake call');
    }

    // Mark as answered
    const updatedCall = await prisma.fakeCall.update({
      where: { id: fakeCallId },
      data: { answered: true }
    });

    // Generate redirect URL based on action
    const redirectUrl = this.getRedirectUrl(updatedCall.redirectAction);

    return {
      answered: true,
      redirectAction: updatedCall.redirectAction,
      redirectUrl
    };
  }

  async getFakeCallHistory(userId: string): Promise<FakeCall[]> {
    const calls = await prisma.fakeCall.findMany({
      where: { userId },
      orderBy: { scheduledTime: 'desc' },
      take: 50 // Limit to last 50 calls
    });

    return calls.map(call => ({
      id: call.id,
      userId: call.userId,
      scheduledTime: call.scheduledTime,
      answered: call.answered,
      redirectAction: call.redirectAction
    }));
  }

  generateRandomCallTime(settings: { timeStart: string; timeEnd: string }): Date {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Parse time strings
    const [startHour, startMinute] = settings.timeStart.split(':').map(Number);
    const [endHour, endMinute] = settings.timeEnd.split(':').map(Number);
    
    // Create start and end times for today
    const startTime = new Date(today);
    startTime.setHours(startHour, startMinute, 0, 0);
    
    const endTime = new Date(today);
    endTime.setHours(endHour, endMinute, 0, 0);
    
    // If current time is past end time, schedule for tomorrow
    if (now > endTime) {
      startTime.setDate(startTime.getDate() + 1);
      endTime.setDate(endTime.getDate() + 1);
    }
    
    // If current time is before start time today, use today's range
    // Otherwise use tomorrow's range
    if (now < startTime && now.getDate() === today.getDate()) {
      // Use today's range, but start from current time if we're already in range
      const effectiveStart = now > startTime ? now : startTime;
      const timeRange = endTime.getTime() - effectiveStart.getTime();
      const randomOffset = Math.random() * timeRange;
      return new Date(effectiveStart.getTime() + randomOffset);
    } else {
      // Use tomorrow's range
      const timeRange = endTime.getTime() - startTime.getTime();
      const randomOffset = Math.random() * timeRange;
      return new Date(startTime.getTime() + randomOffset);
    }
  }

  getCallFrequencyInMs(frequency: FakeCallFrequency): number {
    switch (frequency) {
      case 'DAILY':
        return 24 * 60 * 60 * 1000; // 24 hours
      case 'WEEKLY':
        return 7 * 24 * 60 * 60 * 1000; // 7 days
      case 'RANDOM':
        // Random between 1 hour and 3 days
        const minMs = 60 * 60 * 1000; // 1 hour
        const maxMs = 3 * 24 * 60 * 60 * 1000; // 3 days
        return minMs + Math.random() * (maxMs - minMs);
      default:
        throw new Error('Invalid frequency');
    }
  }

  private validateSettings(settings: FakeCallSettings): void {
    // Validate frequency
    const validFrequencies: FakeCallFrequency[] = ['DAILY', 'WEEKLY', 'RANDOM'];
    if (!validFrequencies.includes(settings.frequency)) {
      throw new Error('Invalid frequency value');
    }

    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(settings.timeRange.start) || !timeRegex.test(settings.timeRange.end)) {
      throw new Error('Invalid time format');
    }

    // Validate time range logic
    const [startHour, startMinute] = settings.timeRange.start.split(':').map(Number);
    const [endHour, endMinute] = settings.timeRange.end.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    
    if (startMinutes >= endMinutes) {
      throw new Error('Start time must be before end time');
    }
  }

  private getRedirectUrl(redirectAction: string): string {
    switch (redirectAction) {
      case 'mood_check':
        return '/mood-assessment';
      case 'breathing_exercise':
        return '/breathing-exercises';
      case 'daily_tracking':
        return '/daily-tracking';
      default:
        return '/';
    }
  }
}