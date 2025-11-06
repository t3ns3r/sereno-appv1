import React from 'react';
import SerenitoCharacter from '../SERENITO/SerenitoCharacter';

interface Reward {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  type: 'daily' | 'weekly' | 'achievement';
}

interface RewardSystemProps {
  rewards: Reward[];
  totalPoints: number;
  onClose: () => void;
}

const RewardSystem: React.FC<RewardSystemProps> = ({ rewards, totalPoints, onClose }) => {
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-lg">
      <div className="text-center mb-6">
        <SerenitoCharacter
          expression="celebrating"
          size="lg"
          message="¡Felicidades! Has ganado nuevas recompensas por cuidar tu bienestar mental."
          showMessage={true}
          className="mb-4"
        />
        
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          🎉 ¡Recompensas Ganadas!
        </h3>
        <p className="text-gray-600">
          Has completado tu evaluación y ganado puntos de bienestar
        </p>
      </div>

      {/* Points Summary */}
      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl p-6 text-white text-center mb-6">
        <div className="text-3xl font-bold mb-2">{totalPoints}</div>
        <div className="text-primary-100">Puntos de Bienestar Totales</div>
      </div>

      {/* Rewards List */}
      <div className="space-y-4 mb-6">
        {rewards.map((reward) => (
          <div
            key={reward.id}
            className="flex items-center p-4 bg-gray-50 rounded-xl border-2 border-transparent hover:border-primary-200 transition-all duration-200"
          >
            <div className="text-3xl mr-4">{reward.icon}</div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800">{reward.title}</h4>
              <p className="text-sm text-gray-600">{reward.description}</p>
              <div className="text-xs text-primary-600 font-medium mt-1">
                +{reward.points} puntos
              </div>
            </div>
            <div className="text-green-500 text-xl">✓</div>
          </div>
        ))}
      </div>

      {/* Next Steps */}
      <div className="bg-blue-50 rounded-xl p-4 mb-6">
        <h4 className="font-semibold text-blue-800 mb-2">🎯 Próximos Objetivos</h4>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• Completa 7 días consecutivos para ganar la insignia "Constancia"</li>
          <li>• Realiza ejercicios de respiración para puntos extra</li>
          <li>• Participa en actividades comunitarias</li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 bg-primary-500 text-white py-3 px-6 rounded-xl font-medium hover:bg-primary-600 transition-colors"
        >
          Continuar
        </button>
        <button
          onClick={() => {/* TODO: Navigate to rewards page */}}
          className="px-6 py-3 border-2 border-primary-500 text-primary-500 rounded-xl font-medium hover:bg-primary-50 transition-colors"
        >
          Ver Todas las Recompensas
        </button>
      </div>
    </div>
  );
};

export default RewardSystem;