import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SerenitoCharacter from '../components/SERENITO/SerenitoCharacter';
import useSerenito from '../hooks/useSerenito';
import SeniorButton from '../components/UI/SeniorButton';

interface Activity {
  id: string;
  title: string;
  description: string;
  type: 'group' | 'individual' | 'workshop';
  difficulty: 'easy' | 'medium' | 'hard';
  duration: string;
  participants: number;
  maxParticipants: number;
  date: string;
  time: string;
  organizer: string;
  tags: string[];
  isRegistered: boolean;
}

const mockActivities: Activity[] = [
  {
    id: '1',
    title: 'Meditación Matutina',
    description: 'Comenzamos el día con una sesión de meditación guiada para encontrar la calma y el equilibrio.',
    type: 'group',
    difficulty: 'easy',
    duration: '30 min',
    participants: 8,
    maxParticipants: 15,
    date: 'Hoy',
    time: '09:00',
    organizer: 'Ana García (SERENO)',
    tags: ['meditación', 'relajación', 'mañana'],
    isRegistered: false
  },
  {
    id: '2',
    title: 'Taller de Respiración',
    description: 'Aprende técnicas avanzadas de respiración para manejar la ansiedad y el estrés.',
    type: 'workshop',
    difficulty: 'medium',
    duration: '45 min',
    participants: 12,
    maxParticipants: 20,
    date: 'Mañana',
    time: '16:00',
    organizer: 'Dr. Carlos Ruiz',
    tags: ['respiración', 'ansiedad', 'técnicas'],
    isRegistered: true
  },
  {
    id: '3',
    title: 'Círculo de Apoyo',
    description: 'Espacio seguro para compartir experiencias y recibir apoyo de la comunidad.',
    type: 'group',
    difficulty: 'easy',
    duration: '60 min',
    participants: 6,
    maxParticipants: 10,
    date: 'Viernes',
    time: '18:00',
    organizer: 'María López (SERENO)',
    tags: ['apoyo', 'comunidad', 'conversación'],
    isRegistered: false
  },
  {
    id: '4',
    title: 'Ejercicios de Mindfulness',
    description: 'Práctica individual guiada de mindfulness para desarrollar la atención plena.',
    type: 'individual',
    difficulty: 'medium',
    duration: '20 min',
    participants: 1,
    maxParticipants: 1,
    date: 'Disponible',
    time: 'Flexible',
    organizer: 'Autoguiado',
    tags: ['mindfulness', 'individual', 'atención'],
    isRegistered: false
  },
  {
    id: '5',
    title: 'Taller de Arte Terapia',
    description: 'Expresión creativa como herramienta de sanación y autoconocimiento.',
    type: 'workshop',
    difficulty: 'easy',
    duration: '90 min',
    participants: 5,
    maxParticipants: 12,
    date: 'Sábado',
    time: '10:00',
    organizer: 'Elena Martín',
    tags: ['arte', 'creatividad', 'terapia'],
    isRegistered: false
  }
];

