import express from 'express';
import { auth } from '../middleware/auth';
import { emergencyService } from '../services/emergencyService';
import { emergencyContactsService } from '../services/emergencyContactsService';
import { notificationService } from '../services/notificationService';

const router = express.Router();

// Activate panic button
router.post('/panic', auth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { location } = req.body;

    // Validate location if provided
    if (location) {
      const { latitude, longitude, accuracy } = location;
      
      if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid latitude' }
        });
      }
      
      if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid longitude' }
        });
      }
      
      if (accuracy && (typeof accuracy !== 'number' || accuracy < 0)) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid accuracy' }
        });
      }
    }

    // Check for existing active alert
    const existingAlert = await emergencyService.getActiveAlertForUser(userId);
    if (existingAlert) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active emergency alert'
      });
    }

    const alert = await emergencyService.activatePanicButton(userId, location);

    res.status(201).json({
      success: true,
      data: {
        id: alert.id,
        userId: alert.userId,
        location: alert.location,
        status: alert.status,
        createdAt: alert.createdAt,
        respondingSerenos: alert.respondingSerenos,
        officialContactsNotified: alert.officialContactsNotified,
        alertId: alert.id
      },
      message: 'Emergency alert activated successfully'
    });

  } catch (error) {
    console.error('Error activating panic button:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to activate emergency system'
    });
  }
});

// Respond to emergency (for SERENOS)
router.put('/alert/:alertId/respond', auth, async (req, res) => {
  try {
    const { alertId } = req.params;
    const serenoId = req.user!.id;

    // Validate alert ID format
    if (!alertId || alertId.length < 10) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid alert ID' }
      });
    }

    // Verify user is a SERENO
    if (req.user!.role !== 'SERENO') {
      return res.status(403).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Only SERENOS can respond to emergencies' }
      });
    }

    await emergencyService.respondToEmergency(alertId, serenoId);

    res.json({
      success: true,
      data: { alertId },
      message: 'Emergency response registered successfully'
    });

  } catch (error) {
    console.error('Error responding to emergency:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to respond to emergency'
    });
  }
});

// Resolve emergency
router.put('/alert/:alertId/resolve', auth, async (req, res) => {
  try {
    const { alertId } = req.params;
    const userId = req.user!.id;

    await emergencyService.resolveEmergency(alertId, userId);

    res.json({
      success: true,
      message: 'Emergency resolved successfully'
    });

  } catch (error) {
    console.error('Error resolving emergency:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to resolve emergency'
    });
  }
});

// Get emergency contacts by country
router.get('/contacts/:country', auth, async (req, res) => {
  try {
    const { country } = req.params;
    
    // Validate country code format
    if (!country || country.length !== 2) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid country code' }
      });
    }
    
    const contacts = await emergencyContactsService.getEmergencyContactsByCountry(country);

    res.json({
      success: true,
      data: {
        contacts,
        country
      }
    });

  } catch (error) {
    console.error('Error getting emergency contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get emergency contacts'
    });
  }
});

// Get emergency history for user
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user!.id;
    
    const history = await emergencyService.getEmergencyHistory(userId);

    res.json({
      success: true,
      data: history
    });

  } catch (error) {
    console.error('Error getting emergency history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get emergency history'
    });
  }
});

// Get active emergencies (for SERENOS)
router.get('/active', auth, async (req, res) => {
  try {
    const serenoId = req.user!.id;

    // Verify user is a SERENO
    if (req.user!.role !== 'sereno') {
      return res.status(403).json({
        success: false,
        message: 'Only SERENOS can view active emergencies'
      });
    }

    const activeEmergencies = await emergencyService.getActiveEmergencies(serenoId);

    res.json({
      success: true,
      data: activeEmergencies
    });

  } catch (error) {
    console.error('Error getting active emergencies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active emergencies'
    });
  }
});

