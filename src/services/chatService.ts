import { PrismaClient, ChatType, MessageType } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface CreateChatChannelData {
  type: ChatType;
  participantIds: string[];
  emergencyAlertId?: string;
}

export interface SendMessageData {
  channelId: string;
  senderId: string;
  content: string;
  type?: MessageType;
}

export interface ChatChannelInfo {
  id: string;
  type: ChatType;
  emergencyAlertId?: string | null;
  participants: Array<{
    id: string;
    username: string;
    role: string;
  }>;
  lastMessage?: {
    content: string;
    timestamp: Date;
    senderUsername: string;
  };
  createdAt: Date;
  emergencyAlert?: any;
}

export class ChatService {
  /**
   * Create a new chat channel
   */
  async createChannel(data: CreateChatChannelData): Promise<string> {
    try {
      const channel = await prisma.chatChannel.create({
        data: {
          type: data.type,
          emergencyAlertId: data.emergencyAlertId,
          participants: {
            connect: data.participantIds.map(id => ({ id }))
          }
        }
      });

      // Send system message for channel creation
      await this.sendMessage({
        channelId: channel.id,
        senderId: 'system',
        content: data.type === 'EMERGENCY' 
          ? 'Canal de emergencia creado. Un SERENO se unirá pronto para ayudarte.'
          : 'Canal de chat creado.',
        type: MessageType.SYSTEM
      });

      logger.info(`Chat channel ${channel.id} created with type ${data.type}`);
      return channel.id;
    } catch (error) {
      logger.error('Error creating chat channel:', error);
      throw new Error('Failed to create chat channel');
    }
  }

  /**
   * Send a message to a chat channel
   */
  async sendMessage(data: SendMessageData): Promise<string> {
    try {
      // Verify channel exists and user has access
      if (data.senderId !== 'system') {
        const channel = await prisma.chatChannel.findFirst({
          where: {
            id: data.channelId,
            participants: {
              some: { id: data.senderId }
            }
          }
        });

        if (!channel) {
          throw new Error('Channel not found or access denied');
        }
      }

      const message = await prisma.chatMessage.create({
        data: {
          channelId: data.channelId,
          senderId: data.senderId,
          content: data.content,
          type: data.type || MessageType.TEXT
        }
      });

      logger.info(`Message sent to channel ${data.channelId} by ${data.senderId}`);
      return message.id;
    } catch (error) {
      logger.error('Error sending message:', error);
      throw new Error('Failed to send message');
    }
  }

