import React, { useMemo } from 'react';
import { TrackingStats } from '../../services/dailyTrackingService';
import { getEmotionById, getConfidenceLevelInfo } from '../../constants/emotions';

interface ProgressChartProps {
  stats: TrackingStats;
  timeRange: number;
}

const ProgressChart: React.FC<ProgressChartProps> = ({ stats, timeRange }) => {
  const chartData = useMemo(() => {
    const entries = stats.entries.slice(-timeRange);
    const maxConfidence = Math.max(...entries.map(e => e.confidenceLevel), 10);
    
    return entries.map((entry, index) => {
      const date = new Date(entry.date);
      const emotion = getEmotionById(entry.emotionalState.primary);
      
      return {
        ...entry,
        x: index,
        normalizedConfidence: (entry.confidenceLevel / maxConfidence) * 100,
        dateLabel: date.toLocaleDateString('es-ES', { 
          month: 'short', 
          day: 'numeric' 
        }),
        emotion
      };
    });
  }, [stats.entries, timeRange]);

  const emotionalTrendData = useMemo(() => {
    return Object.entries(stats.emotionalTrends)
      .map(([emotionId, count]) => ({
        emotion: getEmotionById(emotionId),
        count,
        percentage: Math.round((count / stats.totalEntries) * 100)
      }))
      .filter(item => item.emotion)
      .sort((a, b) => b.count - a.count);
  }, [stats.emotionalTrends, stats.totalEntries]);

  if (chartData.length === 0) {
    return (
      <div className="card-senior text-center py-8">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Sin Datos Suficientes</h3>
        <p className="text-gray-600">
          Registra tu estado emocional por algunos días para ver tu progreso aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Confidence Level Trend */}
      <div className="card-senior">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <span className="text-2xl mr-2">📈</span>
          Tendencia de Confianza
        </h3>
        
        <div className="relative h-48 bg-gray-50 rounded-lg p-4 overflow-x-auto">
          <svg width="100%" height="100%" viewBox={`0 0 ${Math.max(chartData.length * 60, 400)} 160`} className="min-w-full">
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map(y => (
              <line
                key={y}
                x1="0"
                y1={160 - (y * 1.6)}
                x2={chartData.length * 60}
                y2={160 - (y * 1.6)}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
            ))}
            
            {/* Confidence line */}
            <polyline
              fill="none"
              stroke="#6366f1"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={chartData.map((point, index) => 
                `${index * 60 + 30},${160 - (point.normalizedConfidence * 1.6)}`
              ).join(' ')}
            />
            
            {/* Data points */}
            {chartData.map((point, index) => (
              <g key={index}>
                <circle
                  cx={index * 60 + 30}
                  cy={160 - (point.normalizedConfidence * 1.6)}
                  r="6"
                  fill="#6366f1"
                  className="hover:r-8 transition-all cursor-pointer"
                />
                <text
                  x={index * 60 + 30}
                  y={180}
                  textAnchor="middle"
                  className="text-xs fill-gray-600"
                >
                  {point.dateLabel}
                </text>
                <text
                  x={index * 60 + 30}
                  y={160 - (point.normalizedConfidence * 1.6) - 15}
                  textAnchor="middle"
                  className="text-xs font-semibold fill-gray-800"
                >
                  {point.confidenceLevel}
                </text>
              </g>
            ))}
          </svg>
        </div>
        
        <div className="mt-4 flex justify-between text-sm text-gray-600">
          <span>Confianza promedio: <strong>{stats.avgConfidence}/10</strong></span>
          <span>Últimos {timeRange} días</span>
        </div>
      </div>

      {/* Emotional States Distribution */}
      <div className="card-senior">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <span className="text-2xl mr-2">🎭</span>
          Estados Emocionales
        </h3>
        
        <div className="space-y-3">
          {emotionalTrendData.map((item, index) => (
            <div key={item.emotion?.id} className="flex items-center space-x-3">
              <div className="text-2xl">{item.emotion?.emoji}</div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-gray-800">{item.emotion?.name}</span>
                  <span className="text-sm text-gray-600">{item.count} días ({item.percentage}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${item.emotion?.color || 'bg-gray-400'}`}
                    style={{ 
                      width: `${item.percentage}%`,
                      animationDelay: `${index * 100}ms`
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Emotions Timeline */}
      <div className="card-senior">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <span className="text-2xl mr-2">📅</span>
          Emociones Recientes
        </h3>
        
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {chartData.slice(-14).map((point, index) => (
            <div key={index} className="flex-shrink-0 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                <span className="text-xl">{point.emotion?.emoji}</span>
              </div>
              <div className="text-xs text-gray-600">{point.dateLabel}</div>
              <div className={`text-xs font-semibold mt-1 px-2 py-1 rounded-full text-white ${getConfidenceLevelInfo(point.confidenceLevel).color}`}>
                {point.confidenceLevel}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProgressChart;