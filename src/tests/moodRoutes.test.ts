import request from 'supertest';
import { app } from '../server';
import { prisma } from '../config/database';
import { generateToken } from '../utils/jwt';

describe('Mood Routes', () => {
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    // Create test user
    const testUser = await prisma.user.create({
      data: {
        email: 'moodroutes@example.com',
        username: 'moodroutesuser',
        password: 'hashedpassword',
        country: 'ES',
        profile: {
          create: {
            firstName: 'Mood',
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
    // Clean up mood entries
    await prisma.moodEntry.deleteMany({
      where: { userId: testUserId }
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.moodEntry.deleteMany();
    await prisma.userProfile.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('POST /api/v1/mood/assessment', () => {
    const validMoodData = {
      selectedEmotion: {
        id: 'happy',
        emoji: '😊',
        label: 'Contento',
        description: 'Me siento bien y positivo',
        intensity: 4
      },
      textDescription: 'Hoy ha sido un buen día, me siento optimista.'
    };

    it('should create mood assessment successfully', async () => {
      const response = await request(app)
        .post('/api/v1/mood/assessment')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validMoodData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.analysisResult).toBeDefined();
      expect(response.body.data.analysisResult.overallSentiment).toBe('positive');
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/mood/assessment')
        .send(validMoodData);

      expect(response.status).toBe(401);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/mood/assessment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should validate emotion intensity range', async () => {
      const invalidData = {
        ...validMoodData,
        selectedEmotion: {
          ...validMoodData.selectedEmotion,
          intensity: 10 // Invalid intensity
        }
      };

      const response = await request(app)
        .post('/api/v1/mood/assessment')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
    });
  });
});  d
escribe('GET /api/v1/mood/history', () => {
    beforeEach(async () => {
      // Create test mood entries
      await prisma.moodEntry.create({
        data: {
          userId: testUserId,
          selectedEmotion: { id: 'happy', intensity: 4, label: 'Contento' },
          textDescription: 'Buen día',
          analysisResult: { overallSentiment: 'positive', riskLevel: 'low' }
        } as any
      });
    });

    it('should get mood history successfully', async () => {
      const response = await request(app)
        .get('/api/v1/mood/history')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.entries).toHaveLength(1);
      expect(response.body.data.entries[0].selectedEmotion.intensity).toBe(4);
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/v1/mood/history?limit=5')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.entries.length).toBeLessThanOrEqual(5);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/v1/mood/history');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/mood/trends', () => {
    beforeEach(async () => {
      // Create multiple test mood entries
      const entries = [
        { intensity: 4, sentiment: 'positive', risk: 'low' },
        { intensity: 2, sentiment: 'negative', risk: 'medium' },
        { intensity: 3, sentiment: 'neutral', risk: 'low' }
      ];

      for (const entry of entries) {
        await prisma.moodEntry.create({
          data: {
            userId: testUserId,
            selectedEmotion: { id: 'test', intensity: entry.intensity, label: 'Test' },
            analysisResult: { overallSentiment: entry.sentiment, riskLevel: entry.risk }
          } as any
        });
      }
    });

    it('should get mood trends successfully', async () => {
      const response = await request(app)
        .get('/api/v1/mood/trends')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalEntries).toBe(3);
      expect(response.body.data.averageIntensity).toBe(3);
      expect(response.body.data.sentimentDistribution).toBeDefined();
      expect(response.body.data.riskLevelDistribution).toBeDefined();
    });

    it('should respect days parameter', async () => {
      const response = await request(app)
        .get('/api/v1/mood/trends?days=7')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/v1/mood/analyze', () => {
    const analysisData = {
      selectedEmotion: {
        id: 'anxious',
        emoji: '😰',
        label: 'Ansioso',
        description: 'Me siento nervioso o preocupado',
        intensity: 2
      },
      textDescription: 'Me siento muy nervioso por el trabajo y no puedo relajarme.'
    };

    it('should analyze mood without saving', async () => {
      const response = await request(app)
        .post('/api/v1/mood/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send(analysisData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.overallSentiment).toBeDefined();
      expect(response.body.data.keyEmotions).toContain('ansiedad');
      expect(response.body.data.recommendations).toBeDefined();
    });

    it('should not save analysis to database', async () => {
      await request(app)
        .post('/api/v1/mood/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send(analysisData);

      // Check that no new mood entry was created
      const moodEntries = await prisma.moodEntry.findMany({
        where: { userId: testUserId }
      });

      expect(moodEntries).toHaveLength(0);
    });
  });
});