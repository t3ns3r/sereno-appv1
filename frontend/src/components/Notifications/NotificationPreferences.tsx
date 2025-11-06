import React, { useState, useEffect } from 'react';
import { notificationService } from '../../services/notificationService';
import { SeniorButton } from '../UI/SeniorButton';

interface NotificationPreferences {
  emergencyAlerts: boolean;
  dailyReminders: boolean;
  activityUpdates: boolean;
  serenoResponses: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
}

export const NotificationPreferences: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  useEffect(() => {
    loadPreferences();
    checkNotificationPermission();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await notificationService.getNotificationPreferences();
      if (prefs) {
        setPreferences(prefs);
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkNotificationPermission = () => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  };

  const requestNotificationPermission = async () => {
    const granted = await notificationService.requestPermission();
    setPermissionStatus(granted ? 'granted' : 'denied');
    
    if (granted && preferences) {
      // Enable push notifications if permission granted
      await updatePreference('pushEnabled', true);
    }
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!preferences) return;

    setSaving(true);
    try {
      const updatedPrefs = await notificationService.updateNotificationPreferences({
        ...preferences,
        [key]: value
      });

      if (updatedPrefs) {
        setPreferences(updatedPrefs);
      }
    } catch (error) {
      console.error('Error updating notification preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const sendTestNotification = async () => {
    try {
      await notificationService.sendTestNotification(
        '🧪 Notificación de Prueba',
        'Esta es una notificación de prueba de SERENO. ¡Todo funciona correctamente!'
      );
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-lg">Cargando preferencias...</span>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="text-center p-8">
        <p className="text-lg text-gray-600">Error al cargar las preferencias de notificación</p>
        <SeniorButton onClick={loadPreferences} className="mt-4">
          Reintentar
        </SeniorButton>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        🔔 Preferencias de Notificaciones
      </h2>

      {/* Permission Status */}
      <div className="mb-8 p-4 rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold mb-3">Estado de Permisos</h3>
        <div className="flex items-center justify-between">
          <span className="text-gray-700">
            Notificaciones del navegador: 
            <span className={`ml-2 font-semibold ${
              permissionStatus === 'granted' ? 'text-green-600' : 
              permissionStatus === 'denied' ? 'text-red-600' : 'text-yellow-600'
            }`}>
              {permissionStatus === 'granted' ? 'Permitidas' : 
               permissionStatus === 'denied' ? 'Bloqueadas' : 'No configuradas'}
            </span>
          </span>
          {permissionStatus !== 'granted' && (
            <SeniorButton 
              onClick={requestNotificationPermission}
              variant="primary"
              size="sm"
            >
              Permitir Notificaciones
            </SeniorButton>
          )}
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="space-y-6">
        {/* Emergency Alerts */}
        <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
          <div>
            <h4 className="text-lg font-semibold text-red-800">🚨 Alertas de Emergencia</h4>
            <p className="text-sm text-red-600">Notificaciones cuando otros usuarios necesitan ayuda</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.emergencyAlerts}
              onChange={(e) => updatePreference('emergencyAlerts', e.target.checked)}
              disabled={saving}
              className="sr-only peer"
            />
            <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-red-600"></div>
          </label>
        </div>

        {/* Daily Reminders */}
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div>
            <h4 className="text-lg font-semibold text-blue-800">🌟 Recordatorios Diarios</h4>
            <p className="text-sm text-blue-600">Recordatorios para registrar tu estado de ánimo</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.dailyReminders}
              onChange={(e) => updatePreference('dailyReminders', e.target.checked)}
              disabled={saving}
              className="sr-only peer"
            />
            <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Activity Updates */}
        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
          <div>
            <h4 className="text-lg font-semibold text-green-800">🎯 Actualizaciones de Actividades</h4>
            <p className="text-sm text-green-600">Notificaciones sobre nuevas actividades y eventos</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.activityUpdates}
              onChange={(e) => updatePreference('activityUpdates', e.target.checked)}
              disabled={saving}
              className="sr-only peer"
            />
            <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-green-600"></div>
          </label>
        </div>

        {/* SERENO Responses */}
        <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div>
            <h4 className="text-lg font-semibold text-purple-800">💙 Respuestas de SERENOS</h4>
            <p className="text-sm text-purple-600">Notificaciones cuando un SERENO responde a tu emergencia</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.serenoResponses}
              onChange={(e) => updatePreference('serenoResponses', e.target.checked)}
              disabled={saving}
              className="sr-only peer"
            />
            <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-purple-600"></div>
          </label>
        </div>

        {/* Push Notifications */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <h4 className="text-lg font-semibold text-gray-800">📱 Notificaciones Push</h4>
            <p className="text-sm text-gray-600">Habilitar todas las notificaciones push</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.pushEnabled}
              onChange={(e) => updatePreference('pushEnabled', e.target.checked)}
              disabled={saving || permissionStatus !== 'granted'}
              className="sr-only peer"
            />
            <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-gray-600 peer-disabled:opacity-50"></div>
          </label>
        </div>

        {/* Email Notifications */}
        <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div>
            <h4 className="text-lg font-semibold text-yellow-800">📧 Notificaciones por Email</h4>
            <p className="text-sm text-yellow-600">Recibir notificaciones importantes por correo electrónico</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.emailEnabled}
              onChange={(e) => updatePreference('emailEnabled', e.target.checked)}
              disabled={saving}
              className="sr-only peer"
            />
            <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-yellow-600"></div>
          </label>
        </div>
      </div>

      {/* Test Notification */}
      <div className="mt-8 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
        <h4 className="text-lg font-semibold text-indigo-800 mb-2">🧪 Probar Notificaciones</h4>
        <p className="text-sm text-indigo-600 mb-4">
          Envía una notificación de prueba para verificar que todo funciona correctamente
        </p>
        <SeniorButton 
          onClick={sendTestNotification}
          variant="secondary"
          disabled={!preferences.pushEnabled || permissionStatus !== 'granted'}
        >
          Enviar Notificación de Prueba
        </SeniorButton>
      </div>

      {/* Status Indicator */}
      {saving && (
        <div className="mt-4 flex items-center justify-center text-blue-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          Guardando cambios...
        </div>
      )}
    </div>
  );
};