import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChartBarIcon, 
  CalendarDaysIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  FireIcon,
  HeartIcon,
  BookOpenIcon
} from '@heroicons/react/24/solid';
import Layout from '../components/Layout/Layout';
import SeniorButton from '../components/UI/SeniorButton';
import SerenitoCharacter from '../components/SERENITO/SerenitoCharacter';
import ProgressChart from '../components/Tracking/ProgressChart';
import EmotionSummary from '../components/Tracking/EmotionSummary';
import TrackingCalendar from '../components/Tracking/TrackingCalendar';
import DiaryInterface from '../components/Diary/DiaryInterface';
import { useDailyTracking } from '../hooks/useDailyTracking';
import { useAuth } from '../hooks/useAuth';

interface EmotionalState {
  [emotion: string]: number; // 1-5 scale
}

const DailyTrackingPage: React.FC = () => {
  const { user } = useAuth();
  const {
    todayEntry,
    trackingStats,
    createOrUpdateEntry,
    getTrackingStats,
    isLoading,
    error
  } = useDailyTracking();

  const [step, setStep] = useState<'form' | 'stats' | 'detailed' | 'diary'>('form');
  const [confidenceLevel, setConfidenceLevel] = useState<number>(5);
  const [emotionalState, setEmotionalState] = useState<EmotionalState>({});
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDiary, setShowDiary] = useState(false);

  // Emotional states with emojis
  const emotions = [
    { key: 'happy', label: 'Feliz', emoji: '😊', color: 'text-yellow-500' },
    { key: 'sad', label: 'Triste', emoji: '😢', color: 'text-blue-500' },
    { key: 'anxious', label: 'Ansioso', emoji: '😰', color: 'text-orange-500' },
    { key: 'calm', label: 'Tranquilo', emoji: '😌', color: 'text-green-500' },
    { key: 'angry', label: 'Enojado', emoji: '😠', color: 'text-red-500' },
    { key: 'excited', label: 'Emocionado', emoji: '🤩', color: 'text-purple-500' },
    { key: 'tired', label: 'Cansado', emoji: '😴', color: 'text-gray-500' },
    { key: 'hopeful', label: 'Esperanzado', emoji: '🌟', color: 'text-indigo-500' }
  ];

  useEffect(() => {
    // Load today's entry if it exists
    if (todayEntry) {
      setConfidenceLevel(todayEntry.confidenceLevel);
      setEmotionalState(todayEntry.emotionalState as EmotionalState);
      setNotes(todayEntry.notes || '');
    }
  }, [todayEntry]);

  useEffect(() => {
    // Load stats when component mounts
    getTrackingStats();
  }, [getTrackingStats]);

  const handleEmotionChange = (emotion: string, value: number) => {
    setEmotionalState(prev => ({
      ...prev,
      [emotion]: value
    }));
  };

  const handleSubmit = async () => {
    if (Object.keys(emotionalState).length === 0) {
      alert('Por favor selecciona al menos una emoción');
      return;
    }

    setIsSubmitting(true);
    try {
      await createOrUpdateEntry({
        confidenceLevel,
        emotionalState,
        notes: notes.trim() || undefined
      });
      
      // Refresh stats after successful submission
      await getTrackingStats();
      
      setStep('stats');
    } catch (error) {
      console.error('Error saving daily tracking:', error);
      alert('Error al guardar el seguimiento diario');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderTrackingForm = () => (
    <div className="space-y-8">
      <div className="text-center">
        <SerenitoCharacter
          expression="encouraging"
          size="large"
          message="¡Hola! Es momento de registrar cómo te sientes hoy. Esto me ayuda a entenderte mejor."
          showMessage={true}
          className="mb-6"
        />
        
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Seguimiento Diario
        </h1>
        <p className="text-gray-600">
          {new Date().toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Confidence Level */}
      <div className="bg-white rounded-senior p-6 shadow-senior">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Nivel de Confianza
        </h2>
        <p className="text-gray-600 mb-6">
          En una escala del 1 al 10, ¿qué tan confiado te sientes hoy?
        </p>
        
        <div className="space-y-4">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Muy bajo</span>
            <span>Muy alto</span>
          </div>
          
          <input
            type="range"
            min="1"
            max="10"
            value={confidenceLevel}
            onChange={(e) => setConfidenceLevel(Number(e.target.value))}
            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #6B73FF 0%, #6B73FF ${(confidenceLevel - 1) * 11.11}%, #e5e7eb ${(confidenceLevel - 1) * 11.11}%, #e5e7eb 100%)`
            }}
          />
          
          <div className="text-center">
            <span className="text-3xl font-bold text-primary-600">
              {confidenceLevel}
            </span>
            <span className="text-gray-600 ml-2">/ 10</span>
          </div>
        </div>
      </div>

      {/* Emotional State */}
      <div className="bg-white rounded-senior p-6 shadow-senior">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Estado Emocional
        </h2>
        <p className="text-gray-600 mb-6">
          Selecciona las emociones que sientes y su intensidad (1-5)
        </p>
        
        <div className="grid grid-cols-2 gap-4">
          {emotions.map((emotion) => (
            <div key={emotion.key} className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{emotion.emoji}</span>
                <span className="font-medium text-gray-700">{emotion.label}</span>
              </div>
              
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    onClick={() => handleEmotionChange(emotion.key, level)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      emotionalState[emotion.key] >= level
                        ? 'bg-primary-500 border-primary-500 text-white'
                        : 'border-gray-300 hover:border-primary-300'
                    }`}
                  >
                    {level}
                  </button>
                ))}
                {emotionalState[emotion.key] && (
                  <button
                    onClick={() => {
                      const newState = { ...emotionalState };
                      delete newState[emotion.key];
                      setEmotionalState(newState);
                    }}
                    className="ml-2 text-gray-400 hover:text-red-500"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-senior p-6 shadow-senior">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Notas Adicionales
        </h2>
        <p className="text-gray-600 mb-4">
          ¿Hay algo específico que quieras recordar sobre hoy?
        </p>
        
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Escribe aquí tus pensamientos, eventos importantes, o cualquier cosa que quieras recordar..."
          className="w-full h-32 p-4 border border-gray-300 rounded-senior resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          maxLength={500}
        />
        <div className="text-right text-sm text-gray-500 mt-2">
          {notes.length}/500 caracteres
        </div>
      </div>

      {/* Submit Button */}
      <div className="text-center space-y-4">
        <SeniorButton
          variant="primary"
          size="large"
          onClick={handleSubmit}
          disabled={isSubmitting || Object.keys(emotionalState).length === 0}
          className="w-full"
        >
          {isSubmitting ? 'Guardando...' : todayEntry ? 'Actualizar Registro' : 'Guardar Registro'}
        </SeniorButton>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {trackingStats && (
            <SeniorButton
              variant="outline"
              size="medium"
              onClick={() => setStep('stats')}
              className="w-full"
            >
              <ChartBarIcon className="w-5 h-5 mr-2" />
              Ver Estadísticas
            </SeniorButton>
          )}
          
          <SeniorButton
            variant="secondary"
            size="medium"
            onClick={() => setShowDiary(true)}
            className="w-full"
          >
            <BookOpenIcon className="w-5 h-5 mr-2" />
            Abrir Diario Personal
          </SeniorButton>
        </div>
      </div>
    </div>
  );

  const renderStats = () => (
    <div className="space-y-6">
      <div className="text-center">
        <SerenitoCharacter
          expression="happy"
          size="large"
          message={`¡Excelente! Has registrado ${trackingStats?.totalEntries || 0} días. ${getEncouragementMessage()}`}
          showMessage={true}
          className="mb-6"
        />
        
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Tu Progreso
        </h1>
        <p className="text-gray-600">
          Últimos 30 días
        </p>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-senior p-6 shadow-senior text-center">
          <FireIcon className="w-8 h-8 text-orange-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-800">
            {trackingStats?.totalEntries || 0}
          </div>
          <div className="text-sm text-gray-600">Días registrados</div>
        </div>
        
        <div className="bg-white rounded-senior p-6 shadow-senior text-center">
          <HeartIcon className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-800">
            {trackingStats?.avgConfidence || 0}
          </div>
          <div className="text-sm text-gray-600">Confianza promedio</div>
        </div>
      </div>

      {/* Trend */}
      <div className="bg-white rounded-senior p-6 shadow-senior">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Tendencia de Confianza
        </h2>
        
        <div className="flex items-center justify-center space-x-4">
          {trackingStats?.confidenceTrend === 'improving' && (
            <>
              <TrendingUpIcon className="w-8 h-8 text-green-500" />
              <span className="text-lg text-green-600 font-medium">Mejorando</span>
            </>
          )}
          {trackingStats?.confidenceTrend === 'declining' && (
            <>
              <TrendingDownIcon className="w-8 h-8 text-red-500" />
              <span className="text-lg text-red-600 font-medium">Necesita atención</span>
            </>
          )}
          {trackingStats?.confidenceTrend === 'stable' && (
            <>
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <div className="w-4 h-0.5 bg-white"></div>
              </div>
              <span className="text-lg text-blue-600 font-medium">Estable</span>
            </>
          )}
        </div>
      </div>

      {/* Diary Access */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-senior p-6 shadow-senior text-white">
        <h2 className="text-xl font-semibold mb-4">
          📖 Diario Personal
        </h2>
        <p className="mb-4 text-purple-100">
          Registra tus emociones diarias, logros y reflexiones en tu diario personal.
        </p>
        <SeniorButton
          variant="secondary"
          onClick={() => setShowDiary(true)}
          className="bg-white text-purple-600 hover:bg-purple-50"
        >
          <BookOpenIcon className="w-5 h-5 mr-2" />
          Abrir Mi Diario
        </SeniorButton>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <SeniorButton
          variant="primary"
          size="large"
          onClick={() => setStep('form')}
          className="w-full"
        >
          <CalendarDaysIcon className="w-5 h-5 mr-2" />
          Nuevo Registro
        </SeniorButton>
        
        <SeniorButton
          variant="secondary"
          size="medium"
          onClick={() => setStep('detailed')}
          className="w-full"
        >
          <ChartBarIcon className="w-5 h-5 mr-2" />
          Ver Análisis Detallado
        </SeniorButton>
        
        <SeniorButton
          variant="outline"
          size="medium"
          onClick={() => window.history.back()}
          className="w-full"
        >
          Volver al Inicio
        </SeniorButton>
      </div>
    </div>
  );

  const renderDetailedStats = () => (
    <div className="space-y-6">
      <div className="text-center">
        <SerenitoCharacter
          expression="happy"
          size="large"
          message="Aquí puedes ver tu progreso en detalle. ¡Me encanta ver cómo has crecido!"
          showMessage={true}
          className="mb-6"
        />
        
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Análisis Detallado
        </h1>
        <p className="text-gray-600">
          Tu progreso completo de seguimiento
        </p>
      </div>

      {/* Progress Chart */}
      {trackingStats?.confidenceHistory && (
        <ProgressChart 
          data={trackingStats.confidenceHistory}
          className="mb-6"
        />
      )}

      {/* Emotion Summary */}
      {trackingStats?.confidenceHistory && (
        <EmotionSummary 
          data={trackingStats.confidenceHistory}
          className="mb-6"
        />
      )}

      {/* Calendar View */}
      {trackingStats?.confidenceHistory && (
        <TrackingCalendar 
          data={trackingStats.confidenceHistory}
          onDateSelect={(date) => {
            console.log('Selected date:', date);
            // Could implement date detail view here
          }}
          className="mb-6"
        />
      )}

      {/* Actions */}
      <div className="space-y-3">
        <SeniorButton
          variant="primary"
          size="large"
          onClick={() => setStep('form')}
          className="w-full"
        >
          <CalendarDaysIcon className="w-5 h-5 mr-2" />
          Nuevo Registro
        </SeniorButton>
        
        <SeniorButton
          variant="secondary"
          size="medium"
          onClick={() => setStep('stats')}
          className="w-full"
        >
          Ver Resumen
        </SeniorButton>
        
        <SeniorButton
          variant="outline"
          size="medium"
          onClick={() => window.history.back()}
          className="w-full"
        >
          Volver al Inicio
        </SeniorButton>
      </div>
    </div>
  );

  const getEncouragementMessage = () => {
    if (!trackingStats) return '';
    
    if (trackingStats.streakDays >= 7) {
      return '¡Increíble constancia!';
    } else if (trackingStats.streakDays >= 3) {
      return '¡Vas muy bien!';
    } else if (trackingStats.totalEntries > 0) {
      return '¡Sigue así!';
    }
    return '¡Comencemos juntos!';
  };

  if (showDiary) {
    return <DiaryInterface onClose={() => setShowDiary(false)} />;
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6 max-w-2xl">
          <div className="text-center">
            <SerenitoCharacter
              expression="concerned"
              size="large"
              message="Hubo un problema cargando tu información. ¿Quieres intentar de nuevo?"
              showMessage={true}
              className="mb-6"
            />
            <p className="text-red-600 mb-4">{error}</p>
            <SeniorButton
              variant="primary"
              onClick={() => window.location.reload()}
            >
              Intentar de Nuevo
            </SeniorButton>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {step === 'form' && renderTrackingForm()}
            {step === 'stats' && renderStats()}
            {step === 'detailed' && renderDetailedStats()}
          </motion.div>
        </AnimatePresence>
      </div>
    </Layout>
  );
};

export default DailyTrackingPage;