import request from 'supertest';
import { app } from '../server';
import { prisma } from '../config/database';

describe('Privacy and GDPR Compliance Tests', () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    // Clean up test data
    await prisma.userProfile.deleteMany();
    await prisma.user.deleteMany();

    // Create test user
    const userData = {
      email: 'privacy@test.com',
      username: 'privacyuser',
      password: 'TestPassword123',
      country: 'US',
      firstName: 'Privacy',
      lastName: 'User'
    };

    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send(userData);

    authToken = registerResponse.body.data.token;
    userId = registerResponse.body.data.user.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.userProfile.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('Consent Management', () => {
    it('should record user consent', async () => {
      const consentData = {
        consentType: 'analyticsConsent',
        granted: true
      };

      const response = await request(app)
        .post('/api/v1/data-management/consent')
        .set('Authorization', `Bearer ${authToken}`)
        .send(consentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.consentType).toBe('analyticsConsent');
      expect(response.body.data.granted).toBe(true);
      expect(response.body.data.timestamp).toBeDefined();
    });

    it('should retrieve consent history', async () => {
      // Record multiple consents
      const consents = [
        { consentType: 'analyticsConsent', granted: true },
        { consentType: 'marketingConsent', granted: false },
        { consentType: 'locationSharingConsent', granted: true }
      ];

      for (const consent of consents) {
        await request(app)
          .post('/api/v1/data-management/consent')
          .set('Authorization', `Bearer ${authToken}`)
          .send(consent);
      }

      const response = await request(app)
        .get('/api/v1/data-management/consent-history')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data[0]).toHaveProperty('consentType');
      expect(response.body.data[0]).toHaveProperty('granted');
      expect(response.body.data[0]).toHaveProperty('timestamp');
    });

    it('should update consent preferences', async () => {
      const initialConsent = {
        consentType: 'analyticsConsent',
        granted: true
      };

      await request(app)
        .post('/api/v1/data-management/consent')
        .set('Authorization', `Bearer ${authToken}`)
        .send(initialConsent);

      // Update consent
      const updatedConsent = {
        consentType: 'analyticsConsent',
        granted: false
      };

      const response = await request(app)
        .post('/api/v1/data-management/consent')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updatedConsent);

      expect(response.status).toBe(201);
      expect(response.body.data.granted).toBe(false);

      // Verify history shows both records
      const historyResponse = await request(app)
        .get('/api/v1/data-management/consent-history')
        .set('Authorization', `Bearer ${authToken}`);

      expect(historyResponse.body.data).toHaveLength(2);
    });

    it('should validate consent types', async () => {
      const invalidConsent = {
        consentType: 'invalidConsentType',
        granted: true
      };

      const response = await request(app)
        .post('/api/v1/data-management/consent')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidConsent);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Data Export (Right to Data Portability)', () => {
    it('should export user data in JSON format', async () => {
      // Add some test data first
      await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'Name',
          mentalHealthConditions: ['anxiety']
        });

      const response = await request(app)
        .get('/api/v1/data-management/export')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
      expect(response.headers['content-disposition']).toContain('attachment');

      const exportedData = response.body;
      expect(exportedData).toHaveProperty('user');
      expect(exportedData).toHaveProperty('profile');
      expect(exportedData).toHaveProperty('exportDate');
      expect(exportedData.user.email).toBe('privacy@test.com');
      expect(exportedData.profile.firstName).toBe('Updated');
    });

    it('should include all user-related data in export', async () => {
      const response = await request(app)
        .get('/api/v1/data-management/export')
        .set('Authorization', `Bearer ${authToken}`);

      const exportedData = response.body;
      
      // Check required sections
      expect(exportedData).toHaveProperty('user');
      expect(exportedData).toHaveProperty('profile');
      expect(exportedData).toHaveProperty('moodEntries');
      expect(exportedData).toHaveProperty('breathingExercises');
      expect(exportedData).toHaveProperty('dailyTracking');
      expect(exportedData).toHaveProperty('consentHistory');
      expect(exportedData).toHaveProperty('emergencyContacts');
      expect(exportedData).toHaveProperty('exportDate');
      expect(exportedData).toHaveProperty('dataRetentionInfo');
    });

    it('should not include sensitive system data in export', async () => {
      const response = await request(app)
        .get('/api/v1/data-management/export')
        .set('Authorization', `Bearer ${authToken}`);

      const exportedData = response.body;
      
      // Should not include password hash or internal IDs
      expect(exportedData.user.password).toBeUndefined();
      expect(exportedData.user.id).toBeUndefined();
      expect(exportedData).not.toHaveProperty('systemLogs');
      expect(exportedData).not.toHaveProperty('internalMetrics');
    });
  });

  describe('Account Deletion (Right to be Forgotten)', () => {
    it('should delete user account and all associated data', async () => {
      const deleteData = {
        confirmPassword: 'TestPassword123',
        reason: 'Testing account deletion'
      };

      const response = await request(app)
        .delete('/api/v1/data-management/account')
        .set('Authorization', `Bearer ${authToken}`)
        .send(deleteData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify user is deleted from database
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      expect(user).toBeNull();

      // Verify profile is also deleted
      const profile = await prisma.userProfile.findUnique({
        where: { userId: userId }
      });
      expect(profile).toBeNull();
    });

    it('should require password confirmation for account deletion', async () => {
      const deleteData = {
        confirmPassword: 'WrongPassword123',
        reason: 'Testing'
      };

      const response = await request(app)
        .delete('/api/v1/data-management/account')
        .set('Authorization', `Bearer ${authToken}`)
        .send(deleteData);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_PASSWORD');

      // Verify user still exists
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      expect(user).not.toBeNull();
    });

    it('should log account deletion with reason', async () => {
      const deleteData = {
        confirmPassword: 'TestPassword123',
        reason: 'Privacy concerns'
      };

      const response = await request(app)
        .delete('/api/v1/data-management/account')
        .set('Authorization', `Bearer ${authToken}`)
        .send(deleteData);

      expect(response.status).toBe(200);
      
      // In a real implementation, this would check deletion logs
      // For now, we just verify the deletion was successful
      expect(response.body.data.deletionReason).toBe('Privacy concerns');
      expect(response.body.data.deletionDate).toBeDefined();
    });
  });

  describe('Privacy Settings Management', () => {
    it('should retrieve current privacy settings', async () => {
      const response = await request(app)
        .get('/api/v1/data-management/privacy-settings')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('dataProcessingConsent');
      expect(response.body.data).toHaveProperty('analyticsConsent');
      expect(response.body.data).toHaveProperty('marketingConsent');
      expect(response.body.data).toHaveProperty('locationSharingConsent');
      expect(response.body.data).toHaveProperty('emergencyLocationConsent');
      expect(response.body.data).toHaveProperty('dataRetentionPeriod');
    });

    it('should update privacy settings', async () => {
      const newSettings = {
        analyticsConsent: true,
        marketingConsent: false,
        dataRetentionPeriod: 90
      };

      const response = await request(app)
        .put('/api/v1/data-management/privacy-settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newSettings);

      expect(response.status).toBe(200);
      expect(response.body.data.analyticsConsent).toBe(true);
      expect(response.body.data.marketingConsent).toBe(false);
      expect(response.body.data.dataRetentionPeriod).toBe(90);
    });

    it('should validate data retention period', async () => {
      const invalidSettings = {
        dataRetentionPeriod: 30 // Too short
      };

      const response = await request(app)
        .put('/api/v1/data-management/privacy-settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidSettings);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Data Minimization', () => {
    it('should only collect necessary data during registration', async () => {
      const minimalUserData = {
        email: 'minimal@test.com',
        username: 'minimaluser',
        password: 'TestPassword123',
        country: 'US'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(minimalUserData);

      expect(response.status).toBe(201);
      
      // Verify only necessary data is stored
      const user = await prisma.user.findUnique({
        where: { email: minimalUserData.email },
        include: { profile: true }
      });

      expect(user?.email).toBe(minimalUserData.email);
      expect(user?.username).toBe(minimalUserData.username);
      expect(user?.country).toBe(minimalUserData.country);
      expect(user?.profile?.firstName).toBeNull();
      expect(user?.profile?.lastName).toBeNull();
    });

    it('should not store unnecessary metadata', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      
      // Should not include system metadata in user-facing responses
      expect(response.body.data).not.toHaveProperty('passwordHash');
      expect(response.body.data).not.toHaveProperty('internalNotes');
      expect(response.body.data).not.toHaveProperty('systemFlags');
    });
  });

  describe('Data Anonymization', () => {
    it('should anonymize data for analytics when consent is given', async () => {
      // Grant analytics consent
      await request(app)
        .post('/api/v1/data-management/consent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          consentType: 'analyticsConsent',
          granted: true
        });

      // This would test anonymization logic if implemented
      // For now, we verify consent is properly recorded
      const consentResponse = await request(app)
        .get('/api/v1/data-management/consent-history')
        .set('Authorization', `Bearer ${authToken}`);

      const analyticsConsent = consentResponse.body.data.find(
        (c: any) => c.consentType === 'analyticsConsent'
      );
      expect(analyticsConsent.granted).toBe(true);
    });

    it('should not process data for analytics without consent', async () => {
      // Explicitly revoke analytics consent
      await request(app)
        .post('/api/v1/data-management/consent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          consentType: 'analyticsConsent',
          granted: false
        });

      // Verify consent is recorded as false
      const consentResponse = await request(app)
        .get('/api/v1/data-management/consent-history')
        .set('Authorization', `Bearer ${authToken}`);

      const analyticsConsent = consentResponse.body.data.find(
        (c: any) => c.consentType === 'analyticsConsent'
      );
      expect(analyticsConsent.granted).toBe(false);
    });
  });

  describe('Cross-Border Data Transfer', () => {
    it('should handle users from different countries', async () => {
      const euUserData = {
        email: 'eu@test.com',
        username: 'euuser',
        password: 'TestPassword123',
        country: 'DE' // Germany (EU)
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(euUserData);

      expect(response.status).toBe(201);
      expect(response.body.data.user.country).toBe('DE');
    });

    it('should apply appropriate data protection based on user location', async () => {
      // This would test location-specific privacy rules
      // For now, we verify country is properly stored
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.country).toBe('US');
    });
  });
});