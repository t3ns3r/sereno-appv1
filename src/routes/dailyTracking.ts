import express from 'express';
import { PrismaClient } from '@prisma/client';
import { auth } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get daily tracking entries for user
router.get('/entries', auth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { startDate, endDate, limit = 30 } = req.query;

    let whereClause: any = { userId };

    // Add date filtering if provided
    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) {
        whereClause.date.gte = new Date(startDate as string);
      }
      if (endDate) {
        whereClause.date.lte = new Date(endDate as string);
      }
    }

    const trackingEntries = await prisma.dailyTracking.findMany({
      where: whereClause,
      orderBy: {
        date: 'desc'
      },
      take: Number(limit)
    });

    res.json({
      success: true,
      data: trackingEntries,
      count: trackingEntries.length
    });

  } catch (error) {
    console.error('Error getting daily tracking entries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get daily tracking entries'
    });
  }
});

// Get today's entry
router.get('/today', auth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayEntry = await prisma.dailyTracking.findFirst({
      where: {
        userId,
        date: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    res.json({
      success: true,
      data: todayEntry,
      hasTrackedToday: !!todayEntry
    });

  } catch (error) {
    console.error('Error getting today entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get today entry'
    });
  }
});

// Create or update daily tracking entry
router.post('/entry', auth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { confidenceLevel, emotionalState, notes, date } = req.body;

    if (!confidenceLevel || !emotionalState) {
      return res.status(400).json({
        success: false,
        message: 'Confidence level and emotional state are required'
      });
    }

    if (confidenceLevel < 1 || confidenceLevel > 10) {
      return res.status(400).json({
        success: false,
        message: 'Confidence level must be between 1 and 10'
      });
    }

    const trackingDate = date ? new Date(date) : new Date();
    
    // Set to start of day to avoid duplicate entries
    trackingDate.setHours(0, 0, 0, 0);

    // Check if entry already exists for this date
    const existingEntry = await prisma.dailyTracking.findFirst({
      where: {
        userId,
        date: {
          gte: trackingDate,
          lt: new Date(trackingDate.getTime() + 24 * 60 * 60 * 1000) // Next day
        }
      }
    });

    let trackingEntry;

    if (existingEntry) {
      // Update existing entry
      trackingEntry = await prisma.dailyTracking.update({
        where: { id: existingEntry.id },
        data: {
          confidenceLevel,
          emotionalState,
          notes: notes || null
        }
      });
    } else {
      // Create new entry
      trackingEntry = await prisma.dailyTracking.create({
        data: {
          userId,
          confidenceLevel,
          emotionalState,
          notes: notes || null,
          date: trackingDate
        }
      });
    }

    res.status(existingEntry ? 200 : 201).json({
      success: true,
      data: trackingEntry,
      message: existingEntry ? 'Daily tracking updated successfully' : 'Daily tracking created successfully'
    });

  } catch (error) {
    console.error('Error creating/updating daily tracking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save daily tracking'
    });
  }
});

// Get daily tracking entry for specific date
router.get('/date/:date', auth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { date } = req.params;

    const trackingDate = new Date(date);
    trackingDate.setHours(0, 0, 0, 0);

    const trackingEntry = await prisma.dailyTracking.findFirst({
      where: {
        userId,
        date: {
          gte: trackingDate,
          lt: new Date(trackingDate.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    if (!trackingEntry) {
      return res.status(404).json({
        success: false,
        message: 'No tracking entry found for this date'
      });
    }

    res.json({
      success: true,
      data: trackingEntry
    });

  } catch (error) {
    console.error('Error getting daily tracking entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get daily tracking entry'
    });
  }
});

// Get tracking statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { days = '30' } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));
    startDate.setHours(0, 0, 0, 0);

    const trackingEntries = await prisma.dailyTracking.findMany({
      where: {
        userId,
        date: {
          gte: startDate
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    // Calculate statistics
    const stats = {
      totalEntries: trackingEntries.length,
      avgConfidence: 0,
      currentStreak: 0,
      longestStreak: 0,
      emotionalTrends: {} as { [key: string]: number },
      entries: trackingEntries.map(entry => ({
        date: entry.date,
        confidenceLevel: entry.confidenceLevel,
        emotionalState: entry.emotionalState
      }))
    };

    if (trackingEntries.length > 0) {
      // Calculate average confidence
      const totalConfidence = trackingEntries.reduce((sum, entry) => sum + entry.confidenceLevel, 0);
      stats.avgConfidence = Math.round((totalConfidence / trackingEntries.length) * 10) / 10;

      // Calculate current streak
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check current streak from today backwards
      for (let i = 0; i < Number(days); i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);

        const hasEntry = trackingEntries.some(entry => {
          const entryDate = new Date(entry.date);
          entryDate.setHours(0, 0, 0, 0);
          return entryDate.getTime() === checkDate.getTime();
        });

        if (hasEntry) {
          if (i === 0 || currentStreak > 0) { // Continue streak only if consecutive
            currentStreak++;
          }
          tempStreak++;
          longestStreak = Math.max(longestStreak, tempStreak);
        } else {
          if (i === 0) {
            currentStreak = 0; // No entry today breaks current streak
          }
          tempStreak = 0;
        }
      }

      stats.currentStreak = currentStreak;
      stats.longestStreak = longestStreak;

      // Calculate emotional trends
      const emotionCounts: { [key: string]: number } = {};
      trackingEntries.forEach(entry => {
        const emotions = entry.emotionalState as any;
        if (emotions && typeof emotions === 'object') {
          Object.keys(emotions).forEach(emotion => {
            emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
          });
        }
      });

      stats.emotionalTrends = emotionCounts;
    }

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error getting tracking statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tracking statistics'
    });
  }
});

// Delete daily tracking entry
router.delete('/:id', auth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Verify the entry belongs to the user
    const trackingEntry = await prisma.dailyTracking.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!trackingEntry) {
      return res.status(404).json({
        success: false,
        message: 'Daily tracking entry not found'
      });
    }

    await prisma.dailyTracking.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Daily tracking entry deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting daily tracking entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete daily tracking entry'
    });
  }
});

export default router;