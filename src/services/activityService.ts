import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { activityNotificationService } from './activityNotificationService';

const prisma = new PrismaClient();

export interface CreateActivityData {
  title: string;
  description: string;
  country: string;
  category: 'GROUP_THERAPY' | 'MINDFULNESS' | 'SUPPORT_GROUP' | 'WELLNESS_WORKSHOP';
  eventDate: Date;
  location: string;
  organizerId: string;
  maxParticipants?: number;
}

export interface ActivityFilters {
  country?: string;
  category?: string;
  startDate?: Date;
  endDate?: Date;
  hasAvailableSpots?: boolean;
}

export class ActivityService {
  async createActivity(data: CreateActivityData) {
    try {
      const activity = await prisma.activity.create({
        data: {
          title: data.title,
          description: data.description,
          country: data.country,
          category: data.category,
          eventDate: data.eventDate,
          location: data.location,
          organizerId: data.organizerId,
          maxParticipants: data.maxParticipants
        },
        include: {
          organizer: {
            select: {
              id: true,
              username: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          registeredUsers: {
            select: {
              id: true,
              username: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      });

      logger.info(`Activity created: ${activity.id} by organizer ${data.organizerId}`);
      return activity;
    } catch (error) {
      logger.error('Error creating activity:', error);
      throw new Error('Failed to create activity');
    }
  }

  async getActivitiesByCountry(country: string, filters?: ActivityFilters) {
    try {
      const whereClause: any = {
        country: country,
        eventDate: {
          gte: new Date() // Only future activities
        }
      };

      if (filters?.category) {
        whereClause.category = filters.category;
      }

      if (filters?.startDate) {
        whereClause.eventDate.gte = filters.startDate;
      }

      if (filters?.endDate) {
        whereClause.eventDate.lte = filters.endDate;
      }

      const activities = await prisma.activity.findMany({
        where: whereClause,
        include: {
          organizer: {
            select: {
              id: true,
              username: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          registeredUsers: {
            select: {
              id: true,
              username: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        },
        orderBy: {
          eventDate: 'asc'
        }
      });

      // Filter by available spots if requested
      if (filters?.hasAvailableSpots) {
        return activities.filter(activity => {
          if (!activity.maxParticipants) return true;
          return activity.registeredUsers.length < activity.maxParticipants;
        });
      }

      return activities;
    } catch (error) {
      logger.error('Error fetching activities by country:', error);
      throw new Error('Failed to fetch activities');
    }
  }

  async getActivityById(activityId: string) {
    try {
      const activity = await prisma.activity.findUnique({
        where: {
          id: activityId
        },
        include: {
          organizer: {
            select: {
              id: true,
              username: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          registeredUsers: {
            select: {
              id: true,
              username: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      });

      if (!activity) {
        throw new Error('Activity not found');
      }

      return activity;
    } catch (error) {
      logger.error('Error fetching activity by ID:', error);
      throw new Error('Failed to fetch activity');
    }
  }

  async registerUserForActivity(activityId: string, userId: string) {
    try {
      // First check if activity exists and has available spots
      const activity = await this.getActivityById(activityId);
      
      if (activity.maxParticipants && activity.registeredUsers.length >= activity.maxParticipants) {
        throw new Error('Activity is full');
      }

      // Check if user is already registered
      const isAlreadyRegistered = activity.registeredUsers.some(user => user.id === userId);
      if (isAlreadyRegistered) {
        throw new Error('User is already registered for this activity');
      }

      // Check if activity is in the future
      if (activity.eventDate < new Date()) {
        throw new Error('Cannot register for past activities');
      }

      const updatedActivity = await prisma.activity.update({
        where: {
          id: activityId
        },
        data: {
          registeredUsers: {
            connect: {
              id: userId
            }
          }
        },
        include: {
          organizer: {
            select: {
              id: true,
              username: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          registeredUsers: {
            select: {
              id: true,
              username: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      });

      logger.info(`User ${userId} registered for activity ${activityId}`);
      
      // Send notification to organizer about new registration
      try {
        await activityNotificationService.notifyNewRegistration(activityId, userId);
      } catch (notificationError) {
        logger.error('Failed to send registration notification:', notificationError);
        // Don't fail the registration if notification fails
      }
      
      return updatedActivity;
    } catch (error) {
      logger.error('Error registering user for activity:', error);
      throw error;
    }
  }

  async unregisterUserFromActivity(activityId: string, userId: string) {
    try {
      const activity = await this.getActivityById(activityId);
      
      // Check if user is registered
      const isRegistered = activity.registeredUsers.some(user => user.id === userId);
      if (!isRegistered) {
        throw new Error('User is not registered for this activity');
      }

      const updatedActivity = await prisma.activity.update({
        where: {
          id: activityId
        },
        data: {
          registeredUsers: {
            disconnect: {
              id: userId
            }
          }
        },
        include: {
          organizer: {
            select: {
              id: true,
              username: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          registeredUsers: {
            select: {
              id: true,
              username: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      });

      logger.info(`User ${userId} unregistered from activity ${activityId}`);
      
      // Send notification to organizer about unregistration
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { profile: true }
        });
        const userName = user?.profile?.firstName || user?.username || 'Usuario';
        await activityNotificationService.notifyUnregistration(activityId, userId, userName);
      } catch (notificationError) {
        logger.error('Failed to send unregistration notification:', notificationError);
        // Don't fail the unregistration if notification fails
      }
      
      return updatedActivity;
    } catch (error) {
      logger.error('Error unregistering user from activity:', error);
      throw error;
    }
  }

  async getUserActivities(userId: string) {
    try {
      const activities = await prisma.activity.findMany({
        where: {
          registeredUsers: {
            some: {
              id: userId
            }
          }
        },
        include: {
          organizer: {
            select: {
              id: true,
              username: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          registeredUsers: {
            select: {
              id: true,
              username: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        },
        orderBy: {
          eventDate: 'asc'
        }
      });

      return activities;
    } catch (error) {
      logger.error('Error fetching user activities:', error);
      throw new Error('Failed to fetch user activities');
    }
  }

  async getOrganizerActivities(organizerId: string) {
    try {
      const activities = await prisma.activity.findMany({
        where: {
          organizerId: organizerId
        },
        include: {
          organizer: {
            select: {
              id: true,
              username: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          registeredUsers: {
            select: {
              id: true,
              username: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        },
        orderBy: {
          eventDate: 'asc'
        }
      });

      return activities;
    } catch (error) {
      logger.error('Error fetching organizer activities:', error);
      throw new Error('Failed to fetch organizer activities');
    }
  }

  async updateActivity(activityId: string, organizerId: string, updateData: Partial<CreateActivityData>) {
    try {
      // Verify the organizer owns this activity
      const activity = await prisma.activity.findUnique({
        where: { id: activityId }
      });

      if (!activity) {
        throw new Error('Activity not found');
      }

      if (activity.organizerId !== organizerId) {
        throw new Error('Unauthorized to update this activity');
      }

      const updatedActivity = await prisma.activity.update({
        where: {
          id: activityId
        },
        data: updateData,
        include: {
          organizer: {
            select: {
              id: true,
              username: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          registeredUsers: {
            select: {
              id: true,
              username: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      });

      logger.info(`Activity ${activityId} updated by organizer ${organizerId}`);
      
      // Send notification to participants about activity update
      try {
        const changes = Object.keys(updateData).join(', ');
        await activityNotificationService.notifyActivityUpdate(activityId, `Se han actualizado: ${changes}`);
      } catch (notificationError) {
        logger.error('Failed to send activity update notification:', notificationError);
        // Don't fail the update if notification fails
      }
      
      return updatedActivity;
    } catch (error) {
      logger.error('Error updating activity:', error);
      throw error;
    }
  }

  async deleteActivity(activityId: string, organizerId: string, reason?: string) {
    try {
      // Verify the organizer owns this activity
      const activity = await prisma.activity.findUnique({
        where: { id: activityId }
      });

      if (!activity) {
        throw new Error('Activity not found');
      }

      if (activity.organizerId !== organizerId) {
        throw new Error('Unauthorized to delete this activity');
      }

      // Send cancellation notification to participants before deleting
      try {
        await activityNotificationService.notifyActivityCancellation(activityId, reason);
      } catch (notificationError) {
        logger.error('Failed to send activity cancellation notification:', notificationError);
        // Continue with deletion even if notification fails
      }

      await prisma.activity.delete({
        where: {
          id: activityId
        }
      });

      logger.info(`Activity ${activityId} deleted by organizer ${organizerId}`);
      return { success: true };
    } catch (error) {
      logger.error('Error deleting activity:', error);
      throw error;
    }
  }

  async getActivityStats(activityId: string) {
    try {
      const activity = await this.getActivityById(activityId);
      
      return {
        totalRegistered: activity.registeredUsers.length,
        maxParticipants: activity.maxParticipants,
        availableSpots: activity.maxParticipants ? activity.maxParticipants - activity.registeredUsers.length : null,
        isFull: activity.maxParticipants ? activity.registeredUsers.length >= activity.maxParticipants : false
      };
    } catch (error) {
      logger.error('Error fetching activity stats:', error);
      throw new Error('Failed to fetch activity statistics');
    }
  }
}

export const activityService = new ActivityService();