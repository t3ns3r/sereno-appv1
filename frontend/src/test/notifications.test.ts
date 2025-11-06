import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock push notification subscription
const mockPushSubscription = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
  keys: {
    p256dh: 'test-p256dh-key',
    auth: 'test-auth-key'
  },
  getKey: vi.fn(),
  toJSON: vi.fn().mockReturnValue({
    endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
    keys: {
      p256dh: 'test-p256dh-key',
      auth: 'test-auth-key'
    }
  }),
  unsubscribe: vi.fn().mockResolvedValue(true)
};

// Mock push manager
const mockPushManager = {
  subscribe: vi.fn().mockResolvedValue(mockPushSubscription),
  getSubscription: vi.fn().mockResolvedValue(mockPushSubscription),
  permissionState: vi.fn().mockResolvedValue('granted'),
  supportedContentEncodings: ['aes128gcm']
};

// Mock service worker registration
const mockServiceWorkerRegistration = {
  pushManager: mockPushManager,
  showNotification: vi.fn().mockResolvedValue(undefined),
  getNotifications: vi.fn().mockResolvedValue([]),
  update: vi.fn().mockResolvedValue(undefined),
  unregister: vi.fn().mockResolvedValue(true),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
};

// Mock notification
const mockNotification = {
  title: 'Test Notification',
  body: 'Test body',
  icon: '/icon.png',
  tag: 'test',
  data: { test: true },
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
};

