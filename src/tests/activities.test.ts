import request from 'supertest';
import { app } from '../server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

describe('Activities API', () => {
  let authToken: string;
  let userId: string;
  let activityId: string;

  beforeAll(async () => {
    // Create a test user
    const testUser = await prisma.user.create({
      data: {
        email: 'test-activities@example.com',
        username: 'testuser-activities',
        password: 'hashedpassword',
        country: 'ES',
        role: 'USER'
      }
    });
    userId = testUser.id;

    // Generate auth token
    authToken = jwt.sign(
      { id: testUser.id, email: testUser.email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.activity.deleteMany({
      where: { organizerId: userId }
    });
    await prisma.user.delete({
      where: { id: userId }
    });
    await prisma.$disconnect();
  });

  describe('POST /api/v1/activities/create', () => {
    it('should create activity successfully', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // 7 days from now

      const activityData = {
        title: 'Test Activity',
        description: 'Test description for activity',
        country: 'ES',
        category: 'SUPPORT_GROUP',
        eventDate: futureDate.toISOString(),
        location: 'Test Location',
        maxParticipants: 10
      };

      const response = await request(app)
        .post('/api/v1/activities/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(activityData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(activityData.title);
      expect(response.body.data.organizerId).toBe(userId);
      activityId = response.body.data.id;
    });

    it('should fail with invalid data', async () => {
      const invalidData = {
        title: '', // Empty title
        description: 'Test description',
        country: 'ES',
        category: 'INVALID_CATEGORY',
        eventDate: new Date().toISOString(),
        location: 'Test Location'
      };

      await request(app)
        .post('/api/v1/activities/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
    });
  });

  describe('GET /api/v1/activities/board/:country', () => {
    it('should get activities by country', async () => {
      const response = await request(app)
        .get('/api/v1/activities/board/ES')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter activities by category', async () => {
      const response = await request(app)
        .get('/api/v1/activities/board/ES?category=SUPPORT_GROUP')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter activities with available spots', async () => {
      const response = await request(app)
        .get('/api/v1/activities/board/ES?hasAvailableSpots=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/activities/:id', () => {
    it('should get specific activity', async () => {
      const response = await request(app)
        .get(`/api/v1/activities/${activityId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(activityId);
    });

    it('should return 404 for non-existent activity', async () => {
      await request(app)
        .get('/api/v1/activities/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('POST /api/v1/activities/:id/register', () => {
    it('should register user for activity', async () => {
      const response = await request(app)
        .post(`/api/v1/activities/${activityId}/register`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.registeredUsers).toHaveLength(1);
      expect(response.body.data.registeredUsers[0].id).toBe(userId);
    });

    it('should fail to register for same activity twice', async () => {
      await request(app)
        .post(`/api/v1/activities/${activityId}/register`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('DELETE /api/v1/activities/:id/register', () => {
    it('should unregister user from activity', async () => {
      const response = await request(app)
        .delete(`/api/v1/activities/${activityId}/register`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.registeredUsers).toHaveLength(0);
    });

    it('should fail to unregister when not registered', async () => {
      await request(app)
        .delete(`/api/v1/activities/${activityId}/register`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('GET /api/v1/activities/user/me', () => {
    it('should get user registered activities', async () => {
      const response = await request(app)
        .get('/api/v1/activities/user/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/activities/organizer/me', () => {
    it('should get organizer activities', async () => {
      const response = await request(app)
        .get('/api/v1/activities/organizer/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('PUT /api/v1/activities/:id', () => {
    it('should update activity by organizer', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14); // 14 days from now

      const updateData = {
        title: 'Updated Test Activity',
        description: 'Updated description',
        country: 'ES',
        category: 'MINDFULNESS',
        eventDate: futureDate.toISOString(),
        location: 'Updated Location',
        maxParticipants: 15
      };

      const response = await request(app)
        .put(`/api/v1/activities/${activityId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.category).toBe(updateData.category);
    });
  });

  describe('GET /api/v1/activities/:id/stats', () => {
    it('should get activity statistics', async () => {
      const response = await request(app)
        .get(`/api/v1/activities/${activityId}/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalRegistered');
      expect(response.body.data).toHaveProperty('maxParticipants');
      expect(response.body.data).toHaveProperty('availableSpots');
      expect(response.body.data).toHaveProperty('isFull');
    });
  });

  describe('DELETE /api/v1/activities/:id', () => {
    it('should delete activity by organizer', async () => {
      const response = await request(app)
        .delete(`/api/v1/activities/${activityId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 404 for deleted activity', async () => {
      await request(app)
        .get(`/api/v1/activities/${activityId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});