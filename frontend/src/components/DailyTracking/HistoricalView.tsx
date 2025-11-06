import React, { useState, useEffect } from 'react';
import { DailyTrackingEntry } from '../../services/dailyTrackingService';
import { getEmotionById, getConfidenceLevelInfo } from '../../constants/emotions';
import SeniorButton from '../UI/SeniorButton';

interface HistoricalViewProps {
  entries: DailyTrackingEntry[];
  onLoadMore: (startDate: string, endDate: string) => void;
  isLoading: boolean;
}

const HistoricalView: React.FC<HistoricalViewProps> = ({ entries, onLoadMore, isLoading }) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedEntry, setSelectedEntry] = useState<DailyTrackingEntry | null>(null);

  const timeRanges = {
    week: { label: 'Última Semana', days: 7 },
    month: { label: 'Último Mes', days: 30 },
    quarter: { label: 'Últimos 3 Meses', days: 90 },
    year: { label: 'Último Año', days: 365 }
  };

  useEffect(() => {
    const range = timeRanges[selectedTimeRange];
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - range.days);
    
    onLoadMore(startDate.toISOString(), endDate.toISOString());
  }, [selectedTimeRange, onLoadMore]);

  const groupedEntries = entries.reduce((groups, entry) => {
    const date = new Date(entry.date);
    const monthYear = date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
    
    if (!groups[monthYear]) {
      groups[monthYear] = [];
    }
    groups[monthYear].push(entry);
    
    return groups;
  }, {} as { [key: string]: DailyTrackingEntry[] });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="card-senior">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <span className="text-xl mr-2">📅</span>
          Período de Tiempo
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(timeRanges).map(([key, range]) => (
            <button
              key={key}
              onClick={() => setSelectedTimeRange(key as any)}
              className={`
                p-3 rounded-lg border-2 transition-all duration-200 text-center
                ${selectedTimeRange === key 
                  ? 'border-primary-500 bg-primary-50 text-primary-700' 
                  : 'border-gray-200 bg-white hover:border-primary-300'
                }
              `}
            >
              <div className="font-semibold">{range.label}</div>
              <div className="text-sm text-gray-600">{range.days} días</div>
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="card-senior text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando registros...</p>
        </div>
      )}

      {/* No Data State */}
      {!isLoading && entries.length === 0 && (
        <div className="card-senior text-center py-8">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Sin Registros</h3>
          <p className="text-gray-600">
            No hay registros para el período seleccionado. ¡Comienza a registrar tu estado emocional!
          </p>
        </div>
      )}

      {/* Historical Entries */}
      {!isLoading && Object.entries(groupedEntries).map(([monthYear, monthEntries]) => (
        <div key={monthYear} className="card-senior">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 capitalize">
            {monthYear}
          </h3>
          
          <div className="space-y-3">
            {monthEntries
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((entry) => {
                const emotion = getEmotionById(entry.emotionalState.primary);
                const confidenceInfo = getConfidenceLevelInfo(entry.confidenceLevel);
                
                return (
                  <div
                    key={entry.id}
                    className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => setSelectedEntry(entry)}
                  >
                    {/* Date */}
                    <div className="text-center min-w-0 flex-shrink-0">
                      <div className="text-sm font-semibold text-gray-800">
                        {new Date(entry.date).getDate()}
                      </div>
                      <div className="text-xs text-gray-600">
                        {new Date(entry.date).toLocaleDateString('es-ES', { weekday: 'short' })}
                      </div>
                    </div>
                    
                    {/* Emotion */}
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <div className="text-2xl">{emotion?.emoji}</div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-800 truncate">{emotion?.name}</div>
                        <div className="text-sm text-gray-600 truncate">
                          {entry.notes || 'Sin notas'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Confidence */}
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${confidenceInfo.color}`}>
                        {entry.confidenceLevel}
                      </div>
                      <div className="text-xs text-gray-600 hidden md:block">
                        {confidenceInfo.label}
                      </div>
                    </div>
                    
                    {/* Time */}
                    <div className="text-xs text-gray-500 flex-shrink-0">
                      {formatTime(entry.createdAt)}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ))}

      {/* Entry Detail Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  Registro Detallado
                </h3>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Date and Time */}
                <div>
                  <div className="text-sm font-semibold text-gray-800 mb-1">Fecha y Hora</div>
                  <div className="text-gray-600">{formatDate(selectedEntry.date)}</div>
                  <div className="text-sm text-gray-500">{formatTime(selectedEntry.createdAt)}</div>
                </div>
                
                {/* Emotion */}
                <div>
                  <div className="text-sm font-semibold text-gray-800 mb-2">Estado Emocional</div>
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{getEmotionById(selectedEntry.emotionalState.primary)?.emoji}</div>
                    <div>
                      <div className="font-medium text-gray-800">
                        {getEmotionById(selectedEntry.emotionalState.primary)?.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {getEmotionById(selectedEntry.emotionalState.primary)?.description}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Confidence */}
                <div>
                  <div className="text-sm font-semibold text-gray-800 mb-2">Nivel de Confianza</div>
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${getConfidenceLevelInfo(selectedEntry.confidenceLevel).color}`}>
                      {selectedEntry.confidenceLevel}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">
                        {getConfidenceLevelInfo(selectedEntry.confidenceLevel).label}
                      </div>
                      <div className="text-sm text-gray-600">
                        {selectedEntry.confidenceLevel} de 10 puntos
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Notes */}
                {selectedEntry.notes && (
                  <div>
                    <div className="text-sm font-semibold text-gray-800 mb-2">Notas del Día</div>
                    <div className="bg-gray-50 p-3 rounded-lg text-gray-700">
                      {selectedEntry.notes}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-6">
                <SeniorButton
                  onClick={() => setSelectedEntry(null)}
                  variant="primary"
                  size="large"
                  className="w-full"
                >
                  Cerrar
                </SeniorButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoricalView;