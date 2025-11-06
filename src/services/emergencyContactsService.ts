import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface EmergencyContact {
  id: string;
  country: string;
  name: string;
  phoneNumber: string;
  type: 'crisis_hotline' | 'emergency_services' | 'mental_health_facility';
  available24h: boolean;
  autoContact: boolean;
  description?: string;
  website?: string;
}

// Default emergency contacts by country
const DEFAULT_EMERGENCY_CONTACTS: Record<string, EmergencyContact[]> = {
  'US': [
    {
      id: 'us-988',
      country: 'US',
      name: 'Suicide & Crisis Lifeline',
      phoneNumber: '988',
      type: 'crisis_hotline',
      available24h: true,
      autoContact: true,
      description: 'National suicide prevention lifeline',
      website: 'https://suicidepreventionlifeline.org'
    },
    {
      id: 'us-911',
      country: 'US',
      name: 'Emergency Services',
      phoneNumber: '911',
      type: 'emergency_services',
      available24h: true,
      autoContact: false,
      description: 'Emergency services for immediate danger'
    }
  ],
  'MX': [
    {
      id: 'mx-saptel',
      country: 'MX',
      name: 'SAPTEL',
      phoneNumber: '55 5259 8121',
      type: 'crisis_hotline',
      available24h: true,
      autoContact: true,
      description: 'Sistema Nacional de Apoyo, Consejo Psicológico e Intervención en Crisis por Teléfono',
      website: 'https://saptel.org.mx'
    },
    {
      id: 'mx-911',
      country: 'MX',
      name: 'Servicios de Emergencia',
      phoneNumber: '911',
      type: 'emergency_services',
      available24h: true,
      autoContact: false,
      description: 'Servicios de emergencia para peligro inmediato'
    }
  ],
  'ES': [
    {
      id: 'es-telefono-esperanza',
      country: 'ES',
      name: 'Teléfono de la Esperanza',
      phoneNumber: '717 003 717',
      type: 'crisis_hotline',
      available24h: true,
      autoContact: true,
      description: 'Teléfono de ayuda para crisis emocionales',
      website: 'https://telefonodelaesperanza.org'
    },
    {
      id: 'es-112',
      country: 'ES',
      name: 'Emergencias',
      phoneNumber: '112',
      type: 'emergency_services',
      available24h: true,
      autoContact: false,
      description: 'Número único de emergencias europeo'
    }
  ],
  'AR': [
    {
      id: 'ar-centro-asistencia',
      country: 'AR',
      name: 'Centro de Asistencia al Suicida',
      phoneNumber: '135',
      type: 'crisis_hotline',
      available24h: true,
      autoContact: true,
      description: 'Línea de prevención del suicidio',
      website: 'https://www.casbuenosaires.com.ar'
    },
    {
      id: 'ar-911',
      country: 'AR',
      name: 'Emergencias',
      phoneNumber: '911',
      type: 'emergency_services',
      available24h: true,
      autoContact: false,
      description: 'Servicios de emergencia'
    }
  ],
  'CO': [
    {
      id: 'co-linea-106',
      country: 'CO',
      name: 'Línea 106',
      phoneNumber: '106',
      type: 'crisis_hotline',
      available24h: true,
      autoContact: true,
      description: 'Línea de atención psicológica y apoyo en crisis',
      website: 'https://www.minsalud.gov.co'
    },
    {
      id: 'co-123',
      country: 'CO',
      name: 'Emergencias',
      phoneNumber: '123',
      type: 'emergency_services',
      available24h: true,
      autoContact: false,
      description: 'Línea única de emergencias'
    }
  ]
};

