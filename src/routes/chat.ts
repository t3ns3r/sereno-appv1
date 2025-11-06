import express from 'express';
import { PrismaClient } from '@prisma/client';
import { auth } from '../middleware/auth';
import { io } from '../server';

const router = express.Router();
const prisma = new PrismaClient();

// Get user's chat channels
router.get('/channels', auth, async (req, res) => {
  try {
    const userId = req.user!.id;

    const channels = await prisma.chatChannel.findMany({
      where: {
        participants: {
          some: {
            id: userId
          }
        }
      },
      include: {
        participants: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            sender: {
              select: {
                id: true,
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
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: channels
    });

  } catch (error) {
    console.error('Error getting chat channels:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat channels'
    });
  }
});

// Get messages for a specific channel
router.get('/channels/:channelId/messages', auth, async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.user!.id;
    const { page = 1, limit = 50 } = req.query;

    // Verify user is participant in the channel
    const channel = await prisma.chatChannel.findFirst({
      where: {
        id: channelId,
        participants: {
          some: {
            id: userId
          }
        }
      }
    });

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Chat channel not found or access denied'
      });
    }

    const messages = await prisma.chatMessage.findMany({
      where: {
        channelId
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: Number(limit),
      skip: (Number(page) - 1) * Number(limit)
    });

    res.json({
      success: true,
      data: messages.reverse() // Return in chronological order
    });

  } catch (error) {
    console.error('Error getting chat messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat messages'
    });
  }
});

// Send a message
router.post('/channels/:channelId/messages', auth, async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.user!.id;
    const { content, type = 'TEXT' } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    // Verify user is participant in the channel
    const channel = await prisma.chatChannel.findFirst({
      where: {
        id: channelId,
        participants: {
          some: {
            id: userId
          }
        }
      },
      include: {
        participants: {
          select: {
            id: true
          }
        }
      }
    });

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Chat channel not found or access denied'
      });
    }

    // Import chatService for moderation
    const { chatService } = await import('../services/chatService');
    
    // Moderate message content
    const isEmergencyChannel = channel.type === 'EMERGENCY';
    const moderationResult = await chatService.moderateMessage(content.trim(), isEmergencyChannel);
    
    if (!moderationResult.allowed) {
      return res.status(400).json({
        success: false,
        message: moderationResult.reason || 'Message content not allowed'
      });
    }

    // Create the message
    const message = await prisma.chatMessage.create({
      data: {
        channelId,
        senderId: userId,
        content: content.trim(),
        type
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            role: true,
            profile: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    // Broadcast message to all channel participants via Socket.IO
    const app = req.app;
    const io = app.get('io');
    
    if (io) {
      io.to(`channel-${channelId}`).emit('new-message', {
        message,
        channelId,
        isEmergency: isEmergencyChannel
      });

      // For emergency channels, also emit to emergency monitoring
      if (isEmergencyChannel) {
        io.to(`emergency-${channel.emergencyAlertId}`).emit('emergency-message', {
          message,
          channelId,
          alertId: channel.emergencyAlertId
        });
      }
    }

    res.status(201).json({
      success: true,
      data: message
    });

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
});

// Create a new chat channel (for group chats)
router.post('/channels', auth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { type = 'GROUP', participantIds = [] } = req.body;

    // Add the creator to participants
    const allParticipantIds = [userId, ...participantIds.filter((id: string) => id !== userId)];

    // Verify all participants exist
    const participants = await prisma.user.findMany({
      where: {
        id: {
          in: allParticipantIds
        }
      }
    });

    if (participants.length !== allParticipantIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more participants not found'
      });
    }

    // Create the channel
    const channel = await prisma.chatChannel.create({
      data: {
        type,
        participants: {
          connect: allParticipantIds.map(id => ({ id }))
        }
      },
      include: {
        participants: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: channel
    });

  } catch (error) {
    console.error('Error creating chat channel:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create chat channel'
    });
  }
});

// Leave a chat channel
router.delete('/channels/:channelId/leave', auth, async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.user!.id;

    // Find the channel
    const channel = await prisma.chatChannel.findUnique({
      where: { id: channelId },
      include: {
        participants: true,
        emergencyAlert: true
      }
    });

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Chat channel not found'
      });
    }

    // Don't allow leaving emergency channels while active
    if (channel.type === 'EMERGENCY' && channel.emergencyAlert?.status === 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'Cannot leave active emergency channel'
      });
    }

    // Remove user from channel
    await prisma.chatChannel.update({
      where: { id: channelId },
      data: {
        participants: {
          disconnect: { id: userId }
        }
      }
    });

    // If no participants left, delete the channel
    const updatedChannel = await prisma.chatChannel.findUnique({
      where: { id: channelId },
      include: { participants: true }
    });

    if (updatedChannel && updatedChannel.participants.length === 0) {
      await prisma.chatChannel.delete({
        where: { id: channelId }
      });
    }

    res.json({
      success: true,
      message: 'Left chat channel successfully'
    });

  } catch (error) {
    console.error('Error leaving chat channel:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave chat channel'
    });
  }
});

