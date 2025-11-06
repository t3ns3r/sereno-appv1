import { notificationService } from '../services/notificationService';

// Mock Prisma client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn()
    },
    pushSubscription: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn()
    },
    notificationPreferences: {
      findUnique: jest.fn(),
      upsert: jest.fn()
    },
    notificationLog: {
      create: jest.fn()
    }
  }))
}));

// Mock Firebase
jest.mock('../config/firebase', () => ({
  messaging: null,
  firebaseAdmin: null
}));

// Mock web-push
jest.mock('web-push', () => ({
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn().mockResolvedValue(undefined)
}));

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateNotificationPreferences', () => {
    it('should update notification preferences successfully', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com'
      };

      const mockPreferences = {
        emergencyAlerts: true,
        dailyReminders: false,
        activityUpdates: true,
        serenoResponses: true,
        pushEnabled: true,
        emailEnabled: false
      };

      const mockUpsert = jest.fn().mockResolvedValue({
        userId: mockUser.id,
        ...mockPreferences
      });

      // Mock Prisma
      const { PrismaClient } = require('@prisma/client');
      const mockPrisma = new PrismaClient();
      mockPrisma.notificationPreferences.upsert = mockUpsert;

      const result = await notificationService.updateNotificationPreferences(
        mockUser.id,
        mockPreferences
      );

      expect(result).toEqual(mockPreferences);
      expect(mockUpsert).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        update: mockPreferences,
        create: {
          userId: mockUser.id,
          ...mockPreferences
        }
      });
    });
  });

  describe('getNotificationPreferences', () => {
    it('should return default preferences when none exist', async () => {
      const mockUser = {
        id: 'user-1'
      };

      const mockFindUnique = jest.fn().mockResolvedValue(null);

      // Mock Prisma
      const { PrismaClient } = require('@prisma/client');
      const mockPrisma = new PrismaClient();
      mockPrisma.notificationPreferences.findUnique = mockFindUnique;

      const result = await notificationService.getNotificationPreferences(mockUser.id);

      expect(result).toEqual({
        emergencyAlerts: true,
        dailyReminders: true,
        activityUpdates: true,
        serenoResponses: true,
        pushEnabled: true,
        emailEnabled: false
      });
    });

    it('should return existing preferences', async () => {
      const mockUser = {
        id: 'user-1'
      };

      const mockPreferences = {
        emergencyAlerts: false,
        dailyReminders: true,
        activityUpdates: false,
        serenoResponses: true,
        pushEnabled: false,
        emailEnabled: true
      };

      const mockFindUnique = jest.fn().mockResolvedValue({
        userId: mockUser.id,
        ...mockPreferences
      });

      // Mock Prisma
      const { PrismaClient } = require('@prisma/client');
      const mockPrisma = new PrismaClient();
      mockPrisma.notificationPreferences.findUnique = mockFindUnique;

      const result = await notificationService.getNotificationPreferences(mockUser.id);

      expect(result).toEqual(mockPreferences);
    });
  });

  describe('subscribeToPushNotifications', () => {
    it('should create new subscription when none exists', async () => {
      const mockUser = {
        id: 'user-1'
      };

      const mockSubscription = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test',
        keys: {
          p256dh: 'test-p256dh-key',
          auth: 'test-auth-key'
        }
      };

      const mockDeviceInfo = {
        userAgent: 'Mozilla/5.0...',
        platform: 'Win32'
      };

      const mockFindFirst = jest.fn().mockResolvedValue(null);
      const mockCreate = jest.fn().mockResolvedValue({
        id: 'subscription-1',
        userId: mockUser.id,
        endpoint: mockSubscription.endpoint,
        keys: JSON.stringify(mockSubscription.keys)
      });

      // Mock Prisma
      const { PrismaClient } = require('@prisma/client');
      const mockPrisma = new PrismaClient();
      mockPrisma.pushSubscription.findFirst = mockFindFirst;
      mockPrisma.pushSubscription.create = mockCreate;

      await notificationService.subscribeToPushNotifications(
        mockUser.id,
        mockSubscription,
        mockDeviceInfo
      );

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          userId: mockUser.id,
          endpoint: mockSubscription.endpoint,
          keys: JSON.stringify({
            ...mockSubscription.keys,
            fcmToken: undefined
          }),
          deviceInfo: JSON.stringify(mockDeviceInfo)
        }
      });
    });
  });

  describe('sendDailyRemindersToAllUsers', () => {
    it('should send reminders to users with daily reminders enabled', async () => {
      const mockUsers = [
        { id: 'user-1' },
        { id: 'user-2' },
        { id: 'user-3' }
      ];

      const mockFindMany = jest.fn().mockResolvedValue(mockUsers);

      // Mock Prisma
      const { PrismaClient } = require('@prisma/client');
      const mockPrisma = new PrismaClient();
      mockPrisma.user.findMany = mockFindMany;

      // Mock sendDailyReminder method
      const sendDailyReminderSpy = jest.spyOn(notificationService, 'sendDailyReminder')
        .mockResolvedValue(undefined);

      await notificationService.sendDailyRemindersToAllUsers();

      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          notificationPreferences: {
            dailyReminders: true,
            pushEnabled: true
          }
        },
        select: { id: true }
      });

      expect(sendDailyReminderSpy).toHaveBeenCalledTimes(3);
      expect(sendDailyReminderSpy).toHaveBeenCalledWith('user-1');
      expect(sendDailyReminderSpy).toHaveBeenCalledWith('user-2');
      expect(sendDailyReminderSpy).toHaveBeenCalledWith('user-3');

      sendDailyReminderSpy.mockRestore();
    });
  });

  describe('sendEmergencyAlertToSerenos', () => {
    it('should send emergency alerts to SERENOS in the same country', async () => {
      const mockAlertId = 'alert-123';
      const mockLocation = {
        latitude: 40.7128,
        longitude: -74.0060,
        country: 'US'
      };

      const mockSerenos = [
        {
          id: 'sereno-1',
          role: 'SERENO',
          country: 'US',
          notificationPreferences: { emergencyAlerts: true },
          pushSubscriptions: []
        },
        {
          id: 'sereno-2',
          role: 'SERENO',
          country: 'US',
          notificationPreferences: { emergencyAlerts: true },
          pushSubscriptions: []
        }
      ];

      const mockFindMany = jest.fn().mockResolvedValue(mockSerenos);

      // Mock Prisma
      const { PrismaClient } = require('@prisma/client');
      const mockPrisma = new PrismaClient();
      mockPrisma.user.findMany = mockFindMany;

      // Mock sendPushNotification method
      const sendPushNotificationSpy = jest.spyOn(notificationService, 'sendPushNotification')
        .mockResolvedValue(undefined);

      await notificationService.sendEmergencyAlertToSerenos(mockAlertId, mockLocation);

      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          role: 'SERENO',
          country: mockLocation.country
        },
        include: {
          notificationPreferences: true,
          pushSubscriptions: true
        }
      });

      expect(sendPushNotificationSpy).toHaveBeenCalledTimes(2);

      sendPushNotificationSpy.mockRestore();
    });
  });
});