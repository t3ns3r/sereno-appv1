import { messaging, getToken, onMessage } from '../config/firebase';
import axios from 'axios';

interface NotificationPreferences {
  emergencyAlerts: boolean;
  dailyReminders: boolean;
  activityUpdates: boolean;
  serenoResponses: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
}

class NotificationService {
  private permission: NotificationPermission = 'default';
  private vapidKey: string | null = null;
  private fcmToken: string | null = null;

  constructor() {
    this.checkPermission();
    this.initializeFirebaseMessaging();
  }

  private checkPermission() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  private async initializeFirebaseMessaging() {
    try {
      if (!messaging) {
        console.warn('Firebase messaging not available');
        return;
      }

      // Get VAPID key from server
      await this.getVapidKey();

      // Listen for foreground messages
      onMessage(messaging, (payload) => {
        console.log('Message received in foreground:', payload);
        this.handleForegroundMessage(payload);
      });

    } catch (error) {
      console.error('Error initializing Firebase messaging:', error);
    }
  }

  private async getVapidKey(): Promise<void> {
    try {
      const response = await axios.get('/api/v1/notifications/vapid-key');
      this.vapidKey = response.data.data.publicKey;
    } catch (error) {
      console.error('Error getting VAPID key:', error);
    }
  }

  private handleForegroundMessage(payload: any): void {
    const { notification, data } = payload;
    
    if (notification) {
      this.showNotification(notification.title, {
        body: notification.body,
        icon: notification.image || '/icons/icon-192x192.png',
        data: data,
        actions: data?.actions ? JSON.parse(data.actions) : undefined
      });
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    const permission = await Notification.requestPermission();
    this.permission = permission;
    
    if (permission === 'granted') {
      await this.subscribeToPushNotifications();
    }
    
    return permission === 'granted';
  }

  async subscribeToPushNotifications(): Promise<boolean> {
    try {
      if (!messaging || !this.vapidKey) {
        console.warn('Firebase messaging or VAPID key not available');
        return false;
      }

      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: this.vapidKey
      });

      if (token) {
        this.fcmToken = token;
        
        // Register service worker for push notifications
        const registration = await navigator.serviceWorker.register('/sw.js');
        
        // Get push subscription
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.vapidKey)
        });

        // Send subscription to server
        await this.sendSubscriptionToServer(subscription, token);
        
        console.log('Successfully subscribed to push notifications');
        return true;
      }

      return false;

    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return false;
    }
  }

  private async sendSubscriptionToServer(subscription: PushSubscription, fcmToken: string): Promise<void> {
    try {
      const subscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
        },
        fcmToken,
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform
        }
      };

      await axios.post('/api/v1/notifications/subscribe', subscriptionData);
      
    } catch (error) {
      console.error('Error sending subscription to server:', error);
      throw error;
    }
  }

  async unsubscribeFromPushNotifications(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          
          // Notify server
          await axios.delete('/api/v1/notifications/unsubscribe', {
            data: { endpoint: subscription.endpoint }
          });
          
          console.log('Successfully unsubscribed from push notifications');
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  }

  async getNotificationPreferences(): Promise<NotificationPreferences | null> {
    try {
      const response = await axios.get('/api/v1/notifications/preferences');
      return response.data.data;
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      return null;
    }
  }

  async updateNotificationPreferences(preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences | null> {
    try {
      const response = await axios.put('/api/v1/notifications/preferences', preferences);
      return response.data.data;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return null;
    }
  }

  async sendTestNotification(title: string, body: string): Promise<boolean> {
    try {
      await axios.post('/api/v1/notifications/test', { title, body });
      return true;
    } catch (error) {
      console.error('Error sending test notification:', error);
      return false;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  showNotification(title: string, options?: NotificationOptions): Notification | null {
    if (this.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    const defaultOptions: NotificationOptions = {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'sereno-reminder',
      requireInteraction: false,
      ...options
    };

    return new Notification(title, defaultOptions);
  }

  showDailyTrackingReminder(): Notification | null {
    return this.showNotification(
      '🌟 SERENITO te recuerda',
      {
        body: '¡Es momento de registrar cómo te sientes hoy! Tu bienestar es importante.',
        icon: '/icons/serenito-icon.png',
        tag: 'daily-tracking-reminder',
        actions: [
          {
            action: 'track-now',
            title: 'Registrar ahora'
          },
          {
            action: 'remind-later',
            title: 'Recordar más tarde'
          }
        ]
      }
    );
  }

  scheduleReminder(hours: number, minutes: number): void {
    const now = new Date();
    const reminderTime = new Date();
    reminderTime.setHours(hours, minutes, 0, 0);

    // If the time has passed today, schedule for tomorrow
    if (reminderTime <= now) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    const timeUntilReminder = reminderTime.getTime() - now.getTime();

    setTimeout(() => {
      this.showDailyTrackingReminder();
      // Schedule next reminder for tomorrow
      this.scheduleReminder(hours, minutes);
    }, timeUntilReminder);
  }

  setupDailyReminders(): void {
    // Schedule reminders at 9 AM, 2 PM, and 7 PM
    const reminderTimes = [
      { hours: 9, minutes: 0 },
      { hours: 14, minutes: 0 },
      { hours: 19, minutes: 0 }
    ];

    reminderTimes.forEach(time => {
      this.scheduleReminder(time.hours, time.minutes);
    });
  }
}

export const notificationService = new NotificationService();