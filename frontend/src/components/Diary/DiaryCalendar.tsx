import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface DiaryEntry {
  date: string;
  emotion?: string;
  hasEntry: boolean;
}

interface DiaryCalendarProps {
  entries: DiaryEntry[];
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
}

const DiaryCalendar: React.FC<DiaryCalendarProps> = ({
  entries,
  selectedDate,
  onDateSelect
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        day,
        dateString,
        isToday: dateString === new Date().toISOString().split('T')[0],
        isSelected: dateString === selectedDate,
        entry: entries.find(entry => entry.date === dateString)
      });
    }

    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
        </button>
        
        <h2 className="text-xl font-bold text-gray-800">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h2>
        
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronRightIcon className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          if (!day) {
            return <div key={index} className="h-12" />;
          }

          const { day: dayNumber, dateString, isToday, isSelected, entry } = day;

          return (
            <button
              key={dateString}
              onClick={() => onDateSelect(dateString)}
              className={`
                h-12 rounded-lg text-sm font-medium transition-all duration-200
                ${isSelected 
                  ? 'bg-primary-500 text-white shadow-lg' 
                  : 'hover:bg-gray-100'
                }
                ${isToday && !isSelected 
                  ? 'bg-blue-100 text-blue-700 font-bold' 
                  : ''
                }
                ${entry?.hasEntry 
                  ? 'ring-2 ring-green-300' 
                  : ''
                }
              `}
            >
              <div className="flex flex-col items-center justify-center h-full">
                <span>{dayNumber}</span>
                {entry?.hasEntry && (
                  <div className="w-1 h-1 bg-green-500 rounded-full mt-1" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center space-x-4 text-xs text-gray-600">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-blue-100 rounded"></div>
          <span>Hoy</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 border-2 border-green-300 rounded"></div>
          <span>Con entrada</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-primary-500 rounded"></div>
          <span>Seleccionado</span>
        </div>
      </div>
    </div>
  );
};

export default DiaryCalendar;