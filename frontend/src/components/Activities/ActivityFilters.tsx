import React, { useState } from 'react';
import { ActivityFilters, activityService } from '../../services/activityService';

interface ActivityFiltersProps {
  filters: ActivityFilters;
  onFiltersChange: (filters: ActivityFilters) => void;
  totalActivities?: number;
  filteredCount?: number;
}

const ActivityFiltersComponent: React.FC<ActivityFiltersProps> = ({ 
  filters, 
  onFiltersChange, 
  totalActivities = 0,
  filteredCount = 0
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const categories = [
    { value: '', label: 'Todas las categorías', icon: '📅', color: 'bg-gray-100' },
    { value: 'GROUP_THERAPY', label: 'Terapia Grupal', icon: '👥', color: 'bg-blue-100' },
    { value: 'MINDFULNESS', label: 'Mindfulness', icon: '🧘', color: 'bg-green-100' },
    { value: 'SUPPORT_GROUP', label: 'Grupo de Apoyo', icon: '🤝', color: 'bg-purple-100' },
    { value: 'WELLNESS_WORKSHOP', label: 'Taller de Bienestar', icon: '🌱', color: 'bg-orange-100' }
  ];

  const handleFilterChange = (key: keyof ActivityFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value === '' ? undefined : value
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== '');

  return (
    <div className="card-senior">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Filtros</h3>
          {totalActivities > 0 && (
            <p className="text-sm text-gray-600">
              Mostrando {filteredCount} de {totalActivities} actividades
            </p>
          )}
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
        >
          {showAdvanced ? 'Ocultar filtros' : 'Más filtros'}
        </button>
      </div>

      <div className="space-y-4">
        {/* Category Filter - Visual Grid */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Categoría
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => handleFilterChange('category', category.value)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  (filters.category || '') === category.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{category.icon}</span>
                  <div>
                    <div className="text-sm font-medium text-gray-800 line-clamp-1">
                      {category.label}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Filters */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Filtros rápidos
          </label>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="availableSpots"
              checked={filters.hasAvailableSpots || false}
              onChange={(e) => handleFilterChange('hasAvailableSpots', e.target.checked || undefined)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="availableSpots" className="ml-2 text-sm text-gray-700">
              Solo actividades con lugares disponibles
            </label>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="space-y-4 pt-4 border-t border-gray-200 animate-gentle-entrance">
            <h4 className="text-sm font-medium text-gray-700">Filtros avanzados</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha desde
                </label>
                <input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha hasta
                </label>
                <input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Preset Date Ranges */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rangos predefinidos
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { label: 'Hoy', days: 0 },
                  { label: 'Esta semana', days: 7 },
                  { label: 'Este mes', days: 30 },
                  { label: 'Próximos 3 meses', days: 90 }
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => {
                      const today = new Date();
                      const endDate = new Date();
                      endDate.setDate(today.getDate() + preset.days);
                      
                      handleFilterChange('startDate', today.toISOString().split('T')[0]);
                      handleFilterChange('endDate', endDate.toISOString().split('T')[0]);
                    }}
                    className="p-2 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {Object.values(filters).filter(v => v !== undefined && v !== '').length} filtro(s) activo(s)
              </span>
              <button
                onClick={clearFilters}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Limpiar todo
              </button>
            </div>
          </div>
        )}

        {/* Clear Filters Button */}
        {!hasActiveFilters && (
          <button
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className="w-full py-2 px-4 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  );
};

export default ActivityFiltersComponent;