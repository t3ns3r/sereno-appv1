import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import SeniorButton from '../UI/SeniorButton';

interface PrivacySettings {
  dataProcessingConsent: boolean;
  analyticsConsent: boolean;
  marketingConsent: boolean;
  locationSharingConsent: boolean;
  emergencyLocationConsent: boolean;
  dataRetentionPeriod: number;
  allowDataExport: boolean;
  allowAccountDeletion: boolean;
}

interface ConsentRecord {
  id: string;
  consentType: string;
  granted: boolean;
  timestamp: string;
}

const PrivacySettings: React.FC = () => {
  const { user } = useAuthStore();
  const [settings, setSettings] = useState<PrivacySettings>({
    dataProcessingConsent: true,
    analyticsConsent: false,
    marketingConsent: false,
    locationSharingConsent: false,
    emergencyLocationConsent: true,
    dataRetentionPeriod: 365,
    allowDataExport: true,
    allowAccountDeletion: true
  });
  const [consentHistory, setConsentHistory] = useState<ConsentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteReason, setDeleteReason] = useState('');

  useEffect(() => {
    loadPrivacySettings();
    loadConsentHistory();
  }, []);

  const loadPrivacySettings = async () => {
    try {
      const response = await fetch('/api/v1/data-management/privacy-settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSettings(data.data);
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConsentHistory = async () => {
    try {
      const response = await fetch('/api/v1/data-management/consent-history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setConsentHistory(data.data);
      }
    } catch (error) {
      console.error('Error loading consent history:', error);
    }
  };

  const updateSettings = async (newSettings: Partial<PrivacySettings>) => {
    setSaving(true);
    try {
      const response = await fetch('/api/v1/data-management/privacy-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newSettings)
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.data);
        // Reload consent history to show new records
        loadConsentHistory();
      }
    } catch (error) {
      console.error('Error updating privacy settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: keyof PrivacySettings) => {
    const newValue = !settings[key];
    const updatedSettings = { ...settings, [key]: newValue };
    setSettings(updatedSettings);
    updateSettings({ [key]: newValue });
  };

  const handleRetentionPeriodChange = (period: number) => {
    const updatedSettings = { ...settings, dataRetentionPeriod: period };
    setSettings(updatedSettings);
    updateSettings({ dataRetentionPeriod: period });
  };

  const exportData = async () => {
    try {
      const response = await fetch('/api/v1/data-management/export', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sereno-data-export-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const deleteAccount = async () => {
    if (!deletePassword) {
      alert('Por favor, confirma tu contraseña');
      return;
    }

    try {
      const response = await fetch('/api/v1/data-management/account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          confirmPassword: deletePassword,
          reason: deleteReason
        })
      });

      if (response.ok) {
        alert('Tu cuenta ha sido eliminada exitosamente.');
        // Redirect to login or home page
        window.location.href = '/';
      } else {
        const error = await response.json();
        alert(error.message || 'Error al eliminar la cuenta');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Error al eliminar la cuenta');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card-senior text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando configuración de privacidad...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center animate-gentle-entrance">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Configuración de Privacidad</h1>
        <p className="text-gray-600">Controla cómo se utilizan tus datos personales</p>
      </div>

      {/* SERENITO Guidance */}
      <div className="card-senior text-center animate-gentle-entrance" style={{ animationDelay: '100ms' }}>
        <div className="w-16 h-16 bg-primary-400 rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-white text-xl">🔒</span>
        </div>
        <p className="text-gray-600">
          "Tu privacidad es muy importante. Aquí puedes controlar exactamente cómo usamos tu información."
        </p>
        <p className="text-sm text-gray-500 mt-2">- SERENITO</p>
      </div>

      {/* Data Processing Consent */}
      <div className="card-senior animate-gentle-entrance" style={{ animationDelay: '200ms' }}>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Consentimientos de Datos</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <h3 className="font-medium text-gray-800">Procesamiento de Datos Básicos</h3>
              <p className="text-sm text-gray-600">Necesario para el funcionamiento de la aplicación</p>
            </div>
            <div className="ml-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.dataProcessingConsent}
                  onChange={() => handleToggle('dataProcessingConsent')}
                  className="sr-only peer"
                  disabled={true} // This should always be true for basic functionality
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <h3 className="font-medium text-gray-800">Análisis y Mejoras</h3>
              <p className="text-sm text-gray-600">Ayúdanos a mejorar la aplicación con datos anónimos</p>
            </div>
            <div className="ml-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.analyticsConsent}
                  onChange={() => handleToggle('analyticsConsent')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <h3 className="font-medium text-gray-800">Comunicaciones de Marketing</h3>
              <p className="text-sm text-gray-600">Recibir información sobre nuevas funciones y consejos</p>
            </div>
            <div className="ml-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.marketingConsent}
                  onChange={() => handleToggle('marketingConsent')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Location Settings */}
      <div className="card-senior animate-gentle-entrance" style={{ animationDelay: '300ms' }}>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Configuración de Ubicación</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <h3 className="font-medium text-gray-800">Compartir Ubicación General</h3>
              <p className="text-sm text-gray-600">Para mostrar actividades y SERENOS cercanos</p>
            </div>
            <div className="ml-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.locationSharingConsent}
                  onChange={() => handleToggle('locationSharingConsent')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex-1">
              <h3 className="font-medium text-gray-800">Ubicación en Emergencias</h3>
              <p className="text-sm text-gray-600">Compartir ubicación precisa durante crisis (recomendado)</p>
            </div>
            <div className="ml-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.emergencyLocationConsent}
                  onChange={() => handleToggle('emergencyLocationConsent')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Data Retention */}
      <div className="card-senior animate-gentle-entrance" style={{ animationDelay: '400ms' }}>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Retención de Datos</h2>
        
        <div className="space-y-4">
          <p className="text-gray-600">¿Por cuánto tiempo quieres que guardemos tus datos?</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { days: 90, label: '3 meses' },
              { days: 365, label: '1 año' },
              { days: 1095, label: '3 años' }
            ].map((option) => (
              <button
                key={option.days}
                onClick={() => handleRetentionPeriodChange(option.days)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  settings.dataRetentionPeriod === option.days
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-800">{option.label}</div>
                  <div className="text-sm text-gray-600">{option.days} días</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Data Management Actions */}
      <div className="card-senior animate-gentle-entrance" style={{ animationDelay: '500ms' }}>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Gestión de Datos</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex-1">
              <h3 className="font-medium text-gray-800">Exportar Mis Datos</h3>
              <p className="text-sm text-gray-600">Descarga una copia de toda tu información</p>
            </div>
            <SeniorButton
              onClick={exportData}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={!settings.allowDataExport}
            >
              Exportar
            </SeniorButton>
          </div>

          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex-1">
              <h3 className="font-medium text-gray-800">Eliminar Mi Cuenta</h3>
              <p className="text-sm text-gray-600">Eliminar permanentemente tu cuenta y todos los datos</p>
            </div>
            <SeniorButton
              onClick={() => setShowDeleteConfirm(true)}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={!settings.allowAccountDeletion}
            >
              Eliminar
            </SeniorButton>
          </div>
        </div>
      </div>

      {/* Consent History */}
      {consentHistory.length > 0 && (
        <div className="card-senior animate-gentle-entrance" style={{ animationDelay: '600ms' }}>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Historial de Consentimientos</h2>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {consentHistory.slice(0, 10).map((record) => (
              <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <span className="font-medium text-gray-800">{record.consentType}</span>
                  <span className="text-sm text-gray-600 ml-2">
                    {new Date(record.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <span className={`px-2 py-1 rounded text-sm ${
                  record.granted 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {record.granted ? 'Otorgado' : 'Revocado'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Confirmar Eliminación de Cuenta</h3>
            
            <div className="space-y-4">
              <p className="text-gray-600">
                Esta acción no se puede deshacer. Todos tus datos serán eliminados permanentemente.
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirma tu contraseña
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="input-senior w-full"
                  placeholder="Tu contraseña actual"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Razón (opcional)
                </label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="input-senior w-full h-20 resize-none"
                  placeholder="¿Por qué eliminas tu cuenta?"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <SeniorButton
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-gray-300 text-gray-700 hover:bg-gray-400"
              >
                Cancelar
              </SeniorButton>
              <SeniorButton
                onClick={deleteAccount}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Eliminar Cuenta
              </SeniorButton>
            </div>
          </div>
        </div>
      )}

      {saving && (
        <div className="fixed bottom-4 right-4 bg-primary-600 text-white px-4 py-2 rounded-lg shadow-lg">
          Guardando cambios...
        </div>
      )}
    </div>
  );
};

export default PrivacySettings;