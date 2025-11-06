import React, { useState, useEffect } from 'react';
import SeniorButton from '../UI/SeniorButton';

interface ConsentBannerProps {
  onConsentGiven: (consents: ConsentChoices) => void;
}

interface ConsentChoices {
  dataProcessingConsent: boolean;
  analyticsConsent: boolean;
  marketingConsent: boolean;
  locationSharingConsent: boolean;
  emergencyLocationConsent: boolean;
}

const ConsentBanner: React.FC<ConsentBannerProps> = ({ onConsentGiven }) => {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [consents, setConsents] = useState<ConsentChoices>({
    dataProcessingConsent: true, // Required for basic functionality
    analyticsConsent: false,
    marketingConsent: false,
    locationSharingConsent: false,
    emergencyLocationConsent: true // Recommended for safety
  });

  useEffect(() => {
    // Check if user has already given consent
    const hasGivenConsent = localStorage.getItem('sereno-consent-given');
    if (!hasGivenConsent) {
      setShowBanner(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const allConsents = {
      dataProcessingConsent: true,
      analyticsConsent: true,
      marketingConsent: true,
      locationSharingConsent: true,
      emergencyLocationConsent: true
    };
    
    submitConsents(allConsents);
  };

  const handleAcceptSelected = () => {
    submitConsents(consents);
  };

  const handleRejectOptional = () => {
    const minimalConsents = {
      dataProcessingConsent: true, // Required
      analyticsConsent: false,
      marketingConsent: false,
      locationSharingConsent: false,
      emergencyLocationConsent: true // Recommended for safety
    };
    
    submitConsents(minimalConsents);
  };

  const submitConsents = async (finalConsents: ConsentChoices) => {
    try {
      // Record each consent individually
      const token = localStorage.getItem('token');
      if (token) {
        for (const [consentType, granted] of Object.entries(finalConsents)) {
          await fetch('/api/v1/data-management/consent', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              consentType,
              granted
            })
          });
        }
      }

      // Mark consent as given
      localStorage.setItem('sereno-consent-given', 'true');
      
      // Call parent callback
      onConsentGiven(finalConsents);
      
      // Hide banner
      setShowBanner(false);
    } catch (error) {
      console.error('Error recording consents:', error);
    }
  };

  const toggleConsent = (key: keyof ConsentChoices) => {
    // Don't allow disabling required consents
    if (key === 'dataProcessingConsent') return;
    
    setConsents(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (!showBanner) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-primary-400 rounded-full flex items-center justify-center mr-4">
              <span className="text-white text-xl">🔒</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Tu Privacidad es Importante</h2>
              <p className="text-gray-600">Configuremos cómo usamos tu información</p>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700">
              SERENO respeta tu privacidad y cumple con las regulaciones de protección de datos. 
              Puedes cambiar estas preferencias en cualquier momento desde tu perfil.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {!showDetails ? (
            /* Simple View */
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  ¿Cómo quieres usar SERENO?
                </h3>
                <p className="text-gray-600">
                  Elige el nivel de personalización que prefieres
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 border-2 border-primary-200 rounded-lg bg-primary-50">
                  <h4 className="font-medium text-gray-800 mb-2">✨ Experiencia Completa</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Funcionalidad completa con personalización, análisis para mejoras, 
                    y notificaciones sobre nuevas funciones.
                  </p>
                  <SeniorButton
                    onClick={handleAcceptAll}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white"
                  >
                    Acepto Todo
                  </SeniorButton>
                </div>

                <div className="p-4 border-2 border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">🛡️ Solo lo Esencial</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Funcionalidad básica con mínimo uso de datos. 
                    Incluye ubicación para emergencias por tu seguridad.
                  </p>
                  <SeniorButton
                    onClick={handleRejectOptional}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white"
                  >
                    Solo lo Necesario
                  </SeniorButton>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={() => setShowDetails(true)}
                  className="text-primary-600 hover:text-primary-700 text-sm underline"
                >
                  Ver opciones detalladas
                </button>
              </div>
            </div>
          ) : (
            /* Detailed View */
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  Configuración Detallada
                </h3>
                <p className="text-gray-600">
                  Personaliza exactamente qué datos quieres compartir
                </p>
              </div>

              <div className="space-y-4">
                {/* Required Consents */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-3">Necesario para el funcionamiento</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <span className="font-medium text-gray-800">Procesamiento de datos básicos</span>
                        <p className="text-sm text-gray-600">Cuenta, perfil, y funciones principales</p>
                      </div>
                      <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center">
                        <span className="text-white text-sm">✓</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <span className="font-medium text-gray-800">Ubicación en emergencias</span>
                        <p className="text-sm text-gray-600">Para conectarte con SERENOS cercanos (recomendado)</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={consents.emergencyLocationConsent}
                          onChange={() => toggleConsent('emergencyLocationConsent')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Optional Consents */}
                <div className="bg-white border border-gray-200 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-3">Opcional (puedes cambiar después)</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <span className="font-medium text-gray-800">Análisis y mejoras</span>
                        <p className="text-sm text-gray-600">Datos anónimos para mejorar la app</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={consents.analyticsConsent}
                          onChange={() => toggleConsent('analyticsConsent')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <span className="font-medium text-gray-800">Comunicaciones</span>
                        <p className="text-sm text-gray-600">Consejos y nuevas funciones</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={consents.marketingConsent}
                          onChange={() => toggleConsent('marketingConsent')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <span className="font-medium text-gray-800">Ubicación general</span>
                        <p className="text-sm text-gray-600">Para actividades y SERENOS cercanos</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={consents.locationSharingConsent}
                          onChange={() => toggleConsent('locationSharingConsent')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <SeniorButton
                  onClick={() => setShowDetails(false)}
                  className="flex-1 bg-gray-300 text-gray-700 hover:bg-gray-400"
                >
                  Volver
                </SeniorButton>
                <SeniorButton
                  onClick={handleAcceptSelected}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white"
                >
                  Confirmar Selección
                </SeniorButton>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            Al continuar, aceptas nuestros{' '}
            <a href="/privacy-policy" className="text-primary-600 hover:underline">
              Términos de Privacidad
            </a>{' '}
            y{' '}
            <a href="/terms-of-service" className="text-primary-600 hover:underline">
              Términos de Servicio
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConsentBanner;