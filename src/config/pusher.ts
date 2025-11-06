import Pusher from 'pusher';

// Initialize Pusher for real-time communications
export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || 'test-app-id',
  key: process.env.PUSHER_KEY || 'test-key',
  secret: process.env.PUSHER_SECRET || 'test-secret',
  cluster: process.env.PUSHER_CLUSTER || 'us2',
  useTLS: true
});

// For development/testing, you can use a mock pusher
if (process.env.NODE_ENV === 'test') {
  // Mock pusher for testing
  (pusher as any).trigger = async (channel: string, event: string, data: any) => {
    console.log(`Mock Pusher: ${channel} -> ${event}`, data);
    return Promise.resolve();
  };
}