const ActivityBoardPage: React.FC = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState(mockActivities);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [filter, setFilter] = useState<'all' | 'group' | 'individual' | 'workshop'>('all');
  const { interact } = useSerenito();

  const handleRegister = (activityId: string) => {
    setActivities(prev => prev.map(activity => 
      activity.id === activityId 
        ? { 
            ...activity, 
            isRegistered: !activity.isRegistered,
            participants: activity.isRegistered 
              ? activity.participants - 1 
              : activity.participants + 1
          }
        : activity
    ));
    
    const activity = activities.find(a => a.id === activityId);
    if (activity && !activity.isRegistered) {
      interact('task-complete');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'group': return '👥';
      case 'individual': return '🧘';
      case 'workshop': return '🎓';
      default: return '📅';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'group': return 'Grupal';
      case 'individual': return 'Individual';
      case 'workshop': return 'Taller';
      default: return 'Actividad';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Fácil';
      case 'medium': return 'Intermedio';
      case 'hard': return 'Avanzado';
      default: return 'Normal';
    }
  };

  const filteredActivities = activities.filter(activity => 
    filter === 'all' || activity.type === filter
  );

  if (selectedActivity) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setSelectedActivity(null)}
              className="text-blue-500 hover:text-blue-600 font-medium"
            >
              ← Volver a actividades
            </button>
            <span className="text-2xl">{getTypeIcon(selectedActivity.type)}</span>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {selectedActivity.title}
            </h1>
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
              <span>{selectedActivity.date} • {selectedActivity.time}</span>
              <span>•</span>
              <span>{selectedActivity.duration}</span>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Descripción</h3>
              <p className="text-gray-600">{selectedActivity.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Tipo</h4>
                <span className="inline-flex items-center space-x-1">
                  <span>{getTypeIcon(selectedActivity.type)}</span>
                  <span>{getTypeLabel(selectedActivity.type)}</span>
                </span>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Dificultad</h4>
                <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(selectedActivity.difficulty)}`}>
                  {getDifficultyLabel(selectedActivity.difficulty)}
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-800 mb-1">Organizador</h4>
              <p className="text-gray-600">{selectedActivity.organizer}</p>
            </div>

            <div>
              <h4 className="font-medium text-gray-800 mb-1">Participantes</h4>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ 
                      width: `${(selectedActivity.participants / selectedActivity.maxParticipants) * 100}%` 
                    }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600">
                  {selectedActivity.participants}/{selectedActivity.maxParticipants}
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-800 mb-2">Etiquetas</h4>
              <div className="flex flex-wrap gap-2">
                {selectedActivity.tags.map((tag, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <SeniorButton
              variant={selectedActivity.isRegistered ? "secondary" : "primary"}
              fullWidth
              onClick={() => handleRegister(selectedActivity.id)}
              disabled={!selectedActivity.isRegistered && selectedActivity.participants >= selectedActivity.maxParticipants}
            >
              {selectedActivity.isRegistered ? 'Cancelar inscripción' : 'Inscribirse'}
            </SeniorButton>
            
            <SeniorButton
              variant="outline"
              fullWidth
              onClick={() => setSelectedActivity(null)}
            >
              Volver
            </SeniorButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <SerenitoCharacter
          expression="welcoming"
          size="lg"
          message="¡Únete a nuestra comunidad! Hay muchas actividades esperándote."
          showMessage={true}
          className="mb-6"
        />
        
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          👥 Actividades Comunitarias
        </h1>
        <p className="text-lg text-gray-600">
          Conecta con otros y participa en actividades de bienestar
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {[
          { key: 'all', label: 'Todas', icon: '📅' },
          { key: 'group', label: 'Grupales', icon: '👥' },
          { key: 'individual', label: 'Individuales', icon: '🧘' },
          { key: 'workshop', label: 'Talleres', icon: '🎓' }
        ].map((filterOption) => (
          <button
            key={filterOption.key}
            onClick={() => setFilter(filterOption.key as any)}
            className={`
              px-4 py-2 rounded-xl font-medium transition-all duration-300
              ${filter === filterOption.key 
                ? 'bg-blue-500 text-white shadow-lg' 
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }
            `}
          >
            <span className="mr-2">{filterOption.icon}</span>
            {filterOption.label}
          </button>
        ))}
      </div>

      {/* Activities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {filteredActivities.map((activity) => (
          <div key={activity.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{getTypeIcon(activity.type)}</span>
                <span className="text-sm text-gray-500">{getTypeLabel(activity.type)}</span>
              </div>
              
              {activity.isRegistered && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                  Inscrito ✓
                </span>
              )}
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {activity.title}
            </h3>
            
            <p className="text-gray-600 mb-4 line-clamp-2">
              {activity.description}
            </p>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">📅 {activity.date} • {activity.time}</span>
                <span className="text-gray-500">⏱️ {activity.duration}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  👥 {activity.participants}/{activity.maxParticipants} participantes
                </span>
                <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(activity.difficulty)}`}>
                  {getDifficultyLabel(activity.difficulty)}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <SeniorButton
                variant="outline"
                fullWidth
                onClick={() => setSelectedActivity(activity)}
              >
                Ver detalles
              </SeniorButton>
              
              <SeniorButton
                variant={activity.isRegistered ? "secondary" : "primary"}
                fullWidth
                onClick={() => handleRegister(activity.id)}
                disabled={!activity.isRegistered && activity.participants >= activity.maxParticipants}
              >
                {activity.isRegistered ? 'Inscrito' : 'Inscribirse'}
              </SeniorButton>
            </div>
          </div>
        ))}
      </div>

      {/* My Activities Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">
          📊 Mis Actividades
        </h3>
        <p className="text-blue-700 mb-4">
          Tienes {activities.filter(a => a.isRegistered).length} actividades programadas
        </p>
        <SeniorButton
          variant="primary"
          onClick={() => navigate('/')}
        >
          Volver al inicio
        </SeniorButton>
      </div>
    </div>
  );
};

export default ActivityBoardPage;