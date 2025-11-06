import request from 'supertest';
import { app } from '../server';
import { prisma } from '../config/database';
import { UserRole } from '@prisma/client';

describe('Chat Routes', () => {
  let user1Token: string;
  let user1Id: string;
  let user2Token: string;
  let user2Id: string;
  let serenoToken: string;
  let serenoId: string;

  beforeEach(async () => {
    // Clean up test data
    await prisma.chatMessage.deleteMany();
    await prisma.chatChannel.deleteMany();
    await prisma.emergencyAlert.deleteMany();
    await prisma.userProfile.deleteMany();
    await prisma.user.deleteMany();

    // Create test users
    const user1Response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'user1@example.com',
        username: 'testuser1',
        password: 'TestPass123',
        country: 'US',
        firstName: 'Test',
        lastName: 'User1'
      });

    user1Token = user1Response.body.data.token;
    user1Id = user1Response.body.data.user.id;

    const user2Response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'user2@example.com',
        username: 'testuser2',
        password: 'TestPass123',
        country: 'US',
        firstName: 'Test',
        lastName: 'User2'
      });

    user2Token = user2Response.body.data.token;
    user2Id = user2Response.body.data.user.id;

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

    // Update SERENO role
    await prisma.user.update({
      where: { id: serenoId },
      data: { role: UserRole.SERENO }
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.chatMessage.deleteMany();
    await prisma.chatChannel.deleteMany();
    await prisma.emergencyAlert.deleteMany();
    await prisma.userProfile.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('GET /api/v1/chat/channels', () => {
    it('should get user channels successfully', async () => {
      // Create a channel first
      await request(app)
        .post('/api/v1/chat/channels')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          type: 'INDIVIDUAL',
          participantIds: [user2Id]
        });

      const response = await request(app)
        .get('/api/v1/chat/channels')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.channels).toHaveLength(1);
    });

    it('should return empty array for user with no channels', async () => {
      const response = await request(app)
        .get('/api/v1/chat/channels')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.channels).toHaveLength(0);
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/chat/channels');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });
  });

  describe('POST /api/v1/chat/channels', () => {
    it('should create individual chat channel successfully', async () => {
      const response = await request(app)
        .post('/api/v1/chat/channels')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          type: 'INDIVIDUAL',
          participantIds: [user2Id]
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.channelId).toBeDefined();
    });

    it('should create group chat channel successfully', async () => {
      const response = await request(app)
        .post('/api/v1/chat/channels')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          type: 'GROUP',
          participantIds: [user2Id, serenoId]
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.channelId).toBeDefined();
    });

    it('should create emergency chat channel successfully', async () => {
      // Create emergency alert first
      const alertResponse = await request(app)
        .post('/api/v1/emergency/panic')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({});

      const alertId = alertResponse.body.data.alertId;

      const response = await request(app)
        .post('/api/v1/chat/channels')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          type: 'EMERGENCY',
          participantIds: [serenoId],
          emergencyAlertId: alertId
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.channelId).toBeDefined();
    });

    it('should reject invalid channel type', async () => {
      const response = await request(app)
        .post('/api/v1/chat/channels')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          type: 'INVALID_TYPE',
          participantIds: [user2Id]
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject empty participant list', async () => {
      const response = await request(app)
        .post('/api/v1/chat/channels')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          type: 'INDIVIDUAL',
          participantIds: []
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/chat/channels/:id/messages', () => {
    let channelId: string;

    beforeEach(async () => {
      // Create channel
      const channelResponse = await request(app)
        .post('/api/v1/chat/channels')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          type: 'INDIVIDUAL',
          participantIds: [user2Id]
        });

      channelId = channelResponse.body.data.channelId;

      // Send some messages
      await request(app)
        .post(`/api/v1/chat/channels/${channelId}/messages`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ content: 'Hello!' });

      await request(app)
        .post(`/api/v1/chat/channels/${channelId}/messages`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ content: 'Hi there!' });
    });

    it('should get channel messages successfully', async () => {
      const response = await request(app)
        .get(`/api/v1/chat/channels/${channelId}/messages`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.messages.length).toBeGreaterThan(0);
    });

    it('should respect pagination parameters', async () => {
      const response = await request(app)
        .get(`/api/v1/chat/channels/${channelId}/messages?limit=1&offset=0`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.messages).toHaveLength(1);
      expect(response.body.data.pagination.limit).toBe(1);
      expect(response.body.data.pagination.offset).toBe(0);
    });

    it('should reject access from non-participant', async () => {
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
        .get(`/api/v1/chat/channels/${channelId}/messages`)
        .set('Authorization', `Bearer ${otherUserResponse.body.data.token}`);

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('MESSAGES_FETCH_FAILED');
    });

    it('should reject invalid channel ID', async () => {
      const response = await request(app)
        .get('/api/v1/chat/channels/invalid-id/messages')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/chat/channels/:id/messages', () => {
    let channelId: string;

    beforeEach(async () => {
      // Create channel
      const channelResponse = await request(app)
        .post('/api/v1/chat/channels')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          type: 'INDIVIDUAL',
          participantIds: [user2Id]
        });

      channelId = channelResponse.body.data.channelId;
    });

    it('should send message successfully', async () => {
      const response = await request(app)
        .post(`/api/v1/chat/channels/${channelId}/messages`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          content: 'Hello, how are you?'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.messageId).toBeDefined();
    });

    it('should reject empty message content', async () => {
      const response = await request(app)
        .post(`/api/v1/chat/channels/${channelId}/messages`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          content: ''
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject message that is too long', async () => {
      const longMessage = 'a'.repeat(2001);
      const response = await request(app)
        .post(`/api/v1/chat/channels/${channelId}/messages`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          content: longMessage
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject inappropriate content', async () => {
      const response = await request(app)
        .post(`/api/v1/chat/channels/${channelId}/messages`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          content: 'This is spam content'
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('MESSAGE_REJECTED');
    });
  });

  describe('POST /api/v1/chat/channels/:id/participants', () => {
    let channelId: string;

    beforeEach(async () => {
      // Create group channel
      const channelResponse = await request(app)
        .post('/api/v1/chat/channels')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          type: 'GROUP',
          participantIds: [user2Id]
        });

      channelId = channelResponse.body.data.channelId;
    });

    it('should add participant successfully', async () => {
      const response = await request(app)
        .post(`/api/v1/chat/channels/${channelId}/participants`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          userId: serenoId
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject invalid user ID', async () => {
      const response = await request(app)
        .post(`/api/v1/chat/channels/${channelId}/participants`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          userId: 'invalid-id'
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('DELETE /api/v1/chat/channels/:id/participants/:userId', () => {
    let channelId: string;

    beforeEach(async () => {
      // Create group channel with all users
      const channelResponse = await request(app)
        .post('/api/v1/chat/channels')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          type: 'GROUP',
          participantIds: [user2Id, serenoId]
        });

      channelId = channelResponse.body.data.channelId;
    });

    it('should remove participant successfully', async () => {
      const response = await request(app)
        .delete(`/api/v1/chat/channels/${channelId}/participants/${serenoId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject invalid user ID', async () => {
      const response = await request(app)
        .delete(`/api/v1/chat/channels/${channelId}/participants/invalid-id`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/chat/emergency/:alertId/channel', () => {
    let alertId: string;
    let channelId: string;

    beforeEach(async () => {
      // Create emergency alert
      const alertResponse = await request(app)
        .post('/api/v1/emergency/panic')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({});

      alertId = alertResponse.body.data.alertId;

      // Create emergency channel
      const channelResponse = await request(app)
        .post('/api/v1/chat/channels')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          type: 'EMERGENCY',
          participantIds: [serenoId],
          emergencyAlertId: alertId
        });

      channelId = channelResponse.body.data.channelId;
    });

    it('should get emergency channel successfully', async () => {
      const response = await request(app)
        .get(`/api/v1/chat/emergency/${alertId}/channel`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.channel.id).toBe(channelId);
      expect(response.body.data.channel.type).toBe('EMERGENCY');
    });

    it('should return 404 for non-existent alert', async () => {
      const response = await request(app)
        .get('/api/v1/chat/emergency/00000000-0000-0000-0000-000000000000/channel')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('CHANNEL_NOT_FOUND');
    });

    it('should reject invalid alert ID', async () => {
      const response = await request(app)
        .get('/api/v1/chat/emergency/invalid-id/channel')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/chat/emergency/:alertId/context', () => {
    let alertId: string;
    let channelId: string;

    beforeEach(async () => {
      // Create emergency alert
      const alertResponse = await request(app)
        .post('/api/v1/emergency/panic')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({});

      alertId = alertResponse.body.data.alertId;

      // Create emergency channel
      const channelResponse = await request(app)
        .post('/api/v1/chat/channels')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          type: 'EMERGENCY',
          participantIds: [serenoId],
          emergencyAlertId: alertId
        });

      channelId = channelResponse.body.data.channelId;
    });

    it('should share emergency context successfully', async () => {
      const response = await request(app)
        .post(`/api/v1/chat/emergency/${alertId}/context`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          emergencyInfo: {
            userId: user1Id,
            location: {
              latitude: 40.7128,
              longitude: -74.0060,
              address: '123 Main St, New York, NY'
            },
            userProfile: {
              firstName: 'Test',
              mentalHealthConditions: ['anxiety']
            }
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject invalid emergency info', async () => {
      const response = await request(app)
        .post(`/api/v1/chat/emergency/${alertId}/context`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          emergencyInfo: 'invalid-data'
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});