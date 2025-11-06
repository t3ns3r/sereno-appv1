import { PrismaClient } from '@prisma/client';
import { pusher } from '../config/pusher';
import { getEmergencyContactsByCountry } from './emergencyContactsService';
import { notificationService } from './notificationService';

const prisma = new PrismaClient();

export interface EmergencyAlert {
  id: string;
  userId: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  status: 'active' | 'responded' | 'resolved';
  createdAt: Date;
  respondingSerenos: string[];
  officialContactsNotified: string[];
}

export interface EmergencyContact {
  id: string;
  country: string;
  name: string;
  phoneNumber: string;
  type: 'crisis_hotline' | 'emergency_services' | 'mental_health_facility';
  available24h: boolean;
  autoContact: boolean;
}

export class EmergencyService {
  async activatePanicButton(
    userId: string, 
    location?: { latitude: number; longitude: number; address?: string }
  ): Promise<EmergencyAlert> {
    try {
      // Get user information
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Create emergency alert
      const alert = await prisma.emergencyAlert.create({
        data: {
          userId,
          location: location ? JSON.stringify(location) : undefined,
          status: 'ACTIVE',
          respondingSerenos: [],
          officialContactsNotified: []
        }
      });

      // Get emergency contacts for user's country
      const emergencyContacts = await getEmergencyContactsByCountry(user.country);
      
      // Notify official emergency contacts that have autoContact enabled
      const autoContactIds: string[] = [];
      for (const contact of emergencyContacts.filter(c => c.autoContact)) {
        try {
          await this.notifyEmergencyContact(contact, user, alert.id);
          autoContactIds.push(contact.id);
        } catch (error) {
          console.error(`Failed to notify emergency contact ${contact.id}:`, error);
        }
      }

      // Find nearby SERENOS based on location or country
      const nearbySerenos = await this.findNearbySerenos(user.country, location);

      // Send emergency alert to SERENOS
      await notificationService.sendEmergencyAlertToSerenos(
        alert.id,
        location ? { 
          latitude: location.latitude, 
          longitude: location.longitude, 
          country: user.country 
        } : undefined
      );

      // Update alert with notified contacts
      const updatedAlert = await prisma.emergencyAlert.update({
        where: { id: alert.id },
        data: {
          officialContactsNotified: autoContactIds
        }
      });

      // Broadcast to real-time channel for immediate response
      await pusher.trigger(`emergency-${alert.id}`, 'alert-created', {
        alertId: alert.id,
        userId,
        location,
        emergencyContacts: emergencyContacts,
        timestamp: new Date().toISOString()
      });

      return {
        id: updatedAlert.id,
        userId: updatedAlert.userId,
        location: updatedAlert.location ? JSON.parse(updatedAlert.location as string) : undefined,
        status: updatedAlert.status as 'active' | 'responded' | 'resolved',
        createdAt: updatedAlert.createdAt,
        respondingSerenos: updatedAlert.respondingSerenos,
        officialContactsNotified: autoContactIds
      };

    } catch (error) {
      console.error('Error activating panic button:', error);
      throw new Error('Failed to activate emergency system');
    }
  }

