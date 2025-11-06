import React, { useState, useEffect } from 'react';
import { fakeCallService } from '../../services/fakeCallService';
import { useTranslation } from '../../i18n';

export const FakeCallSettings: React.FC = () => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState(fakeCallService.getSettings());
  const [nextCall, setNextCall] = useState<Date | null>(null);

  useEffect(() => {
    setNextCall(fakeCallService.getNextScheduledCall());
  }, [settings]);

  const handleToggleEnabled = () => {
    const newSettings = { ...settings, enabled: !settings.enabled };
    setSettings(newSettings);
    fakeCallService.updateSettings(newSettings);
  };

  const handleFrequencyChange = (frequency: 'daily' | 'weekly' | 'random') => {
    const newSettings = { ...settings, frequency };
    setSettings(newSettings);
    fakeCallService.updateSettings(newSettings);
  };

  const handleTimeRangeChange = (field: 'start' | 'end', value: string) => {
    const newSettings = {
      ...settings,
      timeRange: {
        ...settings.timeRange,
        [field]: value
      }
    };
    setSettings(newSettings);
    fakeCallService.updateSettings(newSettings);
  };

  const handleTestCall = () => {
    fakeCallService.triggerManualCall();
  };

  const formatNextCall = (date: Date | null) => {
    if (!date) return 'No programada';
    
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `En ${diffDays} día${diffDays > 1 ? 's' : ''} a las ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffHours > 0) {
      return `En ${diffHours} hora${diffHours > 1 ? 's' : ''} a las ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return `Hoy a las ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Configuración de Llamadas
        </h2>
        <div className="text-2xl">📞</div>
      </div>

      {/* Enable/Disable Toggle */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Llamadas de Bienestar
            </h3>
            <p className="text-sm text-gray-600">
              Recibe llamadas sorpresa de SERENITO para recordarte cuidar tu bienestar
            </p>
          </div>
          <button
            onClick={handleToggleEnabled}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.enabled ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {settings.enabled && (
        <>
          {/* Frequency Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Frecuencia de Llamadas
            </h3>
            <div className="space-y-2">
              {[
                { value: 'daily', label: 'Diario', description: 'Una llamada cada día' },
                { value: 'weekly', label: 'Semanal', description: 'Una llamada por semana' },
                { value: 'random', label: 'Aleatorio', description: 'Llamadas sorpresa cada 1-3 días' }
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="radio"
                    name="frequency"
                    value={option.value}
                    checked={settings.frequency === option.value}
                    onChange={() => handleFrequencyChange(option.value as any)}
                    className="mr-3 text-blue-600"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-600">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Time Range */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Horario de Llamadas
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Desde
                </label>
                <input
                  type="time"
                  value={settings.timeRange.start}
                  onChange={(e) => handleTimeRangeChange('start', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hasta
                </label>
                <input
                  type="time"
                  value={settings.timeRange.end}
                  onChange={(e) => handleTimeRangeChange('end', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Next Call Info */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-1">
              Próxima Llamada
            </h3>
            <p className="text-sm text-blue-700">
              {formatNextCall(nextCall)}
            </p>
          </div>

          {/* Test Call Button */}
          <button
            onClick={handleTestCall}
            className="w-full py-3 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
          >
            🧪 Probar Llamada Ahora
          </button>
        </>
      )}

      {!settings.enabled && (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">😴</div>
          <p className="text-gray-600">
            Las llamadas de bienestar están desactivadas
          </p>
        </div>
      )}
    </div>
  );
};