// Get emergency chat for specific alert
router.get('/emergency/:alertId', auth, async (req, res) => {
  try {
    const { alertId } = req.params;
    const userId = req.user!.id;

    const { chatService } = await import('../services/chatService');
    const channel = await chatService.getEmergencyChannel(alertId);

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Emergency chat not found'
      });
    }

    // Verify user has access (participant or emergency owner)
    const hasAccess = channel.participants.some(p => p.id === userId);
    if (!hasAccess) {
      // Check if user is the emergency owner
      const alert = await prisma.emergencyAlert.findUnique({
        where: { id: alertId }
      });
      
      if (!alert || alert.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to emergency chat'
        });
      }
    }

    res.json({
      success: true,
      data: channel
    });

  } catch (error) {
    console.error('Error getting emergency chat:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get emergency chat'
    });
  }
});

// Add SERENO to emergency chat
router.post('/emergency/:alertId/add-sereno', auth, async (req, res) => {
  try {
    const { alertId } = req.params;
    const { serenoId } = req.body;
    const userId = req.user!.id;

    // Verify requester is a SERENO or admin
    if (req.user!.role !== 'SERENO' && req.user!.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only SERENOS can add other SERENOS to emergency chats'
      });
    }

    // Verify the user being added is a SERENO
    const serenoUser = await prisma.user.findUnique({
      where: { id: serenoId }
    });

    if (!serenoUser || serenoUser.role !== 'SERENO') {
      return res.status(400).json({
        success: false,
        message: 'User is not a SERENO'
      });
    }

    // Find emergency channel
    const channel = await prisma.chatChannel.findFirst({
      where: { emergencyAlertId: alertId }
    });

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Emergency chat not found'
      });
    }

    const { chatService } = await import('../services/chatService');
    await chatService.addParticipant(channel.id, serenoId, userId);

    res.json({
      success: true,
      message: 'SERENO added to emergency chat successfully'
    });

  } catch (error) {
    console.error('Error adding SERENO to emergency chat:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add SERENO to emergency chat'
    });
  }
});

// Share emergency context
router.post('/emergency/:alertId/share-context', auth, async (req, res) => {
  try {
    const { alertId } = req.params;
    const userId = req.user!.id;

    // Verify user is a SERENO
    if (req.user!.role !== 'SERENO') {
      return res.status(403).json({
        success: false,
        message: 'Only SERENOS can share emergency context'
      });
    }

    // Get emergency alert and user info
    const alert = await prisma.emergencyAlert.findUnique({
      where: { id: alertId },
      include: {
        user: {
          include: {
            profile: true
          }
        }
      }
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Emergency alert not found'
      });
    }

    // Find emergency channel
    const channel = await prisma.chatChannel.findFirst({
      where: { emergencyAlertId: alertId }
    });

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Emergency chat not found'
      });
    }

    const { chatService } = await import('../services/chatService');
    await chatService.shareEmergencyContext(channel.id, {
      userId: alert.userId,
      location: alert.location ? JSON.parse(alert.location) : undefined,
      userProfile: alert.user.profile,
      emergencyAlert: alert
    });

    res.json({
      success: true,
      message: 'Emergency context shared successfully'
    });

  } catch (error) {
    console.error('Error sharing emergency context:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to share emergency context'
    });
  }
});

// Send emergency escalation
router.post('/emergency/:alertId/escalate', auth, async (req, res) => {
  try {
    const { alertId } = req.params;
    const { escalationType } = req.body;
    const userId = req.user!.id;

    // Verify user is a SERENO
    if (req.user!.role !== 'SERENO') {
      return res.status(403).json({
        success: false,
        message: 'Only SERENOS can escalate emergencies'
      });
    }

    if (!['medical', 'police', 'crisis_center'].includes(escalationType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid escalation type'
      });
    }

    // Find emergency channel
    const channel = await prisma.chatChannel.findFirst({
      where: { emergencyAlertId: alertId }
    });

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Emergency chat not found'
      });
    }

    const { chatService } = await import('../services/chatService');
    await chatService.sendEmergencyEscalation(channel.id, escalationType);

    res.json({
      success: true,
      message: 'Emergency escalation sent successfully'
    });

  } catch (error) {
    console.error('Error sending emergency escalation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send emergency escalation'
    });
  }
});

// Get emergency chat history
router.get('/emergency/:alertId/history', auth, async (req, res) => {
  try {
    const { alertId } = req.params;
    const userId = req.user!.id;

    const { chatService } = await import('../services/chatService');
    const history = await chatService.getEmergencyChatHistory(
      alertId,
      userId,
      req.user!.role
    );

    res.json({
      success: true,
      data: history
    });

  } catch (error) {
    console.error('Error getting emergency chat history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get emergency chat history'
    });
  }
});

export default router;