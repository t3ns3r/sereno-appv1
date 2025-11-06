import express from 'express';
import { PrismaClient } from '@prisma/client';
import { auth } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get user's breathing exercises
router.get('/exercises', auth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { limit = 20, startDate, endDate } = req.query;

    let whereClause: any = { userId };

    // Add date filtering if provided
    if (startDate || endDate) {
      whereClause.completedAt = {};
      if (startDate) {
        whereClause.completedAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        whereClause.completedAt.lte = new Date(endDate as string);
      }
    }

    const exercises = await prisma.breathingExercise.findMany({
      where: whereClause,
      orderBy: {
        completedAt: 'desc'
      },
      take: Number(limit)
    });

    res.json({
      success: true,
      data: exercises
    });

  } catch (error) {
    console.error('Error getting breathing exercises:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get breathing exercises'
    });
  }
});

// Record a completed breathing exercise
router.post('/exercise', auth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { configuration, duration } = req.body;

    if (!configuration || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Configuration and duration are required'
      });
    }

    // Validate configuration
    const { inhaleSeconds, holdSeconds, exhaleSeconds, cycles } = configuration;
    
    if (!inhaleSeconds || !holdSeconds || !exhaleSeconds || !cycles) {
      return res.status(400).json({
        success: false,
        message: 'Complete breathing configuration is required (inhale, hold, exhale, cycles)'
      });
    }

    if (inhaleSeconds < 1 || holdSeconds < 0 || exhaleSeconds < 1 || cycles < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid breathing configuration values'
      });
    }

    if (duration < 10 || duration > 3600) { // 10 seconds to 1 hour
      return res.status(400).json({
        success: false,
        message: 'Duration must be between 10 seconds and 1 hour'
      });
    }

    const exercise = await prisma.breathingExercise.create({
      data: {
        userId,
        configuration,
        duration
      }
    });

    res.status(201).json({
      success: true,
      data: exercise,
      message: 'Breathing exercise recorded successfully'
    });

  } catch (error) {
    console.error('Error recording breathing exercise:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record breathing exercise'
    });
  }
});

// Get breathing exercise configurations/presets
router.get('/configurations', auth, async (req, res) => {
  try {
    const userId = req.user!.id;

    // Get user's custom configurations from their profile
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { preferences: true }
    });

    const customConfigurations = userProfile?.preferences?.breathingConfigurations || [];

    // Default configurations
    const defaultConfigurations = [
      {
        id: 'default-4-6-5',
        name: 'Configuración Predeterminada',
        description: 'Respiración relajante estándar',
        inhaleSeconds: 4,
        holdSeconds: 6,
        exhaleSeconds: 5,
        cycles: 8,
        isDefault: true
      },
      {
        id: 'beginner-3-3-3',
        name: 'Principiante',
        description: 'Ideal para comenzar con ejercicios de respiración',
        inhaleSeconds: 3,
        holdSeconds: 3,
        exhaleSeconds: 3,
        cycles: 6,
        isDefault: true
      },
      {
        id: 'anxiety-relief-4-7-8',
        name: 'Alivio de Ansiedad',
        description: 'Técnica 4-7-8 para reducir la ansiedad',
        inhaleSeconds: 4,
        holdSeconds: 7,
        exhaleSeconds: 8,
        cycles: 4,
        isDefault: true
      },
      {
        id: 'energy-boost-6-2-4',
        name: 'Energizante',
        description: 'Para aumentar la energía y concentración',
        inhaleSeconds: 6,
        holdSeconds: 2,
        exhaleSeconds: 4,
        cycles: 10,
        isDefault: true
      },
      {
        id: 'sleep-preparation-4-4-6',
        name: 'Preparación para Dormir',
        description: 'Respiración calmante antes de dormir',
        inhaleSeconds: 4,
        holdSeconds: 4,
        exhaleSeconds: 6,
        cycles: 12,
        isDefault: true
      }
    ];

    const allConfigurations = [...defaultConfigurations, ...customConfigurations];

    res.json({
      success: true,
      data: allConfigurations
    });

  } catch (error) {
    console.error('Error getting breathing configurations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get breathing configurations'
    });
  }
});

