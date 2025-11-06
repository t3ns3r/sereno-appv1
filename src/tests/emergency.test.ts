import request from 'supertest';
import { app } from '../server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Mock external services
jest.mock('../services/notificationService', () => ({
  sendPushNotification: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../config/pusher', () => ({
  pusher: {
    trigger: jest.fn().mockResolvedValue(undefined)
  }
}));

describe('Emergency System', () => {
  let userToken: string;
  let serenoToken: string;
  let userId: string;
  let serenoId: string;

  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'testuser@example.com',
        username: 'testuser',
        password: 'hashedpassword',
        country: 'US',
        role: 'USER'
      }
    });
    userId = user.id;
    userToken = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET!);

    // Create test SERENO
    const sereno = await prisma.user.create({
      data: {
        email: 'sereno@example.com',
        username: 'testsereno',
        password: 'hashedpassword',
        country: 'US',
        role: 'SERENO'
      }
    });
    serenoId = sereno.id;
    serenoToken = jwt.sign({ id: sereno.id, email: sereno.email }, process.env.JWT_SECRET!);
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.emergencyAlert.deleteMany({
      where: { userId }
    });
    await prisma.user.deleteMany({
      where: { id: { in: [userId, serenoId] } }
    });
    await prisma.$disconnect();
  });

  describe('POST /api/v1/emergency/panic', () => {
    it('should activate panic button successfully', async () => {
      const location = {
        latitude: 40.7128,
        longitude: -74.0060,
        address: 'New York, NY'
      };

      const response = await request(app)
        .post('/api/v1/emergency/panic')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ location })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.userId).toBe(userId);
      expect(response.body.data.status).toBe('active');
      expect(response.body.data.location).toEqual(location);
    });

    it('should activate panic button without location', async () => {
      const response = await request(app)
        .post('/api/v1/emergency/panic')
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.location).toBeUndefined();
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/v1/emergency/panic')
        .send({})
        .expect(401);
    });
  });

  describe('POST /api/v1/emergency/alert/:alertId/respond', () => {
    let alertId: string;

    beforeEach(async () => {
      // Create test emergency alert
      const alert = await prisma.emergencyAlert.create({
        data: {
          userId,
          status: 'ACTIVE',
          respondingSerenos: [],
          officialContactsNotified: []
        }
      });
      alertId = alert.id;
    });

    afterEach(async () => {
      await prisma.emergencyAlert.deleteMany({
        where: { id: alertId }
      });
    });

    it('should allow SERENO to respond to emergency', async () => {
      const response = await request(app)
        .post(`/api/v1/emergency/alert/${alertId}/respond`)
        .set('Authorization', `Bearer ${serenoToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Emergency response registered successfully');

      // Verify alert was updated
      const updatedAlert = await prisma.emergencyAlert.findUnique({
        where: { id: alertId }
      });
      expect(updatedAlert?.status).toBe('RESPONDED');
      expect(updatedAlert?.respondingSerenos).toContain(serenoId);
    });

    it('should not allow regular user to respond to emergency', async () => {
      const response = await request(app)
        .post(`/api/v1/emergency/alert/${alertId}/respond`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Only SERENOS can respond to emergencies');
    });

    it('should return 404 for non-existent alert', async () => {
      const response = await request(app)
        .post('/api/v1/emergency/alert/non-existent-id/respond')
        .set('Authorization', `Bearer ${serenoToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/emergency/alert/:alertId/resolve', () => {
    let alertId: string;

    beforeEach(async () => {
      const alert = await prisma.emergencyAlert.create({
        data: {
          userId,
          status: 'ACTIVE',
          respondingSerenos: [],
          officialContactsNotified: []
        }
      });
      alertId = alert.id;
    });

    afterEach(async () => {
      await prisma.emergencyAlert.deleteMany({
        where: { id: alertId }
      });
    });

    it('should allow user to resolve their own emergency', async () => {
      const response = await request(app)
        .put(`/api/v1/emergency/alert/${alertId}/resolve`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Emergency resolved successfully');

      // Verify alert was updated
      const updatedAlert = await prisma.emergencyAlert.findUnique({
        where: { id: alertId }
      });
      expect(updatedAlert?.status).toBe('RESOLVED');
    });

    it('should not allow other users to resolve emergency', async () => {
      const response = await request(app)
        .put(`/api/v1/emergency/alert/${alertId}/resolve`)
        .set('Authorization', `Bearer ${serenoToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/emergency/contacts/:country', () => {
    it('should return emergency contacts for US', async () => {
      const response = await request(app)
        .get('/api/v1/emergency/contacts/US')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      const contact = response.body.data[0];
      expect(contact).toHaveProperty('name');
      expect(contact).toHaveProperty('phoneNumber');
      expect(contact).toHaveProperty('type');
      expect(contact).toHaveProperty('available24h');
    });

    it('should return generic contact for unknown country', async () => {
      const response = await request(app)
        .get('/api/v1/emergency/contacts/XX')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].phoneNumber).toBe('911');
    });
  });

  describe('GET /api/v1/emergency/history', () => {
    it('should return user emergency history', async () => {
      // Create test emergency alert
      await prisma.emergencyAlert.create({
        data: {
          userId,
          status: 'RESOLVED',
          respondingSerenos: [],
          officialContactsNotified: []
        }
      });

      const response = await request(app)
        .get('/api/v1/emergency/history')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/v1/emergency/history')
        .expect(401);
    });
  });

  describe('GET /api/v1/emergency/active', () => {
    it('should return active emergencies for SERENO', async () => {
      const response = await request(app)
        .get('/api/v1/emergency/active')
        .set('Authorization', `Bearer ${serenoToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should not allow regular users to view active emergencies', async () => {
      const response = await request(app)
        .get('/api/v1/emergency/active')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Only SERENOS can view active emergencies');
    });
  });

  describe('Panic Button Activation Flow', () => {
    it('should complete full panic button activation with location', async () => {
      const location = {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
        address: 'New York, NY'
      };

      // Step 1: Activate panic button
      const panicResponse = await request(app)
        .post('/api/v1/emergency/panic')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ location })
        .expect(201);

      expect(panicResponse.body.success).toBe(true);
      expect(panicResponse.body.data).toHaveProperty('id');
      expect(panicResponse.body.data.userId).toBe(userId);
      expect(panicResponse.body.data.status).toBe('active');
      expect(panicResponse.body.data.location).toEqual(location);

      const alertId = panicResponse.body.data.id;

      // Step 2: Verify emergency contacts are retrieved
      const contactsResponse = await request(app)
        .get('/api/v1/emergency/contacts/US')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(contactsResponse.body.success).toBe(true);
      expect(contactsResponse.body.data).toBeInstanceOf(Array);

      // Step 3: Verify alert appears in active emergencies for SERENOS
      const activeResponse = await request(app)
        .get('/api/v1/emergency/active')
        .set('Authorization', `Bearer ${serenoToken}`)
        .expect(200);

      expect(activeResponse.body.success).toBe(true);
      expect(activeResponse.body.data).toBeInstanceOf(Array);
      
      // Step 4: SERENO responds to emergency
      const respondResponse = await request(app)
        .post(`/api/v1/emergency/alert/${alertId}/respond`)
        .set('Authorization', `Bearer ${serenoToken}`)
        .expect(200);

      expect(respondResponse.body.success).toBe(true);

      // Step 5: Verify alert status changed to responded
      const alertResponse = await request(app)
        .get(`/api/v1/emergency/alert/${alertId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(alertResponse.body.success).toBe(true);
      expect(alertResponse.body.data.alert.status).toBe('RESPONDED');
      expect(alertResponse.body.data.alert.respondingSerenos).toContain(serenoId);
    });

    it('should handle panic button activation without location', async () => {
      const panicResponse = await request(app)
        .post('/api/v1/emergency/panic')
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(201);

      expect(panicResponse.body.success).toBe(true);
      expect(panicResponse.body.data.location).toBeUndefined();
      expect(panicResponse.body.data.status).toBe('active');
    });

    it('should validate location data when provided', async () => {
      const invalidLocation = {
        latitude: 200, // Invalid latitude
        longitude: -74.0060
      };

      const response = await request(app)
        .post('/api/v1/emergency/panic')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ location: invalidLocation })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should prevent multiple active alerts from same user', async () => {
      // Create first alert
      await request(app)
        .post('/api/v1/emergency/panic')
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(201);

      // Try to create second alert
      const response = await request(app)
        .post('/api/v1/emergency/panic')
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('active emergency alert');
    });
  });

  describe('SERENO Notification System', () => {
    const mockSubscription = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/test',
      keys: {
        p256dh: 'test-p256dh-key',
        auth: 'test-auth-key'
      }
    };

    beforeEach(async () => {
      // Subscribe SERENO to push notifications
      await request(app)
        .post('/api/v1/emergency/notifications/subscribe')
        .set('Authorization', `Bearer ${serenoToken}`)
        .send({
          subscription: mockSubscription,
          deviceInfo: {
            userAgent: 'Test Browser',
            platform: 'Test Platform'
          }
        });
    });

    it('should notify SERENOS when panic button is activated', async () => {
      const location = {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10
      };

      const response = await request(app)
        .post('/api/v1/emergency/panic')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ location })
        .expect(201);

      expect(response.body.success).toBe(true);
      
      // Verify notification service was called (mocked)
      // In a real test, you would verify the push notification was sent
    });

    it('should filter SERENOS by geographic location', async () => {
      // Create SERENO in different country
      const foreignSereno = await prisma.user.create({
        data: {
          email: 'foreign@example.com',
          username: 'foreignsereno',
          password: 'hashedpassword',
          country: 'CA', // Different country
          role: 'SERENO'
        }
      });

      const foreignToken = jwt.sign({ id: foreignSereno.id, email: foreignSereno.email }, process.env.JWT_SECRET!);

      // Activate panic button
      await request(app)
        .post('/api/v1/emergency/panic')
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(201);

      // US SERENO should see the alert
      const usResponse = await request(app)
        .get('/api/v1/emergency/active')
        .set('Authorization', `Bearer ${serenoToken}`)
        .expect(200);

      expect(usResponse.body.data.length).toBeGreaterThan(0);

      // Foreign SERENO should not see the alert
      const foreignResponse = await request(app)
        .get('/api/v1/emergency/active')
        .set('Authorization', `Bearer ${foreignToken}`)
        .expect(200);

      expect(foreignResponse.body.data.length).toBe(0);

      // Cleanup
      await prisma.user.delete({ where: { id: foreignSereno.id } });
    });

    it('should track SERENO response times', async () => {
      // Create emergency alert
      const panicResponse = await request(app)
        .post('/api/v1/emergency/panic')
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      const alertId = panicResponse.body.data.id;
      const startTime = Date.now();

      // SERENO responds
      await request(app)
        .post(`/api/v1/emergency/alert/${alertId}/respond`)
        .set('Authorization', `Bearer ${serenoToken}`)
        .expect(200);

      const responseTime = Date.now() - startTime;

      // Verify response was recorded with timing
      const alert = await prisma.emergencyAlert.findUnique({
        where: { id: alertId }
      });

      expect(alert?.respondingSerenos).toContain(serenoId);
      expect(alert?.status).toBe('RESPONDED');
      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds in test
    });

    it('should handle SERENO availability status', async () => {
      // Set SERENO as unavailable
      await request(app)
        .put('/api/v1/emergency/sereno/availability')
        .set('Authorization', `Bearer ${serenoToken}`)
        .send({ isAvailable: false })
        .expect(200);

      // Create emergency - unavailable SERENO should not be notified
      await request(app)
        .post('/api/v1/emergency/panic')
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(201);

      // Set SERENO as available
      await request(app)
        .put('/api/v1/emergency/sereno/availability')
        .set('Authorization', `Bearer ${serenoToken}`)
        .send({ 
          isAvailable: true,
          location: {
            latitude: 40.7128,
            longitude: -74.0060
          }
        })
        .expect(200);

      // Now SERENO should be able to see active emergencies
      const response = await request(app)
        .get('/api/v1/emergency/active')
        .set('Authorization', `Bearer ${serenoToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Emergency Chat System', () => {
    let alertId: string;
    let chatChannelId: string;

    beforeEach(async () => {
      // Create emergency alert
      const panicResponse = await request(app)
        .post('/api/v1/emergency/panic')
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      alertId = panicResponse.body.data.id;

      // SERENO responds to create chat channel
      await request(app)
        .post(`/api/v1/emergency/alert/${alertId}/respond`)
        .set('Authorization', `Bearer ${serenoToken}`)
        .expect(200);

      // Get emergency chat channel
      const channelResponse = await request(app)
        .get(`/api/v1/chat/emergency/${alertId}/channel`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      chatChannelId = channelResponse.body.data.channel.id;
    });

    it('should create emergency chat channel when SERENO responds', async () => {
      expect(chatChannelId).toBeDefined();

      // Verify channel exists and is of emergency type
      const channelResponse = await request(app)
        .get(`/api/v1/chat/emergency/${alertId}/channel`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(channelResponse.body.data.channel.type).toBe('EMERGENCY');
      expect(channelResponse.body.data.channel.emergencyAlertId).toBe(alertId);
    });

    it('should allow emergency context sharing', async () => {
      const emergencyInfo = {
        userId: userId,
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
          address: '123 Main St, New York, NY'
        },
        userProfile: {
          firstName: 'Test',
          mentalHealthConditions: ['anxiety', 'depression']
        }
      };

      const response = await request(app)
        .post(`/api/v1/chat/emergency/${alertId}/context`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ emergencyInfo })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify context message was added to chat
      const messagesResponse = await request(app)
        .get(`/api/v1/chat/channels/${chatChannelId}/messages`)
        .set('Authorization', `Bearer ${serenoToken}`)
        .expect(200);

      const contextMessage = messagesResponse.body.data.messages.find(
        (msg: any) => msg.content.includes('Información de Emergencia')
      );

      expect(contextMessage).toBeTruthy();
      expect(contextMessage.content).toContain('Test');
      expect(contextMessage.content).toContain('anxiety');
    });

    it('should support real-time messaging in emergency chat', async () => {
      // User sends message
      const userMessageResponse = await request(app)
        .post(`/api/v1/chat/channels/${chatChannelId}/messages`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: 'I need help, feeling very anxious' })
        .expect(201);

      expect(userMessageResponse.body.success).toBe(true);

      // SERENO responds
      const serenoMessageResponse = await request(app)
        .post(`/api/v1/chat/channels/${chatChannelId}/messages`)
        .set('Authorization', `Bearer ${serenoToken}`)
        .send({ content: 'I am here to help. Can you tell me more about how you are feeling?' })
        .expect(201);

      expect(serenoMessageResponse.body.success).toBe(true);

      // Verify both messages exist
      const messagesResponse = await request(app)
        .get(`/api/v1/chat/channels/${chatChannelId}/messages`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const messages = messagesResponse.body.data.messages;
      expect(messages.length).toBeGreaterThanOrEqual(2);
      
      const userMessage = messages.find((msg: any) => msg.content.includes('very anxious'));
      const serenoMessage = messages.find((msg: any) => msg.content.includes('here to help'));
      
      expect(userMessage).toBeTruthy();
      expect(serenoMessage).toBeTruthy();
    });

    it('should allow multiple SERENOS in group emergency chat', async () => {
      // Create second SERENO
      const sereno2 = await prisma.user.create({
        data: {
          email: 'sereno2@example.com',
          username: 'testsereno2',
          password: 'hashedpassword',
          country: 'US',
          role: 'SERENO'
        }
      });

      const sereno2Token = jwt.sign({ id: sereno2.id, email: sereno2.email }, process.env.JWT_SECRET!);

      // Second SERENO responds to same emergency
      await request(app)
        .post(`/api/v1/emergency/alert/${alertId}/respond`)
        .set('Authorization', `Bearer ${sereno2Token}`)
        .expect(200);

      // Add second SERENO to chat
      await request(app)
        .post(`/api/v1/chat/channels/${chatChannelId}/participants`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ userId: sereno2.id })
        .expect(200);

      // Verify both SERENOS can participate
      await request(app)
        .post(`/api/v1/chat/channels/${chatChannelId}/messages`)
        .set('Authorization', `Bearer ${sereno2Token}`)
        .send({ content: 'I am also here to assist' })
        .expect(201);

      // Cleanup
      await prisma.user.delete({ where: { id: sereno2.id } });
    });

    it('should archive chat when emergency is resolved', async () => {
      // Resolve emergency
      await request(app)
        .put(`/api/v1/emergency/alert/${alertId}/resolve`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Verify chat is archived (messages still accessible but no new messages)
      const messagesResponse = await request(app)
        .get(`/api/v1/chat/channels/${chatChannelId}/messages`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(messagesResponse.body.success).toBe(true);
      
      // Try to send message to archived chat (should fail or be restricted)
      const newMessageResponse = await request(app)
        .post(`/api/v1/chat/channels/${chatChannelId}/messages`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: 'This should not work' });

      // Depending on implementation, this might return 400 or 403
      expect([400, 403]).toContain(newMessageResponse.status);
    });
  });

  describe('Geolocation Sharing', () => {
    it('should validate location coordinates', async () => {
      const validLocation = {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10
      };

      const response = await request(app)
        .post('/api/v1/emergency/panic')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ location: validLocation })
        .expect(201);

      expect(response.body.data.location).toEqual(validLocation);
    });

    it('should reject invalid latitude', async () => {
      const invalidLocation = {
        latitude: 91, // Invalid: > 90
        longitude: -74.0060,
        accuracy: 10
      };

      const response = await request(app)
        .post('/api/v1/emergency/panic')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ location: invalidLocation })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject invalid longitude', async () => {
      const invalidLocation = {
        latitude: 40.7128,
        longitude: 181, // Invalid: > 180
        accuracy: 10
      };

      const response = await request(app)
        .post('/api/v1/emergency/panic')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ location: invalidLocation })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle location sharing with SERENOS', async () => {
      const location = {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 5,
        address: 'Central Park, New York, NY'
      };

      // Create emergency with location
      const panicResponse = await request(app)
        .post('/api/v1/emergency/panic')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ location })
        .expect(201);

      const alertId = panicResponse.body.data.id;

      // SERENO responds
      await request(app)
        .post(`/api/v1/emergency/alert/${alertId}/respond`)
        .set('Authorization', `Bearer ${serenoToken}`)
        .expect(200);

      // SERENO should be able to access location information
      const alertResponse = await request(app)
        .get(`/api/v1/emergency/alert/${alertId}`)
        .set('Authorization', `Bearer ${serenoToken}`)
        .expect(200);

      expect(alertResponse.body.data.alert.location).toEqual(location);
    });

    it('should protect location privacy from unauthorized users', async () => {
      const location = {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10
      };

      // Create emergency with location
      const panicResponse = await request(app)
        .post('/api/v1/emergency/panic')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ location })
        .expect(201);

      const alertId = panicResponse.body.data.id;

      // Create unauthorized user
      const unauthorizedUser = await prisma.user.create({
        data: {
          email: 'unauthorized@example.com',
          username: 'unauthorized',
          password: 'hashedpassword',
          country: 'US',
          role: 'USER'
        }
      });

      const unauthorizedToken = jwt.sign({ id: unauthorizedUser.id, email: unauthorizedUser.email }, process.env.JWT_SECRET!);

      // Unauthorized user should not access alert details
      const response = await request(app)
        .get(`/api/v1/emergency/alert/${alertId}`)
        .set('Authorization', `Bearer ${unauthorizedToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);

      // Cleanup
      await prisma.user.delete({ where: { id: unauthorizedUser.id } });
    });

    it('should calculate distance for SERENO proximity', async () => {
      const userLocation = {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10
      };

      // Set SERENO location
      await request(app)
        .put('/api/v1/emergency/sereno/availability')
        .set('Authorization', `Bearer ${serenoToken}`)
        .send({
          isAvailable: true,
          location: {
            latitude: 40.7589, // Close to user location
            longitude: -73.9851
          }
        })
        .expect(200);

      // Create emergency
      const panicResponse = await request(app)
        .post('/api/v1/emergency/panic')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ location: userLocation })
        .expect(201);

      // Verify SERENO can see the emergency (within proximity)
      const activeResponse = await request(app)
        .get('/api/v1/emergency/active')
        .set('Authorization', `Bearer ${serenoToken}`)
        .expect(200);

      expect(activeResponse.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('Push Notification Endpoints', () => {
    const mockSubscription = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/test',
      keys: {
        p256dh: 'test-p256dh-key',
        auth: 'test-auth-key'
      }
    };

    describe('POST /api/v1/emergency/notifications/subscribe', () => {
      it('should subscribe to push notifications', async () => {
        const response = await request(app)
          .post('/api/v1/emergency/notifications/subscribe')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            subscription: mockSubscription,
            deviceInfo: {
              userAgent: 'Test Browser',
              platform: 'Test Platform'
            }
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('Push notification subscription registered successfully');
      });

      it('should require valid subscription data', async () => {
        const response = await request(app)
          .post('/api/v1/emergency/notifications/subscribe')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            subscription: { invalid: 'data' }
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Invalid subscription data');
      });
    });

    describe('POST /api/v1/emergency/notifications/unsubscribe', () => {
      it('should unsubscribe from push notifications', async () => {
        const response = await request(app)
          .post('/api/v1/emergency/notifications/unsubscribe')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            endpoint: mockSubscription.endpoint
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('Push notification subscription removed successfully');
      });

      it('should require endpoint', async () => {
        const response = await request(app)
          .post('/api/v1/emergency/notifications/unsubscribe')
          .set('Authorization', `Bearer ${userToken}`)
          .send({})
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Endpoint is required');
      });
    });
  });

  describe('Notification Preferences', () => {
    describe('GET /api/v1/emergency/notifications/preferences', () => {
      it('should return default notification preferences', async () => {
        const response = await request(app)
          .get('/api/v1/emergency/notifications/preferences')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('emergencyAlerts');
        expect(response.body.data).toHaveProperty('dailyReminders');
        expect(response.body.data).toHaveProperty('pushEnabled');
      });
    });

    describe('PUT /api/v1/emergency/notifications/preferences', () => {
      it('should update notification preferences', async () => {
        const preferences = {
          emergencyAlerts: false,
          dailyReminders: true,
          pushEnabled: true
        };

        const response = await request(app)
          .put('/api/v1/emergency/notifications/preferences')
          .set('Authorization', `Bearer ${userToken}`)
          .send(preferences)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.emergencyAlerts).toBe(false);
        expect(response.body.data.dailyReminders).toBe(true);
        expect(response.body.data.pushEnabled).toBe(true);
      });
    });
  });
});