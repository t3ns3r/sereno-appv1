import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface CreateEducationalContentData {
  title: string;
  description: string;
  content: string;
  category: 'ARTICLE' | 'EXERCISE' | 'VIDEO' | 'AUDIO' | 'INTERACTIVE' | 'WORKSHEET';
  mentalHealthConditions: string[];
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  duration?: number;
  tags: string[];
  authorId: string;
}

export interface UpdateContentProgressData {
  userId: string;
  contentId: string;
  progress: number;
  timeSpent: number;
  completed?: boolean;
}

export class EducationalContentService {
  async createContent(data: CreateEducationalContentData) {
    try {
      const content = await prisma.educationalContent.create({
        data: {
          title: data.title,
          description: data.description,
          content: data.content,
          category: data.category,
          mentalHealthConditions: data.mentalHealthConditions,
          difficulty: data.difficulty,
          duration: data.duration,
          tags: data.tags,
          authorId: data.authorId,
          isPublished: false
        },
        include: {
          author: {
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

      logger.info(`Educational content created: ${content.id}`);
      return content;
    } catch (error) {
      logger.error('Error creating educational content:', error);
      throw new Error('Failed to create educational content');
    }
  }

  async getContentByCondition(condition: string, userId?: string) {
    try {
      const content = await prisma.educationalContent.findMany({
        where: {
          isPublished: true,
          mentalHealthConditions: {
            has: condition
          }
        },
        include: {
          author: {
            select: {
              username: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          progress: userId ? {
            where: {
              userId: userId
            }
          } : false
        },
        orderBy: [
          { difficulty: 'asc' },
          { createdAt: 'desc' }
        ]
      });

      return content;
    } catch (error) {
      logger.error('Error fetching educational content:', error);
      throw new Error('Failed to fetch educational content');
    }
  }

  async getContentByCategory(category: string, userId?: string) {
    try {
      const content = await prisma.educationalContent.findMany({
        where: {
          isPublished: true,
          category: category as any
        },
        include: {
          author: {
            select: {
              username: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          progress: userId ? {
            where: {
              userId: userId
            }
          } : false
        },
        orderBy: [
          { difficulty: 'asc' },
          { createdAt: 'desc' }
        ]
      });

      return content;
    } catch (error) {
      logger.error('Error fetching educational content by category:', error);
      throw new Error('Failed to fetch educational content');
    }
  }

  async getAllContent(userId?: string) {
    try {
      const content = await prisma.educationalContent.findMany({
        where: {
          isPublished: true
        },
        include: {
          author: {
            select: {
              username: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          progress: userId ? {
            where: {
              userId: userId
            }
          } : false
        },
        orderBy: [
          { difficulty: 'asc' },
          { createdAt: 'desc' }
        ]
      });

      return content;
    } catch (error) {
      logger.error('Error fetching all educational content:', error);
      throw new Error('Failed to fetch educational content');
    }
  }

  async getContentById(contentId: string, userId?: string) {
    try {
      const content = await prisma.educationalContent.findUnique({
        where: {
          id: contentId,
          isPublished: true
        },
        include: {
          author: {
            select: {
              username: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          progress: userId ? {
            where: {
              userId: userId
            }
          } : false
        }
      });

      if (!content) {
        throw new Error('Educational content not found');
      }

      return content;
    } catch (error) {
      logger.error('Error fetching educational content by ID:', error);
      throw new Error('Failed to fetch educational content');
    }
  }

  async updateContentProgress(data: UpdateContentProgressData) {
    try {
      const progress = await prisma.contentProgress.upsert({
        where: {
          userId_contentId: {
            userId: data.userId,
            contentId: data.contentId
          }
        },
        update: {
          progress: data.progress,
          timeSpent: data.timeSpent,
          completed: data.completed || data.progress >= 1.0
        },
        create: {
          userId: data.userId,
          contentId: data.contentId,
          progress: data.progress,
          timeSpent: data.timeSpent,
          completed: data.completed || data.progress >= 1.0
        }
      });

      logger.info(`Content progress updated for user ${data.userId}, content ${data.contentId}`);
      return progress;
    } catch (error) {
      logger.error('Error updating content progress:', error);
      throw new Error('Failed to update content progress');
    }
  }

  async getUserProgress(userId: string) {
    try {
      const progress = await prisma.contentProgress.findMany({
        where: {
          userId: userId
        },
        include: {
          content: {
            select: {
              id: true,
              title: true,
              category: true,
              difficulty: true,
              duration: true
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });

      return progress;
    } catch (error) {
      logger.error('Error fetching user progress:', error);
      throw new Error('Failed to fetch user progress');
    }
  }

  async publishContent(contentId: string, authorId: string) {
    try {
      const content = await prisma.educationalContent.findUnique({
        where: { id: contentId }
      });

      if (!content) {
        throw new Error('Content not found');
      }

      if (content.authorId !== authorId) {
        throw new Error('Unauthorized to publish this content');
      }

      const updatedContent = await prisma.educationalContent.update({
        where: { id: contentId },
        data: { isPublished: true }
      });

      logger.info(`Educational content published: ${contentId}`);
      return updatedContent;
    } catch (error) {
      logger.error('Error publishing educational content:', error);
      throw new Error('Failed to publish educational content');
    }
  }

  async getContentStats(contentId: string) {
    try {
      const stats = await prisma.contentProgress.aggregate({
        where: {
          contentId: contentId
        },
        _count: {
          id: true
        },
        _avg: {
          progress: true,
          timeSpent: true
        }
      });

      const completedCount = await prisma.contentProgress.count({
        where: {
          contentId: contentId,
          completed: true
        }
      });

      return {
        totalUsers: stats._count.id,
        averageProgress: stats._avg.progress || 0,
        averageTimeSpent: stats._avg.timeSpent || 0,
        completedUsers: completedCount,
        completionRate: stats._count.id > 0 ? (completedCount / stats._count.id) * 100 : 0
      };
    } catch (error) {
      logger.error('Error fetching content stats:', error);
      throw new Error('Failed to fetch content statistics');
    }
  }
}

export const educationalContentService = new EducationalContentService();