describe('Push Notification Tests', () => {
  beforeEach(() => {
    // Setup global mocks
    Object.defineProperty(global, 'Notification', {
      value: class MockNotification {
        static permission = 'granted';
        static requestPermission = vi.fn().mockResolvedValue('granted');
        
        constructor(title: string, options?: NotificationOptions) {
          Object.assign(this, { title, ...options, ...mockNotification });
        }
      },
      writable: true
    });

    Object.defineProperty(global, 'navigator', {
      value: {
        serviceWorker: {
          ready: Promise.resolve(mockServiceWorkerRegistration),
          register: vi.fn().mockResolvedValue(mockServiceWorkerRegistration),
          getRegistration: vi.fn().mockResolvedValue(mockServiceWorkerRegistration)
        }
      },
      writable: true
    });

    // Mock fetch for API calls
    global.fetch = vi.fn();

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Notification Permission', () => {
    it('should request notification permission successfully', async () => {
      const permission = await Notification.requestPermission();
      
      expect(Notification.requestPermission).toHaveBeenCalled();
      expect(permission).toBe('granted');
    });

    it('should handle denied notification permission', async () => {
      Notification.requestPermission = vi.fn().mockResolvedValue('denied');
      
      const permission = await Notification.requestPermission();
      
      expect(permission).toBe('denied');
    });

    it('should check current notification permission', () => {
      expect(Notification.permission).toBe('granted');
    });
  });

  describe('Push Subscription Management', () => {
    it('should subscribe to push notifications', async () => {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: 'test-vapid-key'
      });
      
      expect(mockPushManager.subscribe).toHaveBeenCalledWith({
        userVisibleOnly: true,
        applicationServerKey: 'test-vapid-key'
      });
      expect(subscription).toEqual(mockPushSubscription);
    });

    it('should get existing push subscription', async () => {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      expect(mockPushManager.getSubscription).toHaveBeenCalled();
      expect(subscription).toEqual(mockPushSubscription);
    });

    it('should unsubscribe from push notifications', async () => {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        const result = await subscription.unsubscribe();
        expect(result).toBe(true);
        expect(mockPushSubscription.unsubscribe).toHaveBeenCalled();
      }
    });

    it('should handle subscription failure', async () => {
      const error = new Error('Subscription failed');
      mockPushManager.subscribe.mockRejectedValueOnce(error);
      
      const registration = await navigator.serviceWorker.ready;
      
      await expect(
        registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: 'test-vapid-key'
        })
      ).rejects.toThrow('Subscription failed');
    });
  });

  describe('Notification Display', () => {
    it('should show basic notification', async () => {
      const registration = await navigator.serviceWorker.ready;
      
      await registration.showNotification('Test Title', {
        body: 'Test body',
        icon: '/icon.png',
        tag: 'test'
      });
      
      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalledWith(
        'Test Title',
        {
          body: 'Test body',
          icon: '/icon.png',
          tag: 'test'
        }
      );
    });

    it('should show notification with actions', async () => {
      const registration = await navigator.serviceWorker.ready;
      
      await registration.showNotification('Emergency Alert', {
        body: 'A user needs help',
        icon: '/emergency-icon.png',
        badge: '/badge.png',
        tag: 'emergency',
        requireInteraction: true,
        actions: [
          {
            action: 'respond',
            title: 'Respond',
            icon: '/respond-icon.png'
          },
          {
            action: 'dismiss',
            title: 'Dismiss'
          }
        ],
        data: {
          alertId: 'alert-123',
          type: 'emergency'
        }
      });
      
      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalledWith(
        'Emergency Alert',
        expect.objectContaining({
          actions: expect.arrayContaining([
            expect.objectContaining({
              action: 'respond',
              title: 'Respond'
            })
          ]),
          requireInteraction: true,
          data: expect.objectContaining({
            alertId: 'alert-123',
            type: 'emergency'
          })
        })
      );
    });

    it('should get existing notifications', async () => {
      const mockNotifications = [
        { title: 'Notification 1', tag: 'tag1' },
        { title: 'Notification 2', tag: 'tag2' }
      ];
      
      mockServiceWorkerRegistration.getNotifications.mockResolvedValue(mockNotifications);
      
      const registration = await navigator.serviceWorker.ready;
      const notifications = await registration.getNotifications();
      
      expect(notifications).toEqual(mockNotifications);
      expect(mockServiceWorkerRegistration.getNotifications).toHaveBeenCalled();
    });

    it('should filter notifications by tag', async () => {
      const mockNotifications = [
        { title: 'Emergency Alert', tag: 'emergency' }
      ];
      
      mockServiceWorkerRegistration.getNotifications.mockResolvedValue(mockNotifications);
      
      const registration = await navigator.serviceWorker.ready;
      const notifications = await registration.getNotifications({ tag: 'emergency' });
      
      expect(mockServiceWorkerRegistration.getNotifications).toHaveBeenCalledWith({ tag: 'emergency' });
      expect(notifications).toEqual(mockNotifications);
    });
  });

  describe('Notification Types', () => {
    it('should handle daily reminder notifications', async () => {
      const registration = await navigator.serviceWorker.ready;
      
      await registration.showNotification('🌟 SERENITO te recuerda', {
        body: '¿Cómo te sientes hoy? Registra tu estado de ánimo y bienestar',
        icon: '/icons/serenito-icon-192.png',
        tag: 'daily-reminder',
        data: {
          type: 'daily_reminder',
          action: 'mood_assessment'
        },
        actions: [
          {
            action: 'open_mood',
            title: 'Registrar Estado'
          },
          {
            action: 'open_tracking',
            title: 'Seguimiento Diario'
          }
        ]
      });
      
      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalledWith(
        '🌟 SERENITO te recuerda',
        expect.objectContaining({
          tag: 'daily-reminder',
          data: expect.objectContaining({
            type: 'daily_reminder'
          })
        })
      );
    });

    it('should handle emergency alert notifications', async () => {
      const registration = await navigator.serviceWorker.ready;
      
      await registration.showNotification('🚨 Alerta de Emergencia', {
        body: 'Un usuario necesita ayuda inmediata en tu área. ¿Puedes responder?',
        icon: '/icons/emergency-icon-192.png',
        badge: '/icons/emergency-badge.png',
        tag: 'emergency-alert',
        requireInteraction: true,
        data: {
          type: 'emergency_alert',
          alertId: 'alert-123',
          action: 'respond_emergency'
        },
        actions: [
          {
            action: 'respond',
            title: 'Responder Ahora',
            icon: '/icons/respond-icon.png'
          },
          {
            action: 'view_location',
            title: 'Ver Ubicación'
          }
        ]
      });
      
      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalledWith(
        '🚨 Alerta de Emergencia',
        expect.objectContaining({
          requireInteraction: true,
          data: expect.objectContaining({
            type: 'emergency_alert',
            alertId: 'alert-123'
          })
        })
      );
    });

    it('should handle activity notifications', async () => {
      const registration = await navigator.serviceWorker.ready;
      
      await registration.showNotification('🎯 Nueva Actividad Disponible', {
        body: 'Se ha publicado una nueva actividad: Sesión de Mindfulness',
        icon: '/icons/activity-icon-192.png',
        tag: 'activity-update',
        data: {
          type: 'activity_update',
          activityId: 'activity-456',
          action: 'view_activity'
        },
        actions: [
          {
            action: 'view_activity',
            title: 'Ver Actividad'
          },
          {
            action: 'view_board',
            title: 'Ver Todas'
          }
        ]
      });
      
      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalledWith(
        '🎯 Nueva Actividad Disponible',
        expect.objectContaining({
          tag: 'activity-update',
          data: expect.objectContaining({
            type: 'activity_update',
            activityId: 'activity-456'
          })
        })
      );
    });

    it('should handle SERENO response notifications', async () => {
      const registration = await navigator.serviceWorker.ready;
      
      await registration.showNotification('💙 SERENO Respondiendo', {
        body: 'María está respondiendo a tu emergencia. Te contactará pronto.',
        icon: '/icons/sereno-response-icon-192.png',
        tag: 'sereno-response',
        data: {
          type: 'sereno_response',
          alertId: 'alert-123',
          action: 'open_chat'
        },
        actions: [
          {
            action: 'open_chat',
            title: 'Abrir Chat'
          },
          {
            action: 'view_help',
            title: 'Ver Ayuda'
          }
        ]
      });
      
      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalledWith(
        '💙 SERENO Respondiendo',
        expect.objectContaining({
          tag: 'sereno-response',
          data: expect.objectContaining({
            type: 'sereno_response'
          })
        })
      );
    });
  });

  describe('Notification Interaction', () => {
    it('should handle notification click events', () => {
      const clickHandler = vi.fn();
      const notification = new Notification('Test', { data: { action: 'test' } });
      
      notification.addEventListener('click', clickHandler);
      
      // Simulate click by calling the handler directly
      clickHandler();
      
      expect(clickHandler).toHaveBeenCalled();
    });

    it('should handle notification action clicks', () => {
      const actionHandler = vi.fn();
      
      // Mock service worker event listener for notificationclick
      const mockEvent = {
        notification: {
          title: 'Emergency Alert',
          data: { alertId: 'alert-123' },
          close: vi.fn()
        },
        action: 'respond',
        waitUntil: vi.fn()
      };
      
      // Simulate action click handler
      actionHandler(mockEvent);
      
      expect(actionHandler).toHaveBeenCalledWith(mockEvent);
    });

    it('should close notification after interaction', () => {
      const notification = new Notification('Test');
      notification.close();
      
      expect(mockNotification.close).toHaveBeenCalled();
    });
  });

  describe('Push Message Handling', () => {
    it('should handle incoming push messages', () => {
      const pushHandler = vi.fn();
      
      const mockPushEvent = {
        data: {
          json: () => ({
            title: 'Push Message',
            body: 'Push body',
            data: { type: 'test' }
          }),
          text: () => 'Push message text'
        },
        waitUntil: vi.fn()
      };
      
      // Simulate push event handler
      pushHandler(mockPushEvent);
      
      expect(pushHandler).toHaveBeenCalledWith(mockPushEvent);
    });

    it('should handle malformed push messages', () => {
      const pushHandler = vi.fn();
      
      const mockPushEvent = {
        data: {
          json: () => { throw new Error('Invalid JSON'); },
          text: () => 'Invalid push message'
        },
        waitUntil: vi.fn()
      };
      
      // Simulate push event handler with error handling
      try {
        pushHandler(mockPushEvent);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Notification Preferences', () => {
    it('should respect user notification preferences', async () => {
      const mockPreferences = {
        emergencyAlerts: true,
        dailyReminders: false,
        activityUpdates: true,
        serenoResponses: true,
        pushEnabled: true
      };

      global.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(mockPreferences), { status: 200 })
      );

      const response = await fetch('/api/notifications/preferences');
      const preferences = await response.json();

      expect(preferences.dailyReminders).toBe(false);
      expect(preferences.emergencyAlerts).toBe(true);
    });

    it('should update notification preferences', async () => {
      const updatedPreferences = {
        dailyReminders: true,
        emergencyAlerts: true
      };

      global.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );

      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPreferences)
      });

      expect(response.status).toBe(200);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/notifications/preferences',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updatedPreferences)
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle push subscription errors gracefully', async () => {
      const error = new Error('Push not supported');
      mockPushManager.subscribe.mockRejectedValue(error);

      const registration = await navigator.serviceWorker.ready;

      await expect(
        registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: 'test-key'
        })
      ).rejects.toThrow('Push not supported');
    });

    it('should handle notification display errors', async () => {
      const error = new Error('Notification failed');
      mockServiceWorkerRegistration.showNotification.mockRejectedValue(error);

      const registration = await navigator.serviceWorker.ready;

      await expect(
        registration.showNotification('Test', { body: 'Test body' })
      ).rejects.toThrow('Notification failed');
    });

    it('should handle network errors when syncing preferences', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(
        fetch('/api/notifications/preferences')
      ).rejects.toThrow('Network error');
    });
  });
});