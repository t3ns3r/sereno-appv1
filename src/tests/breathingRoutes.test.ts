import request from 'supertest';
import { app } from '../server';
import { prisma } from '../config/database';
import { generateToken } from '../utils/jwt';

describe('Breathing Routes', () => {
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    // Create test user
    const testUser = await prisma.user.create({
      data: {
        email: 'breathingroutes@example.com',
        username: 'breathingroutesuser',
        password: 'hashedpassword',
        country: 'ES',
        profile: {
          create: {
            firstName: 'Breathing',
            lastName: 'Routes'
          }
        }
      }
    });

    testUserId = testUser.id;
    authToken = generateToken({
      userId: testUser.id,
      email: testUser.email,
      role: testUser.role
    });
  });

  beforeEach(async () => {
    // Clean up breathing exercises
    await prisma.breathingExercise.deleteMany({
      where: { userId: testUserId }
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.breathingExercise.deleteMany();
    await prisma.userProfile.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('POST /api/v1/breathing/exercise', () => {
    const validExerciseData = {
      configuration: {
        name: 'Test Breathing',
        inhaleTime: 4,
        holdTime: 6,
        exhaleTime: 5,
        cycles: 8
      },
      duration: 300
    };

    it('should record breathing exercise successfully', async () => {
      const response = await request(app)
        .post('/api/v1/breathing/exercise')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validExerciseData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.configuration.name).toBe('Test Breathing');
      expect(response.body.data.benefits).toBeDefined();
      expect(response.body.data.recommendations).toBeDefined();
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/breathing/exercise')
        .send(validExerciseData);

      expect(response.status).toBe(401);
    });

    it('should validate configuration parameters', async () => {
      const invalidData = {
        ...validExerciseData,
        configuration: {
          ...validExerciseData.configuration,
          inhaleTime: 0 // Invalid
        }
      };

      const response = await request(app)
        .post('/api/v1/breathing/exercise')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should validate hold time range', async () => {
      const invalidData = {
        ...validExerciseData,
        configuration: {
          ...validExerciseData.configuration,
          holdTime: 25 // Too high
        }
      };

      const response = await request(app)
        .post('/api/v1/breathing/exercise')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
    });

    it('should validate cycles range', async () => {
      const invalidData = {
        ...validExerciseData,
        configuration: {
          ...validExerciseData.configuration,
          cycles: 25 // Too high
        }
      };

      const response = await request(app)
        .post('/api/v1/breathing/exercise')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/breathing/history', () => {
    beforeEach(async () => {
      // Create test breathing exercise
      await prisma.breathingExercise.create({
        data: {
          userId: testUserId,
          configuration: { name: 'Test Exercise', inhaleTime: 4, holdTime: 4, exhaleTime: 4, cycles: 5 },
          duration: 300
        } as any
      });
    });

    it('should get breathing history successfully', async () => {
      const response = await request(app)
        .get('/api/v1/breathing/history')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.exercises).toHaveLength(1);
      expect(response.body.data.exercises[0].configuration.name).toBe('Test Exercise');
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/v1/breathing/history?limit=5')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.exercises.length).toBeLessThanOrEqual(5);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/v1/breathing/history');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/breathing/stats', () => {
    beforeEach(async () => {
      // Create multiple test breathing exercises
      const exercises = [
        { duration: 300, name: 'Basic' },
        { duration: 240, name: 'Quick' },
        { duration: 360, name: 'Deep' }
      ];

      for (const exercise of exercises) {
        await prisma.breathingExercise.create({
          data: {
            userId: testUserId,
            configuration: { name: exercise.name, inhaleTime: 4, holdTime: 4, exhaleTime: 4, cycles: 5 },
            duration: exercise.duration
          } as any
        });
      }
    });

    it('should get breathing statistics successfully', async () => {
      const response = await request(app)
        .get('/api/v1/breathing/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalSessions).toBe(3);
      expect(response.body.data.totalDuration).toBe(15); // (300+240+360)/60 = 15 minutes
      expect(response.body.data.averageSessionDuration).toBe(5); // 15/3 = 5 minutes
      expect(response.body.data.weeklyProgress).toBeDefined();
      expect(response.body.data.streakDays).toBeDefined();
    });

    it('should respect days parameter', async () => {
      const response = await request(app)
        .get('/api/v1/breathing/stats?days=7')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/v1/breathing/configurations', () => {
    it('should get breathing configurations successfully', async () => {
      const response = await request(app)
        .get('/api/v1/breathing/configurations');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.default).toBeDefined();
      expect(response.body.data.default.length).toBeGreaterThan(0);
      expect(response.body.data.popular).toBeDefined();
    });

    it('should include default configurations', async () => {
      const response = await request(app)
        .get('/api/v1/breathing/configurations');

      const defaultConfigs = response.body.data.default;
      expect(defaultConfigs.some((config: any) => config.name === 'Relajación Básica')).toBe(true);
      expect(defaultConfigs.some((config: any) => config.name === 'Anti-Ansiedad (4-7-8)')).toBe(true);
    });
  });

  describe('POST /api/v1/breathing/validate', () => {
    const validConfiguration = {
      configuration: {
        name: 'Test Config',
        inhaleTime: 4,
        holdTime: 6,
        exhaleTime: 5,
        cycles: 8
      }
    };

    it('should validate configuration successfully', async () => {
      const response = await request(app)
        .post('/api/v1/breathing/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validConfiguration);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.configuration).toEqual(validConfiguration.configuration);
      expect(response.body.data.estimatedDuration).toBeDefined();
      expect(response.body.data.difficulty).toBeDefined();
      expect(response.body.data.benefits).toBeDefined();
    });

    it('should reject invalid configuration', async () => {
      const invalidConfig = {
        configuration: {
          ...validConfiguration.configuration,
          inhaleTime: 0 // Invalid
        }
      };

      const response = await request(app)
        .post('/api/v1/breathing/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidConfig);

      expect(response.status).toBe(400);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/v1/breathing/validate')
        .send(validConfiguration);

      expect(response.status).toBe(401);
    });
  });
});