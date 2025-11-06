import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MoodAssessment, { MoodAssessmentData } from '../components/Mood/MoodAssessment';
import SeniorCard from '../components/UI/SeniorCard';
import SeniorButton from '../components/UI/SeniorButton';
import SerenitoCharacter from '../components/SERENITO/SerenitoCharacter';
import useSerenito from '../hooks/useSerenito';
import { moodService } from '../services/moodService';

const MoodAssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [isCompleted, setIsCompleted] = useState(false);
  const [assessmentData, setAssessmentData] = useState<MoodAssessmentData | null>(null);
  const { interact } = useSerenito();

  const handleAssessmentComplete = async (data: MoodAssessmentData) => {
    try {
      // Upload voice recording if present
      let voiceRecordingUrl: string | undefined;
      if (data.voiceRecording) {
        try {
          voiceRecordingUrl = await moodService.uploadVoiceRecording(data.voiceRecording);
        } catch (voiceError) {
          console.warn('Voice upload failed, continuing without voice data:', voiceError);
        }
      }

      // Submit mood assessment to backend
      const result = await moodService.submitMoodAssessment({
        selectedEmotion: data.selectedEmotion,
        textDescription: data.textDescription,
        voiceRecordingUrl
      });
      
      setAssessmentData({
        ...data,
        timestamp: new Date(result.createdAt)
      });
      setIsCompleted(true);
      
      // SERENITO celebrates completion
      interact('task-complete');
    } catch (error) {
      console.error('Error saving mood assessment:', error);
      // Show error to user
      interact('custom', 'Hubo un problema al guardar tu evaluación. Por favor, inténtalo de nuevo.');
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  const handleNewAssessment = () => {
    setIsCompleted(false);
    setAssessmentData(null);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  if (isCompleted && assessmentData) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8 animate-gentle-entrance">
          <SerenitoCharacter
            expression="celebrating"
            size="xl"
            message="¡Excelente! Has completado tu evaluación de ánimo."
            showMessage={true}
            className="mb-6"
          />
          
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            ¡Evaluación completada!
          </h1>
          <p className="text-gray-600">
            Gracias por compartir cómo te sientes
          </p>
        </div>

        <SeniorCard 
          title="Tu evaluación ha sido guardada"
          variant="gradient"
          className="mb-8 text-center"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-4">
              <span className="text-4xl">{assessmentData.selectedEmotion.emoji}</span>
              <div className="text-left">
                <p className="text-lg font-semibold text-gray-800">
                  {assessmentData.selectedEmotion.label}
                </p>
                <p className="text-sm text-gray-600">
                  Evaluación guardada a las {assessmentData.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>

            {assessmentData.selectedEmotion.intensity <= 2 && (
              <div className="bg-blue-50 border border-blue-200 rounded-senior p-4">
                <p className="text-blue-800 font-medium mb-2">
                  💙 Notamos que no te sientes muy bien
                </p>
                <p className="text-blue-700 text-sm">
                  Recuerda que es normal tener días difíciles. Considera probar algunos ejercicios de respiración 
                  o contactar con un SERENO si necesitas apoyo adicional.
                </p>
              </div>
            )}

            {assessmentData.selectedEmotion.intensity >= 4 && (
              <div className="bg-green-50 border border-green-200 rounded-senior p-4">
                <p className="text-green-800 font-medium mb-2">
                  💚 ¡Qué bueno que te sientes bien!
                </p>
                <p className="text-green-700 text-sm">
                  Es genial ver que tienes un buen día. Mantén esa energía positiva y 
                  considera compartir tu bienestar con la comunidad.
                </p>
              </div>
            )}
          </div>
        </SeniorCard>

        <div className="flex flex-col sm:flex-row gap-4">
          <SeniorButton
            variant="primary"
            fullWidth
            onClick={handleGoHome}
          >
            Volver al inicio
          </SeniorButton>
          
          <SeniorButton
            variant="outline"
            fullWidth
            onClick={handleNewAssessment}
          >
            Nueva evaluación
          </SeniorButton>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-gentle-entrance">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Evaluación de Estado de Ánimo
        </h1>
        <p className="text-gray-600">
          Comparte cómo te sientes hoy
        </p>
      </div>

      <MoodAssessment
        onComplete={handleAssessmentComplete}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default MoodAssessmentPage;