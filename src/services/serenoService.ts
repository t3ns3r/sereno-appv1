import { PrismaClient, UserRole } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface SerenoRegistrationData {
  userId: string;
  verificationDocuments?: string[];
  specializations: string[];
  availabilityHours: {
    start: string;
    end: string;
  };
  maxResponseDistance: number; // in kilometers
}

export interface SerenoAvailability {
  serenoId: string;
  isAvailable: boolean;
  location?: {
    latitude: number;
    longitude: number;
  };
  lastSeen: Date;
}

export class SerenoService {
  /**
   * Register a user as a SERENO volunteer
   */
  async registerSereno(data: SerenoRegistrationData): Promise<void> {
    try {
      // Update user role to SERENO
      await prisma.user.update({
        where: { id: data.userId },
        data: { role: UserRole.SERENO }
      });

      // Update user profile with SERENO-specific data
      await prisma.userProfile.upsert({
        where: { userId: data.userId },
        update: {
          preferences: {
            serenoData: {
              specializations: data.specializations,
              availabilityHours: data.availabilityHours,
              maxResponseDistance: data.maxResponseDistance,
              verificationStatus: 'pending',
              verificationDocuments: data.verificationDocuments || [],
              registeredAt: new Date().toISOString()
            }
          }
        },
        create: {
          userId: data.userId,
          preferences: {
            serenoData: {
              specializations: data.specializations,
              availabilityHours: data.availabilityHours,
              maxResponseDistance: data.maxResponseDistance,
              verificationStatus: 'pending',
              verificationDocuments: data.verificationDocuments || [],
              registeredAt: new Date().toISOString()
            }
          }
        }
      });

      logger.info(`User ${data.userId} registered as SERENO`);
    } catch (error) {
      logger.error('Error registering SERENO:', error);
      throw new Error('Failed to register as SERENO');
    }
  }

  /**
   * Verify a SERENO volunteer
   */
  async verifySereno(serenoId: string, adminId: string): Promise<void> {
    try {
      const profile = await prisma.userProfile.findUnique({
        where: { userId: serenoId }
      });

      if (!profile || !profile.preferences) {
        throw new Error('SERENO profile not found');
      }

      const preferences = profile.preferences as any;
      preferences.serenoData.verificationStatus = 'verified';
      preferences.serenoData.verifiedBy = adminId;
      preferences.serenoData.verifiedAt = new Date().toISOString();

      await prisma.userProfile.update({
        where: { userId: serenoId },
        data: { preferences }
      });

      logger.info(`SERENO ${serenoId} verified by admin ${adminId}`);
    } catch (error) {
      logger.error('Error verifying SERENO:', error);
      throw new Error('Failed to verify SERENO');
    }
  }

  /**
   * Get available SERENOS within a geographic area
   */
  async getAvailableSerenos(
    userLocation: { latitude: number; longitude: number },
    maxDistance: number = 50
  ): Promise<any[]> {
    try {
      // Get all verified SERENOS
      const serenos = await prisma.user.findMany({
        where: { role: UserRole.SERENO },
        include: {
          profile: true
        }
      });

      // Filter verified and available SERENOS
      const availableSerenos = serenos.filter(sereno => {
        if (!sereno.profile?.preferences) return false;
        
        const serenoData = (sereno.profile.preferences as any)?.serenoData;
        if (!serenoData || serenoData.verificationStatus !== 'verified') return false;

        // Check availability hours (simplified - would need more complex logic for timezones)
        const now = new Date();
        const currentHour = now.getHours();
        const startHour = parseInt(serenoData.availabilityHours.start.split(':')[0]);
        const endHour = parseInt(serenoData.availabilityHours.end.split(':')[0]);
        
        if (currentHour < startHour || currentHour > endHour) return false;

        // TODO: Add distance calculation based on location
        // For now, return all available SERENOS
        return true;
      });

      return availableSerenos.map(sereno => ({
        id: sereno.id,
        username: sereno.username,
        country: sereno.country,
        specializations: (sereno.profile?.preferences as any)?.serenoData?.specializations || [],
        responseDistance: (sereno.profile?.preferences as any)?.serenoData?.maxResponseDistance || 50
      }));
    } catch (error) {
      logger.error('Error getting available SERENOS:', error);
      throw new Error('Failed to get available SERENOS');
    }
  }

  /**
   * Update SERENO availability status
   */
  async updateAvailability(serenoId: string, availability: SerenoAvailability): Promise<void> {
    try {
      const profile = await prisma.userProfile.findUnique({
        where: { userId: serenoId }
      });

      if (!profile || !profile.preferences) {
        throw new Error('SERENO profile not found');
      }

      const preferences = profile.preferences as any;
      if (!preferences.serenoData) {
        throw new Error('User is not a SERENO');
      }

      preferences.serenoData.currentAvailability = {
        isAvailable: availability.isAvailable,
        location: availability.location,
        lastSeen: availability.lastSeen.toISOString()
      };

      await prisma.userProfile.update({
        where: { userId: serenoId },
        data: { preferences }
      });

      logger.info(`SERENO ${serenoId} availability updated`);
    } catch (error) {
      logger.error('Error updating SERENO availability:', error);
      throw new Error('Failed to update availability');
    }
  }

  /**
   * Get SERENO response statistics
   */
  async getSerenoStats(serenoId: string): Promise<any> {
    try {
      // Get emergency alerts this SERENO has responded to
      const responses = await prisma.emergencyAlert.findMany({
        where: {
          respondingSerenos: {
            has: serenoId
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const totalResponses = responses.length;
      const resolvedResponses = responses.filter(alert => alert.status === 'RESOLVED').length;
      
      // Calculate average response time (simplified)
      const avgResponseTime = responses.length > 0 
        ? responses.reduce((acc, alert) => {
            const responseTime = alert.resolvedAt 
              ? new Date(alert.resolvedAt).getTime() - new Date(alert.createdAt).getTime()
              : 0;
            return acc + responseTime;
          }, 0) / responses.length
        : 0;

      return {
        totalResponses,
        resolvedResponses,
        successRate: totalResponses > 0 ? (resolvedResponses / totalResponses) * 100 : 0,
        averageResponseTime: Math.round(avgResponseTime / (1000 * 60)), // in minutes
        recentResponses: responses.slice(0, 10)
      };
    } catch (error) {
      logger.error('Error getting SERENO stats:', error);
      throw new Error('Failed to get SERENO statistics');
    }
  }
}

export const serenoService = new SerenoService();