import React from 'react';
import { diaryEmotions, DiaryEmotion } from '../../data/diaryEmotions';
import SerenitoCharacter from '../SERENITO/SerenitoCharacter';

interface EmotionSelectorProps {
  selectedEmotion: string | null;
  onEmotionSelect: (emotionId: string) => void;
  onNext: () => void;
  onCancel: () => void;
}

const EmotionSelector: React.FC<EmotionSelectorProps> = ({
  selectedEmotion,
  onEmotionSelect,
  onNext,
  onCancel
}) => {
  const selectedEmotionData = selectedEmotion 
    ? diaryEmotions.find(e => e.id === selectedEmotion)
    : null;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-lg">
      {/* Header */}
      <div className="text-center mb-8">
        <SerenitoCharacter
          expression={selectedEmotionData?.serenitoExpression || 'encouraging'}
          size="lg"
          message={
            selectedEmotionData 
              ? `Veo que te sientes ${selectedEmotionData.label.toLowerCase()}. ${selectedEmotionData.description}`
              : "¿Cómo te sientes hoy? Selecciona la emoción que mejor describe tu estado actual."
          }
          showMessage={true}
          className="mb-6"
        />
        
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          ¿Cómo te sientes?
        </h2>
        <p className="text-gray-600">
          Selecciona la emoción que mejor describe tu estado actual
        </p>
      </div>

      {/* Emotion Grid */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-8">
        {diaryEmotions.map((emotion) => (
          <button
            key={emotion.id}
            onClick={() => onEmotionSelect(emotion.id)}
            className={`
              p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105
              ${selectedEmotion === emotion.id
                ? 'border-primary-500 bg-primary-50 shadow-lg'
                : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
              }
            `}
          >
            <div className="text-center">
              <div className="text-4xl mb-2">{emotion.emoji}</div>
              <div className={`text-sm font-medium ${emotion.color}`}>
                {emotion.label}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Selected Emotion Details */}
      {selectedEmotionData && (
        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="text-5xl">{selectedEmotionData.emoji}</div>
            <div>
              <h3 className={`text-xl font-bold ${selectedEmotionData.color}`}>
                {selectedEmotionData.label}
              </h3>
              <p className="text-gray-600 mt-1">
                {selectedEmotionData.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={onCancel}
          className="flex-1 py-3 px-6 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        
        <button
          onClick={onNext}
          disabled={!selectedEmotion}
          className={`
            flex-1 py-3 px-6 rounded-xl font-medium transition-colors
            ${selectedEmotion
              ? 'bg-primary-500 text-white hover:bg-primary-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          Continuar
        </button>
      </div>
    </div>
  );
};

export default EmotionSelector;