  /**
   * Get chat channel messages with pagination
   */
  async getChannelMessages(
    channelId: string, 
    userId: string, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<any[]> {
    try {
      // Verify user has access to channel
      const channel = await prisma.chatChannel.findFirst({
        where: {
          id: channelId,
          participants: {
            some: { id: userId }
          }
        }
      });

      if (!channel) {
        throw new Error('Channel not found or access denied');
      }

      const messages = await prisma.chatMessage.findMany({
        where: { channelId },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });

      return messages.reverse().map(message => ({
        id: message.id,
        content: message.content,
        type: message.type,
        createdAt: message.createdAt,
        sender: message.senderId === 'system' 
          ? { id: 'system', username: 'Sistema', role: 'SYSTEM' }
          : message.sender
      }));
    } catch (error) {
      logger.error('Error getting channel messages:', error);
      throw new Error('Failed to get channel messages');
    }
  }

  /**
   * Get user's chat channels
   */
  async getUserChannels(userId: string): Promise<ChatChannelInfo[]> {
    try {
      const channels = await prisma.chatChannel.findMany({
        where: {
          participants: {
            some: { id: userId }
          }
        },
        include: {
          participants: {
            select: {
              id: true,
              username: true,
              role: true
            }
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              sender: {
                select: {
                  username: true
                }
              }
            }
          },
          emergencyAlert: {
            select: {
              id: true,
              status: true,
              createdAt: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return channels.map(channel => ({
        id: channel.id,
        type: channel.type,
        emergencyAlertId: channel.emergencyAlertId,
        participants: channel.participants,
        lastMessage: channel.messages[0] ? {
          content: channel.messages[0].content,
          timestamp: channel.messages[0].createdAt,
          senderUsername: channel.messages[0].senderId === 'system' 
            ? 'Sistema' 
            : channel.messages[0].sender.username
        } : undefined,
        createdAt: channel.createdAt,
        emergencyAlert: channel.emergencyAlert
      }));
    } catch (error) {
      logger.error('Error getting user channels:', error);
      throw new Error('Failed to get user channels');
    }
  }

  /**
   * Add participant to chat channel
   */
  async addParticipant(channelId: string, userId: string, addedBy: string): Promise<void> {
    try {
      // Verify the person adding has access to the channel
      const channel = await prisma.chatChannel.findFirst({
        where: {
          id: channelId,
          participants: {
            some: { id: addedBy }
          }
        }
      });

      if (!channel) {
        throw new Error('Channel not found or access denied');
      }

      // Add participant
      await prisma.chatChannel.update({
        where: { id: channelId },
        data: {
          participants: {
            connect: { id: userId }
          }
        }
      });

      // Get user info for system message
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true }
      });

      // Send system message
      await this.sendMessage({
        channelId,
        senderId: 'system',
        content: `${user?.username || 'Usuario'} se ha unido al chat.`,
        type: MessageType.SYSTEM
      });

      logger.info(`User ${userId} added to channel ${channelId} by ${addedBy}`);
    } catch (error) {
      logger.error('Error adding participant to channel:', error);
      throw new Error('Failed to add participant to channel');
    }
  }

  /**
   * Remove participant from chat channel
   */
  async removeParticipant(channelId: string, userId: string, removedBy: string): Promise<void> {
    try {
      // Verify the person removing has access to the channel
      const channel = await prisma.chatChannel.findFirst({
        where: {
          id: channelId,
          participants: {
            some: { id: removedBy }
          }
        }
      });

      if (!channel) {
        throw new Error('Channel not found or access denied');
      }

      // Remove participant
      await prisma.chatChannel.update({
        where: { id: channelId },
        data: {
          participants: {
            disconnect: { id: userId }
          }
        }
      });

      // Get user info for system message
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true }
      });

      // Send system message
      await this.sendMessage({
        channelId,
        senderId: 'system',
        content: `${user?.username || 'Usuario'} ha salido del chat.`,
        type: MessageType.SYSTEM
      });

      logger.info(`User ${userId} removed from channel ${channelId} by ${removedBy}`);
    } catch (error) {
      logger.error('Error removing participant from channel:', error);
      throw new Error('Failed to remove participant from channel');
    }
  }

  /**
   * Get emergency chat channel for an alert
   */
  async getEmergencyChannel(alertId: string): Promise<ChatChannelInfo | null> {
    try {
      const channel = await prisma.chatChannel.findFirst({
        where: { emergencyAlertId: alertId },
        include: {
          participants: {
            select: {
              id: true,
              username: true,
              role: true
            }
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              sender: {
                select: {
                  username: true
                }
              }
            }
          }
        }
      });

      if (!channel) {
        return null;
      }

      return {
        id: channel.id,
        type: channel.type,
        emergencyAlertId: channel.emergencyAlertId,
        participants: channel.participants,
        lastMessage: channel.messages[0] ? {
          content: channel.messages[0].content,
          timestamp: channel.messages[0].createdAt,
          senderUsername: channel.messages[0].senderId === 'system' 
            ? 'Sistema' 
            : channel.messages[0].sender.username
        } : undefined,
        createdAt: channel.createdAt
      };
    } catch (error) {
      logger.error('Error getting emergency channel:', error);
      throw new Error('Failed to get emergency channel');
    }
  }

  /**
   * Share emergency context in chat
   */
  async shareEmergencyContext(
    channelId: string, 
    emergencyInfo: {
      userId: string;
      location?: any;
      userProfile?: any;
      emergencyAlert?: any;
    }
  ): Promise<void> {
    try {
      const contextMessage = this.formatEmergencyContext(emergencyInfo);
      
      await this.sendMessage({
        channelId,
        senderId: 'system',
        content: contextMessage,
        type: MessageType.SYSTEM
      });

      // Also share location if available
      if (emergencyInfo.location) {
        await this.sendMessage({
          channelId,
          senderId: 'system',
          content: `📍 **Ubicación compartida:** https://maps.google.com/?q=${emergencyInfo.location.latitude},${emergencyInfo.location.longitude}`,
          type: MessageType.SYSTEM
        });
      }

      logger.info(`Emergency context shared in channel ${channelId}`);
    } catch (error) {
      logger.error('Error sharing emergency context:', error);
      throw new Error('Failed to share emergency context');
    }
  }

  /**
   * Format emergency context for sharing
   */
  private formatEmergencyContext(emergencyInfo: any): string {
    let context = '🚨 **Información de Emergencia**\n\n';
    
    if (emergencyInfo.userProfile) {
      const profile = emergencyInfo.userProfile;
      if (profile.firstName) {
        context += `👤 **Usuario:** ${profile.firstName}\n`;
      }
      if (profile.mentalHealthConditions && profile.mentalHealthConditions.length > 0) {
        context += `🏥 **Condiciones:** ${profile.mentalHealthConditions.join(', ')}\n`;
      }
      if (profile.emergencyContacts && profile.emergencyContacts.length > 0) {
        context += `📞 **Contactos de emergencia registrados:** ${profile.emergencyContacts.length}\n`;
      }
    }
    
    if (emergencyInfo.emergencyAlert) {
      context += `⏰ **Hora de la alerta:** ${new Date(emergencyInfo.emergencyAlert.createdAt).toLocaleString('es-ES')}\n`;
    }
    
    context += '\n💙 **Un SERENO está aquí para ayudarte. No estás solo.**';
    context += '\n\n*Esta información es confidencial y solo visible para los SERENOS respondiendo a esta emergencia.*';
    
    return context;
  }

  /**
   * Create emergency chat channel with context sharing
   */
  async createEmergencyChannel(
    alertId: string,
    userId: string,
    serenoId: string,
    emergencyContext: any
  ): Promise<string> {
    try {
      // Create emergency chat channel
      const channelId = await this.createChannel({
        type: ChatType.EMERGENCY,
        participantIds: [userId, serenoId],
        emergencyAlertId: alertId
      });

      // Share emergency context
      await this.shareEmergencyContext(channelId, {
        userId,
        ...emergencyContext
      });

      // Send welcome message from SERENO perspective
      await this.sendMessage({
        channelId,
        senderId: 'system',
        content: '👋 **Hola, soy un SERENO y estoy aquí para ayudarte.**\n\nPuedes hablar conmigo sobre lo que está pasando. Todo lo que compartamos aquí es confidencial.\n\n¿Cómo te sientes ahora mismo?',
        type: MessageType.SYSTEM
      });

      logger.info(`Emergency chat channel ${channelId} created for alert ${alertId}`);
      return channelId;
    } catch (error) {
      logger.error('Error creating emergency chat channel:', error);
      throw new Error('Failed to create emergency chat channel');
    }
  }

  /**
   * Add multiple SERENOS to emergency channel (for group support)
   */
  async addSerenosToEmergencyChannel(
    channelId: string,
    serenoIds: string[],
    addedBy: string
  ): Promise<void> {
    try {
      for (const serenoId of serenoIds) {
        await this.addParticipant(channelId, serenoId, addedBy);
      }

      // Send system message about additional support
      await this.sendMessage({
        channelId,
        senderId: 'system',
        content: `🤝 **Apoyo adicional:** ${serenoIds.length} SERENO(s) más se han unido para brindarte mejor asistencia.`,
        type: MessageType.SYSTEM
      });

      logger.info(`Added ${serenoIds.length} SERENOS to emergency channel ${channelId}`);
    } catch (error) {
      logger.error('Error adding SERENOS to emergency channel:', error);
      throw new Error('Failed to add SERENOS to emergency channel');
    }
  }

  /**
   * Archive emergency chat when resolved
   */
  async archiveEmergencyChannel(channelId: string, resolvedBy: string): Promise<void> {
    try {
      // Send resolution message
      await this.sendMessage({
        channelId,
        senderId: 'system',
        content: '✅ **Emergencia resuelta.**\n\nEste chat ha sido archivado. Si necesitas ayuda nuevamente, no dudes en usar el botón de pánico.\n\n💙 Cuídate mucho.',
        type: MessageType.SYSTEM
      });

      // In a real implementation, you might want to:
      // 1. Move messages to an archive table
      // 2. Remove active participants but keep history
      // 3. Update channel status to 'archived'
      
      logger.info(`Emergency channel ${channelId} archived by ${resolvedBy}`);
    } catch (error) {
      logger.error('Error archiving emergency channel:', error);
      throw new Error('Failed to archive emergency channel');
    }
  }

  /**
   * Get chat history for emergency (with privacy controls)
   */
  async getEmergencyChatHistory(
    alertId: string,
    requesterId: string,
    requesterRole: string
  ): Promise<any[]> {
    try {
      // Only allow access to emergency participants or admins
      const channel = await prisma.chatChannel.findFirst({
        where: { 
          emergencyAlertId: alertId,
          OR: [
            { participants: { some: { id: requesterId } } },
            { emergencyAlert: { userId: requesterId } }
          ]
        },
        include: {
          messages: {
            include: {
              sender: {
                select: {
                  id: true,
                  username: true,
                  role: true
                }
              }
            },
            orderBy: { createdAt: 'asc' }
          }
        }
      });

      if (!channel) {
        throw new Error('Emergency chat not found or access denied');
      }

      return channel.messages.map(message => ({
        id: message.id,
        content: message.content,
        type: message.type,
        createdAt: message.createdAt,
        sender: message.senderId === 'system' 
          ? { id: 'system', username: 'Sistema', role: 'SYSTEM' }
          : message.sender
      }));
    } catch (error) {
      logger.error('Error getting emergency chat history:', error);
      throw new Error('Failed to get emergency chat history');
    }
  }

  /**
   * Enhanced message moderation for emergency chats
   */
  async moderateMessage(content: string, isEmergencyChannel: boolean = false): Promise<{ allowed: boolean; reason?: string }> {
    try {
      // Basic content moderation - in production, use more sophisticated tools
      const inappropriateWords = ['spam', 'scam', 'fake'];
      const lowerContent = content.toLowerCase();
      
      // More lenient moderation for emergency channels
      if (!isEmergencyChannel) {
        for (const word of inappropriateWords) {
          if (lowerContent.includes(word)) {
            return {
              allowed: false,
              reason: 'Contenido inapropiado detectado'
            };
          }
        }
      }
      
      // Check message length (more generous for emergency)
      const maxLength = isEmergencyChannel ? 5000 : 2000;
      if (content.length > maxLength) {
        return {
          allowed: false,
          reason: 'Mensaje demasiado largo'
        };
      }

      // Check for potential self-harm indicators in emergency chats
      if (isEmergencyChannel) {
        const concerningPhrases = ['quiero morir', 'no vale la pena', 'acabar con todo'];
        const hasConcerningContent = concerningPhrases.some(phrase => 
          lowerContent.includes(phrase)
        );
        
        if (hasConcerningContent) {
          // Don't block, but flag for immediate SERENO attention
          logger.warn(`Concerning content detected in emergency chat: ${content.substring(0, 100)}...`);
        }
      }
      
      return { allowed: true };
    } catch (error) {
      logger.error('Error moderating message:', error);
      return { allowed: true }; // Allow by default if moderation fails
    }
  }

  /**
   * Send emergency escalation message
   */
  async sendEmergencyEscalation(
    channelId: string,
    escalationType: 'medical' | 'police' | 'crisis_center'
  ): Promise<void> {
    try {
      let escalationMessage = '';
      
      switch (escalationType) {
        case 'medical':
          escalationMessage = '🚑 **Escalación médica activada.**\n\nSe ha contactado a servicios médicos de emergencia. Mantente en línea.';
          break;
        case 'police':
          escalationMessage = '🚔 **Escalación policial activada.**\n\nSe ha contactado a las autoridades locales para asistencia inmediata.';
          break;
        case 'crisis_center':
          escalationMessage = '🏥 **Centro de crisis contactado.**\n\nProfesionales especializados han sido notificados y se pondrán en contacto contigo.';
          break;
      }

      await this.sendMessage({
        channelId,
        senderId: 'system',
        content: escalationMessage,
        type: MessageType.SYSTEM
      });

      logger.info(`Emergency escalation (${escalationType}) sent to channel ${channelId}`);
    } catch (error) {
      logger.error('Error sending emergency escalation:', error);
      throw new Error('Failed to send emergency escalation');
    }
  }
}

export const chatService = new ChatService();