import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { UserRole } from '@prisma/client';

export interface UserDataExport {
  user: {
    id: string;
    email: string;
    username: string;
    country: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
  };
  profile?: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: Date;
    mentalHealthConditions: string[];
    preferences: any;
    emergencyContacts: any[];
  };
  moodEntries: any[];
  breathingExercises: any[];
  emergencyAlerts: any[];
  dailyTracking: any[];
  activities: any[];
  educationalProgress: any[];
  notificationPreferences?: any;
  serenitoInteractions: any[];
  fakeCallSettings?: any;
  fakeCalls: any[];
}

export interface PrivacySettings {
  dataProcessingConsent: boolean;
  analyticsConsent: boolean;
  marketingConsent: boolean;
  locationSharingConsent: boolean;
  emergencyLocationConsent: boolean;
  dataRetentionPeriod: number; // in days
  allowDataExport: boolean;
  allowAccountDeletion: boolean;
}

export interface ConsentRecord {
  id: string;
  userId: string;
  consentType: string;
  granted: boolean;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export class DataManagementService {
  /**
   * Export all user data in a structured format (GDPR Article 20)
   */
  async exportUserData(userId: string): Promise<UserDataExport> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        moodEntries: true,
        breathingExercises: true,
        emergencyAlerts: true,
        serenitoInteractions: true,
        fakeCallSettings: true,
        fakeCalls: true,
        notificationPreferences: true,
        contentProgress: {
          include: {
            content: {
              select: {
                title: true,
                category: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Get daily tracking data
    const dailyTracking = await prisma.dailyTracking.findMany({
      where: { userId }
    });

    // Get activities the user is registered for
    const activities = await prisma.activity.findMany({
      where: {
        registeredUsers: {
          some: { id: userId }
        }
      }
    });

    // Sanitize sensitive data for export
    const exportData: UserDataExport = {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        country: user.country,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      profile: user.profile ? {
        firstName: user.profile.firstName || undefined,
        lastName: user.profile.lastName || undefined,
        dateOfBirth: user.profile.dateOfBirth || undefined,
        mentalHealthConditions: user.profile.mentalHealthConditions,
        preferences: user.profile.preferences,
        emergencyContacts: user.profile.emergencyContacts
      } : undefined,
      moodEntries: user.moodEntries.map(entry => ({
        id: entry.id,
        selectedEmotion: entry.selectedEmotion,
        textDescription: entry.textDescription,
        analysisResult: entry.analysisResult,
        createdAt: entry.createdAt
      })),
      breathingExercises: user.breathingExercises.map(exercise => ({
        id: exercise.id,
        configuration: exercise.configuration,
        duration: exercise.duration,
        completedAt: exercise.completedAt
      })),
      emergencyAlerts: user.emergencyAlerts.map(alert => ({
        id: alert.id,
        status: alert.status,
        createdAt: alert.createdAt,
        resolvedAt: alert.resolvedAt
        // Note: location data excluded for privacy
      })),
      dailyTracking: dailyTracking.map(tracking => ({
        id: tracking.id,
        confidenceLevel: tracking.confidenceLevel,
        emotionalState: tracking.emotionalState,
        notes: tracking.notes,
        date: tracking.date,
        createdAt: tracking.createdAt
      })),
      activities: activities.map(activity => ({
        id: activity.id,
        title: activity.title,
        description: activity.description,
        category: activity.category,
        eventDate: activity.eventDate,
        location: activity.location
      })),
      educationalProgress: user.contentProgress.map(progress => ({
        contentTitle: progress.content.title,
        category: progress.content.category,
        completed: progress.completed,
        progress: progress.progress,
        timeSpent: progress.timeSpent,
        createdAt: progress.createdAt
      })),
      notificationPreferences: user.notificationPreferences,
      serenitoInteractions: user.serenitoInteractions.map(interaction => ({
        id: interaction.id,
        context: interaction.context,
        expression: interaction.expression,
        message: interaction.message,
        createdAt: interaction.createdAt
      })),
      fakeCallSettings: user.fakeCallSettings,
      fakeCalls: user.fakeCalls.map(call => ({
        id: call.id,
        scheduledTime: call.scheduledTime,
        answered: call.answered,
        redirectAction: call.redirectAction,
        createdAt: call.createdAt
      }))
    };

    return exportData;
  }

  /**
   * Delete user account and all associated data (GDPR Article 17 - Right to be forgotten)
   */
  async deleteUserAccount(userId: string, reason?: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Log the deletion request for audit purposes
    await this.logAccountDeletion(userId, reason);

    // Delete user and all related data (cascade deletes will handle most relations)
    await prisma.$transaction(async (tx) => {
      // Delete daily tracking data (not in cascade)
      await tx.dailyTracking.deleteMany({
        where: { userId }
      });

      // Remove user from activity participants (using update instead of updateMany for relations)
      const userActivities = await tx.activity.findMany({
        where: {
          registeredUsers: {
            some: { id: userId }
          }
        }
      });

      for (const activity of userActivities) {
        await tx.activity.update({
          where: { id: activity.id },
          data: {
            registeredUsers: {
              disconnect: { id: userId }
            }
          }
        });
      }

      // Remove user from chat channels (using update instead of updateMany for relations)
      const userChannels = await tx.chatChannel.findMany({
        where: {
          participants: {
            some: { id: userId }
          }
        }
      });

      for (const channel of userChannels) {
        await tx.chatChannel.update({
          where: { id: channel.id },
          data: {
            participants: {
              disconnect: { id: userId }
            }
          }
        });
      }

      // Delete the user (this will cascade delete most related data)
      await tx.user.delete({
        where: { id: userId }
      });
    });
  }

  /**
   * Get user's privacy settings
   */
  async getPrivacySettings(userId: string): Promise<PrivacySettings> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true
      }
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Get privacy settings from user preferences or use defaults
    const preferences = user.profile?.preferences as any || {};
    const privacySettings = preferences.privacy || {};

    return {
      dataProcessingConsent: privacySettings.dataProcessingConsent ?? true,
      analyticsConsent: privacySettings.analyticsConsent ?? false,
      marketingConsent: privacySettings.marketingConsent ?? false,
      locationSharingConsent: privacySettings.locationSharingConsent ?? false,
      emergencyLocationConsent: privacySettings.emergencyLocationConsent ?? true,
      dataRetentionPeriod: privacySettings.dataRetentionPeriod ?? 365,
      allowDataExport: privacySettings.allowDataExport ?? true,
      allowAccountDeletion: privacySettings.allowAccountDeletion ?? true
    };
  }

  /**
   * Update user's privacy settings
   */
  async updatePrivacySettings(userId: string, settings: Partial<PrivacySettings>): Promise<PrivacySettings> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const currentPreferences = user.profile?.preferences as any || {};
    const currentPrivacy = currentPreferences.privacy || {};

    const updatedPrivacy = {
      ...currentPrivacy,
      ...settings
    };

    // Update user profile with new privacy settings
    await prisma.userProfile.update({
      where: { userId },
      data: {
        preferences: {
          ...currentPreferences,
          privacy: updatedPrivacy
        }
      }
    });

    // Log consent changes
    await this.logConsentChanges(userId, settings);

    return updatedPrivacy;
  }

  /**
   * Record user consent for specific purposes
   */
  async recordConsent(
    userId: string, 
    consentType: string, 
    granted: boolean, 
    ipAddress?: string, 
    userAgent?: string
  ): Promise<ConsentRecord> {
    // For now, we'll store consent records in the user preferences
    // In a production system, you might want a separate consent_records table
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const consentRecord: ConsentRecord = {
      id: `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      consentType,
      granted,
      timestamp: new Date(),
      ipAddress,
      userAgent
    };

    const currentPreferences = user.profile?.preferences as any || {};
    const consentHistory = currentPreferences.consentHistory || [];

    // Add new consent record to history
    consentHistory.push(consentRecord);

    // Update user profile with consent history
    await prisma.userProfile.update({
      where: { userId },
      data: {
        preferences: {
          ...currentPreferences,
          consentHistory
        }
      }
    });

    return consentRecord;
  }

  /**
   * Get user's consent history
   */
  async getConsentHistory(userId: string): Promise<ConsentRecord[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const preferences = user.profile?.preferences as any || {};
    return preferences.consentHistory || [];
  }

  /**
   * Check if user has given consent for a specific purpose
   */
  async hasConsent(userId: string, consentType: string): Promise<boolean> {
    const consentHistory = await this.getConsentHistory(userId);
    
    // Get the most recent consent record for this type
    const latestConsent = consentHistory
      .filter(record => record.consentType === consentType)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    return latestConsent ? latestConsent.granted : false;
  }

  /**
   * Log account deletion for audit purposes
   */
  private async logAccountDeletion(userId: string, reason?: string): Promise<void> {
    // In a production system, you might want to log this to a separate audit table
    // For now, we'll use a simple log entry
    console.log(`Account deletion requested for user ${userId}`, {
      userId,
      reason,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log consent changes for audit purposes
   */
  private async logConsentChanges(userId: string, changes: Partial<PrivacySettings>): Promise<void> {
    console.log(`Privacy settings updated for user ${userId}`, {
      userId,
      changes,
      timestamp: new Date().toISOString()
    });
  }
}