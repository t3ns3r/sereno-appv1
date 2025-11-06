import request from 'supertest';
import { app } from '../server';
import { prisma } from '../config/database';
import { UserRole } from '@prisma/client';

describe('Emergency Routes', () => {
  let userToken: string;
  let userId: string;
  let serenoToken: string;
  let serenoId: string;

  beforeEach(async () => {
    // Clean up test data
    await prisma.chatMessage.deleteMany();
    await prisma.chatChannel.deleteMany();
    await prisma.emergencyAlert.deleteMany();
    await prisma.userProfile.deleteMany();
    await prisma.user.deleteMany();

    // Create test user
    const userResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'user@example.com',
        username: 'testuser',
        password: 'TestPass123',
        country: 'US',
        firstName: 'Test',
        lastName: 'User'
      });

    userToken = userResponse.body.data.token;
    userId = userResponse.body.data.user.id;

    // Create test SERENO
    const serenoResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'sereno@example.com',
        username: 'testsereno',
        password: 'TestPass123',
        country: 'US',
        firstName: 'Test',
        lastName: 'SERENO'
      });

    serenoToken = serenoResponse.body.data.token;
    serenoId = serenoResponse.body.data.user.id;

    // Update SERENO role and profile
    await prisma.user.update({
      where: { id: serenoId },
      data: { role: UserRole.SERENO }
    });

    await prisma.userProfile.update({
      where: { userId: serenoId },
      data: {
        preferences: {
          serenoData: {
            specializations: ['anxiety', 'depression'],
            availabilityHours: { start: '09:00', end: '17:00' },
            maxResponseDistance: 50,
            verificationStatus: 'verified'
          }
        }
      }
    });

    // Create emergency contacts
    await prisma.emergencyContact.createMany({
      data: [
        {
          id: 'US-911',
          country: 'US',
          name: 'Emergency Services',
          phoneNumber: '911',
          type: 'EMERGENCY_SERVICES',
          available24h: true,
          autoContact: true
        },
        {
          id: 'US-988',
          country: 'US',
          name: '988 Suicide & Crisis Lifeline',
          phoneNumber: '988',
          type: 'CRISIS_HOTLINE',
          available24h: true,
          autoContact: false
        }
      ]
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.emergencyContact.deleteMany();
    await prisma.chatMessage.deleteMany();
    await prisma.chatChannel.deleteMany();
    await prisma.emergencyAlert.deleteMany();
    await prisma.userProfile.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('POST /api/v1/emergency/panic', () => {
    it('should activate panic button successfully', async () => {
      const response = await request(app)
        .post('/api/v1/emergency/panic')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          location: {
            latitude: 40.7128,
            longitude: -74.0060,
            accuracy: 10
          },
          additionalInfo: 'Feeling very anxious'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.alertId).toBeDefined();
    });

    it('should activate panic button without location', async () => {
      const response = await request(app)
        .post('/api/v1/emergency/panic')
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.alertId).toBeDefined();
    });

    it('should reject panic button without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/emergency/panic')
        .send({});

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });

    it('should reject invalid location data', async () => {
      const response = await request(app)
        .post('/api/v1/emergency/panic')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          location: {
            latitude: 200, // Invalid latitude
            longitude: -74.0060
          }
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/emergency/contacts/:country', () => {
    it('should get emergency contacts for valid country', async () => {
      const response = await request(app)
        .get('/api/v1/emergency/contacts/US')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.contacts).toHaveLength(2);
      expect(response.body.data.country).toBe('US');
    });

    it('should return empty array for non-existent country', async () => {
      const response = await request(app)
        .get('/api/v1/emergency/contacts/XX')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.contacts).toHaveLength(0);
    });

    it('should reject invalid country code', async () => {
      const response = await request(app)
        .get('/api/v1/emergency/contacts/USA') // Too long
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/emergency/contacts/US');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });
  });

  describe('PUT /api/v1/emergency/alert/:id/respond', () => {
    let alertId: string;

    beforeEach(async () => {
      // Create emergency alert
      const panicResponse = await request(app)
        .post('/api/v1/emergency/panic')
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      alertId = panicResponse.body.data.alertId;
    });

    it('should allow SERENO to respond to emergency', async () => {
      const response = await request(app)
        .put(`/api/v1/emergency/alert/${alertId}/respond`)
        .set('Authorization', `Bearer ${serenoToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.alertId).toBe(alertId);
    });

    it('should reject non-SERENO user response', async () => {
      const response = await request(app)
        .put(`/api/v1/emergency/alert/${alertId}/respond`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject invalid alert ID', async () => {
      const response = await request(app)
        .put('/api/v1/emergency/alert/invalid-id/respond')
        .set('Authorization', `Bearer ${serenoToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject response without authentication', async () => {
      const response = await request(app)
        .put(`/api/v1/emergency/alert/${alertId}/respond`);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });
  });

  describe('GET /api/v1/emergency/alert/:id', () => {
    let alertId: string;

    beforeEach(async () => {
      // Create emergency alert
      const panicResponse = await request(app)
        .post('/api/v1/emergency/panic')
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      alertId = panicResponse.body.data.alertId;
    });

    it('should allow user to view their own alert', async () => {
      const response = await request(app)
        .get(`/api/v1/emergency/alert/${alertId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.alert.id).toBe(alertId);
      expect(response.body.data.alert.userId).toBe(userId);
    });

    it('should allow responding SERENO to view alert', async () => {
      // SERENO responds first
      await request(app)
        .put(`/api/v1/emergency/alert/${alertId}/respond`)
        .set('Authorization', `Bearer ${serenoToken}`);

      const response = await request(app)
        .get(`/api/v1/emergency/alert/${alertId}`)
        .set('Authorization', `Bearer ${serenoToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.alert.id).toBe(alertId);
    });

    it('should reject access from unauthorized user', async () => {
      // Create another user
      const otherUserResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'other@example.com',
          username: 'otheruser',
          password: 'TestPass123',
          country: 'US'
        });

      const response = await request(app)
        .get(`/api/v1/emergency/alert/${alertId}`)
        .set('Authorization', `Bearer ${otherUserResponse.body.data.token}`);

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('ACCESS_DENIED');
    });

    it('should return 404 for non-existent alert', async () => {
      const response = await request(app)
        .get('/api/v1/emergency/alert/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('ALERT_NOT_FOUND');
    });
  });

  describe('POST /api/v1/emergency/sereno/register', () => {
    it('should register user as SERENO successfully', async () => {
      const response = await request(app)
        .post('/api/v1/emergency/sereno/register')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          specializations: ['anxiety', 'depression'],
          availabilityHours: {
            start: '09:00',
            end: '17:00'
          },
          maxResponseDistance: 25
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should reject invalid specializations', async () => {
      const response = await request(app)
        .post('/api/v1/emergency/sereno/register')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          specializations: [], // Empty array
          availabilityHours: {
            start: '09:00',
            end: '17:00'
          },
          maxResponseDistance: 25
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid time format', async () => {
      const response = await request(app)
        .post('/api/v1/emergency/sereno/register')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          specializations: ['anxiety'],
          availabilityHours: {
            start: '25:00', // Invalid time
            end: '17:00'
          },
          maxResponseDistance: 25
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PUT /api/v1/emergency/sereno/availability', () => {
    it('should update SERENO availability successfully', async () => {
      const response = await request(app)
        .put('/api/v1/emergency/sereno/availability')
        .set('Authorization', `Bearer ${serenoToken}`)
        .send({
          isAvailable: true,
          location: {
            latitude: 40.7128,
            longitude: -74.0060
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should update availability without location', async () => {
      const response = await request(app)
        .put('/api/v1/emergency/sereno/availability')
        .set('Authorization', `Bearer ${serenoToken}`)
        .send({
          isAvailable: false
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject invalid availability data', async () => {
      const response = await request(app)
        .put('/api/v1/emergency/sereno/availability')
        .set('Authorization', `Bearer ${serenoToken}`)
        .send({
          isAvailable: 'yes' // Should be boolean
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/emergency/sereno/stats', () => {
    it('should get SERENO statistics successfully', async () => {
      const response = await request(app)
        .get('/api/v1/emergency/sereno/stats')
        .set('Authorization', `Bearer ${serenoToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.stats).toBeDefined();
      expect(response.body.data.stats.totalResponses).toBeDefined();
      expect(response.body.data.stats.successRate).toBeDefined();
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/emergency/sereno/stats');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });
  });
});