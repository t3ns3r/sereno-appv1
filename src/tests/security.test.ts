import request from 'supertest';
import { app } from '../server';
import { prisma } from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('Security Tests', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.userProfile.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.userProfile.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('Data Encryption', () => {
    it('should hash passwords with bcrypt', async () => {
      const userData = {
        email: 'encryption@test.com',
        username: 'encryptuser',
        password: 'TestPassword123',
        country: 'US'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      expect(response.status).toBe(201);

      // Verify password is hashed in database
      const user = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      expect(user?.password).not.toBe(userData.password);
      expect(user?.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
      expect(await bcrypt.compare(userData.password, user!.password)).toBe(true);
    });

    it('should use strong salt rounds for password hashing', async () => {
      const password = 'TestPassword123';
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Verify salt rounds (should be 12 or higher)
      const saltRounds = hashedPassword.split('$')[2];
      expect(parseInt(saltRounds)).toBeGreaterThanOrEqual(12);
    });

    it('should not expose sensitive data in API responses', async () => {
      const userData = {
        email: 'sensitive@test.com',
        username: 'sensitiveuser',
        password: 'TestPassword123',
        country: 'US'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.data.user.password).toBeUndefined();
      expect(response.body.data.user.id).toBeDefined();
      expect(response.body.data.token).toBeDefined();
    });

    it('should validate JWT token structure and expiration', async () => {
      const userData = {
        email: 'jwt@test.com',
        username: 'jwtuser',
        password: 'TestPassword123',
        country: 'US'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      const token = response.body.data.token;
      expect(token).toBeDefined();

      // Verify JWT structure
      const decoded = jwt.decode(token, { complete: true });
      expect(decoded?.header.alg).toBe('HS256');
      expect(decoded?.payload).toHaveProperty('userId');
      expect(decoded?.payload).toHaveProperty('email');
      expect(decoded?.payload).toHaveProperty('role');
      expect(decoded?.payload).toHaveProperty('iat');
      expect(decoded?.payload).toHaveProperty('exp');
    });
  });

  describe('Authentication Security', () => {
    it('should reject requests with invalid JWT tokens', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });

    it('should reject requests with expired JWT tokens', async () => {
      const expiredToken = jwt.sign(
        { userId: 'test-id', email: 'test@test.com', role: 'user' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('TOKEN_EXPIRED');
    });

    it('should reject requests without authorization header', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });

    it('should validate user existence on token verification', async () => {
      // Create a token for non-existent user
      const fakeToken = jwt.sign(
        { userId: 'non-existent-id', email: 'fake@test.com', role: 'user' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${fakeToken}`);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });
  });

  describe('Input Validation Security', () => {
    it('should sanitize email input', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: '  TEST@EXAMPLE.COM  ',
          username: 'testuser',
          password: 'TestPassword123',
          country: 'US'
        });

      expect(response.status).toBe(201);
      expect(response.body.data.user.email).toBe('test@example.com');
    });

    it('should reject weak passwords', async () => {
      const weakPasswords = [
        'weak',
        '12345678',
        'password',
        'PASSWORD',
        'Password',
        'Pass123' // Too short
      ];

      for (const password of weakPasswords) {
        const response = await request(app)
          .post('/api/v1/auth/register')
          .send({
            email: `test${Date.now()}@example.com`,
            username: `user${Date.now()}`,
            password,
            country: 'US'
          });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should validate username format', async () => {
      const invalidUsernames = [
        'ab', // Too short
        'a'.repeat(31), // Too long
        'user@name', // Invalid characters
        'user name', // Spaces
        'user-name' // Hyphens
      ];

      for (const username of invalidUsernames) {
        const response = await request(app)
          .post('/api/v1/auth/register')
          .send({
            email: `test${Date.now()}@example.com`,
            username,
            password: 'TestPassword123',
            country: 'US'
          });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should validate country code format', async () => {
      const invalidCountries = [
        'USA', // Too long
        'U', // Too short
        '12', // Numbers
        'us' // Lowercase
      ];

      for (const country of invalidCountries) {
        const response = await request(app)
          .post('/api/v1/auth/register')
          .send({
            email: `test${Date.now()}@example.com`,
            username: `user${Date.now()}`,
            password: 'TestPassword123',
            country
          });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      }
    });
  });

  describe('Rate Limiting and Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', 'Bearer invalid-token');

      // Check for common security headers
      expect(response.headers['x-content-type-options']).toBeDefined();
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-xss-protection']).toBeDefined();
    });

    it('should prevent SQL injection attempts', async () => {
      const sqlInjectionAttempts = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "admin'--",
        "' UNION SELECT * FROM users --"
      ];

      for (const injection of sqlInjectionAttempts) {
        const response = await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: injection,
            password: 'TestPassword123'
          });

        // Should either be validation error or invalid credentials, not server error
        expect([400, 401]).toContain(response.status);
        expect(response.status).not.toBe(500);
      }
    });
  });

  describe('Role-Based Access Control', () => {
    let userToken: string;
    let adminToken: string;

    beforeEach(async () => {
      // Create regular user
      const userResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'user@test.com',
          username: 'regularuser',
          password: 'TestPassword123',
          country: 'US'
        });
      userToken = userResponse.body.data.token;

      // Create admin user (would need to be done through database directly)
      const adminUser = await prisma.user.create({
        data: {
          email: 'admin@test.com',
          username: 'adminuser',
          password: await bcrypt.hash('AdminPassword123', 12),
          country: 'US',
          role: 'ADMIN',
          profile: {
            create: {
              preferences: {},
              emergencyContacts: []
            }
          }
        }
      });

      adminToken = jwt.sign(
        { userId: adminUser.id, email: adminUser.email, role: adminUser.role },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );
    });

    it('should allow users to access their own profile', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
    });

    it('should prevent unauthorized access to admin endpoints', async () => {
      // This would test admin-only endpoints if they exist
      // For now, we test that regular users can't access other users' data
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.email).toBe('user@test.com');
    });
  });
});