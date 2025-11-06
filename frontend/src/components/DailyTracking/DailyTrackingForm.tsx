import React, { useState, useEffect } from 'react';
import { EMOTIONAL_STATES, CONFIDENCE_LEVELS, getEmotionById } from '../../constants/emotions';
import { dailyTrackingService, CreateTrackingEntryData, DailyTrackingEntry } from '../../services/dailyTrackingService';
import SeniorButton from '../UI/SeniorButton';
import SerenitoCharacter from '../SERENITO/SerenitoCharacter';
import useSerenito from '../../hooks/useSerenito';

interface DailyTrackingFormProps {
  existingEntry?: DailyTrackingEntry | null;
  onEntrySubmitted: (entry: DailyTrackingEntry) => void;
}

const DailyTrackingForm: React.FC<DailyTrackingFormProps> = ({ existingEntry, onEntrySubmitted }) => {
  const [selectedEmotion, setSelectedEmotion] = useState<string>(existingEntry?.emotionalState?.primary || '');
  const [confidenceLevel, setConfidenceLevel] = useState<number>(existingEntry?.confidenceLevel || 5);
  const [emotionIntensity, setEmotionIntensity] = useState<number>(existingEntry?.emotionalState?.intensity || 5);
  const [notes, setNotes] = useState<string>(existingEntry?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'emotion' | 'confidence' | 'notes' | 'review'>(
    existingEntry ? 'review' : 'emotion'
  );

  const { interact, message, expression } = useSerenito();

  useEffect(() => {
    if (step === 'emotion' && !existingEntry) {
      interact('custom', '¡Hola! Vamos a registrar cómo te sientes hoy. Primero, selecciona la emoción que mejor describe tu estado actual.');
    } else if (step === 'confidence') {
      interact('custom', 'Perfecto. Ahora, ¿qué tan confiado te sientes hoy en una escala del 1 al 10?');
    } else if (step === 'notes') {
      interact('custom', '¡Excelente! Si quieres, puedes agregar algunas notas sobre tu día. Es opcional, pero puede ayudarte a reflexionar.');
    } else if (step === 'review') {
      interact('custom', existingEntry ? 'Aquí está tu registro de hoy. Puedes modificar cualquier campo si lo deseas.' : '¡Perfecto! Revisa tu registro antes de guardarlo.');
    }
  }, [step, existingEntry, interact]);

  const handleEmotionSelect = (emotionId: string) => {
    setSelectedEmotion(emotionId);
    if (!existingEntry) {
      setTimeout(() => setStep('confidence'), 500);
    }
  };

  const handleConfidenceSelect = (level: number) => {
    setConfidenceLevel(level);
    if (!existingEntry) {
      setTimeout(() => setStep('notes'), 500);
    }
  };

  const handleSubmit = async () => {
    if (!selectedEmotion) return;

    setIsSubmitting(true);
    try {
      const entryData: CreateTrackingEntryData = {
        confidenceLevel,
        emotionalState: {
          primary: selectedEmotion,
          intensity: emotionIntensity
        },
        notes: notes.trim() || undefined
      };

      const savedEntry = await dailyTrackingService.createEntry(entryData);
      
      interact('task-complete');
      
      onEntrySubmitted(savedEntry);
    } catch (error) {
      console.error('Error saving tracking entry:', error);
      interact('custom', 'Hubo un problema al guardar tu registro. Por favor, inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedEmotionData = selectedEmotion ? getEmotionById(selectedEmotion) : null;
  const confidenceLevelData = CONFIDENCE_LEVELS.find(cl => cl.value === confidenceLevel);

  if (step === 'emotion') {
    return (
      <div className="space-y-6">
        <SerenitoCharacter 
          message={serenitoMessage}
          expression={serenitoExpression}
          animation="gentle-nod"
        />
        
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">¿Cómo te sientes hoy?</h2>
          <p className="text-gray-600 mb-6">Selecciona la emoción que mejor describe tu estado actual</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {EMOTIONAL_STATES.map((emotion) => (
            <button
              key={emotion.id}
              onClick={() => handleEmotionSelect(emotion.id)}
              className={`
                p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105
                ${selectedEmotion === emotion.id 
                  ? 'border-primary-500 bg-primary-50 shadow-lg' 
                  : 'border-gray-200 bg-white hover:border-primary-300'
                }
              `}
            >
              <div className="text-4xl mb-2">{emotion.emoji}</div>
              <div className="text-sm font-semibold text-gray-800">{emotion.name}</div>
              <div className="text-xs text-gray-600 mt-1">{emotion.description}</div>
            </button>
          ))}
        </div>

        {selectedEmotion && (
          <div className="text-center">
            <SeniorButton
              onClick={() => setStep('confidence')}
              variant="primary"
              size="large"
            >
              Continuar
            </SeniorButton>
          </div>
        )}
      </div>
    );
  }

  if (step === 'confidence') {
    return (
      <div className="space-y-6">
        <SerenitoCharacter 
          message={serenitoMessage}
          expression={serenitoExpression}
          animation="thumbs-up"
        />
        
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Nivel de Confianza</h2>
          <p className="text-gray-600 mb-6">¿Qué tan confiado te sientes hoy? (1 = Muy baja, 10 = Perfecta)</p>
        </div>

        <div className="space-y-4">
          <div className="flex justify-center mb-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold ${confidenceLevelData?.color}`}>
              {confidenceLevel}
            </div>
          </div>
          
          <div className="text-center mb-6">
            <span className="text-lg font-semibold text-gray-800">{confidenceLevelData?.label}</span>
          </div>

          <input
            type="range"
            min="1"
            max="10"
            value={confidenceLevel}
            onChange={(e) => setConfidenceLevel(parseInt(e.target.value))}
            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          
          <div className="flex justify-between text-sm text-gray-600">
            <span>1 - Muy Baja</span>
            <span>10 - Perfecta</span>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <SeniorButton
            onClick={() => setStep('emotion')}
            variant="secondary"
          >
            Atrás
          </SeniorButton>
          <SeniorButton
            onClick={() => setStep('notes')}
            variant="primary"
            size="large"
          >
            Continuar
          </SeniorButton>
        </div>
      </div>
    );
  }

  if (step === 'notes') {
    return (
      <div className="space-y-6">
        <SerenitoCharacter 
          message={serenitoMessage}
          expression={serenitoExpression}
          animation="gentle-nod"
        />
        
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Notas del Día</h2>
          <p className="text-gray-600 mb-6">Comparte algo sobre tu día (opcional)</p>
        </div>

        <div className="space-y-4">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="¿Qué pasó hoy? ¿Cómo te sentiste? ¿Hay algo especial que quieras recordar?"
            className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none resize-none"
            rows={4}
            maxLength={500}
          />
          <div className="text-right text-sm text-gray-500">
            {notes.length}/500 caracteres
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <SeniorButton
            onClick={() => setStep('confidence')}
            variant="secondary"
          >
            Atrás
          </SeniorButton>
          <SeniorButton
            onClick={() => setStep('review')}
            variant="primary"
            size="large"
          >
            Revisar
          </SeniorButton>
        </div>
      </div>
    );
  }

  // Review step
  return (
    <div className="space-y-6">
      <SerenitoCharacter 
        message={serenitoMessage}
        expression={serenitoExpression}
        animation="celebrating"
      />
      
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Resumen del Día</h2>
        <p className="text-gray-600 mb-6">Revisa tu registro antes de guardarlo</p>
      </div>

      <div className="card-senior space-y-6">
        {/* Emotion Summary */}
        <div className="flex items-center space-x-4">
          <div className="text-4xl">{selectedEmotionData?.emoji}</div>
          <div>
            <div className="font-semibold text-gray-800">{selectedEmotionData?.name}</div>
            <div className="text-sm text-gray-600">{selectedEmotionData?.description}</div>
          </div>
          <button
            onClick={() => setStep('emotion')}
            className="ml-auto text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            Cambiar
          </button>
        </div>

        {/* Confidence Summary */}
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${confidenceLevelData?.color}`}>
            {confidenceLevel}
          </div>
          <div>
            <div className="font-semibold text-gray-800">Confianza: {confidenceLevelData?.label}</div>
            <div className="text-sm text-gray-600">Nivel {confidenceLevel} de 10</div>
          </div>
          <button
            onClick={() => setStep('confidence')}
            className="ml-auto text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            Cambiar
          </button>
        </div>

        {/* Notes Summary */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-gray-800">Notas del día</div>
            <button
              onClick={() => setStep('notes')}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              {notes ? 'Editar' : 'Agregar'}
            </button>
          </div>
          {notes ? (
            <div className="text-gray-600 bg-gray-50 p-3 rounded-lg">
              {notes}
            </div>
          ) : (
            <div className="text-gray-400 italic">Sin notas</div>
          )}
        </div>
      </div>

      <div className="flex gap-4 justify-center">
        <SeniorButton
          onClick={() => setStep('notes')}
          variant="secondary"
        >
          Atrás
        </SeniorButton>
        <SeniorButton
          onClick={handleSubmit}
          variant="primary"
          size="large"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Guardando...' : existingEntry ? 'Actualizar Registro' : 'Guardar Registro'}
        </SeniorButton>
      </div>
    </div>
  );
};

export default DailyTrackingForm;