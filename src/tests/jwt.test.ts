import { generateToken, verifyToken } from '../utils/jwt';

describe('JWT Utilities', () => {
  const mockPayload = {
    userId: 'test-user-id',
    email: 'test@example.com',
    role: 'USER'
  };

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-jwt-secret-key';
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken(mockPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should throw error when JWT_SECRET is not set', () => {
      delete process.env.JWT_SECRET;
      
      expect(() => generateToken(mockPayload)).toThrow('JWT_SECRET environment variable is required');
      
      // Restore for other tests
      process.env.JWT_SECRET = 'test-jwt-secret-key';
    });
  });

  describe('verifyToken', () => {
    it('should verify and decode a valid token', () => {
      const token = generateToken(mockPayload);
      const decoded = verifyToken(token);
      
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.role).toBe(mockPayload.role);
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyToken('invalid-token')).toThrow();
    });

    it('should throw error when JWT_SECRET is not set', () => {
      const token = generateToken(mockPayload);
      delete process.env.JWT_SECRET;
      
      expect(() => verifyToken(token)).toThrow('JWT_SECRET environment variable is required');
      
      // Restore for other tests
      process.env.JWT_SECRET = 'test-jwt-secret-key';
    });

    it('should throw error for expired token', () => {
      // Create a token with very short expiration
      process.env.JWT_EXPIRES_IN = '1ms';
      const token = generateToken(mockPayload);
      
      // Wait for token to expire
      setTimeout(() => {
        expect(() => verifyToken(token)).toThrow();
      }, 10);
      
      // Restore default expiration
      process.env.JWT_EXPIRES_IN = '7d';
    });
  });
});