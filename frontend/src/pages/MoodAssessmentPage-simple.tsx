import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SerenitoCharacter from '../components/SERENITO/SerenitoCharacter';
import useSerenito from '../hooks/useSerenito';
import SeniorButton from '../components/UI/SeniorButton';

interface Emotion {
  id: string;
  label: string;
  emoji: string;
  intensity: number;
  color: string;
}

const emotions: Emotion[] = [
  { id: 'very-happy', label: 'Muy Feliz', emoji: '😄', intensity: 5, color: 'bg-green-500' },
  { id: 'happy', label: 'Feliz', emoji: '😊', intensity: 4, color: 'bg-green-400' },
  { id: 'neutral', label: 'Normal', emoji: '😐', intensity: 3, color: 'bg-yellow-400' },
  { id: 'sad', label: 'Triste', emoji: '😢', intensity: 2, color: 'bg-orange-400' },
  { id: 'very-sad', label: 'Muy Triste', emoji: '😭', intensity: 1, color: 'bg-red-400' },
];

const MoodAssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedEmotion, setSelectedEmotion] = useState<Emotion | null>(null);
  const [textDescription, setTextDescription] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const { interact, expression, message, showMessage } = useSerenito();

  const handleEmotionSelect = (emotion: Emotion) => {
    setSelectedEmotion(emotion);
    
    // SERENITO reacts to the emotion
    if (emotion.intensity <= 2) {
      interact('show-concern');
    } else if (emotion.intensity >= 4) {
      interact('encourage');
    } else {
      interact('custom', 'Entiendo cómo te sientes. Cuéntame más si quieres.');
    }
  };

  const handleSubmit = () => {
    if (!selectedEmotion) return;
    
    // Simulate saving the assessment
    setIsCompleted(true);
    interact('task-complete');
  };

  const handleNewAssessment = () => {
    setIsCompleted(false);
    setSelectedEmotion(null);
    setTextDescription('');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  if (isCompleted && selectedEmotion) {
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

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 text-center">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <span className="text-6xl">{selectedEmotion.emoji}</span>
            <div className="text-left">
              <p className="text-2xl font-semibold text-gray-800">
                {selectedEmotion.label}
              </p>
              <p className="text-sm text-gray-600">
                Evaluación guardada a las {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>

          {textDescription && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-gray-700 italic">"{textDescription}"</p>
            </div>
          )}

          {selectedEmotion.intensity <= 2 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
              <p className="text-blue-800 font-medium mb-2">
                💙 Notamos que no te sientes muy bien
              </p>
              <p className="text-blue-700 text-sm">
                Recuerda que es normal tener días difíciles. Considera probar algunos ejercicios de respiración 
                o contactar con un SERENO si necesitas apoyo adicional.
              </p>
            </div>
          )}

          {selectedEmotion.intensity >= 4 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
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
    <div className="max-w-2xl mx-auto animate-gentle-entrance">
      <div className="text-center mb-8">
        <SerenitoCharacter
          expression={expression}
          size="lg"
          message={message}
          showMessage={showMessage}
          className="mb-6"
        />
        
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          🧠 Evaluación de Estado de Ánimo
        </h1>
        <p className="text-lg text-gray-600">
          ¿Cómo te sientes en este momento?
        </p>
      </div>

      {/* Emotion Selection */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
          Selecciona tu estado de ánimo:
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {emotions.map((emotion) => (
            <button
              key={emotion.id}
              onClick={() => handleEmotionSelect(emotion)}
              className={`
                p-6 rounded-xl border-2 transition-all duration-300 text-center
                ${selectedEmotion?.id === emotion.id 
                  ? 'border-blue-500 bg-blue-50 shadow-lg' 
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }
              `}
            >
              <div className="text-4xl mb-2">{emotion.emoji}</div>
              <div className="font-semibold text-gray-800">{emotion.label}</div>
            </button>
          ))}
        </div>

        {/* Text Description */}
        {selectedEmotion && (
          <div className="mb-6">
            <label className="block text-lg font-medium text-gray-700 mb-3">
              ¿Quieres contarme más sobre cómo te sientes? (opcional)
            </label>
            <textarea
              value={textDescription}
              onChange={(e) => setTextDescription(e.target.value)}
              placeholder="Describe cómo te sientes hoy, qué ha pasado, o cualquier cosa que quieras compartir..."
              className="w-full p-4 border border-gray-300 rounded-xl text-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <SeniorButton
            variant="outline"
            fullWidth
            onClick={() => navigate('/')}
          >
            Cancelar
          </SeniorButton>
          
          <SeniorButton
            variant="primary"
            fullWidth
            onClick={handleSubmit}
            disabled={!selectedEmotion}
          >
            Guardar Evaluación
          </SeniorButton>
        </div>
      </div>
    </div>
  );
};

export default MoodAssessmentPage;