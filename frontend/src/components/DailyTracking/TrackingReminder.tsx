import React, { useState, useEffect } from 'react';
import SeniorButton from '../UI/SeniorButton';
import SerenitoCharacter from '../SERENITO/SerenitoCharacter';

interface TrackingReminderProps {
  hasTrackedToday: boolean;
  onStartTracking: () => void;
  onDismiss: () => void;
}

const TrackingReminder: React.FC<TrackingReminderProps> = ({ 
  hasTrackedToday, 
  onStartTracking, 
  onDismiss 
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [reminderMessage, setReminderMessage] = useState('');
  const [reminderExpression, setReminderExpression] = useState<'encouraging' | 'happy' | 'supportive'>('encouraging');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const hour = currentTime.getHours();
    
    if (hour >= 6 && hour < 12) {
      setReminderMessage('¡Buenos días! ¿Cómo amaneciste hoy? Es un buen momento para registrar tu estado emocional.');
      setReminderExpression('happy');
    } else if (hour >= 12 && hour < 18) {
      setReminderMessage('¡Buenas tardes! ¿Qué tal va tu día? Tómate un momento para reflexionar sobre cómo te sientes.');
      setReminderExpression('supportive');
    } else if (hour >= 18 && hour < 22) {
      setReminderMessage('¡Buenas noches! Antes de que termine el día, ¿te gustaría registrar cómo te sentiste hoy?');
      setReminderExpression('encouraging');
    } else {
      setReminderMessage('Es tarde, pero nunca es mal momento para cuidar tu bienestar. ¿Cómo te sientes?');
      setReminderExpression('supportive');
    }
  }, [currentTime]);

  if (hasTrackedToday) {
    return null;
  }

  return (
    <div className="card-senior border-l-4 border-primary-500 bg-primary-50">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <SerenitoCharacter 
            message={reminderMessage}
            expression={reminderExpression}
            animation="gentle-nod"
            size="small"
          />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <span className="text-xl mr-2">🔔</span>
              Recordatorio Gentil
            </h3>
            <button
              onClick={onDismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Cerrar recordatorio"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <p className="text-gray-700 mb-4">
            Aún no has registrado tu estado emocional hoy. Tómate unos minutos para reflexionar sobre tu día.
          </p>
          
          <div className="flex space-x-3">
            <SeniorButton
              onClick={onStartTracking}
              variant="primary"
              size="medium"
            >
              Registrar Ahora
            </SeniorButton>
            <SeniorButton
              onClick={onDismiss}
              variant="secondary"
              size="medium"
            >
              Más Tarde
            </SeniorButton>
          </div>
        </div>
      </div>
      
      {/* Gentle animation */}
      <div className="mt-4 flex justify-center">
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-primary-400 rounded-full animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrackingReminder;