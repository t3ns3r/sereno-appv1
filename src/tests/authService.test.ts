import { AuthService } from '../services/authService';
import { prisma } from '../config/database';
import bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let authService: AuthService;

  beforeAll(() => {
    authService = new AuthService();
    process.env.JWT_SECRET = 'test-jwt-secret-key';
  });

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

  describe('register', () => {
    const validRegisterData = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'TestPass123',
      country: 'US',
      firstName: 'Test',
      lastName: 'User'
    };

    it('should register a new user successfully', async () => {
      const result = await authService.register(validRegisterData);

      expect(result.user.email).toBe(validRegisterData.email);
      expect(result.user.username).toBe(validRegisterData.username);
      expect(result.user.country).toBe('US');
      expect(result.token).toBeDefined();
      expect(result.user.profile?.firstName).toBe(validRegisterData.firstName);

      // Verify password is hashed
      const user = await prisma.user.findUnique({
        where: { email: validRegisterData.email }
      });
      expect(user?.password).not.toBe(validRegisterData.password);
      expect(await bcrypt.compare(validRegisterData.password, user!.password)).toBe(true);
    });

    it('should throw error for duplicate email', async () => {
      await authService.register(validRegisterData);

      await expect(
        authService.register({
          ...validRegisterData,
          username: 'differentuser'
        })
      ).rejects.toThrow('Email already registered');
    });

    it('should throw error for duplicate username', async () => {
      await authService.register(validRegisterData);

      await expect(
        authService.register({
          ...validRegisterData,
          email: 'different@example.com'
        })
      ).rejects.toThrow('Username already taken');
    });

    it('should create user without optional profile fields', async () => {
      const minimalData = {
        email: 'minimal@example.com',
        username: 'minimaluser',
        password: 'MinimalPass123',
        country: 'CA'
      };

      const result = await authService.register(minimalData);

      expect(result.user.email).toBe(minimalData.email);
      expect(result.user.profile?.firstName).toBeUndefined();
      expect(result.user.profile?.lastName).toBeUndefined();
    });
  });

  describe('login', () => {
    const userData = {
      email: 'login@example.com',
      username: 'loginuser',
      password: 'LoginPass123',
      country: 'US'
    };

    beforeEach(async () => {
      await authService.register(userData);
    });

    it('should login successfully with valid credentials', async () => {
      const result = await authService.login({
        email: userData.email,
        password: userData.password
      });

      expect(result.user.email).toBe(userData.email);
      expect(result.user.username).toBe(userData.username);
      expect(result.token).toBeDefined();
    });

    it('should throw error for non-existent user', async () => {
      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: userData.password
        })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error for invalid password', async () => {
      await expect(
        authService.login({
          email: userData.email,
          password: 'wrongpassword'
        })
      ).rejects.toThrow('Invalid email or password');
    });
  });

  describe('getUserProfile', () => {
    let userId: string;

    beforeEach(async () => {
      const result = await authService.register({
        email: 'profile@example.com',
        username: 'profileuser',
        password: 'ProfilePass123',
        country: 'US',
        firstName: 'Profile',
        lastName: 'User'
      });
      userId = result.user.id;
    });

    it('should get user profile successfully', async () => {
      const profile = await authService.getUserProfile(userId);

      expect(profile.id).toBe(userId);
      expect(profile.email).toBe('profile@example.com');
      expect(profile.profile?.firstName).toBe('Profile');
      expect(profile.profile?.lastName).toBe('User');
    });

    it('should throw error for non-existent user', async () => {
      await expect(
        authService.getUserProfile('non-existent-id')
      ).rejects.toThrow('User not found');
    });
  });

  describe('updateUserProfile', () => {
    let userId: string;

    beforeEach(async () => {
      const result = await authService.register({
        email: 'update@example.com',
        username: 'updateuser',
        password: 'UpdatePass123',
        country: 'US'
      });
      userId = result.user.id;
    });

    it('should update user profile successfully', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        mentalHealthConditions: ['anxiety', 'depression']
      };

      const result = await authService.updateUserProfile(userId, updateData);

      expect(result.profile?.firstName).toBe('Updated');
      expect(result.profile?.lastName).toBe('Name');
      expect(result.profile?.mentalHealthConditions).toEqual(['anxiety', 'depression']);
    });

    it('should throw error for non-existent user', async () => {
      await expect(
        authService.updateUserProfile('non-existent-id', { firstName: 'Test' })
      ).rejects.toThrow('User not found');
    });
  });
});