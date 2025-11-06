import { EmergencyService } from '../services/emergencyService';
import { PrismaClient } from '@prisma/client';

// Mock dependencies
jest.mock('@prisma/client');
jest.mock('../config/pusher');
jest.mock('../services/notificationService');
jest.mock('../services/emergencyContactsService');

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn()
  },
  emergencyAlert: {
    create: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn()
  },
  chatChannel: {
    create: jest.fn()
  }
};

(PrismaClient as jest.Mock).mockImplementation(() => mockPrisma);

describe('EmergencyService', () => {
  let emergencyService: EmergencyService;

  beforeEach(() => {
    emergencyService = new EmergencyService();
    jest.clearAllMocks();
  });

  describe('activatePanicButton', () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      country: 'US',
      profile: {}
    };

    const mockAlert = {
      id: 'alert-1',
      userId: 'user-1',
      location: null,
      status: 'active',
      respondingSerenos: [],
      officialContactsNotified: [],
      createdAt: new Date()
    };

    beforeEach(() => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.emergencyAlert.create.mockResolvedValue(mockAlert);
      mockPrisma.emergencyAlert.update.mockResolvedValue(mockAlert);
    });

    it('should activate panic button successfully', async () => {
      const location = {
        latitude: 40.7128,
        longitude: -74.0060,
        address: 'New York, NY'
      };

      const result = await emergencyService.activatePanicButton('user-1', location);

      expect(result).toEqual({
        id: 'alert-1',
        userId: 'user-1',
        location,
        status: 'active',
        createdAt: expect.any(Date),
        respondingSerenos: [],
        officialContactsNotified: []
      });

      expect(mockPrisma.emergencyAlert.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          location: JSON.stringify(location),
          status: 'active',
          respondingSerenos: [],
          officialContactsNotified: []
        }
      });
    });

    it('should activate panic button without location', async () => {
      const result = await emergencyService.activatePanicButton('user-1');

      expect(result).toEqual({
        id: 'alert-1',
        userId: 'user-1',
        location: undefined,
        status: 'active',
        createdAt: expect.any(Date),
        respondingSerenos: [],
        officialContactsNotified: []
      });

      expect(mockPrisma.emergencyAlert.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          location: null,
          status: 'active',
          respondingSerenos: [],
          officialContactsNotified: []
        }
      });
    });

    it('should throw error if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(emergencyService.activatePanicButton('non-existent-user'))
        .rejects.toThrow('User not found');
    });
  });

  describe('respondToEmergency', () => {
    const mockAlert = {
      id: 'alert-1',
      userId: 'user-1',
      status: 'active',
      respondingSerenos: []
    };

    beforeEach(() => {
      mockPrisma.emergencyAlert.findUnique.mockResolvedValue(mockAlert);
      mockPrisma.emergencyAlert.update.mockResolvedValue({
        ...mockAlert,
        respondingSerenos: ['sereno-1'],
        status: 'responded'
      });
      mockPrisma.chatChannel.create.mockResolvedValue({
        id: 'channel-1',
        type: 'emergency',
        participants: ['user-1', 'sereno-1']
      });
    });

    it('should allow SERENO to respond to emergency', async () => {
      await emergencyService.respondToEmergency('alert-1', 'sereno-1');

      expect(mockPrisma.emergencyAlert.update).toHaveBeenCalledWith({
        where: { id: 'alert-1' },
        data: {
          respondingSerenos: ['sereno-1'],
          status: 'responded'
        }
      });

      expect(mockPrisma.chatChannel.create).toHaveBeenCalledWith({
        data: {
          type: 'emergency',
          participants: ['user-1', 'sereno-1'],
          emergencyAlertId: 'alert-1'
        }
      });
    });

    it('should throw error if alert not found', async () => {
      mockPrisma.emergencyAlert.findUnique.mockResolvedValue(null);

      await expect(emergencyService.respondToEmergency('non-existent-alert', 'sereno-1'))
        .rejects.toThrow('Emergency alert not found');
    });

    it('should throw error if alert is not active', async () => {
      mockPrisma.emergencyAlert.findUnique.mockResolvedValue({
        ...mockAlert,
        status: 'resolved'
      });

      await expect(emergencyService.respondToEmergency('alert-1', 'sereno-1'))
        .rejects.toThrow('Emergency alert is no longer active');
    });
  });

  describe('resolveEmergency', () => {
    const mockAlert = {
      id: 'alert-1',
      userId: 'user-1',
      status: 'active',
      respondingSerenos: ['sereno-1']
    };

    beforeEach(() => {
      mockPrisma.emergencyAlert.findUnique.mockResolvedValue(mockAlert);
      mockPrisma.emergencyAlert.update.mockResolvedValue({
        ...mockAlert,
        status: 'resolved'
      });
    });

    it('should allow user to resolve their own emergency', async () => {
      await emergencyService.resolveEmergency('alert-1', 'user-1');

      expect(mockPrisma.emergencyAlert.update).toHaveBeenCalledWith({
        where: { id: 'alert-1' },
        data: {
          status: 'resolved',
          resolvedAt: expect.any(Date)
        }
      });
    });

    it('should throw error if alert not found', async () => {
      mockPrisma.emergencyAlert.findUnique.mockResolvedValue(null);

      await expect(emergencyService.resolveEmergency('non-existent-alert', 'user-1'))
        .rejects.toThrow('Emergency alert not found');
    });

    it('should throw error if user is not the owner', async () => {
      await expect(emergencyService.resolveEmergency('alert-1', 'other-user'))
        .rejects.toThrow('Unauthorized to resolve this emergency');
    });
  });

  describe('getEmergencyHistory', () => {
    const mockHistory = [
      {
        id: 'alert-1',
        userId: 'user-1',
        status: 'resolved',
        createdAt: new Date('2023-01-01')
      },
      {
        id: 'alert-2',
        userId: 'user-1',
        status: 'resolved',
        createdAt: new Date('2023-01-02')
      }
    ];

    beforeEach(() => {
      mockPrisma.emergencyAlert.findMany.mockResolvedValue(mockHistory);
    });

    it('should return user emergency history', async () => {
      const result = await emergencyService.getEmergencyHistory('user-1');

      expect(result).toEqual(mockHistory);
      expect(mockPrisma.emergencyAlert.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        take: 20
      });
    });
  });

  describe('getActiveEmergencies', () => {
    const mockSereno = {
      id: 'sereno-1',
      role: 'sereno',
      country: 'US'
    };

    const mockActiveEmergencies = [
      {
        id: 'alert-1',
        userId: 'user-1',
        status: 'active',
        createdAt: new Date(),
        user: {
          id: 'user-1',
          username: 'testuser',
          profile: {
            firstName: 'Test',
            mentalHealthConditions: ['anxiety']
          }
        }
      }
    ];

    beforeEach(() => {
      mockPrisma.user.findUnique.mockResolvedValue(mockSereno);
      mockPrisma.emergencyAlert.findMany.mockResolvedValue(mockActiveEmergencies);
    });

    it('should return active emergencies for SERENO', async () => {
      const result = await emergencyService.getActiveEmergencies('sereno-1');

      expect(result).toEqual(mockActiveEmergencies);
      expect(mockPrisma.emergencyAlert.findMany).toHaveBeenCalledWith({
        where: {
          status: 'active',
          user: {
            country: 'US'
          }
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              profile: {
                select: {
                  firstName: true,
                  mentalHealthConditions: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    });

    it('should throw error if user is not a SERENO', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        role: 'user',
        country: 'US'
      });

      await expect(emergencyService.getActiveEmergencies('user-1'))
        .rejects.toThrow('User is not a SERENO');
    });

    it('should throw error if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(emergencyService.getActiveEmergencies('non-existent-user'))
        .rejects.toThrow('User is not a SERENO');
    });
  });
});