import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BellIcon, ClockIcon } from '@heroicons/react/24/solid';
import SeniorButton from '../UI/SeniorButton';
import SerenitoCharacter from '../SERENITO/SerenitoCharacter';
import { notificationService } from '../../services/notificationService';

interface ReminderSettingsProps {
  onClose?: () => void;
  className?: string;
}

const ReminderSettings: React.FC<ReminderSettingsProps> = ({ onClose, className = '' }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [reminderTimes, setReminderTimes] = useState([
    { id: 1, time: '09:00', enabled: true, label: 'Mañana' },
    { id: 2, time: '14:00', enabled: true, label: 'Tarde' },
    { id: 3, time: '19:00', enabled: true, label: 'Noche' }
  ]);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Check current notification permission
    if ('Notification' in window) {
      setPermission(Notification.permission);
      setNotificationsEnabled(Notification.permission === 'granted');
    }

    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem('sereno-reminder-settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setReminderTimes(settings.reminderTimes || reminderTimes);
        setNotificationsEnabled(settings.notificationsEnabled || false);
      } catch (error) {
        console.error('Error loading reminder settings:', error);
      }
    }
  }, []);

  const handleEnableNotifications = async () => {
    const granted = await notificationService.requestPermission();
    setPermission(Notification.permission);
    setNotificationsEnabled(granted);
    
    if (granted) {
      // Setup daily reminders
      notificationService.setupDailyReminders();
      saveSettings();
    }
  };

  const handleTimeChange = (id: number, newTime: string) => {
    setReminderTimes(prev => 
      prev.map(reminder => 
        reminder.id === id ? { ...reminder, time: newTime } : reminder
      )
    );
  };

  const handleToggleReminder = (id: number) => {
    setReminderTimes(prev => 
      prev.map(reminder => 
        reminder.id === id ? { ...reminder, enabled: !reminder.enabled } : reminder
      )
    );
  };

  const saveSettings = () => {
    const settings = {
      notificationsEnabled,
      reminderTimes
    };
    localStorage.setItem('sereno-reminder-settings', JSON.stringify(settings));
  };

  const handleSave = () => {
    saveSettings();
    
    // Show confirmation
    if (notificationsEnabled) {
      notificationService.showNotification(
        '✅ Recordatorios configurados',
        {
          body: 'SERENITO te recordará hacer tu seguimiento diario en los horarios seleccionados.',
          tag: 'settings-saved'
        }
      );
    }
    
    onClose?.();
  };

  const testNotification = () => {
    notificationService.showDailyTrackingReminder();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-white rounded-senior p-6 shadow-senior ${className}`}
    >
      <div className="text-center mb-6">
        <SerenitoCharacter
          expression="encouraging"
          size="medium"
          message="¡Configuremos recordatorios suaves para que no olvides cuidar tu bienestar!"
          showMessage={true}
          className="mb-4"
        />
        
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          Recordatorios Diarios
        </h2>
        <p className="text-gray-600">
          SERENITO te enviará recordatorios gentiles para hacer tu seguimiento
        </p>
      </div>

      {/* Notification Permission */}
      <div className="space-y-6">
        <div className="bg-sky-50 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-3">
            <BellIcon className="w-6 h-6 text-primary-600" />
            <h3 className="font-semibold text-gray-800">Notificaciones</h3>
          </div>
          
          {permission === 'denied' && (
            <div className="text-red-600 text-sm mb-3">
              Las notificaciones están bloqueadas. Puedes habilitarlas en la configuración de tu navegador.
            </div>
          )}
          
          {permission === 'default' && (
            <div className="text-orange-600 text-sm mb-3">
              Necesitamos tu permiso para enviarte recordatorios suaves.
            </div>
          )}
          
          {permission === 'granted' && (
            <div className="text-green-600 text-sm mb-3">
              ✅ Las notificaciones están habilitadas
            </div>
          )}

          <div className="flex space-x-3">
            {permission !== 'granted' && (
              <SeniorButton
                variant="primary"
                size="medium"
                onClick={handleEnableNotifications}
              >
                Habilitar Notificaciones
              </SeniorButton>
            )}
            
            {permission === 'granted' && (
              <SeniorButton
                variant="outline"
                size="medium"
                onClick={testNotification}
              >
                Probar Notificación
              </SeniorButton>
            )}
          </div>
        </div>

        {/* Reminder Times */}
        {notificationsEnabled && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <ClockIcon className="w-6 h-6 text-primary-600" />
              <h3 className="font-semibold text-gray-800">Horarios de Recordatorio</h3>
            </div>

            {reminderTimes.map(reminder => (
              <div key={reminder.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={reminder.enabled}
                    onChange={() => handleToggleReminder(reminder.id)}
                    className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span className="font-medium text-gray-700">{reminder.label}</span>
                </div>
                
                <input
                  type="time"
                  value={reminder.time}
                  onChange={(e) => handleTimeChange(reminder.id, e.target.value)}
                  disabled={!reminder.enabled}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
                />
              </div>
            ))}

            <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
              💡 <strong>Tip:</strong> Los recordatorios son suaves y no interrumpirán tus actividades importantes. 
              Puedes desactivarlos temporalmente si lo necesitas.
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3 pt-4">
          <SeniorButton
            variant="primary"
            size="large"
            onClick={handleSave}
            className="flex-1"
          >
            Guardar Configuración
          </SeniorButton>
          
          {onClose && (
            <SeniorButton
              variant="outline"
              size="large"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </SeniorButton>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ReminderSettings;