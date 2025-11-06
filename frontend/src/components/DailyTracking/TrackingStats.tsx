import React from 'react';
import { TrackingStats as TrackingStatsType } from '../../services/dailyTrackingService';
import SerenitoCharacter from '../SERENITO/SerenitoCharacter';

interface TrackingStatsProps {
  stats: TrackingStatsType;
}

const TrackingStats: React.FC<TrackingStatsProps> = ({ stats }) => {
  const getStreakMessage = () => {
    if (stats.currentStreak === 0) {
      return "¡Comienza tu racha hoy! Cada día cuenta para tu bienestar.";
    } else if (stats.currentStreak === 1) {
      return "¡Excelente! Has comenzado tu racha. ¡Sigamos así!";
    } else if (stats.currentStreak < 7) {
      return `¡Increíble! Llevas ${stats.currentStreak} días seguidos. ¡Estás construyendo un gran hábito!`;
    } else if (stats.currentStreak < 30) {
      return `¡Fantástico! ${stats.currentStreak} días seguidos es impresionante. ¡Eres muy constante!`;
    } else {
      return `¡Extraordinario! ${stats.currentStreak} días seguidos. ¡Eres un ejemplo de dedicación!`;
    }
  };

  const getStreakExpression = () => {
    if (stats.currentStreak === 0) return 'encouraging';
    if (stats.currentStreak < 7) return 'happy';
    if (stats.currentStreak < 30) return 'celebrating';
    return 'celebrating';
  };

  const getConfidenceMessage = () => {
    if (stats.avgConfidence >= 8) {
      return "Tu confianza promedio es excelente. ¡Sigue así!";
    } else if (stats.avgConfidence >= 6) {
      return "Tu confianza está en un buen nivel. Cada día es una oportunidad para crecer.";
    } else if (stats.avgConfidence >= 4) {
      return "Tu confianza está mejorando. Recuerda que cada pequeño paso cuenta.";
    } else {
      return "Estás trabajando en tu confianza. Eres valiente por seguir adelante.";
    }
  };

  return (
    <div className="space-y-6">
      {/* SERENITO Encouragement */}
      <div className="card-senior">
        <SerenitoCharacter 
          message={getStreakMessage()}
          expression={getStreakExpression()}
          animation="celebrating"
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Streak */}
        <div className="card-senior text-center">
          <div className="text-4xl mb-2">🔥</div>
          <div className="text-3xl font-bold text-primary-600 mb-1">{stats.currentStreak}</div>
          <div className="text-sm font-semibold text-gray-800">Racha Actual</div>
          <div className="text-xs text-gray-600 mt-1">
            {stats.currentStreak === 1 ? 'día seguido' : 'días seguidos'}
          </div>
        </div>

        {/* Longest Streak */}
        <div className="card-senior text-center">
          <div className="text-4xl mb-2">🏆</div>
          <div className="text-3xl font-bold text-amber-600 mb-1">{stats.longestStreak}</div>
          <div className="text-sm font-semibold text-gray-800">Mejor Racha</div>
          <div className="text-xs text-gray-600 mt-1">
            {stats.longestStreak === 1 ? 'día máximo' : 'días máximo'}
          </div>
        </div>

        {/* Average Confidence */}
        <div className="card-senior text-center">
          <div className="text-4xl mb-2">💪</div>
          <div className="text-3xl font-bold text-green-600 mb-1">{stats.avgConfidence}</div>
          <div className="text-sm font-semibold text-gray-800">Confianza Promedio</div>
          <div className="text-xs text-gray-600 mt-1">de 10 puntos</div>
        </div>

        {/* Total Entries */}
        <div className="card-senior text-center">
          <div className="text-4xl mb-2">📊</div>
          <div className="text-3xl font-bold text-blue-600 mb-1">{stats.totalEntries}</div>
          <div className="text-sm font-semibold text-gray-800">Registros Totales</div>
          <div className="text-xs text-gray-600 mt-1">
            {stats.totalEntries === 1 ? 'día registrado' : 'días registrados'}
          </div>
        </div>
      </div>

      {/* Confidence Insight */}
      <div className="card-senior">
        <div className="flex items-start space-x-4">
          <div className="text-4xl">💡</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Reflexión sobre tu Confianza</h3>
            <p className="text-gray-600 mb-4">{getConfidenceMessage()}</p>
            
            {/* Confidence Level Indicator */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Nivel actual:</span>
              <div className="flex-1 bg-gray-200 rounded-full h-3 max-w-xs">
                <div
                  className="bg-gradient-to-r from-red-400 via-yellow-400 to-green-500 h-3 rounded-full transition-all duration-1000"
                  style={{ width: `${(stats.avgConfidence / 10) * 100}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-gray-800">{stats.avgConfidence}/10</span>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="card-senior">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <span className="text-2xl mr-2">🎖️</span>
          Logros Desbloqueados
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* First Entry Achievement */}
          <div className={`p-3 rounded-lg text-center ${stats.totalEntries >= 1 ? 'bg-green-100 border-green-300' : 'bg-gray-100 border-gray-300'} border-2`}>
            <div className="text-2xl mb-1">🌱</div>
            <div className="text-xs font-semibold">Primer Paso</div>
            <div className="text-xs text-gray-600">1 registro</div>
          </div>

          {/* Week Streak Achievement */}
          <div className={`p-3 rounded-lg text-center ${stats.currentStreak >= 7 || stats.longestStreak >= 7 ? 'bg-green-100 border-green-300' : 'bg-gray-100 border-gray-300'} border-2`}>
            <div className="text-2xl mb-1">📅</div>
            <div className="text-xs font-semibold">Una Semana</div>
            <div className="text-xs text-gray-600">7 días seguidos</div>
          </div>

          {/* Month Streak Achievement */}
          <div className={`p-3 rounded-lg text-center ${stats.currentStreak >= 30 || stats.longestStreak >= 30 ? 'bg-green-100 border-green-300' : 'bg-gray-100 border-gray-300'} border-2`}>
            <div className="text-2xl mb-1">🗓️</div>
            <div className="text-xs font-semibold">Un Mes</div>
            <div className="text-xs text-gray-600">30 días seguidos</div>
          </div>

          {/* High Confidence Achievement */}
          <div className={`p-3 rounded-lg text-center ${stats.avgConfidence >= 8 ? 'bg-green-100 border-green-300' : 'bg-gray-100 border-gray-300'} border-2`}>
            <div className="text-2xl mb-1">⭐</div>
            <div className="text-xs font-semibold">Alta Confianza</div>
            <div className="text-xs text-gray-600">Promedio 8+</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackingStats;