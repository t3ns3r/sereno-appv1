import React, { useState, useEffect } from 'react';
import { Activity, activityService } from '../../services/activityService';
import SeniorButton from '../UI/SeniorButton';

interface ParticipantManagementProps {
  activity: Activity;
  onActivityUpdate: () => void;
  onClose: () => void;
}

interface ParticipantStats {
  totalRegistered: number;
  maxParticipants?: number;
  availableSpots?: number;
  isFull: boolean;
  registrationRate: number;
}

const ParticipantManagement: React.FC<ParticipantManagementProps> = ({
  activity,
  onActivityUpdate,
  onClose
}) => {
  const [stats, setStats] = useState<ParticipantStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadActivityStats();
  }, [activity.id]);

  const loadActivityStats = async () => {
    try {
      setLoading(true);
      const statsData = await activityService.getActivityStats(activity.id);
      setStats(statsData);
    } catch (err) {
      setError('Error al cargar estadísticas');
      console.error('Error loading activity stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveParticipant = async (userId: string) => {
    try {
      await activityService.unregisterFromActivity(activity.id);
      setShowRemoveConfirm(null);
      onActivityUpdate();
      loadActivityStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al remover participante');
    }
  };

  const filteredParticipants = activity.registeredUsers.filter(user => {
    const name = user.profile?.firstName || user.username;
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getRegistrationRate = () => {
    if (!activity.maxParticipants) return 0;
    return (activity.registeredUsers.length / activity.maxParticipants) * 100;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando información de participantes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">Gestión de Participantes</h2>
              <p className="text-gray-600">{activity.title}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Activity Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Fecha:</span>
                <div className="text-gray-900">{formatDate(activity.eventDate)}</div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Ubicación:</span>
                <div className="text-gray-900">{activity.location}</div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Categoría:</span>
                <div className="text-gray-900">{activityService.getCategoryName(activity.category)}</div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          {stats && (
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-primary-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-primary-600">{stats.totalRegistered}</div>
                <div className="text-sm text-gray-600">Registrados</div>
              </div>
              
              {activity.maxParticipants && (
                <>
                  <div className="bg-secondary-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-secondary-600">{activity.maxParticipants}</div>
                    <div className="text-sm text-gray-600">Capacidad Máxima</div>
                  </div>
                  
                  <div className="bg-accent-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-accent-600">{stats.availableSpots || 0}</div>
                    <div className="text-sm text-gray-600">Lugares Disponibles</div>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-600">{Math.round(getRegistrationRate())}%</div>
                    <div className="text-sm text-gray-600">Ocupación</div>
                  </div>
                </>
              )}
              
              {!activity.maxParticipants && (
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">∞</div>
                  <div className="text-sm text-gray-600">Sin Límite</div>
                </div>
              )}
            </div>
          )}

          {/* Registration Progress Bar */}
          {activity.maxParticipants && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progreso de Inscripciones</span>
                <span className="text-sm text-gray-600">
                  {activity.registeredUsers.length} / {activity.maxParticipants}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-primary-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(getRegistrationRate(), 100)}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Buscar participante..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Participants List */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800">
              Participantes Registrados ({filteredParticipants.length})
            </h3>
            
            {filteredParticipants.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {activity.registeredUsers.length === 0 
                  ? 'No hay participantes registrados aún'
                  : 'No se encontraron participantes con ese nombre'
                }
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredParticipants.map((participant, index) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 font-semibold">
                          {(participant.profile?.firstName || participant.username).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">
                          {participant.profile?.firstName && participant.profile?.lastName
                            ? `${participant.profile.firstName} ${participant.profile.lastName}`
                            : participant.username
                          }
                        </div>
                        <div className="text-sm text-gray-600">@{participant.username}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">#{index + 1}</span>
                      <button
                        onClick={() => setShowRemoveConfirm(participant.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remover participante"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <SeniorButton
              onClick={onClose}
              className="bg-gray-300 text-gray-700 hover:bg-gray-400"
            >
              Cerrar
            </SeniorButton>
          </div>
        </div>
      </div>

      {/* Remove Confirmation Modal */}
      {showRemoveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Confirmar Eliminación
            </h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que quieres remover a este participante de la actividad?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex space-x-3">
              <SeniorButton
                onClick={() => setShowRemoveConfirm(null)}
                className="flex-1 bg-gray-300 text-gray-700 hover:bg-gray-400"
              >
                Cancelar
              </SeniorButton>
              <SeniorButton
                onClick={() => handleRemoveParticipant(showRemoveConfirm)}
                className="flex-1 bg-red-500 text-white hover:bg-red-600"
              >
                Remover
              </SeniorButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipantManagement;