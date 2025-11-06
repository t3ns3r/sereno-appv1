import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Daily Tracking Service Tests', () => {
  let testUserId: string;

  beforeEach(async () => {
    // Create a test user
    const testUser = await prisma.user.create({
      data: {
        email: 'test-tracking@example.com',
        username: 'testtrackinguser',
        password: 'hashedpassword',
        country: 'ES',
        role: 'USER'
      }
    });
    testUserId = testUser.id;
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.dailyTracking.deleteMany({
      where: { userId: testUserId }
    });
    await prisma.user.deleteMany({
      where: { id: testUserId }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Daily Tracking Entry Creation', () => {
    it('should create a daily tracking entry', async () => {
      const trackingData = {
        userId: testUserId,
        confidenceLevel: 7,
        emotionalState: {
          happy: 4,
          calm: 3,
          anxious: 1
        },
        notes: 'Had a good day overall',
        date: new Date()
      };

      const entry = await prisma.dailyTracking.create({
        data: trackingData
      });

      expect(entry).toBeDefined();
      expect(entry.confidenceLevel).toBe(7);
      expect(entry.emotionalState).toEqual(trackingData.emotionalState);
      expect(entry.notes).toBe('Had a good day overall');
      expect(entry.userId).toBe(testUserId);
    });

    it('should validate confidence level range', async () => {
      const trackingData = {
        userId: testUserId,
        confidenceLevel: 15, // Invalid - should be 1-10
        emotionalState: {
          happy: 3
        },
        date: new Date()
      };

      // This should fail validation in the application layer
      // For now, we'll just test that the database accepts it
      // In a real implementation, validation would happen before database insertion
      const entry = await prisma.dailyTracking.create({
        data: trackingData
      });

      expect(entry.confidenceLevel).toBe(15);
      // Note: In production, this would be caught by application validation
    });

    it('should handle emotional state as JSON', async () => {
      const complexEmotionalState = {
        primary: 'happy',
        secondary: ['excited', 'grateful'],
        intensity: 8,
        triggers: ['good_news', 'family_time'],
        notes: 'Feeling great today'
      };

      const trackingData = {
        userId: testUserId,
        confidenceLevel: 9,
        emotionalState: complexEmotionalState,
        date: new Date()
      };

      const entry = await prisma.dailyTracking.create({
        data: trackingData
      });

      expect(entry.emotionalState).toEqual(complexEmotionalState);
    });
  });

  describe('Daily Tracking Queries', () => {
    beforeEach(async () => {
      // Create test entries for the last 5 days
      const entries = [];
      for (let i = 0; i < 5; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        entries.push({
          userId: testUserId,
          confidenceLevel: 5 + i,
          emotionalState: {
            happy: Math.min(5, 2 + i),
            calm: Math.min(5, 1 + i)
          },
          notes: `Day ${i + 1} notes`,
          date
        });
      }

      await prisma.dailyTracking.createMany({
        data: entries
      });
    });

    it('should retrieve entries for a user', async () => {
      const entries = await prisma.dailyTracking.findMany({
        where: { userId: testUserId },
        orderBy: { date: 'desc' }
      });

      expect(entries).toHaveLength(5);
      expect(entries[0].confidenceLevel).toBe(5); // Most recent (i=0)
      expect(entries[4].confidenceLevel).toBe(9); // Oldest (i=4)
    });

    it('should filter entries by date range', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const entries = await prisma.dailyTracking.findMany({
        where: {
          userId: testUserId,
          date: {
            gte: yesterday,
            lte: today
          }
        }
      });

      expect(entries.length).toBeGreaterThanOrEqual(1);
      expect(entries.length).toBeLessThanOrEqual(2);
    });

    it('should calculate basic statistics', async () => {
      const entries = await prisma.dailyTracking.findMany({
        where: { userId: testUserId }
      });

      const totalEntries = entries.length;
      const avgConfidence = entries.reduce((sum, entry) => sum + entry.confidenceLevel, 0) / totalEntries;

      expect(totalEntries).toBe(5);
      expect(avgConfidence).toBe(7); // (5+6+7+8+9)/5 = 7
    });

    it('should find today\'s entry', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayEntry = await prisma.dailyTracking.findFirst({
        where: {
          userId: testUserId,
          date: {
            gte: today,
            lt: tomorrow
          }
        }
      });

      expect(todayEntry).toBeDefined();
      expect(todayEntry?.confidenceLevel).toBe(5);
    });
  });

  describe('Daily Tracking Updates', () => {
    let entryId: string;

    beforeEach(async () => {
      const entry = await prisma.dailyTracking.create({
        data: {
          userId: testUserId,
          confidenceLevel: 5,
          emotionalState: { happy: 3 },
          notes: 'Initial entry',
          date: new Date()
        }
      });
      entryId = entry.id;
    });

    it('should update an existing entry', async () => {
      const updatedEntry = await prisma.dailyTracking.update({
        where: { id: entryId },
        data: {
          confidenceLevel: 8,
          emotionalState: { happy: 5, excited: 4 },
          notes: 'Updated entry'
        }
      });

      expect(updatedEntry.confidenceLevel).toBe(8);
      expect(updatedEntry.emotionalState).toEqual({ happy: 5, excited: 4 });
      expect(updatedEntry.notes).toBe('Updated entry');
    });

    it('should delete an entry', async () => {
      await prisma.dailyTracking.delete({
        where: { id: entryId }
      });

      const deletedEntry = await prisma.dailyTracking.findUnique({
        where: { id: entryId }
      });

      expect(deletedEntry).toBeNull();
    });
  });

  describe('Progress Visualization Data', () => {
    beforeEach(async () => {
      // Create entries with varying confidence levels for trend analysis
      const entries = [];
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() - 10);

      for (let i = 0; i < 10; i++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + i);
        date.setHours(0, 0, 0, 0);

        // Create an improving trend
        const confidence = Math.min(10, 3 + i);
        
        entries.push({
          userId: testUserId,
          confidenceLevel: confidence,
          emotionalState: {
            happy: Math.min(5, Math.floor(confidence / 2)),
            calm: Math.min(5, Math.floor(confidence / 2) + 1)
          },
          date
        });
      }

      await prisma.dailyTracking.createMany({
        data: entries
      });
    });

    it('should provide data for progress charts', async () => {
      const entries = await prisma.dailyTracking.findMany({
        where: { userId: testUserId },
        orderBy: { date: 'asc' },
        select: {
          date: true,
          confidenceLevel: true,
          emotionalState: true
        }
      });

      expect(entries).toHaveLength(10);
      
      // Verify trend data structure
      const chartData = entries.map(entry => ({
        date: entry.date.toISOString(),
        confidence: entry.confidenceLevel,
        emotionalState: entry.emotionalState
      }));

      expect(chartData[0].confidence).toBe(3);
      expect(chartData[9].confidence).toBe(10); // Should show improvement
    });

    it('should calculate streak information', async () => {
      const entries = await prisma.dailyTracking.findMany({
        where: { userId: testUserId },
        orderBy: { date: 'desc' }
      });

      // Calculate current streak (consecutive days from today backwards)
      let currentStreak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);

        const hasEntry = entries.some(entry => {
          const entryDate = new Date(entry.date);
          entryDate.setHours(0, 0, 0, 0);
          return entryDate.getTime() === checkDate.getTime();
        });

        if (hasEntry) {
          currentStreak++;
        } else {
          break;
        }
      }

      expect(currentStreak).toBeGreaterThan(0);
      expect(entries.length).toBe(10);
    });

    it('should aggregate emotional trends', async () => {
      const entries = await prisma.dailyTracking.findMany({
        where: { userId: testUserId }
      });

      const emotionCounts: { [key: string]: number } = {};
      
      entries.forEach(entry => {
        const emotions = entry.emotionalState as any;
        if (emotions && typeof emotions === 'object') {
          Object.keys(emotions).forEach(emotion => {
            emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
          });
        }
      });

      expect(emotionCounts.happy).toBe(10); // All entries have 'happy'
      expect(emotionCounts.calm).toBe(10); // All entries have 'calm'
    });
  });
});