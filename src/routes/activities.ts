import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { activityService } from '../services/activityService';
import { validateRequest } from '../middleware/validation';
import { body, param, query } from 'express-validator';

const router = Router();

// Validation schemas
const createActivityValidation = [
  body('title').isLength({ min: 1, max: 255 }).withMessage('Title is required and must be less than 255 characters'),
  body('description').isLength({ min: 1, max: 1000 }).withMessage('Description is required and must be less than 1000 characters'),
  body('country').isLength({ min: 2, max: 2 }).withMessage('Country code must be 2 characters'),
  body('category').isIn(['GROUP_THERAPY', 'MINDFULNESS', 'SUPPORT_GROUP', 'WELLNESS_WORKSHOP']).withMessage('Invalid category'),
  body('eventDate').isISO8601().withMessage('Event date must be a valid ISO 8601 date'),
  body('location').isLength({ min: 1, max: 255 }).withMessage('Location is required and must be less than 255 characters'),
  body('maxParticipants').optional().isInt({ min: 1 }).withMessage('Max participants must be a positive integer')
];

// Get activities by country (activity board)
router.get('/board/:country',
  authenticateToken,
  param('country').isLength({ min: 2, max: 2 }).withMessage('Country code must be 2 characters'),
  query('category').optional().isIn(['GROUP_THERAPY', 'MINDFULNESS', 'SUPPORT_GROUP', 'WELLNESS_WORKSHOP']).withMessage('Invalid category'),
  query('hasAvailableSpots').optional().isBoolean().withMessage('hasAvailableSpots must be a boolean'),
  validateRequest,
  async (req, res) => {
    try {
      const { country } = req.params;
      const { category, hasAvailableSpots, startDate, endDate } = req.query;

      const filters: any = {};
      if (category) filters.category = category;
      if (hasAvailableSpots === 'true') filters.hasAvailableSpots = true;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const activities = await activityService.getActivitiesByCountry(country, filters);

      res.json({
        success: true,
        data: activities
      });
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'FETCH_ACTIVITIES_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch activities',
          timestamp: new Date().toISOString()
        }
      });
    }
  }
);

// Create new activity
router.post('/create',
  authenticateToken,
  createActivityValidation,
  validateRequest,
  async (req, res) => {
    try {
      const organizerId = req.user!.id;
      const activityData = {
        ...req.body,
        organizerId,
        eventDate: new Date(req.body.eventDate)
      };

      const activity = await activityService.createActivity(activityData);

      res.status(201).json({
        success: true,
        data: activity
      });
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'CREATE_ACTIVITY_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create activity',
          timestamp: new Date().toISOString()
        }
      });
    }
  }
);

// Register for activity
router.post('/:id/register',
  authenticateToken,
  param('id').isString().withMessage('Activity ID is required'),
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const activity = await activityService.registerUserForActivity(id, userId);

      res.json({
        success: true,
        data: activity,
        message: 'Successfully registered for activity'
      });
    } catch (error) {
      const statusCode = error instanceof Error && 
        ['Activity not found', 'Activity is full', 'User is already registered for this activity', 'Cannot register for past activities'].includes(error.message) 
        ? 400 : 500;

      res.status(statusCode).json({
        error: {
          code: statusCode === 400 ? 'REGISTRATION_ERROR' : 'SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to register for activity',
          timestamp: new Date().toISOString()
        }
      });
    }
  }
);

// Unregister from activity
router.delete('/:id/register',
  authenticateToken,
  param('id').isString().withMessage('Activity ID is required'),
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const activity = await activityService.unregisterUserFromActivity(id, userId);

      res.json({
        success: true,
        data: activity,
        message: 'Successfully unregistered from activity'
      });
    } catch (error) {
      const statusCode = error instanceof Error && 
        ['Activity not found', 'User is not registered for this activity'].includes(error.message) 
        ? 400 : 500;

      res.status(statusCode).json({
        error: {
          code: statusCode === 400 ? 'UNREGISTRATION_ERROR' : 'SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to unregister from activity',
          timestamp: new Date().toISOString()
        }
      });
    }
  }
);

