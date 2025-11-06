import React from 'react';
import { motion } from 'framer-motion';

interface EmotionSummaryProps {
  data: Array<{
    date: string;
    confidence: number;
    emotionalState: any;
  }>;
  className?: string;
}

const EmotionSummary: React.FC<EmotionSummaryProps> = ({ data, className = '' }) => {
  if (!data || data.length === 0) {
    return (
      <div className={`bg-white rounded-senior p-6 shadow-senior ${className}`}>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Resumen Emocional
        </h3>
        <div className="text-center text-gray-500 py-8">
          No hay datos emocionales para mostrar
        </div>
      </div>
    );
  }

  // Aggregate emotions from all entries
  const emotionCounts: { [key: string]: number } = {};
  const emotionIntensities: { [key: string]: number[] } = {};

  data.forEach(entry => {
    if (entry.emotionalState && typeof entry.emotionalState === 'object') {
      Object.entries(entry.emotionalState).forEach(([emotion, intensity]) => {
        if (typeof intensity === 'number' && intensity > 0) {
          emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
          if (!emotionIntensities[emotion]) {
            emotionIntensities[emotion] = [];
          }
          emotionIntensities[emotion].push(intensity);
        }
      });
    }
  });

  // Calculate averages and sort by frequency
  const emotionStats = Object.entries(emotionCounts)
    .map(([emotion, count]) => {
      const intensities = emotionIntensities[emotion];
      const avgIntensity = intensities.reduce((sum, val) => sum + val, 0) / intensities.length;
      const percentage = (count / data.length) * 100;
      
      return {
        emotion,
        count,
        avgIntensity: Math.round(avgIntensity * 10) / 10,
        percentage: Math.round(percentage)
      };
    })
    .sort((a, b) => b.count - a.count);

  // Emotion display mapping
  const emotionDisplay: { [key: string]: { emoji: string; label: string; color: string } } = {
    happy: { emoji: '😊', label: 'Feliz', color: 'bg-yellow-100 text-yellow-800' },
    sad: { emoji: '😢', label: 'Triste', color: 'bg-blue-100 text-blue-800' },
    anxious: { emoji: '😰', label: 'Ansioso', color: 'bg-orange-100 text-orange-800' },
    calm: { emoji: '😌', label: 'Tranquilo', color: 'bg-green-100 text-green-800' },
    angry: { emoji: '😠', label: 'Enojado', color: 'bg-red-100 text-red-800' },
    excited: { emoji: '🤩', label: 'Emocionado', color: 'bg-purple-100 text-purple-800' },
    tired: { emoji: '😴', label: 'Cansado', color: 'bg-gray-100 text-gray-800' },
    hopeful: { emoji: '🌟', label: 'Esperanzado', color: 'bg-indigo-100 text-indigo-800' }
  };

  return (
    <div className={`bg-white rounded-senior p-6 shadow-senior ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Resumen Emocional
      </h3>
      
      <div className="space-y-4">
        {emotionStats.slice(0, 6).map((stat, index) => {
          const display = emotionDisplay[stat.emotion] || { 
            emoji: '❓', 
            label: stat.emotion, 
            color: 'bg-gray-100 text-gray-800' 
          };
          
          return (
            <motion.div
              key={stat.emotion}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-200"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{display.emoji}</span>
                <div>
                  <div className="font-medium text-gray-800">{display.label}</div>
                  <div className="text-sm text-gray-500">
                    {stat.count} {stat.count === 1 ? 'vez' : 'veces'} • Intensidad promedio: {stat.avgIntensity}/5
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${display.color}`}>
                  {stat.percentage}%
                </div>
                
                {/* Visual intensity bar */}
                <div className="mt-1 w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${(stat.avgIntensity / 5) * 100}%` }}
                    transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {emotionStats.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No se han registrado emociones aún
        </div>
      )}

      {emotionStats.length > 6 && (
        <div className="mt-4 text-center text-sm text-gray-500">
          Y {emotionStats.length - 6} emociones más...
        </div>
      )}

      {/* Summary insights */}
      {emotionStats.length > 0 && (
        <div className="mt-6 p-4 bg-sky-50 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2">Insights</h4>
          <div className="text-sm text-gray-600 space-y-1">
            {emotionStats[0] && (
              <p>• Tu emoción más frecuente es <strong>{emotionDisplay[emotionStats[0].emotion]?.label || emotionStats[0].emotion}</strong></p>
            )}
            {emotionStats.length >= 2 && (
              <p>• Has experimentado <strong>{emotionStats.length}</strong> tipos de emociones diferentes</p>
            )}
            <p>• Promedio de registros emocionales: <strong>{Math.round((Object.values(emotionCounts).reduce((sum, count) => sum + count, 0) / data.length) * 10) / 10}</strong> por día</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmotionSummary;