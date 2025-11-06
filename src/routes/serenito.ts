import express from 'express';
import { PrismaClient } from '@prisma/client';
import { auth } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get user's SERENITO interactions
router.get('/interactions', auth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { limit = 20, context } = req.query;

    const whereClause: any = { userId };
    if (context) {
      whereClause.context = context;
    }

    const interactions = await prisma.serenitoInteraction.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      take: Number(limit)
    });

    res.json({
      success: true,
      data: interactions
    });

  } catch (error) {
    console.error('Error getting SERENITO interactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get SERENITO interactions'
    });
  }
});

// Create a new SERENITO interaction
router.post('/interact', auth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { context, expression, message, animation } = req.body;

    if (!context || !expression || !message) {
      return res.status(400).json({
        success: false,
        message: 'Context, expression, and message are required'
      });
    }

    const interaction = await prisma.serenitoInteraction.create({
      data: {
        userId,
        context,
        expression,
        message,
        animation: animation || 'gentle-nod'
      }
    });

    res.status(201).json({
      success: true,
      data: interaction
    });

  } catch (error) {
    console.error('Error creating SERENITO interaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create SERENITO interaction'
    });
  }
});

// Get SERENITO settings for user
router.get('/settings', auth, async (req, res) => {
  try {
    const userId = req.user!.id;

    // Get user preferences related to SERENITO
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { preferences: true }
    });

    const serenitoSettings = userProfile?.preferences?.serenito || {
      enabled: true,
      interactionFrequency: 'medium',
      preferredExpressions: ['happy', 'encouraging', 'concerned'],
      voiceEnabled: false
    };

    res.json({
      success: true,
      data: serenitoSettings
    });

  } catch (error) {
    console.error('Error getting SERENITO settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get SERENITO settings'
    });
  }
});

// Update SERENITO settings
router.put('/settings', auth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { enabled, interactionFrequency, preferredExpressions, voiceEnabled } = req.body;

    // Get current preferences
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { preferences: true }
    });

    const currentPreferences = userProfile?.preferences || {};
    const updatedPreferences = {
      ...currentPreferences,
      serenito: {
        enabled: enabled !== undefined ? enabled : currentPreferences.serenito?.enabled ?? true,
        interactionFrequency: interactionFrequency || currentPreferences.serenito?.interactionFrequency || 'medium',
        preferredExpressions: preferredExpressions || currentPreferences.serenito?.preferredExpressions || ['happy', 'encouraging'],
        voiceEnabled: voiceEnabled !== undefined ? voiceEnabled : currentPreferences.serenito?.voiceEnabled ?? false
      }
    };

    // Update user preferences
    await prisma.userProfile.upsert({
      where: { userId },
      update: {
        preferences: updatedPreferences
      },
      create: {
        userId,
        preferences: updatedPreferences
      }
    });

    res.json({
      success: true,
      data: updatedPreferences.serenito,
      message: 'SERENITO settings updated successfully'
    });

  } catch (error) {
    console.error('Error updating SERENITO settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update SERENITO settings'
    });
  }
});

// Get contextual SERENITO message
router.post('/message', auth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { context, userState } = req.body;

    if (!context) {
      return res.status(400).json({
        success: false,
        message: 'Context is required'
      });
    }

    // Get user's SERENITO settings
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { preferences: true }
    });

    const serenitoSettings = userProfile?.preferences?.serenito || {
      enabled: true,
      interactionFrequency: 'medium',
      preferredExpressions: ['happy', 'encouraging'],
      voiceEnabled: false
    };

    if (!serenitoSettings.enabled) {
      return res.json({
        success: true,
        data: null,
        message: 'SERENITO interactions are disabled'
      });
    }

    // Generate contextual message based on context and user state
    const message = generateSerenitoMessage(context, userState, serenitoSettings);

    // Log the interaction
    await prisma.serenitoInteraction.create({
      data: {
        userId,
        context,
        expression: message.expression,
        message: message.text,
        animation: message.animation
      }
    });

    res.json({
      success: true,
      data: message
    });

  } catch (error) {
    console.error('Error getting SERENITO message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get SERENITO message'
    });
  }
});

// Helper function to generate contextual SERENITO messages
function generateSerenitoMessage(context: string, userState: any, settings: any) {
  const messages = {
    onboarding: [
      {
        text: "¡Hola! Soy SERENITO, tu compañero en este viaje hacia el bienestar. Estoy aquí para apoyarte.",
        expression: "happy",
        animation: "wave"
      },
      {
        text: "Bienvenido a SERENO. Juntos vamos a cuidar tu salud mental paso a paso.",
        expression: "encouraging",
        animation: "gentle-nod"
      }
    ],
    daily_checkin: [
      {
        text: "¿Cómo te sientes hoy? Recuerda que cada día es una nueva oportunidad.",
        expression: "encouraging",
        animation: "gentle-nod"
      },
      {
        text: "Es momento de registrar tu estado de ánimo. Yo te acompaño en este proceso.",
        expression: "happy",
        animation: "thumbs_up"
      }
    ],
    breathing: [
      {
        text: "Respira conmigo. Inhala tranquilidad, exhala tensión.",
        expression: "calm",
        animation: "breathing_guide"
      },
      {
        text: "Vamos a hacer unos ejercicios de respiración juntos. Sígueme.",
        expression: "encouraging",
        animation: "breathing_guide"
      }
    ],
    mood_assessment: [
      {
        text: "Cuéntame cómo te sientes. No hay respuestas correctas o incorrectas.",
        expression: "concerned",
        animation: "gentle-nod"
      },
      {
        text: "Tu estado emocional es importante. Vamos a explorarlo juntos.",
        expression: "encouraging",
        animation: "gentle-nod"
      }
    ],
    emergency: [
      {
        text: "Entiendo que necesitas ayuda. No estás solo, estoy aquí contigo.",
        expression: "concerned",
        animation: "gentle-nod"
      },
      {
        text: "Vamos a buscar la ayuda que necesitas. Todo va a estar bien.",
        expression: "encouraging",
        animation: "gentle-nod"
      }
    ],
    achievement: [
      {
        text: "¡Excelente trabajo! Cada pequeño paso cuenta en tu camino al bienestar.",
        expression: "celebrating",
        animation: "celebration"
      },
      {
        text: "¡Estoy muy orgulloso de ti! Sigues avanzando hacia tus metas.",
        expression: "happy",
        animation: "thumbs_up"
      }
    ]
  };

  const contextMessages = messages[context as keyof typeof messages] || messages.daily_checkin;
  const randomMessage = contextMessages[Math.floor(Math.random() * contextMessages.length)];

  // Filter by preferred expressions if set
  if (settings.preferredExpressions && settings.preferredExpressions.length > 0) {
    const preferredMessages = contextMessages.filter(msg => 
      settings.preferredExpressions.includes(msg.expression)
    );
    
    if (preferredMessages.length > 0) {
      return preferredMessages[Math.floor(Math.random() * preferredMessages.length)];
    }
  }

  return randomMessage;
}

export default router;