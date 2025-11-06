import request from 'supertest';
import { app } from '../server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

describe('Educational Content API', () => {
  let authToken: string;
  let userId: string;
  let contentId: string;

  beforeAll(async () => {
    // Create a test user
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        username: 'testuser',
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
    await prisma.contentProgress.deleteMany({
      where: { userId }
    });
    await prisma.educationalContent.deleteMany({
      where: { authorId: userId }
    });
    await prisma.user.delete({
      where: { id: userId }
    });
    await prisma.$disconnect();
  });

  describe('POST /api/v1/educational-content', () => {
    it('should create educational content successfully', async () => {
      const contentData = {
        title: 'Test Content',
        description: 'Test description',
        content: 'This is test content',
        category: 'ARTICLE',
        mentalHealthConditions: ['ansiedad'],
        difficulty: 'BEGINNER',
        duration: 10,
        tags: ['test', 'content']
      };

      const response = await request(app)
        .post('/api/v1/educational-content')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(contentData.title);
      expect(response.body.data.authorId).toBe(userId);
      contentId = response.body.data.id;
    });

    it('should fail with invalid data', async () => {
      const invalidData = {
        title: '', // Empty title
        description: 'Test description',
        content: 'This is test content',
        category: 'INVALID_CATEGORY',
        mentalHealthConditions: ['ansiedad'],
        difficulty: 'BEGINNER'
      };

      await request(app)
        .post('/api/v1/educational-content')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
    });
  });

  describe('GET /api/v1/educational-content', () => {
    it('should get all educational content', async () => {
      // First publish the content
      await request(app)
        .patch(`/api/v1/educational-content/${contentId}/publish`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const response = await request(app)
        .get('/api/v1/educational-content')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter content by condition', async () => {
      const response = await request(app)
        .get('/api/v1/educational-content?condition=ansiedad')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/educational-content/:id', () => {
    it('should get specific educational content', async () => {
      const response = await request(app)
        .get(`/api/v1/educational-content/${contentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(contentId);
    });

    it('should return 404 for non-existent content', async () => {
      await request(app)
        .get('/api/v1/educational-content/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('POST /api/v1/educational-content/:id/progress', () => {
    it('should update content progress', async () => {
      const progressData = {
        progress: 0.5,
        timeSpent: 300,
        completed: false
      };

      const response = await request(app)
        .post(`/api/v1/educational-content/${contentId}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(progressData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.progress).toBe(0.5);
      expect(response.body.data.timeSpent).toBe(300);
    });

    it('should mark as completed when progress is 1.0', async () => {
      const progressData = {
        progress: 1.0,
        timeSpent: 600
      };

      const response = await request(app)
        .post(`/api/v1/educational-content/${contentId}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(progressData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.progress).toBe(1.0);
      expect(response.body.data.completed).toBe(true);
    });
  });

  describe('GET /api/v1/educational-content/progress/me', () => {
    it('should get user progress', async () => {
      const response = await request(app)
        .get('/api/v1/educational-content/progress/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/educational-content/:id/stats', () => {
    it('should get content statistics', async () => {
      const response = await request(app)
        .get(`/api/v1/educational-content/${contentId}/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalUsers');
      expect(response.body.data).toHaveProperty('averageProgress');
      expect(response.body.data).toHaveProperty('completedUsers');
    });
  });
});