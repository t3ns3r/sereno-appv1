import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PhoneIcon, 
  MapPinIcon, 
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/solid';
import Layout from '../components/Layout/Layout';
import SeniorButton from '../components/UI/SeniorButton';
import SerenitoCharacter from '../components/SERENITO/SerenitoCharacter';
import { useAuth } from '../hooks/useAuth';
import { useEmergency } from '../hooks/useEmergency';
import { useGeolocation } from '../hooks/useGeolocation';

interface EmergencyContact {
  id: string;
  name: string;
  phoneNumber: string;
  type: 'crisis_hotline' | 'emergency_services' | 'mental_health_facility';
  available24h: boolean;
  description?: string;
}

const EmergencyPage: React.FC = () => {
  const { user } = useAuth();
  const { 
    activateEmergency, 
    resolveEmergency, 
    getEmergencyContacts,
    isLoading,
    activeAlert,
    emergencyContacts
  } = useEmergency();
  const { location, requestLocation, isLoading: locationLoading } = useGeolocation();
  
  const [step, setStep] = useState<'contacts' | 'activating' | 'active' | 'resolved'>('contacts');
  const [selectedContacts, setSelectedContacts] = useState<EmergencyContact[]>([]);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);

  useEffect(() => {
    if (user?.country) {
      loadEmergencyContacts();
    }
  }, [user?.country]);

  useEffect(() => {
    if (activeAlert) {
      setStep('active');
    }
  }, [activeAlert]);

  const loadEmergencyContacts = async () => {
    if (user?.country) {
      await getEmergencyContacts(user.country);
    }
  };

  const handleActivateEmergency = async () => {
    setStep('activating');
    
    try {
      // Request location if not already available
      if (!location && !locationLoading) {
        setShowLocationPrompt(true);
        await requestLocation();
        setShowLocationPrompt(false);
      }

      await activateEmergency(location);
      setStep('active');
    } catch (error) {
      console.error('Error activating emergency:', error);
      setStep('contacts');
    }
  };

  const handleResolveEmergency = async () => {
    if (activeAlert) {
      await resolveEmergency(activeAlert.id);
      setStep('resolved');
    }
  };

  const handleCallContact = (contact: EmergencyContact) => {
    // Open phone dialer
    window.open(`tel:${contact.phoneNumber}`, '_self');
  };

  const renderEmergencyContacts = () => (
    <div className="space-y-6">
      <div className="text-center">
        <SerenitoCharacter
          expression="concerned"
          size="large"
          message="Aquí tienes los contactos de emergencia disponibles en tu país. También puedo activar el sistema SERENO."
          showMessage={true}
          className="mb-6"
        />
        
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Ayuda de Emergencia
        </h1>
        <p className="text-gray-600 mb-6">
          Contacta servicios de emergencia o activa el sistema SERENO
        </p>
      </div>

      {/* Emergency Contacts */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Contactos de Emergencia
        </h2>
        
        {emergencyContacts.map((contact) => (
          <motion.div
            key={contact.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-senior p-4 shadow-senior border-l-4 border-emergency-400"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 text-lg">
                  {contact.name}
                </h3>
                <p className="text-gray-600 text-base">
                  {contact.description}
                </p>
                <div className="flex items-center mt-2 space-x-4">
                  <span className="text-2xl font-bold text-emergency-500">
                    {contact.phoneNumber}
                  </span>
                  {contact.available24h && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-green-100 text-green-800">
                      <ClockIcon className="w-4 h-4 mr-1" />
                      24/7
                    </span>
                  )}
                </div>
              </div>
              <SeniorButton
                variant="emergency"
                size="large"
                onClick={() => handleCallContact(contact)}
                className="ml-4"
              >
                <PhoneIcon className="w-6 h-6 mr-2" />
                Llamar
              </SeniorButton>
            </div>
          </motion.div>
        ))}
      </div>

      {/* SERENO System Activation */}
      <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-senior p-6 border border-primary-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Sistema SERENO
        </h2>
        <p className="text-gray-600 mb-4">
          Activa el sistema SERENO para conectar con voluntarios especializados en tu área que pueden brindarte apoyo inmediato.
        </p>
        
        <div className="flex items-center space-x-4">
          <SeniorButton
            variant="primary"
            size="large"
            onClick={handleActivateEmergency}
            disabled={isLoading}
            className="flex-1"
          >
            <ExclamationTriangleIcon className="w-6 h-6 mr-2" />
            {isLoading ? 'Activando...' : 'Activar SERENO'}
          </SeniorButton>
          
          {!location && (
            <SeniorButton
              variant="outline"
              size="large"
              onClick={requestLocation}
              disabled={locationLoading}
            >
              <MapPinIcon className="w-6 h-6 mr-2" />
              {locationLoading ? 'Obteniendo...' : 'Compartir Ubicación'}
            </SeniorButton>
          )}
        </div>
        
        {location && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center text-green-800">
              <MapPinIcon className="w-5 h-5 mr-2" />
              <span className="text-sm">
                Ubicación compartida: {location.address || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderActivatingEmergency = () => (
    <div className="text-center space-y-6">
      <SerenitoCharacter
        expression="concerned"
        size="large"
        message="Activando el sistema de emergencia. Los SERENOS cercanos están siendo notificados."
        showMessage={true}
        className="mb-6"
      />
      
      <div className="space-y-4">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emergency-400"></div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800">
          Activando Sistema de Emergencia
        </h1>
        
        <div className="space-y-2 text-gray-600">
          <p>✓ Notificando SERENOS cercanos</p>
          <p>✓ Contactando servicios de emergencia</p>
          <p>✓ Preparando canal de chat</p>
        </div>
      </div>

      {showLocationPrompt && (
        <div className="bg-blue-50 border border-blue-200 rounded-senior p-4">
          <p className="text-blue-800">
            Solicitando tu ubicación para encontrar SERENOS cercanos...
          </p>
        </div>
      )}
    </div>
  );

  const renderActiveEmergency = () => (
    <div className="space-y-6">
      <div className="text-center">
        <SerenitoCharacter
          expression="encouraging"
          size="large"
          message="El sistema está activo. Los SERENOS han sido notificados y la ayuda está en camino."
          showMessage={true}
          className="mb-6"
        />
        
        <h1 className="text-2xl font-bold text-emergency-600 mb-2">
          Sistema de Emergencia Activo
        </h1>
        <p className="text-gray-600">
          Los SERENOS cercanos han sido notificados
        </p>
      </div>

      {/* Status */}
      <div className="bg-emergency-50 border border-emergency-200 rounded-senior p-6">
        <div className="flex items-center justify-center mb-4">
          <div className="animate-pulse">
            <ExclamationTriangleIcon className="w-12 h-12 text-emergency-500" />
          </div>
        </div>
        
        <div className="text-center space-y-2">
          <p className="font-semibold text-emergency-800">
            Emergencia Activa desde {activeAlert?.createdAt ? new Date(activeAlert.createdAt).toLocaleTimeString() : ''}
          </p>
          <p className="text-emergency-700">
            {activeAlert?.respondingSerenos.length || 0} SERENO(s) respondiendo
          </p>
        </div>
      </div>

      {/* Emergency Contacts Still Available */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Contactos de Emergencia Disponibles
        </h2>
        
        {emergencyContacts.slice(0, 2).map((contact) => (
          <div key={contact.id} className="bg-white rounded-senior p-4 shadow-senior">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-800">{contact.name}</h3>
                <p className="text-xl font-bold text-emergency-500">{contact.phoneNumber}</p>
              </div>
              <SeniorButton
                variant="emergency"
                size="medium"
                onClick={() => handleCallContact(contact)}
              >
                <PhoneIcon className="w-5 h-5 mr-1" />
                Llamar
              </SeniorButton>
            </div>
          </div>
        ))}
      </div>

      {/* Resolve Emergency */}
      <div className="text-center">
        <SeniorButton
          variant="secondary"
          size="large"
          onClick={handleResolveEmergency}
          className="w-full"
        >
          <CheckCircleIcon className="w-6 h-6 mr-2" />
          Marcar como Resuelto
        </SeniorButton>
      </div>
    </div>
  );

  const renderResolvedEmergency = () => (
    <div className="text-center space-y-6">
      <SerenitoCharacter
        expression="happy"
        size="large"
        message="Me alegra saber que estás mejor. Recuerda que siempre estoy aquí para apoyarte."
        showMessage={true}
        className="mb-6"
      />
      
      <div className="space-y-4">
        <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto" />
        
        <h1 className="text-2xl font-bold text-green-600">
          Emergencia Resuelta
        </h1>
        
        <p className="text-gray-600">
          Nos alegra saber que estás mejor. Los SERENOS han sido notificados.
        </p>
      </div>

      <div className="space-y-3">
        <SeniorButton
          variant="primary"
          size="large"
          onClick={() => setStep('contacts')}
          className="w-full"
        >
          Volver a Contactos
        </SeniorButton>
        
        <SeniorButton
          variant="outline"
          size="large"
          onClick={() => window.history.back()}
          className="w-full"
        >
          Volver al Inicio
        </SeniorButton>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {step === 'contacts' && renderEmergencyContacts()}
            {step === 'activating' && renderActivatingEmergency()}
            {step === 'active' && renderActiveEmergency()}
            {step === 'resolved' && renderResolvedEmergency()}
          </motion.div>
        </AnimatePresence>
      </div>
    </Layout>
  );
};

export default EmergencyPage;