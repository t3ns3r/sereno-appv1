import { BreathingService } from '../services/breathingService';
import { prisma } from '../config/database';

describe('BreathingService', () => {
  let breathingService: BreathingService;
  let testUserId: string;

  beforeAll(() => {
    breathingService = new BreathingService();
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.breathingExercise.deleteMany();
    await prisma.userProfile.deleteMany();
    await prisma.user.deleteMany();

    // Create test user
    const testUser = await prisma.user.create({
      data: {
        email: 'breathingtest@example.com',
        username: 'breathingtestuser',
        password: 'hashedpassword',
        country: 'ES',
        profile: {
          create: {
            firstName: 'Breathing',
            lastName: 'Test'
          }
        }
      }
    });
    testUserId = testUser.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.breathingExercise.deleteMany();
    await prisma.userProfile.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('recordBreathingExercise', () => {
    const validExerciseData = {
      userId: '',
      configuration: {
        name: 'Test Breathing',
        inhaleTime: 4,
        holdTime: 6,
        exhaleTime: 5,
        cycles: 8
      },
      duration: 120
    };

    beforeEach(() => {
      validExerciseData.userId = testUserId;
    });

    it('should record a breathing exercise successfully', async () => {
      const result = await breathingService.recordBreathingExercise(validExerciseData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.userId).toBe(testUserId);
      expect(result.configuration.name).toBe('Test Breathing');
      expect(result.duration).toBe(120);
      expect(result.benefits).toBeDefined();
      expect(result.benefits.length).toBeGreaterThan(0);
      expect(result.recommendations).toBeDefined();
    });

    it('should generate appropriate benefits for long sessions', async () => {
      const longSessionData = {
        ...validExerciseData,
        duration: 600, // 10 minutes
        configuration: {
          ...validExerciseData.configuration,
          holdTime: 8,
          exhaleTime: 10
        }
      };

      const result = await breathingService.recordBreathingExercise(longSessionData);

      expect(result.benefits).toContain('Relajación profunda del sistema nervioso');
      expect(result.benefits).toContain('Mejora de la capacidad pulmonar');
      expect(result.benefits).toContain('Activación del sistema nervioso parasimpático');
    });

    it('should validate configuration parameters', async () => {
      const invalidData = {
        ...validExerciseData,
        configuration: {
          ...validExerciseData.configuration,
          inhaleTime: 0 // Invalid
        }
      };

      await expect(breathingService.recordBreathingExercise(invalidData))
        .rejects.toThrow('Inhale time must be between 1 and 15 seconds');
    });

    it('should reject invalid hold time', async () => {
      const invalidData = {
        ...validExerciseData,
        configuration: {
          ...validExerciseData.configuration,
          holdTime: 25 // Too high
        }
      };

      await expect(breathingService.recordBreathingExercise(invalidData))
        .rejects.toThrow('Hold time must be between 0 and 20 seconds');
    });

    it('should reject invalid cycles', async () => {
      const invalidData = {
        ...validExerciseData,
        configuration: {
          ...validExerciseData.configuration,
          cycles: 0 // Invalid
        }
      };

      await expect(breathingService.recordBreathingExercise(invalidData))
        .rejects.toThrow('Cycles must be between 1 and 20');
    });
  });

  describe('getUserBreathingStats', () => {
    beforeEach(async () => {
      // Create test breathing exercises
      const exercises = [
        {
          userId: testUserId,
          configuration: { name: 'Basic Relaxation', inhaleTime: 4, holdTime: 6, exhaleTime: 5, cycles: 8 },
          duration: 300,
          completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
        },
        {
          userId: testUserId,
          configuration: { name: 'Quick Calm', inhaleTime: 3, holdTime: 3, exhaleTime: 6, cycles: 6 },
          duration: 180,
          completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
        },
        {
          userId: testUserId,
          configuration: { name: 'Basic Relaxation', inhaleTime: 4, holdTime: 6, exhaleTime: 5, cycles: 8 },
          duration: 360,
          completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
        }
      ];

      for (const exercise of exercises) {
        await prisma.breathingExercise.create({ data: exercise as any });
      }
    });

    it('should calculate breathing statistics correctly', async () => {
      const stats = await breathingService.getUserBreathingStats(testUserId, 30);

      expect(stats.totalSessions).toBe(3);
      expect(stats.totalDuration).toBe(14); // (300 + 180 + 360) / 60 = 14 minutes
      expect(stats.averageSessionDuration).toBe(5); // 14 / 3 ≈ 5 minutes
      expect(stats.favoriteConfiguration).toBe('Basic Relaxation');
      expect(stats.weeklyProgress).toBeDefined();
      expect(stats.streakDays).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty results', async () => {
      // Create another user with no exercises
      const anotherUser = await prisma.user.create({
        data: {
          email: 'another@example.com',
          username: 'anotheruser',
          password: 'password',
          country: 'ES'
        }
      });

      const stats = await breathingService.getUserBreathingStats(anotherUser.id);

      expect(stats.totalSessions).toBe(0);
      expect(stats.totalDuration).toBe(0);
      expect(stats.averageSessionDuration).toBe(0);
      expect(stats.favoriteConfiguration).toBe('Ninguna');
    });
  });

  describe('getBreathingHistory', () => {
    beforeEach(async () => {
      // Create test breathing exercises
      for (let i = 0; i < 5; i++) {
        await prisma.breathingExercise.create({
          data: {
            userId: testUserId,
            configuration: { name: `Exercise ${i}`, inhaleTime: 4, holdTime: 4, exhaleTime: 4, cycles: 5 },
            duration: 120 + i * 30,
            completedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
          } as any
        });
      }
    });

    it('should retrieve breathing history', async () => {
      const history = await breathingService.getBreathingHistory(testUserId, 10);

      expect(history).toHaveLength(5);
      expect(history[0].configuration.name).toBe('Exercise 0'); // Most recent
      expect(history[4].configuration.name).toBe('Exercise 4'); // Oldest
    });

    it('should limit results correctly', async () => {
      const history = await breathingService.getBreathingHistory(testUserId, 3);

      expect(history).toHaveLength(3);
    });
  });

  describe('getPopularConfigurations', () => {
    beforeEach(async () => {
      // Create exercises with different configurations
      const exercises = [
        { name: 'Basic Relaxation', duration: 300 },
        { name: 'Basic Relaxation', duration: 240 },
        { name: 'Quick Calm', duration: 180 },
        { name: 'Deep Breathing', duration: 420 }
      ];

      for (const ex of exercises) {
        await prisma.breathingExercise.create({
          data: {
            userId: testUserId,
            configuration: { name: ex.name, inhaleTime: 4, holdTime: 4, exhaleTime: 4, cycles: 5 },
            duration: ex.duration
          } as any
        });
      }
    });

    it('should return popular configurations', async () => {
      const popular = await breathingService.getPopularConfigurations();

      expect(popular).toBeDefined();
      expect(popular.length).toBeGreaterThan(0);
      expect(popular[0].name).toBe('Basic Relaxation'); // Most used
      expect(popular[0].usage).toBe(2);
      expect(popular[0].avgDuration).toBe(5); // (300 + 240) / 2 / 60 = 4.5 ≈ 5
    });
  });

  describe('calculateStreakDays', () => {
    it('should calculate streak correctly for consecutive days', async () => {
      // Create exercises for consecutive days
      for (let i = 0; i < 3; i++) {
        await prisma.breathingExercise.create({
          data: {
            userId: testUserId,
            configuration: { name: 'Daily Exercise', inhaleTime: 4, holdTime: 4, exhaleTime: 4, cycles: 5 },
            duration: 300,
            completedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
          } as any
        });
      }

      const stats = await breathingService.getUserBreathingStats(testUserId);
      expect(stats.streakDays).toBe(3);
    });

    it('should handle broken streaks', async () => {
      // Create exercises with a gap
      await prisma.breathingExercise.create({
        data: {
          userId: testUserId,
          configuration: { name: 'Exercise', inhaleTime: 4, holdTime: 4, exhaleTime: 4, cycles: 5 },
          duration: 300,
          completedAt: new Date(Date.now() - 0 * 24 * 60 * 60 * 1000) // Today
        } as any
      });

      await prisma.breathingExercise.create({
        data: {
          userId: testUserId,
          configuration: { name: 'Exercise', inhaleTime: 4, holdTime: 4, exhaleTime: 4, cycles: 5 },
          duration: 300,
          completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago (gap)
        } as any
      });

      const stats = await breathingService.getUserBreathingStats(testUserId);
      expect(stats.streakDays).toBe(1); // Only today counts
    });
  });
});