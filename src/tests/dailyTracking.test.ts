import request from 'supertest';
import { app } from '../server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

describe('Daily Tracking System', () => {
  let userToken: string;
  let userId: string;

  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'trackinguser@example.com',
        username: 'trackinguser',
        password: 'hashedpassword',
        country: 'US',
        role: 'USER'
      }
    });
    userId = user.id;
    userToken = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET!);
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.dailyTracking.deleteMany({
      where: { userId }
    });
    await prisma.user.deleteMany({
      where: { id: userId }
    });
    await prisma.$disconnect();
  });

  describe('POST /api/v1/daily-tracking', () => {
    it('should create a new daily tracking entry', async () => {
      const trackingData = {
        confidenceLevel: 7,
        emotionalState: {
          happy: 4,
          calm: 3,
          anxious: 1
        },
        notes: 'Had a good day overall'
      };

      const response = await request(app)
        .post('/api/v1/daily-tracking')
        .set('Authorization', `Bearer ${userToken}`)
        .send(trackingData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.confidenceLevel).toBe(7);
      expect(response.body.data.emotionalState).toEqual(trackingData.emotionalState);
      expect(response.body.data.notes).toBe('Had a good day overall');
    });

    it('should update existing entry for the same day', async () => {
      const updatedData = {
        confidenceLevel: 8,
        emotionalState: {
          happy: 5,
          excited: 4
        },
        notes: 'Updated - even better day!'
      };

      const response = await request(app)
        .post('/api/v1/daily-tracking')
        .set('Authorization', `Bearer ${userToken}`)
        .send(updatedData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.confidenceLevel).toBe(8);
      expect(response.body.data.emotionalState).toEqual(updatedData.emotionalState);
      expect(response.body.data.notes).toBe('Updated - even better day!');
    });

    it('should require confidence level', async () => {
      const response = await request(app)
        .post('/api/v1/daily-tracking')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          emotionalState: { happy: 3 }
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Confidence level and emotional state are required');
    });

    it('should validate confidence level range', async () => {
      const response = await request(app)
        .post('/api/v1/daily-tracking')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          confidenceLevel: 15,
          emotionalState: { happy: 3 }
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Confidence level must be between 1 and 10');
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/v1/daily-tracking')
        .send({
          confidenceLevel: 5,
          emotionalState: { happy: 3 }
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/daily-tracking', () => {
    beforeEach(async () => {
      // Create some test entries
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      await prisma.dailyTracking.createMany({
        data: [
          {
            userId,
            confidenceLevel: 6,
            emotionalState: { happy: 3, calm: 4 },
            date: yesterday
          },
          {
            userId,
            confidenceLevel: 8,
            emotionalState: { excited: 5, happy: 4 },
            date: today
          }
        ]
      });
    });

    afterEach(async () => {
      await prisma.dailyTracking.deleteMany({
        where: { userId }
      });
    });

    it('should return user tracking entries', async () => {
      const response = await request(app)
        .get('/api/v1/daily-tracking')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      const entry = response.body.data[0];
      expect(entry).toHaveProperty('confidenceLevel');
      expect(entry).toHaveProperty('emotionalState');
      expect(entry).toHaveProperty('date');
    });

    it('should filter by date range', async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const response = await request(app)
        .get(`/api/v1/daily-tracking?startDate=${today}&endDate=${today}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      // Should only return today's entry
      expect(response.body.data.length).toBe(1);
    });

    it('should limit results', async () => {
      const response = await request(app)
        .get('/api/v1/daily-tracking?limit=1')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(1);
    });
  });

  describe('GET /api/v1/daily-tracking/date/:date', () => {
    let entryDate: string;

    beforeEach(async () => {
      const today = new Date();
      entryDate = today.toISOString().split('T')[0];
      
      await prisma.dailyTracking.create({
        data: {
          userId,
          confidenceLevel: 7,
          emotionalState: { happy: 4, calm: 3 },
          date: today
        }
      });
    });

    afterEach(async () => {
      await prisma.dailyTracking.deleteMany({
        where: { userId }
      });
    });

    it('should return entry for specific date', async () => {
      const response = await request(app)
        .get(`/api/v1/daily-tracking/date/${entryDate}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('confidenceLevel', 7);
      expect(response.body.data.emotionalState).toEqual({ happy: 4, calm: 3 });
    });

    it('should return 404 for date with no entry', async () => {
      const futureDate = '2025-12-31';
      
      const response = await request(app)
        .get(`/api/v1/daily-tracking/date/${futureDate}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No tracking entry found for this date');
    });
  });

  describe('GET /api/v1/daily-tracking/stats', () => {
    beforeEach(async () => {
      // Create test entries for statistics
      const dates = [];
      for (let i = 0; i < 10; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date);
      }

      await prisma.dailyTracking.createMany({
        data: dates.map((date, index) => ({
          userId,
          confidenceLevel: 5 + (index % 5), // Varying confidence levels
          emotionalState: { 
            happy: Math.floor(Math.random() * 5) + 1,
            calm: Math.floor(Math.random() * 5) + 1
          },
          date
        }))
      });
    });

    afterEach(async () => {
      await prisma.dailyTracking.deleteMany({
        where: { userId }
      });
    });

    it('should return tracking statistics', async () => {
      const response = await request(app)
        .get('/api/v1/daily-tracking/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalEntries');
      expect(response.body.data).toHaveProperty('averageConfidence');
      expect(response.body.data).toHaveProperty('confidenceTrend');
      expect(response.body.data).toHaveProperty('streakDays');
      expect(response.body.data).toHaveProperty('confidenceHistory');
      
      expect(response.body.data.totalEntries).toBe(10);
      expect(response.body.data.averageConfidence).toBeGreaterThan(0);
      expect(['improving', 'declining', 'stable']).toContain(response.body.data.confidenceTrend);
    });

    it('should accept custom period', async () => {
      const response = await request(app)
        .get('/api/v1/daily-tracking/stats?period=7')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.confidenceHistory.length).toBeLessThanOrEqual(7);
    });
  });

  describe('DELETE /api/v1/daily-tracking/:id', () => {
    let entryId: string;

    beforeEach(async () => {
      const entry = await prisma.dailyTracking.create({
        data: {
          userId,
          confidenceLevel: 6,
          emotionalState: { happy: 3 },
          date: new Date()
        }
      });
      entryId = entry.id;
    });

    it('should delete user\'s own entry', async () => {
      const response = await request(app)
        .delete(`/api/v1/daily-tracking/${entryId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Daily tracking entry deleted successfully');

      // Verify entry was deleted
      const deletedEntry = await prisma.dailyTracking.findUnique({
        where: { id: entryId }
      });
      expect(deletedEntry).toBeNull();
    });

    it('should return 404 for non-existent entry', async () => {
      const response = await request(app)
        .delete('/api/v1/daily-tracking/non-existent-id')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Daily tracking entry not found');
    });
  });
});