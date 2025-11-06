import { EmergencyContactsService } from '../services/emergencyContactsService';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client');

const mockPrisma = {
  emergencyContact: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findFirst: jest.fn()
  }
};

(PrismaClient as jest.Mock).mockImplementation(() => mockPrisma);

describe('EmergencyContactsService', () => {
  let emergencyContactsService: EmergencyContactsService;

  beforeEach(() => {
    emergencyContactsService = new EmergencyContactsService();
    jest.clearAllMocks();
  });

  describe('getEmergencyContactsByCountry', () => {
    it('should return contacts from database if available', async () => {
      const mockDbContacts = [
        {
          id: 'contact-1',
          country: 'US',
          name: 'Test Crisis Line',
          phoneNumber: '123-456-7890',
          type: 'crisis_hotline',
          available24h: true,
          autoContact: true,
          description: 'Test description',
          website: 'https://test.com'
        }
      ];

      mockPrisma.emergencyContact.findMany.mockResolvedValue(mockDbContacts);

      const result = await emergencyContactsService.getEmergencyContactsByCountry('US');

      expect(result).toEqual([
        {
          id: 'contact-1',
          country: 'US',
          name: 'Test Crisis Line',
          phoneNumber: '123-456-7890',
          type: 'crisis_hotline',
          available24h: true,
          autoContact: true,
          description: 'Test description',
          website: 'https://test.com'
        }
      ]);

      expect(mockPrisma.emergencyContact.findMany).toHaveBeenCalledWith({
        where: { country: 'US' }
      });
    });

    it('should return default contacts for US when no database contacts', async () => {
      mockPrisma.emergencyContact.findMany.mockResolvedValue([]);

      const result = await emergencyContactsService.getEmergencyContactsByCountry('US');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'us-988',
        country: 'US',
        name: 'Suicide & Crisis Lifeline',
        phoneNumber: '988',
        type: 'crisis_hotline',
        available24h: true,
        autoContact: true,
        description: 'National suicide prevention lifeline',
        website: 'https://suicidepreventionlifeline.org'
      });
    });

    it('should return default contacts for Mexico', async () => {
      mockPrisma.emergencyContact.findMany.mockResolvedValue([]);

      const result = await emergencyContactsService.getEmergencyContactsByCountry('MX');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'mx-saptel',
        country: 'MX',
        name: 'SAPTEL',
        phoneNumber: '55 5259 8121',
        type: 'crisis_hotline',
        available24h: true,
        autoContact: true,
        description: 'Sistema Nacional de Apoyo, Consejo Psicológico e Intervención en Crisis por Teléfono',
        website: 'https://saptel.org.mx'
      });
    });

    it('should return generic emergency contact for unknown country', async () => {
      mockPrisma.emergencyContact.findMany.mockResolvedValue([]);

      const result = await emergencyContactsService.getEmergencyContactsByCountry('XX');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'xx-generic',
        country: 'XX',
        name: 'Servicios de Emergencia',
        phoneNumber: '911',
        type: 'emergency_services',
        available24h: true,
        autoContact: false,
        description: 'Servicios de emergencia locales'
      });
    });

    it('should return fallback contact on database error', async () => {
      mockPrisma.emergencyContact.findMany.mockRejectedValue(new Error('Database error'));

      const result = await emergencyContactsService.getEmergencyContactsByCountry('US');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'us-fallback',
        country: 'US',
        name: 'Emergencias',
        phoneNumber: '911',
        type: 'emergency_services',
        available24h: true,
        autoContact: false,
        description: 'Servicios de emergencia'
      });
    });
  });

  describe('addEmergencyContact', () => {
    it('should create new emergency contact', async () => {
      const newContact = {
        country: 'CA',
        name: 'Canada Crisis Line',
        phoneNumber: '1-833-456-4566',
        type: 'crisis_hotline' as const,
        available24h: true,
        autoContact: true,
        description: 'Canadian crisis support',
        website: 'https://talksuicide.ca'
      };

      const mockDbContact = {
        id: 'contact-new',
        ...newContact
      };

      mockPrisma.emergencyContact.create.mockResolvedValue(mockDbContact);

      const result = await emergencyContactsService.addEmergencyContact(newContact);

      expect(result).toEqual({
        id: 'contact-new',
        country: 'CA',
        name: 'Canada Crisis Line',
        phoneNumber: '1-833-456-4566',
        type: 'crisis_hotline',
        available24h: true,
        autoContact: true,
        description: 'Canadian crisis support',
        website: 'https://talksuicide.ca'
      });

      expect(mockPrisma.emergencyContact.create).toHaveBeenCalledWith({
        data: {
          country: 'CA',
          name: 'Canada Crisis Line',
          phoneNumber: '1-833-456-4566',
          type: 'crisis_hotline',
          available24h: true,
          autoContact: true,
          description: 'Canadian crisis support',
          website: 'https://talksuicide.ca'
        }
      });
    });
  });

  describe('updateEmergencyContact', () => {
    it('should update existing emergency contact', async () => {
      const updates = {
        name: 'Updated Crisis Line',
        phoneNumber: '999-888-7777',
        available24h: false
      };

      const mockUpdatedContact = {
        id: 'contact-1',
        country: 'US',
        name: 'Updated Crisis Line',
        phoneNumber: '999-888-7777',
        type: 'crisis_hotline',
        available24h: false,
        autoContact: true,
        description: 'Test description',
        website: 'https://test.com'
      };

      mockPrisma.emergencyContact.update.mockResolvedValue(mockUpdatedContact);

      const result = await emergencyContactsService.updateEmergencyContact('contact-1', updates);

      expect(result).toEqual({
        id: 'contact-1',
        country: 'US',
        name: 'Updated Crisis Line',
        phoneNumber: '999-888-7777',
        type: 'crisis_hotline',
        available24h: false,
        autoContact: true,
        description: 'Test description',
        website: 'https://test.com'
      });

      expect(mockPrisma.emergencyContact.update).toHaveBeenCalledWith({
        where: { id: 'contact-1' },
        data: {
          name: 'Updated Crisis Line',
          phoneNumber: '999-888-7777',
          available24h: false
        }
      });
    });
  });

  describe('deleteEmergencyContact', () => {
    it('should delete emergency contact', async () => {
      mockPrisma.emergencyContact.delete.mockResolvedValue({});

      await emergencyContactsService.deleteEmergencyContact('contact-1');

      expect(mockPrisma.emergencyContact.delete).toHaveBeenCalledWith({
        where: { id: 'contact-1' }
      });
    });
  });

  describe('initializeDefaultContacts', () => {
    it('should initialize default contacts if they do not exist', async () => {
      // Mock that no existing contacts are found
      mockPrisma.emergencyContact.findFirst.mockResolvedValue(null);
      mockPrisma.emergencyContact.create.mockResolvedValue({});

      await emergencyContactsService.initializeDefaultContacts();

      // Should check for existing contacts and create new ones
      expect(mockPrisma.emergencyContact.findFirst).toHaveBeenCalled();
      expect(mockPrisma.emergencyContact.create).toHaveBeenCalled();
    });

    it('should not create contacts if they already exist', async () => {
      // Mock that existing contacts are found
      mockPrisma.emergencyContact.findFirst.mockResolvedValue({
        id: 'existing-contact',
        country: 'US',
        phoneNumber: '988'
      });

      await emergencyContactsService.initializeDefaultContacts();

      // Should check for existing contacts but not create new ones
      expect(mockPrisma.emergencyContact.findFirst).toHaveBeenCalled();
      expect(mockPrisma.emergencyContact.create).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockPrisma.emergencyContact.findFirst.mockRejectedValue(new Error('Database error'));

      // Should not throw error
      await expect(emergencyContactsService.initializeDefaultContacts()).resolves.toBeUndefined();
    });
  });
});