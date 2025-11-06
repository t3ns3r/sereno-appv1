import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n';

interface FakeCallInterfaceProps {
  onAnswer: () => void;
  onDecline: () => void;
  callerName?: string;
  callerImage?: string;
}

export const FakeCallInterface: React.FC<FakeCallInterfaceProps> = ({
  onAnswer,
  onDecline,
  callerName = 'SERENITO',
  callerImage
}) => {
  const { t } = useTranslation();
  const [isRinging, setIsRinging] = useState(true);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    // Simulate phone vibration effect
    if (isRinging && 'vibrate' in navigator) {
      const vibrationPattern = [200, 100, 200, 100, 200];
      navigator.vibrate(vibrationPattern);
    }

    // Auto-decline after 30 seconds if not answered
    const autoDeclineTimer = setTimeout(() => {
      if (isRinging) {
        onDecline();
      }
    }, 30000);

    return () => {
      clearTimeout(autoDeclineTimer);
      if ('vibrate' in navigator) {
        navigator.vibrate(0); // Stop vibration
      }
    };
  }, [isRinging, onDecline]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (!isRinging) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRinging]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = () => {
    setIsRinging(false);
    // Brief delay to show answered state before redirecting
    setTimeout(() => {
      onAnswer();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex flex-col">
      {/* Status Bar Simulation */}
      <div className="flex justify-between items-center p-4 text-white text-sm">
        <div className="flex items-center space-x-1">
          <div className="flex space-x-1">
            <div className="w-1 h-3 bg-white rounded-full"></div>
            <div className="w-1 h-3 bg-white rounded-full"></div>
            <div className="w-1 h-3 bg-white rounded-full"></div>
            <div className="w-1 h-3 bg-white opacity-50 rounded-full"></div>
          </div>
          <span className="ml-2">SERENO</span>
        </div>
        <div className="text-center">
          {isRinging ? 'Llamada entrante' : 'En llamada'}
        </div>
        <div className="flex items-center space-x-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M17.778 8.222c-4.296-4.296-11.26-4.296-15.556 0A1 1 0 01.808 6.808c5.076-5.077 13.308-5.077 18.384 0a1 1 0 01-1.414 1.414zM14.95 11.05a7 7 0 00-9.9 0 1 1 0 01-1.414-1.414 9 9 0 0112.728 0 1 1 0 01-1.414 1.414zM12.12 13.88a3 3 0 00-4.24 0 1 1 0 01-1.415-1.414 5 5 0 017.07 0 1 1 0 01-1.415 1.414zM9 16a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
          <div className="w-6 h-3 border border-white rounded-sm">
            <div className="w-4 h-1 bg-white rounded-sm mt-0.5 ml-0.5"></div>
          </div>
        </div>
      </div>

      {/* Call Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {/* Caller Info */}
        <div className="text-center mb-8">
          <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
            {callerImage ? (
              <img src={callerImage} alt={callerName} className="w-full h-full object-cover" />
            ) : (
              <div className="text-6xl">🧘‍♂️</div>
            )}
          </div>
          <h2 className="text-2xl font-light text-white mb-2">{callerName}</h2>
          <p className="text-white/80">
            {isRinging ? 'Llamada entrante...' : `${formatDuration(callDuration)}`}
          </p>
        </div>

        {/* Call Status */}
        {isRinging && (
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-2 text-white/80">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span>Sonando...</span>
            </div>
          </div>
        )}

        {!isRinging && (
          <div className="mb-8 text-center">
            <div className="text-white/80 mb-4">
              ¡Hola! Soy SERENITO y quería saber cómo estás hoy.
            </div>
            <div className="text-white/60 text-sm">
              Te voy a redirigir a una evaluación rápida de bienestar...
            </div>
          </div>
        )}
      </div>

      {/* Call Actions */}
      {isRinging && (
        <div className="p-8">
          <div className="flex justify-center space-x-16">
            {/* Decline Button */}
            <button
              onClick={onDecline}
              className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
              aria-label="Rechazar llamada"
            >
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 3l1.5 1.5M21 21l-1.5-1.5M3 3l18 18" />
              </svg>
            </button>

            {/* Answer Button */}
            <button
              onClick={handleAnswer}
              className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform animate-pulse"
              aria-label="Contestar llamada"
            >
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </button>
          </div>

          {/* Action Labels */}
          <div className="flex justify-center space-x-16 mt-4">
            <span className="text-white/60 text-sm">Rechazar</span>
            <span className="text-white/60 text-sm">Contestar</span>
          </div>
        </div>
      )}

      {/* Additional Actions for Active Call */}
      {!isRinging && (
        <div className="p-8">
          <div className="flex justify-center space-x-8">
            <button className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </button>
            <button
              onClick={onDecline}
              className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 3l1.5 1.5M21 21l-1.5-1.5M3 3l18 18" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};