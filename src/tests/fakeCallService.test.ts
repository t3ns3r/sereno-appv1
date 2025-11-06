import { prisma } from '../config/database';
import { FakeCallService } from '../services/fakeCallService';

describe('FakeCallService', () => {
  let userId: string;
  let fakeCallService: FakeCallService;

  beforeEach(async () => {
    // Clean up test data
    await prisma.fakeCall.deleteMany();
    await prisma.fakeCallSettings.deleteMany();
    await prisma.userProfile.deleteMany();
    await prisma.user.deleteMany();

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'fakecallservice@example.com',
        username: 'fakecallserviceuser',
        password: 'hashedpassword',
        country: 'US',
        profile: {
          create: {
            firstName: 'Fake',
            lastName: 'Call'
          }
        }
      }
    });

    userId = user.id;
    fakeCallService = new FakeCallService();
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.fakeCall.deleteMany();
    await prisma.fakeCallSettings.deleteMany();
    await prisma.userProfile.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('getUserSettings', () => {
    it('should return default settings when no settings exist', async () => {
      const settings = await fakeCallService.getUserSettings(userId);

      expect(settings).toEqual({
        enabled: true,
        frequency: 'RANDOM',
        timeRange: {
          start: '09:00',
          end: '21:00'
        }
      });
    });

    it('should return existing user settings', async () => {
      // Create custom settings
      await prisma.fakeCallSettings.create({
        data: {
          userId,
          enabled: false,
          frequency: 'DAILY',
          timeStart: '10:00',
          timeEnd: '20:00'
        }
      });

      const settings = await fakeCallService.getUserSettings(userId);

      expect(settings).toEqual({
        enabled: false,
        frequency: 'DAILY',
        timeRange: {
          start: '10:00',
          end: '20:00'
        }
      });
    });

    it('should throw error for non-existent user', async () => {
      await expect(fakeCallService.getUserSettings('non-existent-id'))
        .rejects.toThrow('User not found');
    });
  });

  describe('updateUserSettings', () => {
    const validSettings = {
      enabled: true,
      frequency: 'WEEKLY' as const,
      timeRange: {
        start: '08:00',
        end: '22:00'
      }
    };

    it('should create new settings when none exist', async () => {
      const updatedSettings = await fakeCallService.updateUserSettings(userId, validSettings);

      expect(updatedSettings).toEqual(validSettings);

      // Verify in database
      const dbSettings = await prisma.fakeCallSettings.findUnique({
        where: { userId }
      });

      expect(dbSettings).toBeTruthy();
      expect(dbSettings!.enabled).toBe(true);
      expect(dbSettings!.frequency).toBe('WEEKLY');
      expect(dbSettings!.timeStart).toBe('08:00');
      expect(dbSettings!.timeEnd).toBe('22:00');
    });

    it('should update existing settings', async () => {
      // Create initial settings
      await prisma.fakeCallSettings.create({
        data: {
          userId,
          enabled: false,
          frequency: 'DAILY',
          timeStart: '09:00',
          timeEnd: '18:00'
        }
      });

      const updatedSettings = await fakeCallService.updateUserSettings(userId, validSettings);

      expect(updatedSettings).toEqual(validSettings);
    });

    it('should validate frequency values', async () => {
      const invalidSettings = {
        ...validSettings,
        frequency: 'INVALID' as any
      };

      await expect(fakeCallService.updateUserSettings(userId, invalidSettings))
        .rejects.toThrow('Invalid frequency value');
    });

    it('should validate time format', async () => {
      const invalidTimeSettings = {
        ...validSettings,
        timeRange: {
          start: '25:00',
          end: '20:00'
        }
      };

      await expect(fakeCallService.updateUserSettings(userId, invalidTimeSettings))
        .rejects.toThrow('Invalid time format');
    });

    it('should validate time range logic', async () => {
      const invalidRangeSettings = {
        ...validSettings,
        timeRange: {
          start: '22:00',
          end: '08:00'
        }
      };

      await expect(fakeCallService.updateUserSettings(userId, invalidRangeSettings))
        .rejects.toThrow('Start time must be before end time');
    });
  });

  describe('scheduleFakeCall', () => {
    beforeEach(async () => {
      // Set up fake call settings
      await prisma.fakeCallSettings.create({
        data: {
          userId,
          enabled: true,
          frequency: 'RANDOM',
          timeStart: '09:00',
          timeEnd: '21:00'
        }
      });
    });

    it('should schedule a fake call successfully', async () => {
      const fakeCall = await fakeCallService.scheduleFakeCall(userId, 'mood_check');

      expect(fakeCall).toHaveProperty('id');
      expect(fakeCall.userId).toBe(userId);
      expect(fakeCall.redirectAction).toBe('mood_check');
      expect(fakeCall.answered).toBe(false);
      expect(fakeCall.scheduledTime).toBeInstanceOf(Date);
    });

    it('should schedule call with different redirect actions', async () => {
      const breathingCall = await fakeCallService.scheduleFakeCall(userId, 'breathing_exercise');
      const trackingCall = await fakeCallService.scheduleFakeCall(userId, 'daily_tracking');

      expect(breathingCall.redirectAction).toBe('breathing_exercise');
      expect(trackingCall.redirectAction).toBe('daily_tracking');
    });

    it('should throw error when fake calls are disabled', async () => {
      // Disable fake calls
      await prisma.fakeCallSettings.update({
        where: { userId },
        data: { enabled: false }
      });

      await expect(fakeCallService.scheduleFakeCall(userId, 'mood_check'))
        .rejects.toThrow('Fake calls are disabled for this user');
    });

    it('should validate redirect action', async () => {
      await expect(fakeCallService.scheduleFakeCall(userId, 'invalid_action' as any))
        .rejects.toThrow('Invalid redirect action');
    });

    it('should schedule call within user time range', async () => {
      // Update settings with specific time range
      await prisma.fakeCallSettings.update({
        where: { userId },
        data: {
          timeStart: '10:00',
          timeEnd: '16:00'
        }
      });

      const fakeCall = await fakeCallService.scheduleFakeCall(userId, 'mood_check');
      const scheduledHour = fakeCall.scheduledTime.getHours();

      expect(scheduledHour).toBeGreaterThanOrEqual(10);
      expect(scheduledHour).toBeLessThan(16);
    });
  });

  describe('answerFakeCall', () => {
    let fakeCallId: string;

    beforeEach(async () => {
      // Create a fake call to answer
      const fakeCall = await prisma.fakeCall.create({
        data: {
          userId: userId,
          scheduledTime: new Date(),
          answered: false,
          redirectAction: 'mood_check'
        }
      });
      fakeCallId = fakeCall.id;
    });

    it('should mark fake call as answered', async () => {
      const result = await fakeCallService.answerFakeCall(fakeCallId, userId);

      expect(result.answered).toBe(true);
      expect(result.redirectAction).toBe('mood_check');
      expect(result.redirectUrl).toBe('/mood-assessment');
    });

    it('should return correct redirect URLs for different actions', async () => {
      // Create calls with different redirect actions
      const breathingCall = await prisma.fakeCall.create({
        data: {
          userId: userId,
          scheduledTime: new Date(),
          answered: false,
          redirectAction: 'breathing_exercise'
        }
      });

      const trackingCall = await prisma.fakeCall.create({
        data: {
          userId: userId,
          scheduledTime: new Date(),
          answered: false,
          redirectAction: 'daily_tracking'
        }
      });

      const breathingResult = await fakeCallService.answerFakeCall(breathingCall.id, userId);
      const trackingResult = await fakeCallService.answerFakeCall(trackingCall.id, userId);

      expect(breathingResult.redirectUrl).toBe('/breathing-exercises');
      expect(trackingResult.redirectUrl).toBe('/daily-tracking');
    });

    it('should throw error for non-existent fake call', async () => {
      await expect(fakeCallService.answerFakeCall('non-existent-id', userId))
        .rejects.toThrow('Fake call not found');
    });

    it('should throw error when user tries to answer another user\'s call', async () => {
      // Create another user
      const otherUser = await prisma.user.create({
        data: {
          email: 'other@example.com',
          username: 'otheruser',
          password: 'hashedpassword',
          country: 'US'
        }
      });

      await expect(fakeCallService.answerFakeCall(fakeCallId, otherUser.id))
        .rejects.toThrow('Unauthorized access to fake call');
    });

    it('should handle already answered calls', async () => {
      // Answer the call first time
      await fakeCallService.answerFakeCall(fakeCallId, userId);

      // Try to answer again
      const result = await fakeCallService.answerFakeCall(fakeCallId, userId);

      expect(result.answered).toBe(true);
      expect(result.redirectAction).toBe('mood_check');
    });
  });

  describe('getFakeCallHistory', () => {
    beforeEach(async () => {
      // Create fake call history
      await prisma.fakeCall.createMany({
        data: [
          {
            userId: userId,
            scheduledTime: new Date('2024-01-01T10:00:00Z'),
            answered: true,
            redirectAction: 'mood_check'
          },
          {
            userId: userId,
            scheduledTime: new Date('2024-01-02T14:00:00Z'),
            answered: false,
            redirectAction: 'breathing_exercise'
          },
          {
            userId: userId,
            scheduledTime: new Date('2024-01-03T16:00:00Z'),
            answered: true,
            redirectAction: 'daily_tracking'
          }
        ]
      });
    });

    it('should return user\'s fake call history', async () => {
      const history = await fakeCallService.getFakeCallHistory(userId);

      expect(history).toHaveLength(3);
      expect(history[0]).toHaveProperty('scheduledTime');
      expect(history[0]).toHaveProperty('answered');
      expect(history[0]).toHaveProperty('redirectAction');
    });

    it('should return history in descending order by scheduled time', async () => {
      const history = await fakeCallService.getFakeCallHistory(userId);

      expect(new Date(history[0].scheduledTime).getTime())
        .toBeGreaterThan(new Date(history[1].scheduledTime).getTime());
      expect(new Date(history[1].scheduledTime).getTime())
        .toBeGreaterThan(new Date(history[2].scheduledTime).getTime());
    });

    it('should return empty array when no history exists', async () => {
      // Clean up fake calls
      await prisma.fakeCall.deleteMany({ where: { userId: userId } });

      const history = await fakeCallService.getFakeCallHistory(userId);

      expect(history).toHaveLength(0);
    });

    it('should only return calls for the specified user', async () => {
      // Create another user with fake calls
      const otherUser = await prisma.user.create({
        data: {
          email: 'other@example.com',
          username: 'otheruser',
          password: 'hashedpassword',
          country: 'US'
        }
      });

      await prisma.fakeCall.create({
        data: {
          userId: otherUser.id,
          scheduledTime: new Date(),
          answered: true,
          redirectAction: 'mood_check'
        }
      });

      const history = await fakeCallService.getFakeCallHistory(userId);

      expect(history).toHaveLength(3); // Only original user's calls
      expect(history.every((call: any) => call.userId === userId)).toBe(true);
    });
  });

  describe('generateRandomCallTime', () => {
    it('should generate time within specified range', async () => {
      const settings = {
        timeStart: '10:00',
        timeEnd: '16:00'
      };

      const randomTime = fakeCallService.generateRandomCallTime(settings);
      const hour = randomTime.getHours();

      expect(hour).toBeGreaterThanOrEqual(10);
      expect(hour).toBeLessThan(16);
    });

    it('should generate time for today or tomorrow', async () => {
      const settings = {
        timeStart: '09:00',
        timeEnd: '21:00'
      };

      const randomTime = fakeCallService.generateRandomCallTime(settings);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

      expect(randomTime.getTime()).toBeGreaterThanOrEqual(today.getTime());
      expect(randomTime.getTime()).toBeLessThan(tomorrow.getTime() + 24 * 60 * 60 * 1000);
    });

    it('should handle edge case where current time is past end time', async () => {
      const settings = {
        timeStart: '09:00',
        timeEnd: '10:00' // Very narrow window
      };

      const randomTime = fakeCallService.generateRandomCallTime(settings);

      expect(randomTime).toBeInstanceOf(Date);
      expect(randomTime.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('getCallFrequencyInMs', () => {
    it('should return correct milliseconds for daily frequency', () => {
      const ms = fakeCallService.getCallFrequencyInMs('DAILY');
      expect(ms).toBe(24 * 60 * 60 * 1000); // 24 hours in ms
    });

    it('should return correct milliseconds for weekly frequency', () => {
      const ms = fakeCallService.getCallFrequencyInMs('WEEKLY');
      expect(ms).toBe(7 * 24 * 60 * 60 * 1000); // 7 days in ms
    });

    it('should return random interval for random frequency', () => {
      const ms = fakeCallService.getCallFrequencyInMs('RANDOM');
      
      // Should be between 1 hour and 3 days
      const oneHour = 60 * 60 * 1000;
      const threeDays = 3 * 24 * 60 * 60 * 1000;
      
      expect(ms).toBeGreaterThanOrEqual(oneHour);
      expect(ms).toBeLessThanOrEqual(threeDays);
    });
  });
});