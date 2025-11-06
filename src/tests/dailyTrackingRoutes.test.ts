import request from 'supertest';
import { app } from '../server';
import { prisma } from '../config/database';
import { generateToken } from '../utils/jwt';

describe('Daily Tracking Routes', () => {
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    // Create test user
    const testUser = await prisma.user.create({
      data: {
        email: 'dailytracking@example.com',
        username: 'dailytrackinguser',
        password: 'hashedpassword',
        country: 'ES',
        profile: {
          create: {
            firstName: 'Daily',
            lastName: 'Tracking'
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
    // Clean up daily tracking entries
    await prisma.dailyTracking.deleteMany({
      where: { userId: testUserId }
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.dailyTracking.deleteMany();
    await prisma.userProfile.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('POST /api/v1/daily-tracking/entry', () => {
    const validTrackingData = {
      confidenceLevel: 7,
      emotionalState: {
        primary: 'feliz',
        intensity: 8
      },
      notes: 'Tuve un buen día hoy'
    };

    it('should create a new daily tracking entry', async () => {
      const response = await request(app)
        .post('/api/v1/daily-tracking/entry')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validTrackingData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.confidenceLevel).toBe(7);
      expect(response.body.data.emotionalState.primary).toBe('feliz');
      expect(response.body.data.notes).toBe('Tuve un buen día hoy');
    });

    it('should update existing entry for the same day', async () => {
      // Create initial entry
      await request(app)
        .post('/api/v1/daily-tracking/entry')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validTrackingData);

      // Update with new data
      const updatedData = {
        ...validTrackingData,
        confidenceLevel: 9,
        notes: 'Actualicé mi estado'
      };

      const response = await request(app)
        .post('/api/v1/daily-tracking/entry')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updatedData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.confidenceLevel).toBe(9);
      expect(response.body.data.notes).toBe('Actualicé mi estado');
      expect(response.body.message).toContain('updated');
    });

    it('should reject invalid confidence level', async () => {
      const invalidData = {
        ...validTrackingData,
        confidenceLevel: 15
      };

      const response = await request(app)
        .post('/api/v1/daily-tracking/entry')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject missing emotional state', async () => {
      const invalidData = {
        confidenceLevel: 7,
        notes: 'Sin estado emocional'
      };

      const response = await request(app)
        .post('/api/v1/daily-tracking/entry')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/v1/daily-tracking/entry')
        .send(validTrackingData)
        .expect(401);
    });
  });

  describe('GET /api/v1/daily-tracking/entries', () => {
    beforeEach(async () => {
      // Create test entries
      const entries = [
        {
          userId: testUserId,
          confidenceLevel: 7,
          emotionalState: { primary: 'feliz', intensity: 8 },
          notes: 'Día 1',
          date: new Date('2024-01-01')
        },
        {
          userId: testUserId,
          confidenceLevel: 5,
          emotionalState: { primary: 'neutral', intensity: 5 },
          notes: 'Día 2',
          date: new Date('2024-01-02')
        },
        {
          userId: testUserId,
          confidenceLevel: 8,
          emotionalState: { primary: 'muy_feliz', intensity: 9 },
          notes: 'Día 3',
          date: new Date('2024-01-03')
        }
      ];

      for (const entry of entries) {
        await prisma.dailyTracking.create({ data: entry });
      }
    });

    it('should return user entries in descending order', async () => {
      const response = await request(app)
        .get('/api/v1/daily-tracking/entries')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.count).toBe(3);
      
      // Should be in descending order (newest first)
      expect(new Date(response.body.data[0].date).getTime())
        .toBeGreaterThan(new Date(response.body.data[1].date).getTime());
    });

    it('should filter by date range', async () => {
      const response = await request(app)
        .get('/api/v1/daily-tracking/entries?startDate=2024-01-02&endDate=2024-01-02')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].notes).toBe('Día 2');
    });

    it('should limit results', async () => {
      const response = await request(app)
        .get('/api/v1/daily-tracking/entries?limit=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/v1/daily-tracking/entries')
        .expect(401);
    });
  });

  describe('GET /api/v1/daily-tracking/stats', () => {
    beforeEach(async () => {
      // Create test entries for stats
      const today = new Date();
      const entries = [];
      
      for (let i = 0; i < 10; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        entries.push({
          userId: testUserId,
          confidenceLevel: 5 + (i % 5),
          emotionalState: { 
            primary: i % 2 === 0 ? 'feliz' : 'neutral', 
            intensity: 6 + (i % 4) 
          },
          date
        });
      }

      for (const entry of entries) {
        await prisma.dailyTracking.create({ data: entry });
      }
    });

    it('should return tracking statistics', async () => {
      const response = await request(app)
        .get('/api/v1/daily-tracking/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalEntries');
      expect(response.body.data).toHaveProperty('avgConfidence');
      expect(response.body.data).toHaveProperty('currentStreak');
      expect(response.body.data).toHaveProperty('longestStreak');
      expect(response.body.data).toHaveProperty('emotionalTrends');
      expect(response.body.data).toHaveProperty('entries');

      expect(response.body.data.totalEntries).toBe(10);
      expect(response.body.data.avgConfidence).toBeGreaterThan(0);
      expect(response.body.data.emotionalTrends).toHaveProperty('feliz');
      expect(response.body.data.emotionalTrends).toHaveProperty('neutral');
    });

    it('should filter stats by days parameter', async () => {
      const response = await request(app)
        .get('/api/v1/daily-tracking/stats?days=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.entries.length).toBeLessThanOrEqual(5);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/v1/daily-tracking/stats')
        .expect(401);
    });
  });

  describe('GET /api/v1/daily-tracking/today', () => {
    it('should return null when no entry exists for today', async () => {
      const response = await request(app)
        .get('/api/v1/daily-tracking/today')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeNull();
      expect(response.body.hasTrackedToday).toBe(false);
    });

    it('should return today\'s entry when it exists', async () => {
      // Create today's entry
      await prisma.dailyTracking.create({
        data: {
          userId: testUserId,
          confidenceLevel: 8,
          emotionalState: { primary: 'feliz', intensity: 9 },
          notes: 'Hoy me siento genial',
          date: new Date()
        }
      });

      const response = await request(app)
        .get('/api/v1/daily-tracking/today')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).not.toBeNull();
      expect(response.body.hasTrackedToday).toBe(true);
      expect(response.body.data.confidenceLevel).toBe(8);
      expect(response.body.data.notes).toBe('Hoy me siento genial');
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/v1/daily-tracking/today')
        .expect(401);
    });
  });
});