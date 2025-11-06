import { disconnectDatabase } from '../config/database';
import { disconnectRedis } from '../config/redis';

// Global test setup
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/sereno_test';
  process.env.REDIS_URL = 'redis://localhost:6379/1';
  
  // Clear VAPID keys for tests to avoid web-push initialization
  delete process.env.VAPID_PUBLIC_KEY;
  delete process.env.VAPID_PRIVATE_KEY;
  delete process.env.VAPID_EMAIL;
  
  // Mock Firebase service account for tests
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY = JSON.stringify({
    type: 'service_account',
    project_id: 'test-project',
    private_key_id: 'test-key-id',
    private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB\ntest-key\n-----END PRIVATE KEY-----\n',
    client_email: 'test@test-project.iam.gserviceaccount.com',
    client_id: 'test-client-id',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token'
  });
});

// Global test teardown
afterAll(async () => {
  // Clean up connections
  await disconnectDatabase();
  await disconnectRedis();
});