// Subscribe to push notifications
router.post('/notifications/subscribe', auth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { subscription, deviceInfo } = req.body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription data'
      });
    }

    await notificationService.subscribeToPushNotifications(userId, subscription, deviceInfo);

    res.json({
      success: true,
      message: 'Push notification subscription registered successfully'
    });

  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register push notification subscription'
    });
  }
});

// Unsubscribe from push notifications
router.post('/notifications/unsubscribe', auth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({
        success: false,
        message: 'Endpoint is required'
      });
    }

    await notificationService.unsubscribeFromPushNotifications(userId, endpoint);

    res.json({
      success: true,
      message: 'Push notification subscription removed successfully'
    });

  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove push notification subscription'
    });
  }
});

// Update notification preferences
router.put('/notifications/preferences', auth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const preferences = req.body;

    const updated = await notificationService.updateNotificationPreferences(userId, preferences);

    res.json({
      success: true,
      data: updated,
      message: 'Notification preferences updated successfully'
    });

  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification preferences'
    });
  }
});

// Get notification preferences
router.get('/notifications/preferences', auth, async (req, res) => {
  try {
    const userId = req.user!.id;
    
    const preferences = await notificationService.getNotificationPreferences(userId);

    res.json({
      success: true,
      data: preferences
    });

  } catch (error) {
    console.error('Error getting notification preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification preferences'
    });
  }
});

// Get specific emergency alert
router.get('/alert/:alertId', auth, async (req, res) => {
  try {
    const { alertId } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Validate alert ID format
    if (!alertId || alertId.length < 10) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid alert ID' }
      });
    }

    const alert = await emergencyService.getEmergencyAlert(alertId, userId, userRole);

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: { code: 'ALERT_NOT_FOUND', message: 'Emergency alert not found' }
      });
    }

    res.json({
      success: true,
      data: { alert }
    });

  } catch (error) {
    console.error('Error getting emergency alert:', error);
    
    if (error.message === 'Access denied') {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Access denied to this emergency alert' }
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to get emergency alert'
    });
  }
});

// Register as SERENO
router.post('/sereno/register', auth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { specializations, availabilityHours, maxResponseDistance } = req.body;

    // Validate input
    if (!specializations || !Array.isArray(specializations) || specializations.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Specializations are required' }
      });
    }

    if (!availabilityHours || !availabilityHours.start || !availabilityHours.end) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Availability hours are required' }
      });
    }

    // Validate time format (HH:mm)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(availabilityHours.start) || !timeRegex.test(availabilityHours.end)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid time format' }
      });
    }

    await emergencyService.registerSereno(userId, {
      specializations,
      availabilityHours,
      maxResponseDistance: maxResponseDistance || 50
    });

    res.status(201).json({
      success: true,
      message: 'SERENO registration successful'
    });

  } catch (error) {
    console.error('Error registering SERENO:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register as SERENO'
    });
  }
});

// Update SERENO availability
router.put('/sereno/availability', auth, async (req, res) => {
  try {
    const serenoId = req.user!.id;
    const { isAvailable, location } = req.body;

    // Validate input
    if (typeof isAvailable !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'isAvailable must be a boolean' }
      });
    }

    // Validate location if provided
    if (location) {
      const { latitude, longitude } = location;
      if (typeof latitude !== 'number' || latitude < -90 || latitude > 90 ||
          typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid location coordinates' }
        });
      }
    }

    await emergencyService.updateSerenoAvailability(serenoId, isAvailable, location);

    res.json({
      success: true,
      message: 'Availability updated successfully'
    });

  } catch (error) {
    console.error('Error updating SERENO availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update availability'
    });
  }
});

// Get SERENO statistics
router.get('/sereno/stats', auth, async (req, res) => {
  try {
    const serenoId = req.user!.id;

    const stats = await emergencyService.getSerenoStats(serenoId);

    res.json({
      success: true,
      data: { stats }
    });

  } catch (error) {
    console.error('Error getting SERENO stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get SERENO statistics'
    });
  }
});

export default router;