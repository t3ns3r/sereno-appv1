import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import SeniorButton from '../UI/SeniorButton';
import SerenitoCharacter from '../SERENITO/SerenitoCharacter';
import { useEmergency } from '../../hooks/useEmergency';
import { useGeolocation } from '../../hooks/useGeolocation';

const EmergencyButton: React.FC = () => {
  const navigate = useNavigate();
  const { activateEmergency, isLoading: emergencyLoading } = useEmergency();
  const { requestLocation, location, isLoading: locationLoading } = useGeolocation();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  const handleEmergencyClick = () => {
    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    setIsActivating(true);
    
    try {
      // Request location if not available
      let currentLocation = location;
      if (!currentLocation) {
        currentLocation = await requestLocation();
      }

      // Activate emergency system
      await activateEmergency(currentLocation || undefined);
      
      setShowConfirmation(false);
      setIsActivating(false);
      navigate('/emergency');
    } catch (error) {
      console.error('Error activating emergency:', error);
      setIsActivating(false);
      // Still navigate to emergency page to show contacts
      navigate('/emergency');
    }
  };

  const handleCancel = () => {
    setShowConfirmation(false);
  };

  return (
    <>
      {/* Emergency Button - Always visible */}
      <motion.button
        onClick={handleEmergencyClick}
        className="
          fixed top-4 right-4 z-50
          w-20 h-20
          bg-emergency-400 hover:bg-emergency-500
          text-white
          rounded-full
          shadow-senior hover:shadow-senior-hover
          flex items-center justify-center
          transition-all duration-300 ease-in-out
          focus:outline-none focus:ring-4 focus:ring-emergency-200
        "
        title="Botón de Pánico - Presiona para obtener ayuda inmediata"
        aria-label="Botón de emergencia"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          boxShadow: [
            "0 4px 8px rgba(255, 107, 107, 0.3)",
            "0 6px 12px rgba(255, 107, 107, 0.5)",
            "0 4px 8px rgba(255, 107, 107, 0.3)"
          ]
        }}
        transition={{
          boxShadow: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }}
      >
        <ExclamationTriangleIcon className="w-10 h-10" />
      </motion.button>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-senior p-6 max-w-sm w-full mx-4"
            >
              <div className="text-center">
                {/* SERENITO showing concern */}
                <SerenitoCharacter
                  expression="concerned"
                  size="large"
                  message={isActivating ? "Activando ayuda de emergencia..." : "Entiendo que necesitas ayuda. ¿Estás seguro?"}
                  showMessage={true}
                  className="mb-6"
                />

                <ExclamationTriangleIcon className="w-16 h-16 text-emergency-400 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  ¿Necesitas ayuda inmediata?
                </h2>
                <p className="text-gray-600 mb-6">
                  Esto activará el sistema de emergencia y notificará a los SERENOS cercanos.
                </p>
                
                {isActivating || emergencyLoading || locationLoading ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emergency-400"></div>
                    </div>
                    <p className="text-gray-600">
                      {locationLoading ? 'Obteniendo ubicación...' : 'Activando sistema de emergencia...'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <SeniorButton
                      variant="emergency"
                      size="large"
                      fullWidth
                      onClick={handleConfirm}
                    >
                      Sí, necesito ayuda
                    </SeniorButton>
                    <SeniorButton
                      variant="outline"
                      size="large"
                      fullWidth
                      onClick={handleCancel}
                    >
                      Cancelar
                    </SeniorButton>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default EmergencyButton;