// Save custom breathing configuration
router.post('/configurations', auth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { name, description, inhaleSeconds, holdSeconds, exhaleSeconds, cycles } = req.body;

    if (!name || !inhaleSeconds || !holdSeconds || !exhaleSeconds || !cycles) {
      return res.status(400).json({
        success: false,
        message: 'Name and complete breathing configuration are required'
      });
    }

    if (inhaleSeconds < 1 || holdSeconds < 0 || exhaleSeconds < 1 || cycles < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid breathing configuration values'
      });
    }

    // Get current user preferences
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { preferences: true }
    });

    const currentPreferences = userProfile?.preferences || {};
    const currentConfigurations = currentPreferences.breathingConfigurations || [];

    // Create new configuration
    const newConfiguration = {
      id: `custom-${Date.now()}`,
      name,
      description: description || '',
      inhaleSeconds,
      holdSeconds,
      exhaleSeconds,
      cycles,
      isDefault: false,
      createdAt: new Date().toISOString()
    };

    const updatedConfigurations = [...currentConfigurations, newConfiguration];

    // Update user preferences
    const updatedPreferences = {
      ...currentPreferences,
      breathingConfigurations: updatedConfigurations
    };

    await prisma.userProfile.upsert({
      where: { userId },
      update: {
        preferences: updatedPreferences
      },
      create: {
        userId,
        preferences: updatedPreferences
      }
    });

    res.status(201).json({
      success: true,
      data: newConfiguration,
      message: 'Custom breathing configuration saved successfully'
    });

  } catch (error) {
    console.error('Error saving breathing configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save breathing configuration'
    });
  }
});

// Delete custom breathing configuration
router.delete('/configurations/:configId', auth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { configId } = req.params;

    // Get current user preferences
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { preferences: true }
    });

    if (!userProfile?.preferences?.breathingConfigurations) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found'
      });
    }

    const currentConfigurations = userProfile.preferences.breathingConfigurations;
    const configIndex = currentConfigurations.findIndex((config: any) => config.id === configId);

    if (configIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found'
      });
    }

    // Don't allow deletion of default configurations
    if (currentConfigurations[configIndex].isDefault) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete default configurations'
      });
    }

    // Remove the configuration
    const updatedConfigurations = currentConfigurations.filter((config: any) => config.id !== configId);

    const updatedPreferences = {
      ...userProfile.preferences,
      breathingConfigurations: updatedConfigurations
    };

    await prisma.userProfile.update({
      where: { userId },
      data: {
        preferences: updatedPreferences
      }
    });

    res.json({
      success: true,
      message: 'Breathing configuration deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting breathing configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete breathing configuration'
    });
  }
});

// Get breathing exercise statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { period = '30' } = req.query; // days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(period));

    const exercises = await prisma.breathingExercise.findMany({
      where: {
        userId,
        completedAt: {
          gte: startDate
        }
      },
      orderBy: {
        completedAt: 'asc'
      }
    });

    // Calculate statistics
    const stats = {
      totalExercises: exercises.length,
      totalMinutes: Math.round(exercises.reduce((sum, ex) => sum + ex.duration, 0) / 60),
      averageDuration: exercises.length > 0 ? Math.round(exercises.reduce((sum, ex) => sum + ex.duration, 0) / exercises.length) : 0,
      streakDays: 0,
      mostUsedConfiguration: null,
      exerciseHistory: exercises.map(ex => ({
        date: ex.completedAt,
        duration: ex.duration,
        configuration: ex.configuration
      }))
    };

    // Calculate current streak
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < Number(period); i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      checkDate.setHours(0, 0, 0, 0);

      const nextDay = new Date(checkDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const hasExercise = exercises.some(ex => {
        const exDate = new Date(ex.completedAt);
        return exDate >= checkDate && exDate < nextDay;
      });

      if (hasExercise) {
        streak++;
      } else {
        break;
      }
    }
    stats.streakDays = streak;

    // Find most used configuration
    if (exercises.length > 0) {
      const configCounts: { [key: string]: number } = {};
      exercises.forEach(ex => {
        const config = ex.configuration as any;
        const key = `${config.inhaleSeconds}-${config.holdSeconds}-${config.exhaleSeconds}`;
        configCounts[key] = (configCounts[key] || 0) + 1;
      });

      const mostUsedKey = Object.keys(configCounts).reduce((a, b) => 
        configCounts[a] > configCounts[b] ? a : b
      );
      
      stats.mostUsedConfiguration = mostUsedKey;
    }

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error getting breathing statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get breathing statistics'
    });
  }
});

export default router;