// Get specific activity by ID
router.get('/:id',
  authenticateToken,
  param('id').isString().withMessage('Activity ID is required'),
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const activity = await activityService.getActivityById(id);

      res.json({
        success: true,
        data: activity
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message === 'Activity not found' ? 404 : 500;
      res.status(statusCode).json({
        error: {
          code: statusCode === 404 ? 'ACTIVITY_NOT_FOUND' : 'FETCH_ACTIVITY_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch activity',
          timestamp: new Date().toISOString()
        }
      });
    }
  }
);

// Get user's registered activities
router.get('/user/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const activities = await activityService.getUserActivities(userId);

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'FETCH_USER_ACTIVITIES_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch user activities',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Get organizer's activities
router.get('/organizer/me', authenticateToken, async (req, res) => {
  try {
    const organizerId = req.user!.id;
    const activities = await activityService.getOrganizerActivities(organizerId);

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'FETCH_ORGANIZER_ACTIVITIES_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch organizer activities',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Update activity (organizer only)
router.put('/:id',
  authenticateToken,
  param('id').isString().withMessage('Activity ID is required'),
  createActivityValidation,
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const organizerId = req.user!.id;
      const updateData = {
        ...req.body,
        eventDate: req.body.eventDate ? new Date(req.body.eventDate) : undefined
      };

      const activity = await activityService.updateActivity(id, organizerId, updateData);

      res.json({
        success: true,
        data: activity,
        message: 'Activity updated successfully'
      });
    } catch (error) {
      const statusCode = error instanceof Error && 
        ['Activity not found', 'Unauthorized to update this activity'].includes(error.message) 
        ? 404 : 500;

      res.status(statusCode).json({
        error: {
          code: statusCode === 404 ? 'ACTIVITY_NOT_FOUND' : 'UPDATE_ACTIVITY_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update activity',
          timestamp: new Date().toISOString()
        }
      });
    }
  }
);

// Delete activity (organizer only)
router.delete('/:id',
  authenticateToken,
  param('id').isString().withMessage('Activity ID is required'),
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const organizerId = req.user!.id;

      await activityService.deleteActivity(id, organizerId);

      res.json({
        success: true,
        message: 'Activity deleted successfully'
      });
    } catch (error) {
      const statusCode = error instanceof Error && 
        ['Activity not found', 'Unauthorized to delete this activity'].includes(error.message) 
        ? 404 : 500;

      res.status(statusCode).json({
        error: {
          code: statusCode === 404 ? 'ACTIVITY_NOT_FOUND' : 'DELETE_ACTIVITY_ERROR',
          message: error instanceof Error ? error.message : 'Failed to delete activity',
          timestamp: new Date().toISOString()
        }
      });
    }
  }
);

// Get activity statistics
router.get('/:id/stats',
  authenticateToken,
  param('id').isString().withMessage('Activity ID is required'),
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const stats = await activityService.getActivityStats(id);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'FETCH_ACTIVITY_STATS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch activity statistics',
          timestamp: new Date().toISOString()
        }
      });
    }
  }
);

// Trigger activity reminders (for testing/admin)
router.post('/trigger-reminders',
  authenticateToken,
  async (req, res) => {
    try {
      // Only allow admins or for testing
      if (req.user!.role !== 'ADMIN' && process.env.NODE_ENV === 'production') {
        return res.status(403).json({
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Only administrators can trigger reminders',
            timestamp: new Date().toISOString()
          }
        });
      }

      const { activitySchedulerService } = await import('../services/activitySchedulerService');
      const result = await activitySchedulerService.triggerReminderCheck();

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'TRIGGER_REMINDERS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to trigger reminders',
          timestamp: new Date().toISOString()
        }
      });
    }
  }
);

export default router;