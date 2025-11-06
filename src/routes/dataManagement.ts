import { Router, Request, Response } from 'express';
import { DataManagementService } from '../services/dataManagementService';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { body, validationResult } from 'express-validator';

const router = Router();
const dataManagementService = new DataManagementService();

// Validation middleware
const privacySettingsValidation = [
  body('dataProcessingConsent').optional().isBoolean(),
  body('analyticsConsent').optional().isBoolean(),
  body('marketingConsent').optional().isBoolean(),
  body('locationSharingConsent').optional().isBoolean(),
  body('emergencyLocationConsent').optional().isBoolean(),
  body('dataRetentionPeriod').optional().isInt({ min: 30, max: 3650 }),
  body('allowDataExport').optional().isBoolean(),
  body('allowAccountDeletion').optional().isBoolean()
];

const consentValidation = [
  body('consentType').isString().notEmpty(),
  body('granted').isBoolean()
];

const accountDeletionValidation = [
  body('reason').optional().isString().isLength({ max: 500 }),
  body('confirmPassword').isString().notEmpty()
];

// Export user data (GDPR Article 20 - Right to data portability)
router.get('/export', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  
  const userData = await dataManagementService.exportUserData(userId);
  
  // Set headers for file download
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="sereno-data-export-${userId}-${Date.now()}.json"`);
  
  return res.status(200).json({
    success: true,
    message: 'User data exported successfully',
    exportDate: new Date().toISOString(),
    data: userData
  });
}));

// Get privacy settings
router.get('/privacy-settings', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  
  const privacySettings = await dataManagementService.getPrivacySettings(userId);
  
  return res.status(200).json({
    success: true,
    data: privacySettings
  });
}));

// Update privacy settings
router.put('/privacy-settings', 
  authenticateToken, 
  privacySettingsValidation, 
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user!.id;
    const clientIp = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    const updatedSettings = await dataManagementService.updatePrivacySettings(userId, req.body);
    
    // Log significant consent changes
    const significantChanges = ['dataProcessingConsent', 'analyticsConsent', 'marketingConsent', 'locationSharingConsent'];
    for (const change of significantChanges) {
      if (req.body[change] !== undefined) {
        await dataManagementService.recordConsent(
          userId,
          change,
          req.body[change],
          clientIp,
          userAgent
        );
      }
    }
    
    return res.status(200).json({
      success: true,
      message: 'Privacy settings updated successfully',
      data: updatedSettings
    });
  })
);

// Record consent
router.post('/consent', 
  authenticateToken, 
  consentValidation, 
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user!.id;
    const { consentType, granted } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    const consentRecord = await dataManagementService.recordConsent(
      userId,
      consentType,
      granted,
      clientIp,
      userAgent
    );
    
    return res.status(201).json({
      success: true,
      message: 'Consent recorded successfully',
      data: consentRecord
    });
  })
);

// Get consent history
router.get('/consent-history', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  
  const consentHistory = await dataManagementService.getConsentHistory(userId);
  
  return res.status(200).json({
    success: true,
    data: consentHistory
  });
}));

// Check specific consent
router.get('/consent/:consentType', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { consentType } = req.params;
  
  const hasConsent = await dataManagementService.hasConsent(userId, consentType);
  
  return res.status(200).json({
    success: true,
    data: {
      consentType,
      granted: hasConsent
    }
  });
}));

// Delete user account (GDPR Article 17 - Right to be forgotten)
router.delete('/account', 
  authenticateToken, 
  accountDeletionValidation, 
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user!.id;
    const { reason, confirmPassword } = req.body;
    
    // Verify password before deletion (additional security)
    const bcrypt = require('bcryptjs');
    const { prisma } = require('../config/database');
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const isPasswordValid = await bcrypt.compare(confirmPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password confirmation'
      });
    }
    
    await dataManagementService.deleteUserAccount(userId, reason);
    
    return res.status(200).json({
      success: true,
      message: 'Account deleted successfully. We\'re sorry to see you go.'
    });
  })
);

export default router;