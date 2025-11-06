import { PrismaClient, EmergencyContactType } from '@prisma/client';

const prisma = new PrismaClient();

export const emergencyContactsData = [
  // Spain
  {
    country: 'ES',
    name: 'Teléfono de la Esperanza',
    phoneNumber: '717003717',
    type: EmergencyContactType.CRISIS_HOTLINE,
    available24h: true,
    autoContact: false
  },
  {
    country: 'ES',
    name: 'Emergencias Sanitarias',
    phoneNumber: '112',
    type: EmergencyContactType.EMERGENCY_SERVICES,
    available24h: true,
    autoContact: true
  },
  {
    country: 'ES',
    name: 'Salud Mental España',
    phoneNumber: '914440009',
    type: EmergencyContactType.MENTAL_HEALTH_FACILITY,
    available24h: false,
    autoContact: false
  },

  // Mexico
  {
    country: 'MX',
    name: 'Línea de la Vida',
    phoneNumber: '8009112000',
    type: EmergencyContactType.CRISIS_HOTLINE,
    available24h: true,
    autoContact: false
  },
  {
    country: 'MX',
    name: 'Cruz Roja Mexicana',
    phoneNumber: '911',
    type: EmergencyContactType.EMERGENCY_SERVICES,
    available24h: true,
    autoContact: true
  },
  {
    country: 'MX',
    name: 'SAPTEL',
    phoneNumber: '5552595121',
    type: EmergencyContactType.CRISIS_HOTLINE,
    available24h: true,
    autoContact: false
  },

  // Argentina
  {
    country: 'AR',
    name: 'Centro de Asistencia al Suicida',
    phoneNumber: '1354000135',
    type: EmergencyContactType.CRISIS_HOTLINE,
    available24h: true,
    autoContact: false
  },
  {
    country: 'AR',
    name: 'SAME',
    phoneNumber: '107',
    type: EmergencyContactType.EMERGENCY_SERVICES,
    available24h: true,
    autoContact: true
  },

  // Colombia
  {
    country: 'CO',
    name: 'Línea 106',
    phoneNumber: '106',
    type: EmergencyContactType.CRISIS_HOTLINE,
    available24h: true,
    autoContact: false
  },
  {
    country: 'CO',
    name: 'Cruz Roja Colombiana',
    phoneNumber: '132',
    type: EmergencyContactType.EMERGENCY_SERVICES,
    available24h: true,
    autoContact: true
  },

  // United States
  {
    country: 'US',
    name: '988 Suicide & Crisis Lifeline',
    phoneNumber: '988',
    type: EmergencyContactType.CRISIS_HOTLINE,
    available24h: true,
    autoContact: false
  },
  {
    country: 'US',
    name: 'Emergency Services',
    phoneNumber: '911',
    type: EmergencyContactType.EMERGENCY_SERVICES,
    available24h: true,
    autoContact: true
  },
  {
    country: 'US',
    name: 'Crisis Text Line',
    phoneNumber: '741741',
    type: EmergencyContactType.CRISIS_HOTLINE,
    available24h: true,
    autoContact: false
  }
];

export async function seedEmergencyContacts() {
  console.log('Seeding emergency contacts...');
  
  for (const contact of emergencyContactsData) {
    await prisma.emergencyContact.upsert({
      where: {
        id: `${contact.country}-${contact.phoneNumber}`
      },
      update: contact,
      create: {
        id: `${contact.country}-${contact.phoneNumber}`,
        ...contact
      }
    });
  }
  
  console.log('Emergency contacts seeded successfully');
}

if (require.main === module) {
  seedEmergencyContacts()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}