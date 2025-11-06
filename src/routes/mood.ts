import { Router, Request, Response } from 'express';
import { MoodAnalysisService } from '../services/moodAnalysisService';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { body, validationResult } from 'express-validator';

const router = Router();
const moodAnalysisService = new MoodAnalysisService();

// Validation middleware for mood assessment
const moodAssessmentValidation = [
  body('selectedEmotion').isObject().withMessage('Selected emotion is required'),
  body('selectedEmotion.id').isString().withMessage('Emotion ID is required'),
  body('selectedEmotion.intensity').isInt({ min: 1, max: 5 }).withMessage('Emotion intensity must be between 1 and 5'),
  body('textDescription').optional().isString().isLength({ max: 1000 }).withMessage('Text description must be less than 1000 characters'),
  body('voiceRecordingUrl').optional().isString().withMessage('Voice recording URL must be a string'),
];

// Submit mood assessment
router.post('/assessment', 
  authenticateToken, 
  moodAssessmentValidation,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid mood assessment data',
          details: errors.array()
        }
      });
    }

    const userId = req.user!.id;
    const { selectedEmotion, textDescription, voiceRecordingUrl } = req.body;

    const result = await moodAnalysisService.analyzeMoodEntry({
      userId,
      selectedEmotion,
      textDescription,
      voiceRecordingUrl
    });

    return res.status(201).json({
      success: true,
      message: 'Mood assessment completed successfully',
      data: result
    });
  })
);

// Get mood history
router.get('/history', 
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 10;

    const history = await moodAnalysisService.getUserMoodHistory(userId, limit);

    res.status(200).json({
      success: true,
      data: {
        entries: history,
        total: history.length
      }
    });
  })
);

// Get mood trends
router.get('/trends', 
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const days = parseInt(req.query.days as string) || 30;

    const trends = await moodAnalysisService.getMoodTrends(userId, days);

    res.status(200).json({
      success: true,
      data: trends
    });
  })
);

// Analyze mood (for testing purposes)
router.post('/analyze', 
  authenticateToken,
  moodAssessmentValidation,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid mood data for analysis',
          details: errors.array()
        }
      });
    }

    const userId = req.user!.id;
    const { selectedEmotion, textDescription, voiceRecordingUrl } = req.body;

    // This endpoint only performs analysis without saving
    const analysis = await moodAnalysisService.analyzeMoodEntry({
      userId,
      selectedEmotion,
      textDescription,
      voiceRecordingUrl
    });

    return res.status(200).json({
      success: true,
      message: 'Mood analysis completed',
      data: analysis
    });
  })
);

export default router;