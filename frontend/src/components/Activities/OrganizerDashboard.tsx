import React, { useState, useEffect } from 'react';
import { Activity, activityService } from '../../services/activityService';
import { useAuth } from '../../hooks/useAuth';
import useSerenito from '../../hooks/useSerenito';
import CreateActivityForm from './CreateActivityForm';
import ActivityCard from './ActivityCard';
import ParticipantManagement from './ParticipantManagement';

const OrganizerDashboard: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [showParticipantManagement, setShowParticipantManagement] = useState<Activity | null>(null);
  const { user } = useAuth();
  const { interact } = useSerenito();

  useEffect(() => {
    loadOrganizerActivities();
  }, []);

  useEffect(() => {
    // Show SERENITO welcome message for organizers
    interact('welcome');
  }, [interact]);

  const loadOrganizerActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      const activitiesData = await activityService.getOrganizerActivities();
      setActivities(activitiesData);
    } catch (err) {
      setError('Error al cargar las actividades');
      console.error('Error loading organizer activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleActivityCreated = () => {
    setShowCreateForm(false);
    loadOrganizerActivities();
  };

  const handleActivityClick = (activity: Activity) => {
    setSelectedActivity(activity);
  };

  const handleDeleteActivity = async (activity: Activity) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta actividad? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await activityService.deleteActivity(activity.id);
      interact('custom', 'La actividad ha sido eliminada correctamente.');
      loadOrganizerActivities();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar la actividad');
    }
  };

  const getActivityStats = () => {
    const now = new Date();
    const upcomingActivities = activities.filter(a => new Date(a.eventDate) > now);
    const pastActivities = activities.filter(a => new Date(a.eventDate) <= now);
    const totalParticipants = activities.reduce((sum, a) => sum + a.registeredUsers.length, 0);

    return {
      total: activities.length,
      upcoming: upcomingActivities.length,
      past: pastActivities.length,
      totalParticipants
    };
  };

  const stats = getActivityStats();

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 animate-gentle-entrance">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Panel de Organizador</h1>
          <p className="text-gray-600">Gestiona tus actividades</p>
        </div>
        
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8 animate-gentle-entrance">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Panel de Organizador</h1>
        <p className="text-gray-600">Gestiona tus actividades y ayuda a tu comunidad</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg animate-gentle-entrance">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 animate-gentle-entrance" style={{ animationDelay: '200ms' }}>
        <div className="card-senior text-center">
          <div className="text-2xl font-bold text-primary-600">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Actividades</div>
        </div>
        <div className="card-senior text-center">
          <div className="text-2xl font-bold text-secondary-600">{stats.upcoming}</div>
          <div className="text-sm text-gray-600">Próximas</div>
        </div>
        <div className="card-senior text-center">
          <div className="text-2xl font-bold text-accent-600">{stats.past}</div>
          <div className="text-sm text-gray-600">Completadas</div>
        </div>
        <div className="card-senior text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.totalParticipants}</div>
          <div className="text-sm text-gray-600">Participantes</div>
        </div>
      </div>

      {/* Create Activity Button */}
      <div className="mb-8 animate-gentle-entrance" style={{ animationDelay: '300ms' }}>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          <span className="text-xl">➕</span>
          <span>Crear Nueva Actividad</span>
        </button>
      </div>

      {/* Activities List */}
      {activities.length === 0 ? (
        <div className="card-senior text-center animate-gentle-entrance" style={{ animationDelay: '400ms' }}>
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-gray-400 text-xl">📅</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            No tienes actividades creadas
          </h2>
          <p className="text-gray-600 mb-4">
            Comienza creando tu primera actividad para ayudar a tu comunidad.
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Crear Primera Actividad
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Upcoming Activities */}
          {activities.filter(a => new Date(a.eventDate) > new Date()).length > 0 && (
            <div className="animate-gentle-entrance" style={{ animationDelay: '400ms' }}>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Próximas Actividades</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activities
                  .filter(a => new Date(a.eventDate) > new Date())
                  .map((activity, index) => (
                    <div key={activity.id} className="relative">
                      <ActivityCard
                        activity={activity}
                        onActivityClick={handleActivityClick}
                        showRegistrationButton={false}
                      />
                      <div className="absolute top-2 right-2 flex space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowParticipantManagement(activity);
                          }}
                          className="p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors text-xs"
                          title="Gestionar participantes"
                        >
                          👥
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteActivity(activity);
                          }}
                          className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors text-xs"
                          title="Eliminar actividad"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Past Activities */}
          {activities.filter(a => new Date(a.eventDate) <= new Date()).length > 0 && (
            <div className="animate-gentle-entrance" style={{ animationDelay: '500ms' }}>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Actividades Completadas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activities
                  .filter(a => new Date(a.eventDate) <= new Date())
                  .map((activity, index) => (
                    <div key={activity.id} className="relative opacity-75">
                      <ActivityCard
                        activity={activity}
                        onActivityClick={handleActivityClick}
                        showRegistrationButton={false}
                      />
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-1 bg-gray-500 text-white rounded-full text-xs">
                          Finalizada
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Activity Form Modal */}
      {showCreateForm && (
        <CreateActivityForm
          onActivityCreated={handleActivityCreated}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Participant Management Modal */}
      {showParticipantManagement && (
        <ParticipantManagement
          activity={showParticipantManagement}
          onActivityUpdate={loadOrganizerActivities}
          onClose={() => setShowParticipantManagement(null)}
        />
      )}

      {/* Activity Details Modal (if needed) */}
      {selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-gray-800">Detalles de la Actividad</h2>
                <button
                  onClick={() => setSelectedActivity(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-800">{selectedActivity.title}</h3>
                  <p className="text-gray-600">{selectedActivity.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Fecha:</span>
                    <div>{activityService.formatEventDate(selectedActivity.eventDate)}</div>
                  </div>
                  <div>
                    <span className="font-medium">Ubicación:</span>
                    <div>{selectedActivity.location}</div>
                  </div>
                  <div>
                    <span className="font-medium">Categoría:</span>
                    <div>{activityService.getCategoryName(selectedActivity.category)}</div>
                  </div>
                  <div>
                    <span className="font-medium">Participantes:</span>
                    <div>
                      {selectedActivity.registeredUsers.length}
                      {selectedActivity.maxParticipants && ` / ${selectedActivity.maxParticipants}`}
                    </div>
                  </div>
                </div>

                {selectedActivity.registeredUsers.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Participantes Registrados:</h4>
                    <div className="space-y-1">
                      {selectedActivity.registeredUsers.map(user => (
                        <div key={user.id} className="text-sm text-gray-600">
                          {user.profile?.firstName || user.username}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizerDashboard;