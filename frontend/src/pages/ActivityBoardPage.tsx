import React, { useState, useEffect } from 'react';
import { Activity, ActivityFilters, activityService } from '../services/activityService';
import { useAuth } from '../hooks/useAuth';
import useSerenito from '../hooks/useSerenito';
import ActivityCard from '../components/Activities/ActivityCard';
import ActivityFiltersComponent from '../components/Activities/ActivityFilters';

const ActivityBoardPage: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ActivityFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const { user } = useAuth();
  const { interact } = useSerenito();

  // Default country - in a real app, this would come from user profile or geolocation
  const userCountry = user?.country || 'ES';

  useEffect(() => {
    loadActivities();
  }, [filters, userCountry]);

  useEffect(() => {
    // Show SERENITO welcome message
    interact('welcome');
  }, [interact]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const activitiesData = await activityService.getActivitiesByCountry(userCountry, filters);
      setActivities(activitiesData);
    } catch (err) {
      setError('Error al cargar las actividades');
      console.error('Error loading activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleActivityClick = (activity: Activity) => {
    // In a real app, this might open a detailed view or modal
    console.log('Activity clicked:', activity);
  };

  const handleRegisterClick = async (activity: Activity) => {
    if (!user) return;

    try {
      const isRegistered = activityService.isUserRegistered(activity, user.id);
      
      if (isRegistered) {
        await activityService.unregisterFromActivity(activity.id);
        interact('custom', 'Te has desregistrado de la actividad. ¡Esperamos verte en otra ocasión!');
      } else {
        await activityService.registerForActivity(activity.id);
        interact('task-complete');
      }
      
      // Reload activities to reflect the change
      loadActivities();
    } catch (err) {
      console.error('Error with activity registration:', err);
      setError(err instanceof Error ? err.message : 'Error al procesar el registro');
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 animate-gentle-entrance">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Pizarra de Actividades</h1>
          <p className="text-gray-600">Conecta con tu comunidad local</p>
        </div>
        
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 animate-gentle-entrance">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Pizarra de Actividades</h1>
          <p className="text-gray-600">Conecta con tu comunidad local</p>
        </div>
        
        <div className="card-senior text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadActivities}
            className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8 animate-gentle-entrance">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Pizarra de Actividades</h1>
        <p className="text-gray-600">Conecta con tu comunidad local y participa en actividades de bienestar</p>
      </div>

      {/* Filter Toggle Button */}
      <div className="mb-6 animate-gentle-entrance" style={{ animationDelay: '200ms' }}>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <span className="text-lg">🔍</span>
          <span>Filtros</span>
          <span className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="lg:col-span-1 animate-gentle-entrance" style={{ animationDelay: '300ms' }}>
            <ActivityFiltersComponent
              filters={filters}
              onFiltersChange={setFilters}
            />
          </div>
        )}

        {/* Activities Grid */}
        <div className={`${showFilters ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
          {activities.length === 0 ? (
            <div className="card-senior text-center animate-gentle-entrance" style={{ animationDelay: '400ms' }}>
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-400 text-xl">👥</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                No hay actividades disponibles
              </h2>
              <p className="text-gray-600">
                No se encontraron actividades en tu área con los filtros seleccionados.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {activities.map((activity, index) => (
                <div
                  key={activity.id}
                  className="animate-gentle-entrance"
                  style={{ animationDelay: `${400 + index * 100}ms` }}
                >
                  <ActivityCard
                    activity={activity}
                    onActivityClick={handleActivityClick}
                    onRegisterClick={handleRegisterClick}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      {activities.length > 0 && (
        <div className="mt-8 card-senior animate-gentle-entrance" style={{ animationDelay: '600ms' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary-600">{activities.length}</div>
              <div className="text-sm text-gray-600">Actividades disponibles</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-secondary-600">
                {activities.filter(a => !activityService.isActivityFull(a)).length}
              </div>
              <div className="text-sm text-gray-600">Con lugares disponibles</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-accent-600">
                {user ? activities.filter(a => activityService.isUserRegistered(a, user.id)).length : 0}
              </div>
              <div className="text-sm text-gray-600">Mis registros</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityBoardPage;