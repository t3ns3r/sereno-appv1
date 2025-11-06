import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/notificationService';

interface NotificationPreferences {
  emergencyAlerts: boolean;
  dailyReminders: boolean;
  activityUpdates: boolean;
  serenoResponses: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
}

interface UseNotificationsReturn {
  preferences: NotificationPreferences | null;
  permissionStatus: NotificationPermission;
  loading: boolean;
  error: string | null;
  requestPermission: () => Promise<boolean>;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
  sendTestNotification: () => Promise<void>;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  refreshPreferences: () => Promise<void>;
}

export const useNotifications = (): UseNotificationsReturn => {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check notification permission status
  const checkPermissionStatus = useCallback(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  // Load notification preferences from server
  const loadPreferences = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const prefs = await notificationService.getNotificationPreferences();
      if (prefs) {
        setPreferences(prefs);
      }
    } catch (err) {
      console.error('Error loading notification preferences:', err);
      setError('Error al cargar las preferencias de notificación');
    } finally {
      setLoading(false);
    }
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await notificationService.requestPermission();
      setPermissionStatus(granted ? 'granted' : 'denied');
      
      if (granted && preferences) {
        // Auto-enable push notifications if permission granted
        await updatePreferences({ pushEnabled: true });
      }
      
      return granted;
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      setError('Error al solicitar permisos de notificación');
      return false;
    }
  }, [preferences]);

  // Update notification preferences
  const updatePreferences = useCallback(async (newPrefs: Partial<NotificationPreferences>) => {
    if (!preferences) return;

    try {
      setError(null);
      
      const updatedPrefs = await notificationService.updateNotificationPreferences({
        ...preferences,
        ...newPrefs
      });

      if (updatedPrefs) {
        setPreferences(updatedPrefs);
      }
    } catch (err) {
      console.error('Error updating notification preferences:', err);
      setError('Error al actualizar las preferencias');
    }
  }, [preferences]);

  // Send test notification
  const sendTestNotification = useCallback(async () => {
    try {
      setError(null);
      
      await notificationService.sendTestNotification(
        '🧪 Notificación de Prueba - SERENO',
        'Esta es una notificación de prueba. ¡Todo funciona correctamente!'
      );
    } catch (err) {
      console.error('Error sending test notification:', err);
      setError('Error al enviar notificación de prueba');
    }
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      
      const success = await notificationService.subscribeToPushNotifications();
      if (success && preferences) {
        await updatePreferences({ pushEnabled: true });
      }
      
      return success;
    } catch (err) {
      console.error('Error subscribing to push notifications:', err);
      setError('Error al suscribirse a las notificaciones');
      return false;
    }
  }, [preferences, updatePreferences]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      
      const success = await notificationService.unsubscribeFromPushNotifications();
      if (success && preferences) {
        await updatePreferences({ pushEnabled: false });
      }
      
      return success;
    } catch (err) {
      console.error('Error unsubscribing from push notifications:', err);
      setError('Error al desuscribirse de las notificaciones');
      return false;
    }
  }, [preferences, updatePreferences]);

  // Refresh preferences from server
  const refreshPreferences = useCallback(async () => {
    await loadPreferences();
  }, [loadPreferences]);

  // Initialize on mount
  useEffect(() => {
    checkPermissionStatus();
    loadPreferences();
  }, [checkPermissionStatus, loadPreferences]);

  // Listen for permission changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkPermissionStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkPermissionStatus]);

  return {
    preferences,
    permissionStatus,
    loading,
    error,
    requestPermission,
    updatePreferences,
    sendTestNotification,
    subscribe,
    unsubscribe,
    refreshPreferences
  };
};