import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

interface EmergencyAlert {
  id: string;
  userId: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  status: 'active' | 'responded' | 'resolved';
  createdAt: string;
  respondingSerenos: string[];
  officialContactsNotified: string[];
}

interface EmergencyContact {
  id: string;
  country: string;
  name: string;
  phoneNumber: string;
  type: 'crisis_hotline' | 'emergency_services' | 'mental_health_facility';
  available24h: boolean;
  autoContact: boolean;
  description?: string;
  website?: string;
}

interface UseEmergencyReturn {
  activeAlert: EmergencyAlert | null;
  emergencyContacts: EmergencyContact[];
  isLoading: boolean;
  error: string | null;
  activateEmergency: (location?: { latitude: number; longitude: number; address?: string }) => Promise<EmergencyAlert>;
  respondToEmergency: (alertId: string) => Promise<void>;
  resolveEmergency: (alertId: string) => Promise<void>;
  getEmergencyContacts: (country: string) => Promise<EmergencyContact[]>;
  getEmergencyHistory: () => Promise<EmergencyAlert[]>;
  getActiveEmergencies: () => Promise<EmergencyAlert[]>;
}

export const useEmergency = (): UseEmergencyReturn => {
  const { user, token } = useAuth();
  const [activeAlert, setActiveAlert] = useState<EmergencyAlert | null>(null);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiCall = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/v1/emergency${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'An error occurred');
    }

    return data;
  }, [token]);

  const activateEmergency = useCallback(async (location?: { latitude: number; longitude: number; address?: string }): Promise<EmergencyAlert> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiCall('/panic', {
        method: 'POST',
        body: JSON.stringify({ location }),
      });

      const alert = response.data;
      setActiveAlert(alert);
      
      // Show browser notification if supported
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Sistema de Emergencia Activado', {
          body: 'Los SERENOS cercanos han sido notificados',
          icon: '/icons/emergency-icon-192.png'
        });
      }

      return alert;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to activate emergency';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [apiCall]);

  const respondToEmergency = useCallback(async (alertId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await apiCall(`/alert/${alertId}/respond`, {
        method: 'POST',
      });

      // Update active alert if it's the one being responded to
      if (activeAlert?.id === alertId) {
        setActiveAlert(prev => prev ? {
          ...prev,
          status: 'responded',
          respondingSerenos: [...prev.respondingSerenos, user?.id || '']
        } : null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to respond to emergency';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [apiCall, activeAlert, user?.id]);

  const resolveEmergency = useCallback(async (alertId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await apiCall(`/alert/${alertId}/resolve`, {
        method: 'PUT',
      });

      // Update active alert
      if (activeAlert?.id === alertId) {
        setActiveAlert(prev => prev ? {
          ...prev,
          status: 'resolved'
        } : null);
      }

      // Clear active alert after a delay
      setTimeout(() => {
        setActiveAlert(null);
      }, 3000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resolve emergency';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [apiCall, activeAlert]);

  const getEmergencyContacts = useCallback(async (country: string): Promise<EmergencyContact[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiCall(`/contacts/${country}`);
      const contacts = response.data;
      setEmergencyContacts(contacts);
      return contacts;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get emergency contacts';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [apiCall]);

  const getEmergencyHistory = useCallback(async (): Promise<EmergencyAlert[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiCall('/history');
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get emergency history';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [apiCall]);

  const getActiveEmergencies = useCallback(async (): Promise<EmergencyAlert[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiCall('/active');
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get active emergencies';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [apiCall]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Subscribe to push notifications when user is authenticated
  useEffect(() => {
    if (user && 'serviceWorker' in navigator && 'PushManager' in window) {
      const subscribeToPushNotifications = async () => {
        try {
          const registration = await navigator.serviceWorker.ready;
          
          // Check if already subscribed
          const existingSubscription = await registration.pushManager.getSubscription();
          if (existingSubscription) {
            return;
          }

          // Subscribe to push notifications
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: process.env.REACT_APP_VAPID_PUBLIC_KEY
          });

          // Send subscription to server
          await apiCall('/notifications/subscribe', {
            method: 'POST',
            body: JSON.stringify({
              subscription: {
                endpoint: subscription.endpoint,
                keys: {
                  p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
                  auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!)))
                }
              },
              deviceInfo: {
                userAgent: navigator.userAgent,
                platform: navigator.platform
              }
            }),
          });

        } catch (error) {
          console.error('Error subscribing to push notifications:', error);
        }
      };

      subscribeToPushNotifications();
    }
  }, [user, apiCall]);

  return {
    activeAlert,
    emergencyContacts,
    isLoading,
    error,
    activateEmergency,
    respondToEmergency,
    resolveEmergency,
    getEmergencyContacts,
    getEmergencyHistory,
    getActiveEmergencies,
  };
};