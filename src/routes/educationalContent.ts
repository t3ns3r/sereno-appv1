import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { educationalContentService } from '../services/educationalContentService';
import { validateRequest } from '../middleware/validation';
import { body, param, query } from 'express-validator';

const router = Router();

// Validation schemas
const createContentValidation = [
  body('title').isLength({ min: 1, max: 255 }).withMessage('Title is required and must be less than 255 characters'),
  body('description').isLength({ min: 1, max: 1000 }).withMessage('Description is required and must be less than 1000 characters'),
  body('content').isLength({ min: 1 }).withMessage('Content is required'),
  body('category').isIn(['ARTICLE', 'EXERCISE', 'VIDEO', 'AUDIO', 'INTERACTIVE', 'WORKSHEET']).withMessage('Invalid category'),
  body('mentalHealthConditions').isArray().withMessage('Mental health conditions must be an array'),
  body('difficulty').isIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).withMessage('Invalid difficulty level'),
  body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
  body('tags').isArray().withMessage('Tags must be an array')
];

const updateProgressValidation = [
  body('progress').isFloat({ min: 0, max: 1 }).withMessage('Progress must be between 0 and 1'),
  body('timeSpent').isInt({ min: 0 }).withMessage('Time spent must be a non-negative integer'),
  body('completed').optional().isBoolean().withMessage('Completed must be a boolean')
];

// Get all educational content
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { condition, category } = req.query;

    let content;
    if (condition) {
      content = await educationalContentService.getContentByCondition(condition as string, userId);
    } else if (category) {
      content = await educationalContentService.getContentByCategory(category as string, userId);
    } else {
      content = await educationalContentService.getAllContent(userId);
    }

    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'FETCH_CONTENT_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch educational content',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Get specific educational content by ID
router.get('/:id', 
  authenticateToken,
  param('id').isString().withMessage('Content ID is required'),
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const content = await educationalContentService.getContentById(id, userId);

      res.json({
        success: true,
        data: content
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message === 'Educational content not found' ? 404 : 500;
      res.status(statusCode).json({
        error: {
          code: statusCode === 404 ? 'CONTENT_NOT_FOUND' : 'FETCH_CONTENT_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch educational content',
          timestamp: new Date().toISOString()
        }
      });
    }
  }
);

// Create new educational content (admin/author only)
router.post('/',
  authenticateToken,
  createContentValidation,
  validateRequest,
  async (req, res) => {
    try {
      const authorId = req.user!.id;
      const contentData = {
        ...req.body,
        authorId
      };

      const content = await educationalContentService.createContent(contentData);

      res.status(201).json({
        success: true,
        data: content
      });
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'CREATE_CONTENT_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create educational content',
          timestamp: new Date().toISOString()
        }
      });
    }
  }
);

// Update content progress
router.post('/:id/progress',
  authenticateToken,
  param('id').isString().withMessage('Content ID is required'),
  updateProgressValidation,
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const { progress, timeSpent, completed } = req.body;

      const progressData = await educationalContentService.updateContentProgress({
        userId,
        contentId: id,
        progress,
        timeSpent,
        completed
      });

      res.json({
        success: true,
        data: progressData
      });
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'UPDATE_PROGRESS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update content progress',
          timestamp: new Date().toISOString()
        }
      });
    }
  }
);

// Get user's progress on all content
router.get('/progress/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const progress = await educationalContentService.getUserProgress(userId);

    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'FETCH_PROGRESS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch user progress',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Publish content (author only)
router.patch('/:id/publish',
  authenticateToken,
  param('id').isString().withMessage('Content ID is required'),
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const authorId = req.user!.id;

      const content = await educationalContentService.publishContent(id, authorId);

      res.json({
        success: true,
        data: content
      });
    } catch (error) {
      const statusCode = error instanceof Error && 
        (error.message === 'Content not found' || error.message === 'Unauthorized to publish this content') ? 404 : 500;
      
      res.status(statusCode).json({
        error: {
          code: statusCode === 404 ? 'CONTENT_NOT_FOUND' : 'PUBLISH_CONTENT_ERROR',
          message: error instanceof Error ? error.message : 'Failed to publish content',
          timestamp: new Date().toISOString()
        }
      });
    }
  }
);

// Get content statistics (author/admin only)
router.get('/:id/stats',
  authenticateToken,
  param('id').isString().withMessage('Content ID is required'),
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const stats = await educationalContentService.getContentStats(id);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'FETCH_STATS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch content statistics',
          timestamp: new Date().toISOString()
        }
      });
    }
  }
);

export default router;