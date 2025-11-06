import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BreathingExercise from '../components/Breathing/BreathingExercise';
import BreathingSettings from '../components/Breathing/BreathingSettings';
import SeniorCard from '../components/UI/SeniorCard';
import SeniorButton from '../components/UI/SeniorButton';
import SerenitoCharacter from '../components/SERENITO/SerenitoCharacter';
import useSerenito from '../hooks/useSerenito';
import { BreathingConfiguration } from '../components/Breathing/BreathingExercise';
import { breathingService } from '../services/breathingService';

const BreathingExercisePage: React.FC = () => {
  const navigate = useNavigate();
  const [isCompleted, setIsCompleted] = useState(false);
  const [completionData, setCompletionData] = useState<{ 
    duration: number; 
    cycles: number; 
    benefits?: string[];
    recommendations?: string[];
  } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<BreathingConfiguration>({
    name: "Relajación Básica",
    inhaleTime: 4,
    holdTime: 6,
    exhaleTime: 5,
    cycles: 8
  });
  
  const { interact } = useSerenito();

  const handleExerciseComplete = async (duration: number, cycles: number) => {
    try {
      // Save breathing exercise to backend
      const result = await breathingService.recordBreathingExercise({
        configuration: currentConfig,
        duration
      });
      
      setCompletionData({ 
        duration, 
        cycles,
        benefits: result.benefits,
        recommendations: result.recommendations 
      });
      setIsCompleted(true);
      
      // SERENITO celebrates completion
      interact('task-complete');
    } catch (error) {
      console.error('Error saving breathing exercise:', error);
      // Show error but still allow completion
      setCompletionData({ duration, cycles });
      setIsCompleted(true);
      interact('custom', 'Completaste el ejercicio, pero hubo un problema al guardarlo. ¡Aún así, excelente trabajo!');
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  const handleNewExercise = () => {
    setIsCompleted(false);
    setCompletionData(null);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleSettingsSave = (config: BreathingConfiguration) => {
    setCurrentConfig(config);
    setShowSettings(false);
    interact('custom', `Perfecto, configuré tu ejercicio "${config.name}". ¡Vamos a respirar juntos!`);
  };

  if (isCompleted && completionData) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8 animate-gentle-entrance">
          <SerenitoCharacter
            expression="celebrating"
            size="xl"
            message="¡Excelente trabajo! Te sientes más relajado ahora."
            showMessage={true}
            className="mb-6"
          />
          
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            ¡Ejercicio completado!
          </h1>
          <p className="text-gray-600">
            Has terminado tu sesión de respiración
          </p>
        </div>

        <SeniorCard 
          title="Resumen de tu sesión"
          variant="gradient"
          className="mb-8 text-center"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4">
                <div className="text-3xl font-bold text-primary-600">
                  {completionData.cycles}
                </div>
                <div className="text-sm text-gray-600">Ciclos completados</div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-3xl font-bold text-secondary-600">
                  {Math.round(completionData.duration / 60)}min
                </div>
                <div className="text-sm text-gray-600">Tiempo total</div>
              </div>
            </div>

            {/* Benefits */}
            {completionData.benefits && completionData.benefits.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-senior p-4">
                <p className="text-green-800 font-medium mb-2">
                  🌱 Beneficios de esta sesión
                </p>
                <div className="text-green-700 text-sm space-y-1">
                  {completionData.benefits.map((benefit, index) => (
                    <p key={index}>• {benefit}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {completionData.recommendations && completionData.recommendations.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-senior p-4">
                <p className="text-blue-800 font-medium mb-2">
                  💡 Recomendaciones personalizadas
                </p>
                <div className="text-blue-700 text-sm space-y-1">
                  {completionData.recommendations.map((recommendation, index) => (
                    <p key={index}>• {recommendation}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </SeniorCard>

        <div className="flex flex-col sm:flex-row gap-4">
          <SeniorButton
            variant="primary"
            fullWidth
            onClick={handleNewExercise}
          >
            Otro Ejercicio
          </SeniorButton>
          
          <SeniorButton
            variant="outline"
            fullWidth
            onClick={handleGoHome}
          >
            Volver al inicio
          </SeniorButton>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-gentle-entrance">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Ejercicios de Respiración
        </h1>
        <p className="text-gray-600">
          Encuentra tu calma interior con SERENITO
        </p>
      </div>

      <BreathingExercise
        onComplete={handleExerciseComplete}
        onCancel={() => setShowSettings(true)}
        initialConfig={currentConfig}
      />

      <BreathingSettings
        currentConfig={currentConfig}
        onSave={handleSettingsSave}
        onCancel={() => setShowSettings(false)}
        isOpen={showSettings}
      />
    </div>
  );
};

export default BreathingExercisePage;