export class EmergencyContactsService {
  async getEmergencyContactsByCountry(country: string): Promise<EmergencyContact[]> {
    try {
      // First, try to get contacts from database
      const dbContacts = await prisma.emergencyContact.findMany({
        where: { country: country.toUpperCase() }
      });

      if (dbContacts.length > 0) {
        return dbContacts.map(contact => ({
          id: contact.id,
          country: contact.country,
          name: contact.name,
          phoneNumber: contact.phoneNumber,
          type: contact.type as 'crisis_hotline' | 'emergency_services' | 'mental_health_facility',
          available24h: contact.available24h,
          autoContact: contact.autoContact,
          description: contact.description || undefined,
          website: contact.website || undefined
        }));
      }

      // Fallback to default contacts
      const defaultContacts = DEFAULT_EMERGENCY_CONTACTS[country.toUpperCase()] || [];
      
      // If no default contacts, provide generic emergency number
      if (defaultContacts.length === 0) {
        return [{
          id: `${country.toLowerCase()}-generic`,
          country: country.toUpperCase(),
          name: 'Servicios de Emergencia',
          phoneNumber: '911', // Most common emergency number
          type: 'emergency_services',
          available24h: true,
          autoContact: false,
          description: 'Servicios de emergencia locales'
        }];
      }

      return defaultContacts;

    } catch (error) {
      console.error('Error getting emergency contacts:', error);
      // Return basic emergency contact as fallback
      return [{
        id: `${country.toLowerCase()}-fallback`,
        country: country.toUpperCase(),
        name: 'Emergencias',
        phoneNumber: '911',
        type: 'emergency_services',
        available24h: true,
        autoContact: false,
        description: 'Servicios de emergencia'
      }];
    }
  }

  async addEmergencyContact(contact: Omit<EmergencyContact, 'id'>): Promise<EmergencyContact> {
    const dbContact = await prisma.emergencyContact.create({
      data: {
        country: contact.country.toUpperCase(),
        name: contact.name,
        phoneNumber: contact.phoneNumber,
        type: contact.type,
        available24h: contact.available24h,
        autoContact: contact.autoContact,
        description: contact.description,
        website: contact.website
      }
    });

    return {
      id: dbContact.id,
      country: dbContact.country,
      name: dbContact.name,
      phoneNumber: dbContact.phoneNumber,
      type: dbContact.type as 'crisis_hotline' | 'emergency_services' | 'mental_health_facility',
      available24h: dbContact.available24h,
      autoContact: dbContact.autoContact,
      description: dbContact.description || undefined,
      website: dbContact.website || undefined
    };
  }

  async updateEmergencyContact(id: string, updates: Partial<EmergencyContact>): Promise<EmergencyContact> {
    const dbContact = await prisma.emergencyContact.update({
      where: { id },
      data: {
        ...(updates.country && { country: updates.country.toUpperCase() }),
        ...(updates.name && { name: updates.name }),
        ...(updates.phoneNumber && { phoneNumber: updates.phoneNumber }),
        ...(updates.type && { type: updates.type }),
        ...(updates.available24h !== undefined && { available24h: updates.available24h }),
        ...(updates.autoContact !== undefined && { autoContact: updates.autoContact }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.website !== undefined && { website: updates.website })
      }
    });

    return {
      id: dbContact.id,
      country: dbContact.country,
      name: dbContact.name,
      phoneNumber: dbContact.phoneNumber,
      type: dbContact.type as 'crisis_hotline' | 'emergency_services' | 'mental_health_facility',
      available24h: dbContact.available24h,
      autoContact: dbContact.autoContact,
      description: dbContact.description || undefined,
      website: dbContact.website || undefined
    };
  }

  async deleteEmergencyContact(id: string): Promise<void> {
    await prisma.emergencyContact.delete({
      where: { id }
    });
  }

  async initializeDefaultContacts(): Promise<void> {
    try {
      for (const [country, contacts] of Object.entries(DEFAULT_EMERGENCY_CONTACTS)) {
        for (const contact of contacts) {
          const existing = await prisma.emergencyContact.findFirst({
            where: {
              country: contact.country,
              phoneNumber: contact.phoneNumber
            }
          });

          if (!existing) {
            await prisma.emergencyContact.create({
              data: {
                country: contact.country,
                name: contact.name,
                phoneNumber: contact.phoneNumber,
                type: contact.type,
                available24h: contact.available24h,
                autoContact: contact.autoContact,
                description: contact.description,
                website: contact.website
              }
            });
          }
        }
      }
      console.log('Default emergency contacts initialized');
    } catch (error) {
      console.error('Error initializing default emergency contacts:', error);
    }
  }
}

export const emergencyContactsService = new EmergencyContactsService();
export const getEmergencyContactsByCountry = (country: string) => 
  emergencyContactsService.getEmergencyContactsByCountry(country);