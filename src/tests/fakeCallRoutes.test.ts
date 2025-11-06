import request from 'supertest';
import { app } from '../server';
import { prisma } from '../config/database';

describe('Fake Call Routes', () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    // Clean up test data
    await prisma.fakeCall.deleteMany();
    await prisma.fakeCallSettings.deleteMany();
    await prisma.userProfile.deleteMany();
    await prisma.user.deleteMany();

    // Create test user
    const userData = {
      email: 'fakecall@example.com',
      username: 'fakecalluser',
      password: 'FakeCall123',
      country: 'US',
      firstName: 'Fake',
      lastName: 'Call'
    };

    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send(userData);

    authToken = registerResponse.body.data.token;
    userId = registerResponse.body.data.user.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.fakeCall.deleteMany();
    await prisma.fakeCallSettings.deleteMany();
    await prisma.userProfile.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('GET /api/v1/fake-calls/settings', () => {
    it('should get default fake call settings for authenticated user', async () => {
      const response = await request(app)
        .get('/api/v1/fake-calls/settings')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('enabled');
      expect(response.body.data).toHaveProperty('frequency');
      expect(response.body.data).toHaveProperty('timeRange');
      expect(response.body.data.timeRange).toHaveProperty('start');
      expect(response.body.data.timeRange).toHaveProperty('end');
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/fake-calls/settings');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/fake-calls/settings')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('PUT /api/v1/fake-calls/settings', () => {
    const validSettings = {
      enabled: true,
      frequency: 'DAILY',
      timeRange: {
        start: '10:00',
        end: '20:00'
      }
    };

    it('should update fake call settings successfully', async () => {
      const response = await request(app)
        .put('/api/v1/fake-calls/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validSettings);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.enabled).toBe(true);
      expect(response.body.data.frequency).toBe('DAILY');
      expect(response.body.data.timeRange.start).toBe('10:00');
      expect(response.body.data.timeRange.end).toBe('20:00');
    });

    it('should update settings to disable fake calls', async () => {
      const disabledSettings = {
        enabled: false,
        frequency: 'WEEKLY',
        timeRange: {
          start: '09:00',
          end: '18:00'
        }
      };

      const response = await request(app)
        .put('/api/v1/fake-calls/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(disabledSettings);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.enabled).toBe(false);
      expect(response.body.data.frequency).toBe('WEEKLY');
    });

    it('should validate frequency values', async () => {
      const invalidSettings = {
        ...validSettings,
        frequency: 'INVALID_FREQUENCY'
      };

      const response = await request(app)
        .put('/api/v1/fake-calls/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidSettings);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should validate time format', async () => {
      const invalidTimeSettings = {
        ...validSettings,
        timeRange: {
          start: '25:00', // Invalid hour
          end: '20:00'
        }
      };

      const response = await request(app)
        .put('/api/v1/fake-calls/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidTimeSettings);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should validate that start time is before end time', async () => {
      const invalidRangeSettings = {
        ...validSettings,
        timeRange: {
          start: '22:00',
          end: '08:00' // End before start
        }
      };

      const response = await request(app)
        .put('/api/v1/fake-calls/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidRangeSettings);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .put('/api/v1/fake-calls/settings')
        .send(validSettings);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });

    it('should reject request with missing required fields', async () => {
      const incompleteSettings = {
        enabled: true
        // Missing frequency and timeRange
      };

      const response = await request(app)
        .put('/api/v1/fake-calls/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incompleteSettings);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/fake-calls/trigger', () => {
    beforeEach(async () => {
      // Set up fake call settings for the user
      await prisma.fakeCallSettings.create({
        data: {
          userId,
          enabled: true,
          frequency: 'RANDOM',
          timeStart: '09:00',
          timeEnd: '21:00'
        }
      });
    });

    it('should trigger a fake call successfully', async () => {
      const callData = {
        redirectAction: 'mood_check'
      };

      const response = await request(app)
        .post('/api/v1/fake-calls/trigger')
        .set('Authorization', `Bearer ${authToken}`)
        .send(callData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('scheduledTime');
      expect(response.body.data.redirectAction).toBe('mood_check');
      expect(response.body.data.answered).toBe(false);
    });

    it('should schedule fake call with breathing exercise redirect', async () => {
      const callData = {
        redirectAction: 'breathing_exercise'
      };

      const response = await request(app)
        .post('/api/v1/fake-calls/trigger')
        .set('Authorization', `Bearer ${authToken}`)
        .send(callData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.redirectAction).toBe('breathing_exercise');
    });

    it('should schedule fake call with daily tracking redirect', async () => {
      const callData = {
        redirectAction: 'daily_tracking'
      };

      const response = await request(app)
        .post('/api/v1/fake-calls/trigger')
        .set('Authorization', `Bearer ${authToken}`)
        .send(callData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.redirectAction).toBe('daily_tracking');
    });

    it('should validate redirect action values', async () => {
      const invalidCallData = {
        redirectAction: 'invalid_action'
      };

      const response = await request(app)
        .post('/api/v1/fake-calls/trigger')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidCallData);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject triggering fake call when disabled', async () => {
      // Disable fake calls for the user
      await prisma.fakeCallSettings.update({
        where: { userId },
        data: { enabled: false }
      });

      const callData = {
        redirectAction: 'mood_check'
      };

      const response = await request(app)
        .post('/api/v1/fake-calls/trigger')
        .set('Authorization', `Bearer ${authToken}`)
        .send(callData);

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FAKE_CALLS_DISABLED');
    });

    it('should reject request without authentication', async () => {
      const callData = {
        redirectAction: 'mood_check'
      };

      const response = await request(app)
        .post('/api/v1/fake-calls/trigger')
        .send(callData);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });

    it('should reject request with missing redirect action', async () => {
      const response = await request(app)
        .post('/api/v1/fake-calls/trigger')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/fake-calls/history', () => {
    beforeEach(async () => {
      // Create some fake call history
      await prisma.fakeCall.createMany({
        data: [
          {
            userId,
            scheduledTime: new Date('2024-01-01T10:00:00Z'),
            answered: true,
            redirectAction: 'mood_check'
          },
          {
            userId,
            scheduledTime: new Date('2024-01-02T14:00:00Z'),
            answered: false,
            redirectAction: 'breathing_exercise'
          },
          {
            userId,
            scheduledTime: new Date('2024-01-03T16:00:00Z'),
            answered: true,
            redirectAction: 'daily_tracking'
          }
        ]
      });
    });

    it('should get fake call history for authenticated user', async () => {
      const response = await request(app)
        .get('/api/v1/fake-calls/history')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data[0]).toHaveProperty('scheduledTime');
      expect(response.body.data[0]).toHaveProperty('answered');
      expect(response.body.data[0]).toHaveProperty('redirectAction');
    });

    it('should return empty array when no fake calls exist', async () => {
      // Clean up fake calls
      await prisma.fakeCall.deleteMany({ where: { userId } });

      const response = await request(app)
        .get('/api/v1/fake-calls/history')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/fake-calls/history');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });
  });

  describe('PUT /api/v1/fake-calls/:id/answer', () => {
    let fakeCallId: string;

    beforeEach(async () => {
      // Create a fake call to answer
      const fakeCall = await prisma.fakeCall.create({
        data: {
          userId,
          scheduledTime: new Date(),
          answered: false,
          redirectAction: 'mood_check'
        }
      });
      fakeCallId = fakeCall.id;
    });

    it('should mark fake call as answered successfully', async () => {
      const response = await request(app)
        .put(`/api/v1/fake-calls/${fakeCallId}/answer`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.answered).toBe(true);
      expect(response.body.data.redirectAction).toBe('mood_check');
    });

    it('should return redirect information when call is answered', async () => {
      const response = await request(app)
        .put(`/api/v1/fake-calls/${fakeCallId}/answer`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('redirectUrl');
      expect(response.body.data.redirectUrl).toContain('mood');
    });

    it('should reject answering non-existent fake call', async () => {
      const response = await request(app)
        .put('/api/v1/fake-calls/non-existent-id/answer')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('FAKE_CALL_NOT_FOUND');
    });

    it('should reject answering fake call that belongs to another user', async () => {
      // Create another user
      const otherUserData = {
        email: 'other@example.com',
        username: 'otheruser',
        password: 'Other123',
        country: 'US'
      };

      const otherUserResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(otherUserData);

      const otherAuthToken = otherUserResponse.body.data.token;

      const response = await request(app)
        .put(`/api/v1/fake-calls/${fakeCallId}/answer`)
        .set('Authorization', `Bearer ${otherAuthToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('UNAUTHORIZED_ACCESS');
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .put(`/api/v1/fake-calls/${fakeCallId}/answer`);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });
  });
});