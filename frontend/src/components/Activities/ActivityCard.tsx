import React from 'react';
import { Activity, activityService } from '../../services/activityService';
import { useAuth } from '../../hooks/useAuth';

interface ActivityCardProps {
  activity: Activity;
  onActivityClick: (activity: Activity) => void;
  onRegisterClick?: (activity: Activity) => void;
  showRegistrationButton?: boolean;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ 
  activity, 
  onActivityClick, 
  onRegisterClick,
  showRegistrationButton = true 
}) => {
  const { user } = useAuth();
  const isUserRegistered = user ? activityService.isUserRegistered(activity, user.id) : false;
  const isFull = activityService.isActivityFull(activity);
  const availableSpots = activityService.getAvailableSpots(activity);
  const isPastEvent = new Date(activity.eventDate) < new Date();

  const handleRegisterClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRegisterClick?.(activity);
  };

  return (
    <div 
      className="card-senior cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:scale-105"
      onClick={() => onActivityClick(activity)}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">
                {activityService.getCategoryIcon(activity.category)}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold text-gray-800 line-clamp-2">
                {activity.title}
              </h3>
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                activityService.getCategoryColor(activity.category)
              }`}>
                {activityService.getCategoryName(activity.category)}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm line-clamp-3">
          {activity.description}
        </p>

        {/* Event Details */}
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <span className="text-lg">📅</span>
            <span>{activityService.formatEventDate(activity.eventDate)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-lg">📍</span>
            <span className="line-clamp-1">{activity.location}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-lg">👤</span>
            <span>
              Organizado por {activity.organizer.profile?.firstName || activity.organizer.username}
            </span>
          </div>
        </div>

        {/* Participants Info */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2 text-gray-600">
            <span className="text-lg">👥</span>
            <span>
              {activity.registeredUsers.length} participante{activity.registeredUsers.length !== 1 ? 's' : ''}
              {activity.maxParticipants && ` de ${activity.maxParticipants}`}
            </span>
          </div>
          
          {/* Status Indicators */}
          <div className="flex items-center space-x-2">
            {isPastEvent && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                Finalizado
              </span>
            )}
            {isFull && !isPastEvent && (
              <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs">
                Completo
              </span>
            )}
            {isUserRegistered && (
              <span className="px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs">
                ✓ Registrado
              </span>
            )}
            {availableSpots !== null && availableSpots > 0 && availableSpots <= 3 && !isPastEvent && (
              <span className="px-2 py-1 bg-orange-100 text-orange-600 rounded-full text-xs">
                {availableSpots} lugar{availableSpots !== 1 ? 'es' : ''} disponible{availableSpots !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Registration Button */}
        {showRegistrationButton && !isPastEvent && (
          <div className="pt-2 border-t">
            {isUserRegistered ? (
              <button
                onClick={handleRegisterClick}
                className="w-full py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
              >
                Cancelar registro
              </button>
            ) : (
              <button
                onClick={handleRegisterClick}
                disabled={isFull}
                className={`w-full py-2 px-4 rounded-lg transition-colors text-sm font-medium ${
                  isFull 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-primary-500 text-white hover:bg-primary-600'
                }`}
              >
                {isFull ? 'Actividad completa' : 'Registrarse'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityCard;