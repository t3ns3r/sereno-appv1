import { Router, Response } from 'express';
import { FakeCallService } from '../services/fakeCallService';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth';
import { body, validationResult } from 'express-validator';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);
const fakeCallService = new FakeCallService();

// Helper function to handle async routes
const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Get user's fake call settings
router.get('/settings', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const settings = await fakeCallService.getUserSettings(req.user!.id);
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error: any) {
    res.status(500).json({
      error: {
        code: 'SETTINGS_FETCH_ERROR',
        message: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
}));

// Update user's fake call settings
router.put('/settings', [
  body('enabled').isBoolean().withMessage('Enabled must be a boolean'),
  body('frequency').isIn(['DAILY', 'WEEKLY', 'RANDOM']).withMessage('Invalid frequency'),
  body('timeRange.start').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid start time format'),
  body('timeRange.end').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid end time format')
], asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: errors.array(),
        timestamp: new Date().toISOString()
      }
    });
  }

  try {
    const { enabled, frequency, timeRange } = req.body;
    
    const updatedSettings = await fakeCallService.updateUserSettings(req.user!.id, {
      enabled,
      frequency,
      timeRange
    });
    
    res.json({
      success: true,
      data: updatedSettings
    });
  } catch (error: any) {
    if (error.message.includes('Invalid') || error.message.includes('must be')) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    res.status(500).json({
      error: {
        code: 'SETTINGS_UPDATE_ERROR',
        message: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
}));

// Trigger a fake call
router.post('/trigger', [
  body('redirectAction').isIn(['mood_check', 'breathing_exercise', 'daily_tracking']).withMessage('Invalid redirect action')
], asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid redirect action',
        details: errors.array(),
        timestamp: new Date().toISOString()
      }
    });
  }

  try {
    const { redirectAction } = req.body;
    
    const fakeCall = await fakeCallService.scheduleFakeCall(req.user!.id, redirectAction);
    
    res.status(201).json({
      success: true,
      data: fakeCall
    });
  } catch (error: any) {
    if (error.message === 'Fake calls are disabled for this user') {
      return res.status(403).json({
        error: {
          code: 'FAKE_CALLS_DISABLED',
          message: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    res.status(500).json({
      error: {
        code: 'FAKE_CALL_TRIGGER_ERROR',
        message: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
}));

// Get fake call history
router.get('/history', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const history = await fakeCallService.getFakeCallHistory(req.user!.id);
    
    res.json({
      success: true,
      data: history
    });
  } catch (error: any) {
    res.status(500).json({
      error: {
        code: 'HISTORY_FETCH_ERROR',
        message: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
}));

// Answer a fake call
router.put('/:id/answer', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await fakeCallService.answerFakeCall(id, req.user!.id);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    if (error.message === 'Fake call not found') {
      return res.status(404).json({
        error: {
          code: 'FAKE_CALL_NOT_FOUND',
          message: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    if (error.message === 'Unauthorized access to fake call') {
      return res.status(403).json({
        error: {
          code: 'UNAUTHORIZED_ACCESS',
          message: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    res.status(500).json({
      error: {
        code: 'FAKE_CALL_ANSWER_ERROR',
        message: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
}));

export default router;