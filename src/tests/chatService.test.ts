import { chatService } from '../services/chatService';
import { prisma } from '../config/database';
import { UserRole, ChatType, MessageType } from '@prisma/client';

describe('ChatService', () => {
  let testUser1: any;
  let testUser2: any;
  let testSereno: any;

  beforeEach(async () => {
    // Clean up test data
    await prisma.chatMessage.deleteMany();
    await prisma.chatChannel.deleteMany();
    await prisma.emergencyAlert.deleteMany();
    await prisma.userProfile.deleteMany();
    await prisma.user.deleteMany();

    // Create test users
    testUser1 = await prisma.user.create({
      data: {
        email: 'user1@example.com',
        username: 'testuser1',
        password: 'hashedpassword',
        country: 'US',
        role: UserRole.USER
      }
    });

    testUser2 = await prisma.user.create({
      data: {
        email: 'user2@example.com',
        username: 'testuser2',
        password: 'hashedpassword',
        country: 'US',
        role: UserRole.USER
      }
    });

    testSereno = await prisma.user.create({
      data: {
        email: 'sereno@example.com',
        username: 'testsereno',
        password: 'hashedpassword',
        country: 'US',
        role: UserRole.SERENO
      }
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

  describe('createChannel', () => {
    it('should create individual chat channel successfully', async () => {
      const channelId = await chatService.createChannel({
        type: ChatType.INDIVIDUAL,
        participantIds: [testUser1.id, testUser2.id]
      });

      expect(channelId).toBeDefined();

      const channel = await prisma.chatChannel.findUnique({
        where: { id: channelId },
        include: { participants: true }
      });

      expect(channel).toBeTruthy();
      expect(channel?.type).toBe(ChatType.INDIVIDUAL);
      expect(channel?.participants).toHaveLength(2);
    });

    it('should create emergency chat channel successfully', async () => {
      // Create emergency alert first
      const emergencyAlert = await prisma.emergencyAlert.create({
        data: {
          userId: testUser1.id,
          status: 'ACTIVE'
        }
      });

      const channelId = await chatService.createChannel({
        type: ChatType.EMERGENCY,
        participantIds: [testUser1.id, testSereno.id],
        emergencyAlertId: emergencyAlert.id
      });

      expect(channelId).toBeDefined();

      const channel = await prisma.chatChannel.findUnique({
        where: { id: channelId }
      });

      expect(channel?.type).toBe(ChatType.EMERGENCY);
      expect(channel?.emergencyAlertId).toBe(emergencyAlert.id);
    });

    it('should create group chat channel successfully', async () => {
      const channelId = await chatService.createChannel({
        type: ChatType.GROUP,
        participantIds: [testUser1.id, testUser2.id, testSereno.id]
      });

      expect(channelId).toBeDefined();

      const channel = await prisma.chatChannel.findUnique({
        where: { id: channelId },
        include: { participants: true }
      });

      expect(channel?.type).toBe(ChatType.GROUP);
      expect(channel?.participants).toHaveLength(3);
    });
  });

  describe('sendMessage', () => {
    let channelId: string;

    beforeEach(async () => {
      channelId = await chatService.createChannel({
        type: ChatType.INDIVIDUAL,
        participantIds: [testUser1.id, testUser2.id]
      });
    });

    it('should send text message successfully', async () => {
      const messageId = await chatService.sendMessage({
        channelId,
        senderId: testUser1.id,
        content: 'Hello, how are you?'
      });

      expect(messageId).toBeDefined();

      const message = await prisma.chatMessage.findUnique({
        where: { id: messageId }
      });

      expect(message?.content).toBe('Hello, how are you?');
      expect(message?.type).toBe(MessageType.TEXT);
      expect(message?.senderId).toBe(testUser1.id);
    });

    it('should send system message successfully', async () => {
      const messageId = await chatService.sendMessage({
        channelId,
        senderId: 'system',
        content: 'User joined the chat',
        type: MessageType.SYSTEM
      });

      expect(messageId).toBeDefined();

      const message = await prisma.chatMessage.findUnique({
        where: { id: messageId }
      });

      expect(message?.type).toBe(MessageType.SYSTEM);
      expect(message?.senderId).toBe('system');
    });

    it('should reject message from non-participant', async () => {
      const nonParticipant = await prisma.user.create({
        data: {
          email: 'nonparticipant@example.com',
          username: 'nonparticipant',
          password: 'hashedpassword',
          country: 'US'
        }
      });

      await expect(chatService.sendMessage({
        channelId,
        senderId: nonParticipant.id,
        content: 'I should not be able to send this'
      })).rejects.toThrow('Channel not found or access denied');
    });
  });

  describe('getChannelMessages', () => {
    let channelId: string;

    beforeEach(async () => {
      channelId = await chatService.createChannel({
        type: ChatType.INDIVIDUAL,
        participantIds: [testUser1.id, testUser2.id]
      });

      // Send some test messages
      await chatService.sendMessage({
        channelId,
        senderId: testUser1.id,
        content: 'First message'
      });

      await chatService.sendMessage({
        channelId,
        senderId: testUser2.id,
        content: 'Second message'
      });

      await chatService.sendMessage({
        channelId,
        senderId: testUser1.id,
        content: 'Third message'
      });
    });

    it('should get messages for participant', async () => {
      const messages = await chatService.getChannelMessages(channelId, testUser1.id);

      expect(messages).toHaveLength(4); // 3 user messages + 1 system message
      expect(messages[1].content).toBe('First message'); // Skip system message
      expect(messages[2].content).toBe('Second message');
      expect(messages[3].content).toBe('Third message');
    });

    it('should respect pagination limits', async () => {
      const messages = await chatService.getChannelMessages(channelId, testUser1.id, 2);

      expect(messages).toHaveLength(2);
    });

    it('should reject access from non-participant', async () => {
      const nonParticipant = await prisma.user.create({
        data: {
          email: 'nonparticipant@example.com',
          username: 'nonparticipant',
          password: 'hashedpassword',
          country: 'US'
        }
      });

      await expect(chatService.getChannelMessages(channelId, nonParticipant.id))
        .rejects.toThrow('Channel not found or access denied');
    });
  });

  describe('getUserChannels', () => {
    it('should get user channels successfully', async () => {
      // Create multiple channels for user
      const channel1 = await chatService.createChannel({
        type: ChatType.INDIVIDUAL,
        participantIds: [testUser1.id, testUser2.id]
      });

      const channel2 = await chatService.createChannel({
        type: ChatType.GROUP,
        participantIds: [testUser1.id, testUser2.id, testSereno.id]
      });

      const channels = await chatService.getUserChannels(testUser1.id);

      expect(channels).toHaveLength(2);
      expect(channels.map(c => c.id)).toContain(channel1);
      expect(channels.map(c => c.id)).toContain(channel2);
    });

    it('should return empty array for user with no channels', async () => {
      const newUser = await prisma.user.create({
        data: {
          email: 'newuser@example.com',
          username: 'newuser',
          password: 'hashedpassword',
          country: 'US'
        }
      });

      const channels = await chatService.getUserChannels(newUser.id);
      expect(channels).toHaveLength(0);
    });
  });

  describe('addParticipant', () => {
    let channelId: string;

    beforeEach(async () => {
      channelId = await chatService.createChannel({
        type: ChatType.GROUP,
        participantIds: [testUser1.id, testUser2.id]
      });
    });

    it('should add participant successfully', async () => {
      await chatService.addParticipant(channelId, testSereno.id, testUser1.id);

      const channel = await prisma.chatChannel.findUnique({
        where: { id: channelId },
        include: { participants: true }
      });

      expect(channel?.participants).toHaveLength(3);
      expect(channel?.participants.map(p => p.id)).toContain(testSereno.id);
    });

    it('should reject adding participant by non-participant', async () => {
      const nonParticipant = await prisma.user.create({
        data: {
          email: 'nonparticipant@example.com',
          username: 'nonparticipant',
          password: 'hashedpassword',
          country: 'US'
        }
      });

      await expect(chatService.addParticipant(channelId, testSereno.id, nonParticipant.id))
        .rejects.toThrow('Channel not found or access denied');
    });
  });

  describe('removeParticipant', () => {
    let channelId: string;

    beforeEach(async () => {
      channelId = await chatService.createChannel({
        type: ChatType.GROUP,
        participantIds: [testUser1.id, testUser2.id, testSereno.id]
      });
    });

    it('should remove participant successfully', async () => {
      await chatService.removeParticipant(channelId, testSereno.id, testUser1.id);

      const channel = await prisma.chatChannel.findUnique({
        where: { id: channelId },
        include: { participants: true }
      });

      expect(channel?.participants).toHaveLength(2);
      expect(channel?.participants.map(p => p.id)).not.toContain(testSereno.id);
    });
  });

  describe('getEmergencyChannel', () => {
    it('should get emergency channel by alert ID', async () => {
      // Create emergency alert
      const emergencyAlert = await prisma.emergencyAlert.create({
        data: {
          userId: testUser1.id,
          status: 'ACTIVE'
        }
      });

      // Create emergency channel
      const channelId = await chatService.createChannel({
        type: ChatType.EMERGENCY,
        participantIds: [testUser1.id, testSereno.id],
        emergencyAlertId: emergencyAlert.id
      });

      const channel = await chatService.getEmergencyChannel(emergencyAlert.id);

      expect(channel).toBeTruthy();
      expect(channel?.id).toBe(channelId);
      expect(channel?.type).toBe(ChatType.EMERGENCY);
    });

    it('should return null for non-existent emergency alert', async () => {
      const channel = await chatService.getEmergencyChannel('non-existent-id');
      expect(channel).toBeNull();
    });
  });

  describe('moderateMessage', () => {
    it('should allow appropriate messages', async () => {
      const result = await chatService.moderateMessage('Hello, I need help with anxiety');

      expect(result.allowed).toBe(true);
    });

    it('should reject messages with inappropriate content', async () => {
      const result = await chatService.moderateMessage('This is spam content');

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Contenido inapropiado detectado');
    });

    it('should reject messages that are too long', async () => {
      const longMessage = 'a'.repeat(2001);
      const result = await chatService.moderateMessage(longMessage);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Mensaje demasiado largo');
    });
  });

  describe('shareEmergencyContext', () => {
    let channelId: string;

    beforeEach(async () => {
      const emergencyAlert = await prisma.emergencyAlert.create({
        data: {
          userId: testUser1.id,
          status: 'ACTIVE'
        }
      });

      channelId = await chatService.createChannel({
        type: ChatType.EMERGENCY,
        participantIds: [testUser1.id, testSereno.id],
        emergencyAlertId: emergencyAlert.id
      });
    });

    it('should share emergency context successfully', async () => {
      await chatService.shareEmergencyContext(channelId, {
        userId: testUser1.id,
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
          address: '123 Main St, New York, NY'
        },
        userProfile: {
          firstName: 'Test',
          mentalHealthConditions: ['anxiety', 'depression']
        }
      });

      const messages = await chatService.getChannelMessages(channelId, testUser1.id);
      const contextMessage = messages.find(m => m.content.includes('Información de Emergencia'));

      expect(contextMessage).toBeTruthy();
      expect(contextMessage?.content).toContain('Test');
      expect(contextMessage?.content).toContain('anxiety');
      expect(contextMessage?.content).toContain('40.7128');
    });
  });
});