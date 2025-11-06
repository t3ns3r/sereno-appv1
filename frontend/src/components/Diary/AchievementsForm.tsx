import React, { useState } from 'react';
import { achievementTypes } from '../../data/diaryEmotions';
import SerenitoCharacter from '../SERENITO/SerenitoCharacter';

interface Achievement {
  type: 'big' | 'medium' | 'small';
  description: string;
}

interface AchievementsFormProps {
  achievements: Achievement[];
  onAchievementsChange: (achievements: Achievement[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const AchievementsForm: React.FC<AchievementsFormProps> = ({
  achievements,
  onAchievementsChange,
  onNext,
  onBack
}) => {
  const [newAchievement, setNewAchievement] = useState<Achievement>({
    type: 'small',
    description: ''
  });

  const addAchievement = () => {
    if (newAchievement.description.trim()) {
      onAchievementsChange([...achievements, newAchievement]);
      setNewAchievement({ type: 'small', description: '' });
    }
  };

  const removeAchievement = (index: number) => {
    const updated = achievements.filter((_, i) => i !== index);
    onAchievementsChange(updated);
  };

  const getSerenitoMessage = () => {
    if (achievements.length === 0) {
      return "¡Cuéntame sobre tus logros de hoy! Pueden ser grandes o pequeños, todos son importantes.";
    }
    
    const bigCount = achievements.filter(a => a.type === 'big').length;
    const mediumCount = achievements.filter(a => a.type === 'medium').length;
    const smallCount = achievements.filter(a => a.type === 'small').length;
    
    if (bigCount > 0) {
      return "¡Wow! Tienes logros grandes hoy. ¡Estoy muy orgulloso de ti!";
    } else if (mediumCount > 0) {
      return "¡Excelente! Veo que has tenido avances importantes hoy.";
    } else if (smallCount > 0) {
      return "¡Me encanta! Los pequeños logros son la base de grandes cambios.";
    }
    
    return "Cada logro cuenta, sin importar su tamaño. ¡Comparte conmigo!";
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-lg">
      {/* Header */}
      <div className="text-center mb-8">
        <SerenitoCharacter
          expression="encouraging"
          size="lg"
          message={getSerenitoMessage()}
          showMessage={true}
          className="mb-6"
        />
        
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Logros de Hoy
        </h2>
        <p className="text-gray-600">
          Comparte tus logros, grandes, medianos o pequeños
        </p>
      </div>

      {/* Existing Achievements */}
      {achievements.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Tus logros registrados:
          </h3>
          <div className="space-y-3">
            {achievements.map((achievement, index) => {
              const type = achievementTypes.find(t => t.id === achievement.type);
              return (
                <div
                  key={index}
                  className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-200"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <span className="text-2xl">{type?.emoji}</span>
                    <div>
                      <div className={`text-sm font-medium ${type?.color}`}>
                        Logro {type?.label}
                      </div>
                      <div className="text-gray-700">
                        {achievement.description}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeAchievement(index)}
                    className="text-red-500 hover:text-red-700 ml-4"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add New Achievement */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Agregar nuevo logro:
        </h3>
        
        {/* Achievement Type Selector */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {achievementTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setNewAchievement({ ...newAchievement, type: type.id as any })}
              className={`
                p-3 rounded-xl border-2 transition-all duration-200
                ${newAchievement.type === type.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-primary-300'
                }
              `}
            >
              <div className="text-center">
                <div className="text-2xl mb-1">{type.emoji}</div>
                <div className={`text-sm font-medium ${type.color}`}>
                  {type.label}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Achievement Description */}
        <div className="mb-4">
          <textarea
            value={newAchievement.description}
            onChange={(e) => setNewAchievement({ ...newAchievement, description: e.target.value })}
            placeholder="Describe tu logro... Por ejemplo: 'Terminé un proyecto importante' o 'Hice ejercicio por 30 minutos'"
            className="w-full h-24 p-4 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            maxLength={200}
          />
          <div className="text-right text-sm text-gray-500 mt-1">
            {newAchievement.description.length}/200 caracteres
          </div>
        </div>

        {/* Add Button */}
        <button
          onClick={addAchievement}
          disabled={!newAchievement.description.trim()}
          className={`
            w-full py-3 px-6 rounded-xl font-medium transition-colors
            ${newAchievement.description.trim()
              ? 'bg-green-500 text-white hover:bg-green-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          ➕ Agregar Logro
        </button>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="flex-1 py-3 px-6 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
        >
          ← Volver
        </button>
        
        <button
          onClick={onNext}
          className="flex-1 py-3 px-6 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
        >
          Continuar →
        </button>
      </div>
    </div>
  );
};

export default AchievementsForm;