  async respondToEmergency(alertId: string, serenoId: string): Promise<void> {
    try {
      const alert = await prisma.emergencyAlert.findUnique({
        where: { id: alertId },
        include: {
          user: {
            include: {
              profile: true
            }
          }
        }
      });

      if (!alert) {
        throw new Error('Emergency alert not found');
      }

      if (alert.status !== 'ACTIVE') {
        throw new Error('Emergency alert is no longer active');
      }

      // Add SERENO to responding list
      const updatedRespondingSerenos = [...alert.respondingSerenos, serenoId];
      
      await prisma.emergencyAlert.update({
        where: { id: alertId },
        data: {
          respondingSerenos: updatedRespondingSerenos,
          status: 'RESPONDED'
        }
      });

      // Import chat service
      const { chatService } = await import('./chatService');

      // Create emergency chat channel with context
      const emergencyContext = {
        location: alert.location ? JSON.parse(alert.location as string) : undefined,
        userProfile: alert.user.profile,
        emergencyAlert: alert
      };

      const chatChannelId = await chatService.createEmergencyChannel(
        alertId,
        alert.userId,
        serenoId,
        emergencyContext
      );

      // Get SERENO name for notification
      const sereno = await prisma.user.findUnique({
        where: { id: serenoId },
        include: { profile: true }
      });

      const serenoName = sereno?.profile?.firstName || 'Un SERENO';

      // Notify user that help is coming
      await notificationService.sendSerenoResponseNotification(
        alert.userId,
        serenoName,
        alertId
      );

      // Broadcast response to real-time channel
      await pusher.trigger(`emergency-${alertId}`, 'sereno-responded', {
        serenoId,
        chatChannelId: chatChannelId,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error responding to emergency:', error);
      throw new Error('Failed to respond to emergency');
    }
  }

  async resolveEmergency(alertId: string, userId: string): Promise<void> {
    try {
      const alert = await prisma.emergencyAlert.findUnique({
        where: { id: alertId }
      });

      if (!alert) {
        throw new Error('Emergency alert not found');
      }

      if (alert.userId !== userId) {
        throw new Error('Unauthorized to resolve this emergency');
      }

      await prisma.emergencyAlert.update({
        where: { id: alertId },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date()
        }
      });

      // Archive emergency chat channel
      const { chatService } = await import('./chatService');
      const emergencyChannel = await chatService.getEmergencyChannel(alertId);
      
      if (emergencyChannel) {
        await chatService.archiveEmergencyChannel(emergencyChannel.id, userId);
      }

      // Notify all responding SERENOS
      const notificationPromises = alert.respondingSerenos.map(serenoId =>
        notificationService.sendPushNotification(serenoId, {
          title: '✅ Emergencia Resuelta',
          body: 'El usuario ha marcado la emergencia como resuelta. Gracias por tu ayuda.',
          data: {
            type: 'emergency_resolved',
            alertId: alertId,
            action: 'view_summary'
          },
          icon: '/icons/success-icon-192.png',
          actions: [
            {
              action: 'view_summary',
              title: 'Ver Resumen'
            }
          ]
        })
      );

      await Promise.allSettled(notificationPromises);

      // Broadcast resolution
      await pusher.trigger(`emergency-${alertId}`, 'emergency-resolved', {
        alertId,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error resolving emergency:', error);
      throw new Error('Failed to resolve emergency');
    }
  }

  private async findNearbySerenos(country: string, location?: { latitude: number; longitude: number }) {
    // For now, find SERENOS in the same country
    // In a real implementation, you would use geospatial queries for location-based matching
    const serenos = await prisma.user.findMany({
      where: {
        role: 'SERENO',
        country: country,
        // Add availability status check here
      },
      take: 10 // Limit to 10 nearest SERENOS
    });

    return serenos;
  }

  private async notifyEmergencyContact(
    contact: EmergencyContact, 
    user: any, 
    alertId: string
  ): Promise<void> {
    // In a real implementation, this would integrate with SMS/email services
    // to automatically notify official emergency contacts
    console.log(`Notifying emergency contact ${contact.name} (${contact.phoneNumber}) about alert ${alertId} for user ${user.email}`);
    
    // For now, just log the notification
    // You could integrate with services like Twilio, SendGrid, etc.
  }

  async getEmergencyHistory(userId: string) {
    return await prisma.emergencyAlert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
  }

  async getActiveEmergencies(serenoId: string) {
    const sereno = await prisma.user.findUnique({
      where: { id: serenoId }
    });

    if (!sereno || sereno.role !== 'SERENO') {
      throw new Error('User is not a SERENO');
    }

    return await prisma.emergencyAlert.findMany({
      where: {
        status: 'ACTIVE',
        // Find emergencies in the same country
        user: {
          country: sereno.country
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
  }

  async getActiveAlertForUser(userId: string) {
    return await prisma.emergencyAlert.findFirst({
      where: {
        userId,
        status: 'ACTIVE'
      }
    });
  }

  async getEmergencyAlert(alertId: string, userId: string, userRole: string) {
    const alert = await prisma.emergencyAlert.findUnique({
      where: { id: alertId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            country: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                mentalHealthConditions: true
              }
            }
          }
        }
      }
    });

    if (!alert) {
      return null;
    }

    // Check access permissions
    const isOwner = alert.userId === userId;
    const isRespondingSereno = alert.respondingSerenos.includes(userId);
    const isSereno = userRole === 'SERENO';

    if (!isOwner && !isRespondingSereno && !isSereno) {
      throw new Error('Access denied');
    }

    return {
      ...alert,
      location: alert.location ? JSON.parse(alert.location as string) : undefined
    };
  }

  async registerSereno(userId: string, serenoData: {
    specializations: string[];
    availabilityHours: { start: string; end: string };
    maxResponseDistance: number;
  }) {
    // Update user role to SERENO
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'SERENO' }
    });

    // Update or create user profile with SERENO data
    await prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        preferences: {
          serenoData: {
            ...serenoData,
            verificationStatus: 'pending',
            isAvailable: false
          }
        }
      },
      update: {
        preferences: {
          serenoData: {
            ...serenoData,
            verificationStatus: 'pending',
            isAvailable: false
          }
        }
      }
    });
  }

  async updateSerenoAvailability(serenoId: string, isAvailable: boolean, location?: { latitude: number; longitude: number }) {
    const profile = await prisma.userProfile.findUnique({
      where: { userId: serenoId }
    });

    if (!profile) {
      throw new Error('SERENO profile not found');
    }

    const currentPreferences = profile.preferences as any || {};
    const serenoData = currentPreferences.serenoData || {};

    await prisma.userProfile.update({
      where: { userId: serenoId },
      data: {
        preferences: {
          ...currentPreferences,
          serenoData: {
            ...serenoData,
            isAvailable,
            currentLocation: location,
            lastLocationUpdate: new Date().toISOString()
          }
        }
      }
    });
  }

  async getSerenoStats(serenoId: string) {
    const totalResponses = await prisma.emergencyAlert.count({
      where: {
        respondingSerenos: {
          has: serenoId
        }
      }
    });

    const resolvedResponses = await prisma.emergencyAlert.count({
      where: {
        respondingSerenos: {
          has: serenoId
        },
        status: 'RESOLVED'
      }
    });

    const successRate = totalResponses > 0 ? (resolvedResponses / totalResponses) * 100 : 0;

    const avgResponseTime = await this.calculateAverageResponseTime(serenoId);

    return {
      totalResponses,
      resolvedResponses,
      successRate: Math.round(successRate * 100) / 100,
      averageResponseTime: avgResponseTime
    };
  }

  private async calculateAverageResponseTime(serenoId: string): Promise<number> {
    // This would require storing response timestamps
    // For now, return a mock value
    return 120; // 2 minutes average
  }
}

export const emergencyService = new EmergencyService();