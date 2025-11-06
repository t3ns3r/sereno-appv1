import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

interface TrackingCalendarProps {
  data: Array<{
    date: string;
    confidence: number;
    emotionalState: any;
  }>;
  onDateSelect?: (date: string) => void;
  className?: string;
}

const TrackingCalendar: React.FC<TrackingCalendarProps> = ({ 
  data, 
  onDateSelect, 
  className = '' 
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Create a map of dates to tracking data for quick lookup
  const dataMap = new Map();
  data.forEach(entry => {
    const date = new Date(entry.date);
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    dataMap.set(dateKey, entry);
  });

  // Get calendar days for current month
  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday
    
    const days = [];
    const currentDate = new Date(startDate);
    
    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
      const trackingData = dataMap.get(dateKey);
      
      days.push({
        date: new Date(currentDate),
        dateKey,
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: currentDate.toDateString() === new Date().toDateString(),
        trackingData
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const days = getCalendarDays();
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 8) return 'bg-green-500';
    if (confidence >= 6) return 'bg-yellow-500';
    if (confidence >= 4) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getConfidenceIntensity = (confidence: number) => {
    const intensity = Math.min(confidence / 10, 1);
    return {
      opacity: 0.3 + (intensity * 0.7) // Range from 0.3 to 1.0
    };
  };

  return (
    <div className={`bg-white rounded-senior p-6 shadow-senior ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          Calendario de Seguimiento
        </h3>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          
          <h4 className="text-lg font-medium text-gray-800 min-w-[140px] text-center">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h4>
          
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronRightIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => (
          <motion.button
            key={day.dateKey}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.01 }}
            onClick={() => onDateSelect?.(day.dateKey)}
            className={`
              relative aspect-square p-2 rounded-lg text-sm font-medium transition-all
              ${day.isCurrentMonth ? 'text-gray-800' : 'text-gray-400'}
              ${day.isToday ? 'ring-2 ring-primary-500' : ''}
              ${day.trackingData ? 'hover:scale-105' : ''}
              hover:bg-gray-50
            `}
          >
            {/* Date number */}
            <span className="relative z-10">
              {day.date.getDate()}
            </span>

            {/* Tracking indicator */}
            {day.trackingData && (
              <div
                className={`
                  absolute inset-1 rounded-md ${getConfidenceColor(day.trackingData.confidence)}
                `}
                style={getConfidenceIntensity(day.trackingData.confidence)}
              />
            )}

            {/* Today indicator */}
            {day.isToday && (
              <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary-500 rounded-full" />
            )}
          </motion.button>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 space-y-3">
        <h5 className="text-sm font-medium text-gray-700">Leyenda:</h5>
        
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-600">Confianza alta (8-10)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span className="text-gray-600">Confianza media (6-7)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span className="text-gray-600">Confianza baja (4-5)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-gray-600">Confianza muy baja (1-3)</span>
          </div>
        </div>
        
        <p className="text-xs text-gray-500">
          La intensidad del color indica el nivel de confianza. Haz clic en una fecha para ver detalles.
        </p>
      </div>

      {/* Summary stats */}
      <div className="mt-4 p-3 bg-sky-50 rounded-lg">
        <div className="text-sm text-gray-600">
          <strong>{data.length}</strong> días registrados este período
          {data.length > 0 && (
            <>
              {' • '}
              Confianza promedio: <strong>{Math.round((data.reduce((sum, entry) => sum + entry.confidence, 0) / data.length) * 10) / 10}</strong>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackingCalendar;