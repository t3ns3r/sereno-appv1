import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Cog6ToothIcon, 
  CheckIcon, 
  XMarkIcon,
  InformationCircleIcon 
} from '@heroicons/react/24/outline';
import SeniorButton from '../UI/SeniorButton';
import SeniorCard from '../UI/SeniorCard';
import { BreathingConfiguration } from './BreathingExercise';

interface BreathingSettingsProps {
  currentConfig: BreathingConfiguration;
  onSave: (config: BreathingConfiguration) => void;
  onCancel: () => void;
  isOpen: boolean;
}

const BreathingSettings: React.FC<BreathingSettingsProps> = ({
  currentConfig,
  onSave,
  onCancel,
  isOpen
}) => {
  const [config, setConfig] = useState<BreathingConfiguration>(currentConfig);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateConfig = (cfg: BreathingConfiguration): { [key: string]: string } => {
    const newErrors: { [key: string]: string } = {};

    if (cfg.inhaleTime < 1 || cfg.inhaleTime > 15) {
      newErrors.inhaleTime = 'Debe estar entre 1 y 15 segundos';
    }
    if (cfg.holdTime < 0 || cfg.holdTime > 20) {
      newErrors.holdTime = 'Debe estar entre 0 y 20 segundos';
    }
    if (cfg.exhaleTime < 1 || cfg.exhaleTime > 20) {
      newErrors.exhaleTime = 'Debe estar entre 1 y 20 segundos';
    }
    if (cfg.cycles < 1 || cfg.cycles > 20) {
      newErrors.cycles = 'Debe estar entre 1 y 20 ciclos';
    }
    if (!cfg.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    return newErrors;
  };

  const handleSave = () => {
    const validationErrors = validateConfig(config);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      onSave(config);
    }
  };

  const handleInputChange = (field: keyof BreathingConfiguration, value: string | number) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const calculateDuration = () => {
    return (config.inhaleTime + config.holdTime + config.exhaleTime) * config.cycles;
  };

  const presetConfigurations = [
    {
      name: "Relajación para Principiantes",
      inhaleTime: 3,
      holdTime: 3,
      exhaleTime: 3,
      cycles: 5
    },
    {
      name: "Técnica 4-7-8 (Anti-ansiedad)",
      inhaleTime: 4,
      holdTime: 7,
      exhaleTime: 8,
      cycles: 8
    },
    {
      name: "Respiración Cuadrada",
      inhaleTime: 4,
      holdTime: 4,
      exhaleTime: 4,
      cycles: 10
    },
    {
      name: "Respiración Energizante",
      inhaleTime: 6,
      holdTime: 2,
      exhaleTime: 4,
      cycles: 12
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-senior p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Cog6ToothIcon className="w-8 h-8 text-primary-500" />
            <h2 className="text-2xl font-bold text-gray-800">
              Configuración de Respiración
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Preset Configurations */}
          <SeniorCard title="Configuraciones Predefinidas" variant="outlined">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {presetConfigurations.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => setConfig(preset)}
                  className="p-3 text-left border-2 border-gray-300 rounded-senior hover:border-primary-300 transition-colors"
                >
                  <h4 className="font-semibold text-gray-800 text-sm mb-1">
                    {preset.name}
                  </h4>
                  <p className="text-xs text-gray-600">
                    {preset.inhaleTime}-{preset.holdTime}-{preset.exhaleTime} • {preset.cycles} ciclos
                  </p>
                </button>
              ))}
            </div>
          </SeniorCard>

          {/* Custom Configuration */}
          <SeniorCard title="Configuración Personalizada" variant="gradient">
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del ejercicio
                </label>
                <input
                  type="text"
                  value={config.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`input-senior w-full ${errors.name ? 'border-red-500' : ''}`}
                  placeholder="Mi ejercicio personalizado"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              {/* Timing Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Inhale Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Inhalar (segundos)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={config.inhaleTime}
                    onChange={(e) => handleInputChange('inhaleTime', parseInt(e.target.value) || 1)}
                    className={`input-senior w-full ${errors.inhaleTime ? 'border-red-500' : ''}`}
                  />
                  {errors.inhaleTime && (
                    <p className="text-red-500 text-xs mt-1">{errors.inhaleTime}</p>
                  )}
                </div>

                {/* Hold Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mantener (segundos)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={config.holdTime}
                    onChange={(e) => handleInputChange('holdTime', parseInt(e.target.value) || 0)}
                    className={`input-senior w-full ${errors.holdTime ? 'border-red-500' : ''}`}
                  />
                  {errors.holdTime && (
                    <p className="text-red-500 text-xs mt-1">{errors.holdTime}</p>
                  )}
                </div>

                {/* Exhale Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Exhalar (segundos)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={config.exhaleTime}
                    onChange={(e) => handleInputChange('exhaleTime', parseInt(e.target.value) || 1)}
                    className={`input-senior w-full ${errors.exhaleTime ? 'border-red-500' : ''}`}
                  />
                  {errors.exhaleTime && (
                    <p className="text-red-500 text-xs mt-1">{errors.exhaleTime}</p>
                  )}
                </div>
              </div>

              {/* Cycles */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de ciclos
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={config.cycles}
                  onChange={(e) => handleInputChange('cycles', parseInt(e.target.value) || 1)}
                  className={`input-senior w-full ${errors.cycles ? 'border-red-500' : ''}`}
                />
                {errors.cycles && (
                  <p className="text-red-500 text-sm mt-1">{errors.cycles}</p>
                )}
              </div>

              {/* Duration Preview */}
              <div className="bg-primary-50 border border-primary-200 rounded-senior p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <InformationCircleIcon className="w-5 h-5 text-primary-600" />
                  <span className="font-medium text-primary-800">Vista previa</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Patrón:</span>
                    <span className="ml-2 font-mono text-primary-700">
                      {config.inhaleTime}-{config.holdTime}-{config.exhaleTime}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Duración total:</span>
                    <span className="ml-2 font-semibold text-primary-700">
                      ~{Math.round(calculateDuration() / 60)} minutos
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </SeniorCard>

          {/* Breathing Tips */}
          <SeniorCard title="Consejos para una mejor respiración" variant="outlined">
            <div className="space-y-2 text-sm text-gray-600">
              <p>• <strong>Principiantes:</strong> Comienza con tiempos cortos (3-4 segundos)</p>
              <p>• <strong>Ansiedad:</strong> Exhala más tiempo del que inhalas (4-7-8)</p>
              <p>• <strong>Relajación:</strong> Mantén la respiración por unos segundos</p>
              <p>• <strong>Energía:</strong> Inhala más tiempo y exhala rápido</p>
              <p>• <strong>Importante:</strong> Nunca fuerces la respiración, debe ser cómoda</p>
            </div>
          </SeniorCard>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <SeniorButton
              variant="primary"
              fullWidth
              onClick={handleSave}
              icon={<CheckIcon className="w-6 h-6" />}
            >
              Guardar Configuración
            </SeniorButton>
            
            <SeniorButton
              variant="outline"
              fullWidth
              onClick={onCancel}
              icon={<XMarkIcon className="w-6 h-6" />}
            >
              Cancelar
            </SeniorButton>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BreathingSettings;